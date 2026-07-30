<?php
/**
 * api/lobby.php — Lobby API for Commander Quest
 *
 * All lobby data is stored as JSON files in data/lobbies/.
 * Lobbies expire after 120 days and are purged on access.
 *
 * Actions (POST unless noted):
 *   create   — Create a lobby (returns code + player token)
 *   get      — Fetch lobby state, strip tokens (GET)
 *   join     — Add player to lobby (returns player token)
 *   rejoin   — Re-enter lobby using PIN (returns player token)
 *   start    — Lock player in; marks quest_started = true
 *   complete — Save finished quest results
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

ini_set('display_errors', '0');
error_reporting(E_ALL);

// Generic error handlers — never leak file paths or line numbers to the client
set_error_handler(function(int $errno, string $errstr): bool {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error. Please try again.']);
    exit;
});

set_exception_handler(function(Throwable $e): void {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Server error. Please try again.']);
    exit;
});

define('DATA_DIR',              __DIR__ . '/../data/lobbies/');
define('RATE_LIMIT_FILE',       __DIR__ . '/../data/rate_limits.json');
define('MAX_PLAYERS',           24);
define('LOBBY_TTL',             120 * 24 * 60 * 60); // 120 days
// Two-tier limit on create: the hourly cap blocks spam-loops while the
// daily cap allows a group iterating on a tournament to keep going.
define('MAX_CREATES_PER_HOUR',  5);
define('MAX_CREATES_PER_DAY',   20);
define('MAX_JOINS_PER_HOUR',    30);
define('MAX_REJOINS_PER_5MIN',  10);

$action = $_REQUEST['action'] ?? '';

// CSRF defense: every mutating action must originate from a same-origin page.
requireSameOriginForPost();

// Low-probability sweep so stale lobbies don't accumulate when never re-accessed.
maybeSweepStaleLobbies();

switch ($action) {
    case 'create':   handleCreate();   break;
    case 'get':      handleGet();      break;
    case 'join':     handleJoin();     break;
    case 'rejoin':   handleRejoin();   break;
    case 'start':    handleStart();    break;
    case 'complete': handleComplete(); break;
    case 'delete':   handleDelete();   break;
    default:         jsonError('Unknown action', 400);
}

/* =============================================================
   HANDLERS
============================================================= */

