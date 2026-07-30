<?php
/**
 * update_burden_quantities.php
 *
 * Reads burden_scryfall.csv, queries the Scryfall API for each row
 * using the scryfall_text column, and writes the total card count
 * into a "quantity" column.
 *
 * Run from the project root:
 *   php scripts/update_burden_quantities.php
 */

define('CSV_PATH',  __DIR__ . '/../assets/files/criteria/burden_scryfall.csv');
define('API_BASE',  'https://api.scryfall.com/cards/search');
define('DELAY_MIN', 200);   // ms — minimum pause between API calls
define('DELAY_MAX', 450);   // ms — maximum pause between API calls

// ── Helpers ──────────────────────────────────────────────────────────────────

function scryfall_fetch(string $url): string|false {
    $headers = [
        'User-Agent: mtg-quest-burden-updater/1.0',
        'Accept: application/json',
    ];

    // Prefer curl — more reliable for HTTPS on Windows
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($raw === false) {
            fwrite(STDERR, "  curl error: $err\n");
            return false;
        }
        return $raw;
    }

    // Fallback: file_get_contents
    $ctx = stream_context_create([
        'http' => [
            'method'        => 'GET',
            'header'        => implode("\r\n", $headers) . "\r\n",
            'timeout'       => 15,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) {
        $err = error_get_last();
        fwrite(STDERR, "  fetch error: " . ($err['message'] ?? 'unknown') . "\n");
    }
    return $raw;
}

function scryfall_count(string $query): int|string {
    $url = API_BASE . '?q=' . urlencode($query) . '&format=json';
    $raw = scryfall_fetch($url);

    if ($raw === false) return 'ERROR';

    $json = json_decode($raw, true);
    if (!isset($json['object'])) return 'ERROR';
    if ($json['object'] === 'error') return 0;

    return (int) ($json['total_cards'] ?? 0);
}

function random_delay(): void {
    $ms = rand(DELAY_MIN, DELAY_MAX);
    usleep($ms * 1000);
}

// ── Read CSV ─────────────────────────────────────────────────────────────────

if (!file_exists(CSV_PATH)) {
    fwrite(STDERR, "ERROR: CSV not found at " . CSV_PATH . "\n");
    exit(1);
}

$fh = fopen(CSV_PATH, 'r');
$rows   = [];
$header = fgetcsv($fh); // read header row

// Find column indices by name (case-insensitive)
$col = [];
foreach ($header as $i => $name) {
    $col[strtolower(trim($name))] = $i;
}
if (!isset($col['scryfall_text'])) {
    fwrite(STDERR, "ERROR: 'scryfall_text' column not found in CSV header.\n");
    exit(1);
}

while (($row = fgetcsv($fh)) !== false) {
    $rows[] = $row;
}
fclose($fh);

// ── Add / update quantity and percentile columns ──────────────────────────────

$qtyIndex  = $col['quantity']   ?? count($header);
if (!isset($col['quantity']))   { $header[] = 'quantity';   $col['quantity']   = $qtyIndex; }

$pctIndex  = $col['percentile'] ?? count($header);
if (!isset($col['percentile'])) { $header[] = 'percentile'; $col['percentile'] = $pctIndex; }

$total = count($rows);
echo "Processing {$total} criteria...\n";

foreach ($rows as $i => &$row) {
    $title        = $row[$col['title'] ?? -1]         ?? '?';
    $scryfall_txt = $row[$col['scryfall_text'] ?? -1] ?? '';

    if (trim($scryfall_txt) === '') {
        echo "  [" . ($i + 1) . "/{$total}] {$title} — skipped (no query)\n";
        $row[$qtyIndex] = '';
        $row[$pctIndex] = '';
        continue;
    }

    $count = scryfall_count($scryfall_txt);
    $row[$qtyIndex] = $count;
    $row[$pctIndex] = ''; // filled in after all counts are known

    echo "  [" . ($i + 1) . "/{$total}] {$title} → {$count}\n";

    if ($i < $total - 1) {
        random_delay();
    }
}
unset($row);

// ── Calculate percentiles ─────────────────────────────────────────────────────
// Collect all numeric quantities, then for each row:
//   percentile = (number of quantities strictly below this value) / (n - 1) * 100
// This gives 0 % for the smallest and 100 % for the largest value.
// Rows with ERROR or empty quantity are excluded from the distribution and left blank.

$numericQtys = [];
foreach ($rows as $row) {
    $v = $row[$qtyIndex] ?? '';
    if (is_numeric($v)) {
        $numericQtys[] = (int) $v;
    }
}
sort($numericQtys);
$n = count($numericQtys);

foreach ($rows as &$row) {
    $v = $row[$qtyIndex] ?? '';
    if (!is_numeric($v) || $n < 2) {
        continue; // leave blank
    }
    $val = (int) $v;
    // Count how many values in the distribution are strictly below $val
    $below = 0;
    foreach ($numericQtys as $q) {
        if ($q < $val) $below++;
    }
    $percentile = round($below / ($n - 1) * 100, 1);
    $row[$pctIndex] = $percentile;
}
unset($row);

// ── Write updated CSV ─────────────────────────────────────────────────────────

$fh = fopen(CSV_PATH, 'w');
fputcsv($fh, $header);
foreach ($rows as $row) {
    fputcsv($fh, $row);
}
fclose($fh);

echo "\nDone! Updated CSV saved to:\n  " . realpath(CSV_PATH) . "\n";
