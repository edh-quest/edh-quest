<?php
/**
 * Commander Quest — index.php
 *
 * This file is the HTML shell only. It includes the three screen
 * templates and loads the JavaScript modules in dependency order.
 *
 * ── Project Structure ──────────────────────────────────────────
 * assets/
 *   css/style.css          — All styles (see table of contents inside)
 *   js/
 *     config.js            — Static game data (colors, combo names)
 *     state.js             — Live quest state (resets each game)
 *     utils.js             — Pure helper functions
 *     data.js              — CSV loader (burdens, lore, events)
 *     ui.js                — Screen manager + QuestFlow controller
 *     step-wheel.js        — Step 1: color wheel logic
 *     step-cards.js        — Steps 2 & 3: flip card mechanic
 *     step-crossroads.js   — Step 4: crossroads event choices
 *     summary.js           — Quest complete summary renderer
 *     main.js              — Entry point: wiring & event binding
 *   files/
 *     criteria/            — CSV files (edit to change quest content)
 *     designs/             — Card back images + wheel pointer
 *     symbols/             — MTG mana symbol PNGs
 * templates/
 *   screen-landing.php     — Landing page HTML
 *   screen-quest.php       — All four quest step panels
 *   screen-complete.php    — Quest summary screen
 *
 * ── Adding Content ─────────────────────────────────────────────
 * To add new burdens / lore / events: edit the CSV files.
 * To add a new step: add a div in screen-quest.php, write a
 *   step-*.js module, and register it in main.js → STEPS.
 * ──────────────────────────────────────────────────────────────
 */

$page_title       = 'EDH Quest | Commander Deck Building Challenge';
$page_description = 'Free randomised deck-building challenge for Magic: The Gathering Commander (EDH). Spin the colour wheel, face your trials, and build your next 99 within the rules — solo or with your whole table.';

// Open Graph: enrich preview when sharing a lobby link (?lobby=CODE)
// Hardcode the canonical host so a spoofed Host header can't inject a rogue
// URL into og:url; REQUEST_URI is scoped to the current path/query and gets
// htmlspecialchars'd on output below.
$og_title       = 'EDH Quest';
$og_description = 'Challenge your next Commander Build.';
$og_url         = 'https://edhquest.com' . ($_SERVER['REQUEST_URI'] ?? '/');