function handleCreate(): void {
    // Honeypot: real users never fill this field
    if (!empty($_POST['website'])) jsonError('Bad request', 400);

    checkRateLimit('create');

    $name              = trim($_POST['name']               ?? '');
    $difficulty        = trim($_POST['difficulty']         ?? 'normal');
    $username          = trim($_POST['username']           ?? '');
    $notes             = trim($_POST['notes']              ?? '');
    $rulesRaw          = trim($_POST['rules']              ?? '[]');
    $resultsVisibility = trim($_POST['results_visibility'] ?? 'public');

    if (!$name)     jsonError('Lobby name is required');
    if (!$username) jsonError('Username is required');
    if (strlen($name)     > 60)  jsonError('Lobby name too long (max 60 chars)');
    if (strlen($notes)    > 500) jsonError('Notes too long (max 500 chars)');
    if (!isValidUsername($username)) jsonError('Username may contain letters, numbers, spaces, hyphens and underscores (2–30 chars).');
    if (!in_array($difficulty, ['easy','normal','hard','custom'], true)) jsonError('Invalid difficulty');
    if (!in_array($resultsVisibility, ['public','hidden'], true)) $resultsVisibility = 'public';

    // Budget is fixed per difficulty; custom reads from custom_settings
    $customSettings = null;
    if ($difficulty === 'custom') {
        $cs = json_decode(trim($_POST['custom_settings'] ?? '{}'), true);
        if (!is_array($cs)) jsonError('Invalid custom settings');

        $csBudget        = (int)($cs['budget']         ?? 150);
        $csRerolls       = (int)($cs['rerolls']        ?? 1);
        $csCurseLevel    =       $cs['curse_level']    ?? 'normal';
        $csRewardLevel   =       $cs['reward_level']   ?? 'normal';
        $csCrossingCount = (int)($cs['crossing_count'] ?? 3);

        if ($csBudget < 0 || $csBudget > 1000)                       jsonError('Invalid custom budget');
        if ($csRerolls < 0 || $csRerolls > 5)                        jsonError('Invalid reroll count');
        if (!in_array($csCurseLevel,  ['low','normal','high'], true)) $csCurseLevel  = 'normal';
        if (!in_array($csRewardLevel, ['low','normal','high'], true)) $csRewardLevel = 'normal';
        if ($csCrossingCount < 1 || $csCrossingCount > 10)           $csCrossingCount = 3;

        $customSettings = [
            'budget'         => $csBudget,
            'rerolls'        => $csRerolls,
            'curse_level'    => $csCurseLevel,
            'reward_level'   => $csRewardLevel,
            'crossing_count' => $csCrossingCount,
        ];
        $budget = $csBudget;
    } else {
        $budget = $difficulty === 'easy' ? 250 : ($difficulty === 'normal' ? 150 : 75);
    }

    $rules = json_decode($rulesRaw, true);
    if (!is_array($rules)) $rules = [];
    // Per-rule length cap so a malicious payload can't blow up storage/render.
    $rules = array_map(fn($r) => substr(trim((string)$r), 0, 200), $rules);
    $rules = array_slice(array_filter($rules, 'strlen'), 0, 20);

    ensureDataDir();
    $code  = generateCode();
    $token = generateToken();
    $now   = time();
    $pin   = generatePin([]);

    $lobby = [
        'code'               => $code,
        'name'               => $name,
        'difficulty'         => $difficulty,
        'budget'             => $budget,
        'custom_settings'    => $customSettings,
        'rules'              => $rules,
        'notes'              => $notes,
        'results_visibility' => $resultsVisibility,
        'created_at'         => $now,
        'expires_at'         => $now + LOBBY_TTL,
        'players'            => [[
            'token'           => $token,
            'pin'             => $pin,
            'username'        => $username,
            'joined_at'       => $now,
            'quest_started'   => false,
            'quest_completed' => false,
            'quest_results'   => null,
        ]],
    ];

    saveLobby($code, $lobby);
    jsonOk(['code' => $code, 'token' => $token, 'pin' => $pin]);
}

function handleGet(): void {
    $code  = sanitizeCode($_GET['code'] ?? '');
    $token = trim($_GET['token'] ?? '');
    $lobby = loadLobby($code);
    if (!$lobby) jsonError('Lobby not found or expired', 404);

    // Never expose tokens or PINs; strip results when visibility is hidden.
    // Exception: a player may always see their own results by supplying their token.
    $hidden          = ($lobby['results_visibility'] ?? 'public') === 'hidden';
    $safe            = $lobby;
    $safe['players'] = array_map(function (array $p) use ($hidden, $token): array {
        $isMe = $token !== '' && isset($p['token']) && hash_equals($p['token'], $token);
        unset($p['token'], $p['pin']);
        if ($hidden && !$isMe) unset($p['quest_results']);
        return $p;
    }, $lobby['players']);

    jsonOk($safe);
}

function handleJoin(): void {
    checkRateLimit('join');

    $code     = sanitizeCode($_POST['code']     ?? '');
    $username = trim($_POST['username'] ?? '');

    if (!$username)                  jsonError('Username is required');
    if (!isValidUsername($username)) jsonError('Username may contain letters, numbers, spaces, hyphens and underscores (2–30 chars).');

    $lobby = loadLobby($code);
    if (!$lobby) jsonError('Lobby not found or expired', 404);
    if (count($lobby['players']) >= MAX_PLAYERS)
        jsonError('Lobby is full (' . MAX_PLAYERS . ' players max)');

    foreach ($lobby['players'] as $p) {
        if (strtolower($p['username']) === strtolower($username))
            jsonError('You have already joined this lobby');
    }

    $token = generateToken();
    $pin   = generatePin(array_column($lobby['players'], 'pin'));

    $lobby['players'][] = [
        'token'           => $token,
        'pin'             => $pin,
        'username'        => $username,
        'joined_at'       => time(),
        'quest_started'   => false,
        'quest_completed' => false,
        'quest_results'   => null,
    ];

    saveLobby($code, $lobby);
    jsonOk([
        'token'           => $token,
        'pin'             => $pin,
        'lobby_name'      => $lobby['name'],
        'difficulty'      => $lobby['difficulty'],
        'budget'          => $lobby['budget'],
        'custom_settings' => $lobby['custom_settings'] ?? null,
    ]);
}

