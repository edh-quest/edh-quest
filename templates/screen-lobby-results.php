<!-- ============================================================
     SCREEN: Lobby Player Results
     Read-only view of another player's (or your own) completed quest.
     Content is rendered by lobby.js → renderLobbyResults().
============================================================ -->
<div id="screen-lobby-results" class="screen">
  <div class="complete-content">
    <div class="sigil sigil-large">✦</div>
    <h2 id="lobby-results-title" class="complete-title">Quest Results</h2>
    <div id="lobby-results-summary" class="quest-summary">
      <!-- Summary rows injected by lobby.js -->
    </div>
    <div class="complete-actions">
      <button id="btn-copy-quest-link-results" class="btn-secondary hidden">Copy Link</button>
      <button id="btn-results-back-to-lobby" class="btn-primary">← Back to Lobby</button>
    </div>
  </div>
</div>