$raw_code = $_GET['lobby'] ?? '';
$lobby_code = substr(preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($raw_code))), 0, 6);
if (strlen($lobby_code) === 6) {
    $lobby_file = __DIR__ . '/data/lobbies/' . $lobby_code . '.json';
    if (file_exists($lobby_file)) {
        $lobby_data = json_decode(file_get_contents($lobby_file), true);
        if (is_array($lobby_data) && time() < ($lobby_data['expires_at'] ?? 0)) {
            $creator  = $lobby_data['players'][0]['username'] ?? 'Someone';
            $lobby_name = $lobby_data['name'] ?? 'a lobby';
            $player_count = count($lobby_data['players']);
            $og_title       = htmlspecialchars($creator) . ' invites you to EDH Quest';
            $og_description = 'Challenge your EDH build.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($page_title) ?></title>
  <meta name="description" content="<?= htmlspecialchars($page_description) ?>">
  <link rel="canonical" href="https://edhquest.com/">

  <!-- Open Graph — controls link previews in Discord, WhatsApp, iMessage, etc. -->
  <meta property="og:type"        content="website">
  <meta property="og:url"         content="<?= htmlspecialchars($og_url) ?>">
  <meta property="og:title"       content="<?= htmlspecialchars($og_title) ?>">
  <meta property="og:description" content="<?= htmlspecialchars($og_description) ?>">
  <meta property="og:image"       content="https://edhquest.com/assets/files/designs/og-image.png">
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="<?= htmlspecialchars($og_title) ?>">
  <meta name="twitter:description" content="<?= htmlspecialchars($og_description) ?>">
  <meta name="twitter:image"       content="https://edhquest.com/assets/files/designs/og-image.png">

  <link rel="icon" type="image/x-icon" href="/assets/files/designs/edhquest_favicon.ico">

  <!-- Fonts loaded via @font-face in style.css (self-hosted, no Google Fonts) -->
<link rel="stylesheet" href="assets/css/style.css?v=<?= filemtime('assets/css/style.css') ?>">
</head>
<body>

<?php include 'templates/screen-landing.php';        ?>
<?php include 'templates/screen-dashboard.php';      ?>

<!-- Resume overlay — shown when player clicks Resume on the banner -->
<div id="resume-overlay" class="resume-overlay hidden">
  <div class="resume-card">
    <div class="resume-sigil">✦</div>
    <p class="resume-title">Unfinished Quest</p>
    <p class="resume-subtitle">You closed mid-quest. Here's where you were:</p>
    <div id="resume-recap" class="resume-recap"></div>
    <button id="btn-resume-continue" class="btn-primary">Continue Quest</button>
    <button id="btn-resume-start-fresh" class="resume-start-fresh">Start a new quest instead</button>
  </div>
</div>

<?php include 'templates/screen-lobby-create.php';  ?>
<?php include 'templates/screen-lobby-join.php';    ?>
<?php include 'templates/screen-lobby-room.php';    ?>
<?php include 'templates/screen-lobby-results.php'; ?>
<?php include 'templates/screen-quest.php';         ?>
<?php include 'templates/screen-complete.php';      ?>

<!-- JavaScript modules — load order matters (each file depends on the ones above it) -->
<?php $jsv = filemtime('assets/js/step-wheel.js'); ?>
<script src="assets/js/currency.js?v=<?= filemtime('assets/js/currency.js') ?>"></script>
<script src="assets/js/history.js?v=<?= filemtime('assets/js/history.js') ?>"></script>
<script src="assets/js/dashboard.js?v=<?= filemtime('assets/js/dashboard.js') ?>"></script>
<script src="assets/js/config.js?v=<?= filemtime('assets/js/config.js') ?>"></script>
<script src="assets/js/state.js?v=<?= filemtime('assets/js/state.js') ?>"></script>
<script src="assets/js/utils.js?v=<?= filemtime('assets/js/utils.js') ?>"></script>
<script src="assets/js/data.js?v=<?= filemtime('assets/js/data.js') ?>"></script>
<script src="assets/js/ui.js?v=<?= filemtime('assets/js/ui.js') ?>"></script>
<script src="assets/js/step-difficulty.js?v=<?= filemtime('assets/js/step-difficulty.js') ?>"></script>
<script src="assets/js/step-wheel.js?v=<?= $jsv ?>"></script>
<script src="assets/js/step-cards.js?v=<?= filemtime('assets/js/step-cards.js') ?>"></script>
<script src="assets/js/step-crossroads.js?v=<?= filemtime('assets/js/step-crossroads.js') ?>"></script>
<script src="assets/js/step-fate.js?v=<?= filemtime('assets/js/step-fate.js') ?>"></script>
<script src="assets/js/step-greed.js?v=<?= filemtime('assets/js/step-greed.js') ?>"></script>
<script src="assets/js/summary.js?v=<?= filemtime('assets/js/summary.js') ?>"></script>
<script src="assets/js/lobby.js?v=<?= filemtime('assets/js/lobby.js') ?>"></script>
<script src="assets/js/quest-save.js?v=<?= filemtime('assets/js/quest-save.js') ?>"></script>
<script src="assets/js/main.js?v=<?= filemtime('assets/js/main.js') ?>"></script>

<footer class="site-footer">
  <a href="legal/faq.php">Rules &amp; FAQ</a>
  <span class="site-footer-sep">·</span>
  <a href="legal/contact.php">Contact</a>
  <span class="site-footer-sep">·</span>
  <a href="legal/impressum.php">Legal Notice</a>
  <span class="site-footer-sep">·</span>
  <a href="legal/datenschutz.php">Privacy Policy</a>
</footer>

</body>
</html>