function handleRejoin(): void {
    checkRateLimit('rejoin');

    $code = sanitizeCode($_POST['code'] ?? '');
    $pin  = trim($_POST['pin'] ?? '');

    if (!preg_match('/^\d{4}$/', $pin)) jsonError('Invalid lobby code or PIN', 403);

    $lobby = loadLobby($code);
    // Same error for missing lobby and wrong PIN — prevents lobby enumeration
    if (!$lobby) jsonError('Invalid lobby code or PIN', 403);

    foreach ($lobby['players'] as $p) {
        if (hash_equals((string)($p['pin'] ?? ''), $pin)) {
            jsonOk([
                'token'           => $p['token'],
                'username'        => $p['username'],
                'lobby_name'      => $lobby['name'],
                'difficulty'      => $lobby['difficulty'],
                'budget'          => $lobby['budget'],
                'custom_settings' => $lobby['custom_settings'] ?? null,
            ]);
        }
    }
    jsonError('Invalid lobby code or PIN', 403);
}

function handleStart(): void {
    checkRateLimit('start');

    $code  = sanitizeCode($_POST['code']  ?? '');
    $token = trim($_POST['token'] ?? '');

    $lobby = loadLobby($code);
    if (!$lobby) jsonError('Lobby not found or expired', 404);

    foreach ($lobby['players'] as &$p) {
        if ($token !== '' && isset($p['token']) && hash_equals($p['token'], $token)) {
            if ($p['quest_started']) jsonError('Your quest has already begun — you only get one shot');
            $p['quest_started'] = true;
            saveLobby($code, $lobby);
            jsonOk(['ok' => true]);
        }
    }
    // Generic 404 so an attacker can't distinguish "lobby doesn't exist"
    // from "lobby exists but your token is wrong" — prevents code enumeration.
    jsonError('Lobby not found or expired', 404);
}

function handleComplete(): void {
    checkRateLimit('complete');

    $code    = sanitizeCode($_POST['code']  ?? '');
    $token   = trim($_POST['token']         ?? '');
    $results = json_decode($_POST['results'] ?? 'null', true);

    if (!is_array($results)) jsonError('Invalid results payload');

    // Basic schema validation
    if (!isset($results['difficulty']) || !is_string($results['difficulty']))
        jsonError('Invalid results payload');
    if (!isset($results['color_ids']) || !is_array($results['color_ids']))
        jsonError('Invalid results payload');

    // Strip any HTML tags from all string values before saving
    $results = sanitizeResults($results);

    $lobby = loadLobby($code);
    if (!$lobby) jsonError('Lobby not found or expired', 404);

    foreach ($lobby['players'] as &$p) {
        if ($token !== '' && isset($p['token']) && hash_equals($p['token'], $token)) {
            if ($p['quest_completed']) jsonError('Results already saved');
            $p['quest_completed'] = true;
            $p['quest_results']   = $results;
            saveLobby($code, $lobby);
            jsonOk(['ok' => true]);
        }
    }
    // Generic 404 so an attacker can't distinguish "lobby doesn't exist"
    // from "lobby exists but your token is wrong" — prevents code enumeration.
    jsonError('Lobby not found or expired', 404);
}

