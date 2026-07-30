<!-- ============================================================
     SCREEN: Join Lobby (invitation accept)
     Only reachable via an invite link (?lobby=CODE). The code is
     pulled from the URL; the visitor picks Join or Rejoin here.
============================================================ -->
<div id="screen-lobby-join" class="screen">
  <div class="lobby-screen-content">

    <div class="lobby-form-header">
      <div class="sigil">✦</div>
      <h2 id="lobby-join-title" class="step-title">Join a Lobby</h2>
      <p id="lobby-join-desc" class="step-desc">You've been invited to a lobby.</p>
    </div>

    <p id="screen-lobby-join-error" class="lobby-error hidden"></p>

    <!-- Two-option layout: Join as new player | Rejoin with PIN -->
    <div class="lobby-join-options">

      <div class="lobby-join-option lobby-join-option--primary">
        <h3 class="lobby-join-option-title">Join as new player</h3>
        <form id="form-lobby-join" class="lobby-form" novalidate>
          <div class="lobby-field">
            <label for="join-username-input">Your Name</label>
            <input id="join-username-input" type="text" maxlength="30" placeholder="e.g. Alice"
                   autocomplete="off" spellcheck="false">
          </div>
          <div class="lobby-form-actions">
            <button type="submit" id="btn-do-join-lobby" class="btn-primary" data-label="Join Lobby">Join Lobby</button>
          </div>
        </form>
      </div>

      <div class="lobby-join-option lobby-join-option--secondary">
        <h3 class="lobby-join-option-title">Rejoin as existing player</h3>
        <p class="lobby-join-option-desc">Use the 4-digit PIN you were shown when you first joined.</p>
        <form id="form-lobby-rejoin" class="lobby-form" novalidate>
          <div class="lobby-field">
            <label for="rejoin-pin-input">PIN</label>
            <input id="rejoin-pin-input" type="text" inputmode="numeric" maxlength="4"
                   placeholder="e.g. 4271" autocomplete="off" spellcheck="false"
                   class="lobby-code-input">
          </div>
          <div class="lobby-form-actions">
            <button type="submit" id="btn-do-rejoin-lobby" class="btn-secondary" data-label="Rejoin">Rejoin</button>
          </div>
        </form>
      </div>

    </div>

    <div class="lobby-form-actions lobby-join-back-wrap">
      <button type="button" id="btn-join-back" class="btn-ghost">← Back to Home</button>
    </div>

  </div>

  <!-- Already in a lobby — confirmation overlay -->
  <div id="join-already-in-lobby" class="lobby-confirm-overlay hidden">
    <div class="lobby-confirm-box">
      <p class="lobby-confirm-title">Already in a Lobby</p>
      <p class="lobby-confirm-text">
        You're already in a lobby. Do you want to join this one as a new player instead?
      </p>
      <div class="lobby-confirm-actions">
        <button type="button" id="btn-already-return" class="btn-primary">Return to My Lobby</button>
        <button type="button" id="btn-already-join-new" class="btn-ghost">Join as New Player</button>
      </div>
    </div>
  </div>

</div>
