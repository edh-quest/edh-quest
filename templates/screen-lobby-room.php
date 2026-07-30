<!-- ============================================================
     SCREEN: Lobby Room
     Player list polled every 15 s via api/lobby.php?action=get.
============================================================ -->
<div id="screen-lobby-room" class="screen">
  <div class="lobby-room-wrap">

    <!-- Header -->
    <div class="lobby-room-header">
      <h2 id="lobby-room-name" class="lobby-room-name">—</h2>
      <span id="lobby-room-diff-badge" class="lobby-diff-badge" title="Difficulty">Normal</span>
    </div>

    <!-- Info boxes row: Invite | Rules -->
    <div class="lobby-info-row">

      <!-- Left: invite link (code hidden — carried in URL) -->
      <div class="lobby-code-wrap">
        <div class="lobby-info-box lobby-info-box--code">
          <span class="lobby-info-box-label">Invite Others</span>
          <button id="btn-copy-link" class="btn-secondary lobby-copy-btn">Copy Invite Link</button>
          <input id="lobby-room-link" type="text" class="lobby-link-hidden" readonly aria-hidden="true" tabindex="-1">
        </div>
        <div class="diff-tooltip">Share this link so others can join this lobby.</div>

        <div class="lobby-my-pin" title="Use this PIN to rejoin this lobby from another device.">
          <span class="lobby-my-pin-label">Your rejoin PIN</span>
          <span id="lobby-my-pin-value" class="lobby-my-pin-value">----</span>
        </div>
      </div>

      <!-- Right: budget + rules -->
      <div class="lobby-info-box lobby-info-box--rules">
        <span class="lobby-info-box-label">Rules</span>
        <ul id="lobby-rules-list" class="lobby-rules-list"></ul>
      </div>

    </div>

    <!-- Custom settings box (rendered by JS only for custom difficulty) -->
    <div id="lobby-custom-settings-box" class="lobby-info-box lobby-info-box--custom hidden">
      <span class="lobby-info-box-label">Custom Settings</span>
      <ul id="lobby-custom-settings-list" class="lobby-rules-list"></ul>
    </div>

    <!-- Notes box (rendered by JS only if notes exist) -->
    <div id="lobby-notes-box" class="lobby-info-box lobby-info-box--notes hidden">
      <span class="lobby-info-box-label">Notes</span>
      <p id="lobby-notes-text" class="lobby-notes-text"></p>
    </div>

    <!-- Player list -->
    <div class="lobby-players-section">
      <h3 class="lobby-players-heading">
        Players <span id="lobby-player-count" class="lobby-player-count"></span>
      </h3>
      <div id="lobby-player-list" class="lobby-player-list"></div>
    </div>

    <p id="screen-lobby-room-error" class="lobby-error hidden"></p>

    <button id="btn-lobby-leave" class="btn-ghost lobby-leave-btn">← Back to Home</button>

  </div>

  <!-- Disconnect / lobby-unavailable modal -->
  <div id="lobby-disconnect-modal" class="lobby-confirm-overlay hidden">
    <div class="lobby-confirm-box">
      <p id="lobby-disconnect-msg" class="lobby-confirm-text">
        Could not reach the lobby.
      </p>
      <div class="lobby-confirm-actions">
        <button id="btn-lobby-retry" class="btn-primary">Retry</button>
        <button id="btn-lobby-disconnect-leave" class="btn-ghost">Back to Home</button>
      </div>
    </div>
  </div>

  <!-- Inline start confirmation (replaces browser confirm()) -->
  <div id="lobby-start-confirm" class="lobby-confirm-overlay hidden">
    <div class="lobby-confirm-box">
      <p class="lobby-confirm-text">
        Once you begin your Quest you cannot restart or redo your choices.
      </p>
      <div class="lobby-confirm-actions">
        <button id="btn-confirm-start" class="btn-primary">Begin Quest</button>
        <button id="btn-cancel-start" class="btn-ghost">Cancel</button>
      </div>
    </div>
  </div>

  <!-- PIN reveal overlay — shown once after fresh join/create -->
  <div id="lobby-pin-reveal" class="lobby-confirm-overlay hidden">
    <div class="lobby-confirm-box lobby-pin-reveal-box">
      <p class="lobby-pin-reveal-title">Save this PIN to rejoin this lobby</p>
      <p id="lobby-pin-reveal-value" class="lobby-pin-reveal-value">----</p>
      <p class="lobby-pin-reveal-note">If you delete your browser history or want to rejoin the lobby from another device, you need this PIN.</p>
      <div class="lobby-confirm-actions">
        <button type="button" id="btn-lobby-pin-dismiss" class="btn-primary">Got it</button>
      </div>
    </div>
  </div>

</div>
