<?php
/**
 * api/quest.php — Quest Result Storage
 *
 * Every completed quest (solo + lobby) is saved server-side under a
 * random 32-char id. The browser stores the id in its local history
 * list so it can fetch full details on demand or via ?quest=<id>.
 *
 * POST action=save  results=JSON        → { ok, id }
 * GET  action=get   id=STRING           → { ok, data }
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

ini_set('display_errors', '0');
error_reporting(E_ALL);

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

define('QUEST_DIR',           __DIR__ . '/../data/quest-results/');
define('QUEST_RATE_FILE',     __DIR__ . '/../data/rate_limits.json');
define('QUEST_TTL',           120 * 24 * 60 * 60);
define('MAX_SAVES_PER_DAY',   50);

if (!is_dir(QUEST_DIR)) mkdir(QUEST_DIR, 0755, true);

$action = $_POST['action'] ?? $_GET['action'] ?? '';

requireSameOriginForPost();
maybeSweepStaleQuests();

if ($action === 'save') {
    checkSaveRateLimit();

    $raw = $_POST['results'] ?? '';
    if (strlen($raw) > 100000) {
        echo json_encode(['ok' => false, 'error' => 'Results payload too large']);
        exit;
    }

    $results = json_decode($raw, true);
    if (!is_array($results)) {
        echo json_encode(['ok' => false, 'error' => 'Invalid results']);
        exit;
    }

    $payload = json_encode([
        'results'    => $results,
        'created_at' => time(),
        'expires_at' => time() + QUEST_TTL,
    ]);

    // Atomically claim a unique id with exclusive-create; retries on the
    // vanishingly unlikely collision.
    $id = '';
    $fh = false;
    for ($attempt = 0; $attempt < 5; $attempt++) {
        $id = bin2hex(random_bytes(16));
        $fh = @fopen(QUEST_DIR . $id . '.json', 'x');
        if ($fh) break;
    }

    if (!$fh) {
        echo json_encode(['ok' => false, 'error' => 'Could not save']);
        exit;
    }

    if (fwrite($fh, $payload) === false) {
        fclose($fh);
        @unlink(QUEST_DIR . $id . '.json');
        echo json_encode(['ok' => false, 'error' => 'Could not save']);
        exit;
    }
    fclose($fh);

    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

if ($action === 'get') {
    $id = sanitizeId($_GET['id'] ?? '');
    if (!$id) {
        echo json_encode(['ok' => false, 'error' => 'Invalid id']);
        exit;
    }

    $file = QUEST_DIR . $id . '.json';
    if (!file_exists($file)) {
        echo json_encode(['ok' => false, 'error' => 'Not found']);
        exit;
    }

    $data = json_decode(file_get_contents($file), true);
    if (!is_array($data) || time() > ($data['expires_at'] ?? 0)) {
        @unlink($file);
        echo json_encode(['ok' => false, 'error' => 'Expired']);
        exit;
    }

    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Unknown action']);

/* =============================================================
   HELPERS
============================================================= */

function requireSameOriginForPost(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') return;

    $host = $_SERVER['HTTP_HOST'] ?? '';
    if (!$host) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Cross-origin requests not allowed']);
        exit;
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $expected = $scheme . '://' . $host;

    $source = !empty($_SERVER['HTTP_ORIGIN'])  ? $_SERVER['HTTP_ORIGIN']
            : (!empty($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '');
    if (!$source) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Cross-origin requests not allowed']);
        exit;
    }

    $parts = parse_url($source);
    if (!$parts || empty($parts['scheme']) || empty($parts['host'])) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Cross-origin requests not allowed']);
        exit;
    }
    $sourceOrigin = $parts['scheme'] . '://' . $parts['host']
                    . (isset($parts['port']) ? ':' . $parts['port'] : '');

    if (!hash_equals($expected, $sourceOrigin)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Cross-origin requests not allowed']);
        exit;
    }
}

// Sweep expired files on ~1% of requests. Handles both new long-id files
// and the older 6-char share files that may still exist from before the
// share-removal refactor — anything past expires_at is fair game.
function maybeSweepStaleQuests(): void {
    if (random_int(1, 100) !== 1) return;
    if (!is_dir(QUEST_DIR)) return;

    $now     = time();
    $checked = 0;
    $dh = @opendir(QUEST_DIR);
    if (!$dh) return;
    while (($entry = readdir($dh)) !== false) {
        if ($entry[0] === '.' || substr($entry, -5) !== '.json') continue;
        if (++$checked > 100) break;

        $path = QUEST_DIR . $entry;
        $raw  = @file_get_contents($path);
        if ($raw === false) continue;
        $data = json_decode($raw, true);
        if (!is_array($data) || $now > ($data['expires_at'] ?? 0)) {
            @unlink($path);
        }
    }
    closedir($dh);
}

function checkSaveRateLimit(): void {
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $now    = time();
    $window = 86400;
    $max    = MAX_SAVES_PER_DAY;
    // Hash the IP with a server-side secret so rate_limits.json never
    // contains reversible visitor IPs — see getRateLimitSecret() below.
    $key    = 'quest_save:' . hash_hmac('sha256', $ip, getRateLimitSecret());

    // Fail-open on file errors (see lobby.php:checkRateLimit for rationale).
    $fh = fopen(QUEST_RATE_FILE, 'c+');
    if (!$fh) {
        error_log('quest.php: rate limiter fail-open — could not open ' . QUEST_RATE_FILE);
        return;
    }
    flock($fh, LOCK_EX);

    $content = stream_get_contents($fh);
    $limits  = json_decode($content ?: '{}', true) ?: [];

    $recent = array_values(array_filter($limits[$key] ?? [], fn($t) => $now - $t < $window));

    if (count($recent) >= $max) {
        flock($fh, LOCK_UN);
        fclose($fh);
        http_response_code(429);
        echo json_encode(['ok' => false, 'error' => 'Too many saves — please try again later.']);
        exit;
    }

    $recent[]     = $now;
    $limits[$key] = $recent;

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
    $fh = @fopen($file, 'x');
    if ($fh) {
        fwrite($fh, $new);
        fclose($fh);
        @chmod($file, 0600);
        return $cached = $new;
    }
    $existing = trim((string)@file_get_contents($file));
    return $cached = (strlen($existing) >= 32) ? $existing : $new;
}

// Ids are 32 hex chars (from random_bytes(16)). The older 24-char ids from
// pre-2026-07 saves are still accepted so existing history links keep working.
function sanitizeId(string $raw): string {
    $clean = preg_replace('/[^a-f0-9]/', '', strtolower(trim($raw)));
    return (strlen($clean) === 32 || strlen($clean) === 24) ? $clean : '';
}
