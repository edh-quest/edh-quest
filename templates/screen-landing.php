<!-- ============================================================
     SCREEN: Landing
     The first thing the player sees. Shown by JS on load.
============================================================ -->
<div id="screen-landing" class="screen active">

  <!-- Top-right: History / Lobbies dashboard link -->
  <div class="auth-widget">
    <button id="btn-open-dashboard" class="btn-auth-signin">History &amp; Lobbies</button>
  </div>

  <div class="landing-bg">
    <div class="rune rune-1">⟁</div>
    <div class="rune rune-2">⟃</div>
    <div class="rune rune-3">⟂</div>
    <div class="rune rune-4">⟇</div>
  </div>
  <!-- Resume banner — shown if a mid-quest save is detected -->
  <div id="resume-banner" class="resume-banner hidden">
    <span class="resume-banner-text">You have an unfinished quest.</span>
    <button id="resume-banner-btn" class="resume-banner-btn">Resume</button>
    <button id="resume-banner-dismiss" class="resume-banner-dismiss" aria-label="Dismiss">✕</button>
  </div>

  <div class="landing-content">
    <div class="sigil">✦</div>
    <h1 class="title-group">
      <span class="title">EDH</span>
      <span class="title-sub"><span class="title-accent">Quest</span></span>
    </h1>
    <p class="tagline">Challenge your next EDH build.</p>
    <p class="landing-desc">A free, randomised deck-building challenge for Magic: The Gathering Commander format. Spin the colour wheel, face your trials, and build your next 99 within the rules.</p>

    <div class="landing-actions">
      <button id="btn-embark" class="btn-primary">
        <span class="btn-inner">Solo Quest</span>
        <span class="btn-glow"></span>
      </button>
      <button id="btn-create-lobby" class="btn-secondary">Create Lobby</button>
    </div>
  </div>
</div>