function handleDelete(): void {
    $code  = sanitizeCode($_POST['code']  ?? '');
    $token = trim($_POST['token']         ?? '');

    if (!$token) jsonError('Missing token');

    $lobby = loadLobby($code);
    if (!$lobby) jsonError('Lobby not found or expired', 404);

    // Only the creator (first player) may delete the lobby.
    // Use generic 404 so an attacker can't distinguish "lobby doesn't exist"
    // from "you're not the creator" — prevents code enumeration.
    if (empty($lobby['players'])
        || !isset($lobby['players'][0]['token'])
        || !hash_equals($lobby['players'][0]['token'], $token))
        jsonError('Lobby not found or expired', 404);

    @unlink(DATA_DIR . $code . '.json');
    jsonOk(['deleted' => true]);
}

/* =============================================================
   HELPERS
============================================================= */

// Block cross-origin POST requests. Browsers set Origin on every POST and
// scripts on other origins cannot forge it, so this stops classic CSRF.
function requireSameOriginForPost(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') return;

    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (!$host) jsonError('Cross-origin requests not allowed', 403);

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $expected = $scheme . '://' . $host;

    $source = !empty($_SERVER['HTTP_ORIGIN'])  ? $_SERVER['HTTP_ORIGIN']
            : (!empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
    if (!$source) jsonError('Cross-origin requests not allowed', 403);

    $parts = parse_url($source);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        jsonError('Cross-origin requests not allowed', 403);
    }
    $sourceOrigin = $parts['scheme'] . '://' . $parts['host']
                    . (isset($parts['port']) ? ':' . $parts['port'] : '');

    if (!hash_equals($expected, $sourceOrigin)) {
        jsonError('Cross-origin requests not allowed', 403);
    }
}

function checkRateLimit(string $action): void {
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $now    = time();

    // Each action defines one or more [window_seconds, max_attempts] pairs.
    // Create uses two tiers so a spam-loop is blocked without punishing groups
    // that legitimately create many lobbies over a day.
    if ($action === 'create') {
        $tiers = [[3600, MAX_CREATES_PER_HOUR], [86400, MAX_CREATES_PER_DAY]];
    } elseif ($action === 'rejoin') {
        $tiers = [[300, MAX_REJOINS_PER_5MIN]];
    } else {
        $tiers = [[3600, MAX_JOINS_PER_HOUR]];
    }

    // Hash the IP with a server-side secret so rate_limits.json never
    // contains reversible visitor IPs — see getRateLimitSecret() below.
    $key = $action . ':' . hash_hmac('sha256', $ip, getRateLimitSecret());

    // Lock the file before reading to prevent race conditions.
    // Fail-open on file errors so a transient disk/permissions issue doesn't
    // block legitimate users, but log it so the outage is visible in server logs.
    $fh = fopen(RATE_LIMIT_FILE, 'c+');
    if (!$fh) {
        error_log('lobby.php: rate limiter fail-open — could not open ' . RATE_LIMIT_FILE);
        return;
    }
    flock($fh, LOCK_EX);

    $content = stream_get_contents($fh);
    $limits  = json_decode($content ?: '{}', true) ?: [];

    $stamps     = $limits[$key] ?? [];
    $maxWindow  = max(array_column($tiers, 0));

    foreach ($tiers as [$window, $max]) {
        $inWindow = array_filter($stamps, fn($t) => $now - $t < $window);
        if (count($inWindow) >= $max) {
            flock($fh, LOCK_UN);
            fclose($fh);
            jsonError('Too many requests — please try again later.', 429);
        }
    }

    // Retain only what any tier still cares about (drops entries older than
    // the widest window so the bucket doesn't grow unbounded).
    $recent = array_values(array_filter($stamps, fn($t) => $now - $t < $maxWindow));
    $recent[] = $now;
    $limits[$key] = $recent;

    // Occasionally purge stale entries
    if (random_int(1, 50) === 1) {
        foreach ($limits as $k => $times) {
            $cleaned = array_values(array_filter($times, fn($t) => $now - $t < 86400));
            if (empty($cleaned)) unset($limits[$k]);
            else $limits[$k] = $cleaned;
        }
    }

    rewind($fh);
    ftruncate($fh, 0);
    fwrite($fh, json_encode($limits));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

// Persistent random secret used to hash visitor IPs in the rate limiter.
// Auto-generated on first request and stored in data/ (blocked from HTTP by
// .htaccess). Kept out of git so every deployment has its own salt.
function getRateLimitSecret(): string {
    static $cached = null;
    if ($cached !== null) return $cached;

    $file = __DIR__ . '/../data/rate_limit_secret';
    if (is_readable($file)) {
        $existing = trim((string)@file_get_contents($file));
        if (strlen($existing) >= 32) return $cached = $existing;
    }

    $new = bin2hex(random_bytes(32));
    // Exclusive-create so parallel first-run requests don't clobber each other.
    $fh = @fopen($file, 'x');
    if ($fh) {
        fwrite($fh, $new);
        fclose($fh);
        @chmod($file, 0600);
        return $cached = $new;
    }
    // Another process won the race — read what they wrote.
    $existing = trim((string)@file_get_contents($file));
    return $cached = (strlen($existing) >= 32) ? $existing : $new;
}

function sanitizeResults(array $results): array {
    array_walk_recursive($results, function (&$v) {
        if (is_string($v)) $v = strip_tags($v);
    });
    return $results;
}

function generatePin(array $existingPins): string {
    $attempts = 0;
    do {
        $pin = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        if (++$attempts > 200) break;
    } while (in_array($pin, $existingPins, true));
    return $pin;
}

function generateCode(): string {
    ensureDataDir();
    $chars    = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I/L)
    $len      = strlen($chars) - 1;
    $attempts = 0;
    do {
        $code = '';
        for ($i = 0; $i < 6; $i++) $code .= $chars[random_int(0, $len)];
        if (++$attempts > 100) jsonError('Server busy — please try again');
    } while (file_exists(DATA_DIR . $code . '.json'));
    return $code;
}

function generateToken(): string {
    return bin2hex(random_bytes(16));
}

function sanitizeCode(string $raw): string {
    return substr(preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($raw))), 0, 6);
}

// Mirrors the client-side regex in lobby.js isValidUsername() (must stay in sync).
function isValidUsername(string $u): bool {
    return (bool)preg_match('/^[A-Za-z0-9_\- ]{2,30}$/', $u);
}

function ensureDataDir(): void {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
}

// Sweep the lobby dir for expired files. Runs on ~1% of requests so cost amortises.
// Caps at 100 files per pass to avoid pegging on a huge directory.
function maybeSweepStaleLobbies(): void {
    if (random_int(1, 100) !== 1) return;
    if (!is_dir(DATA_DIR)) return;

    $now     = time();
    $checked = 0;
    $dh = @opendir(DATA_DIR);
    if (!$dh) return;
    while (($entry = readdir($dh)) !== false) {
        if ($entry[0] === '.' || substr($entry, -5) !== '.json') continue;
        if (++$checked > 100) break;

        $path = DATA_DIR . $entry;
        $raw  = @file_get_contents($path);
        if ($raw === false) continue;
        $data = json_decode($raw, true);
        if (!is_array($data) || $now > ($data['expires_at'] ?? 0)) {
            @unlink($path);
        }
    }
    closedir($dh);
}

function loadLobby(string $code): ?array {
    if (strlen($code) !== 6) return null;
    $file = DATA_DIR . $code . '.json';
    if (!file_exists($file)) return null;
    $data = json_decode(file_get_contents($file), true);
    if (!is_array($data)) return null;
    if (time() > ($data['expires_at'] ?? 0)) { @unlink($file); return null; }
    return $data;
}

function saveLobby(string $code, array $lobby): void {
    ensureDataDir();
    file_put_contents(
        DATA_DIR . $code . '.json',
        json_encode($lobby, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
}

function jsonOk(array $data): void {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

function jsonError(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}
