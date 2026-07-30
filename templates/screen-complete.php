<!-- ============================================================
     SCREEN: Quest Complete
     Shown after Step 4. Summary content is injected by
     summary.js → renderQuestSummary().
============================================================ -->
<div id="screen-complete" class="screen">
  <div class="complete-content">
    <div class="sigil sigil-large">✦</div>
    <h2 class="complete-title">Your Quest is Sealed</h2>
    <p class="complete-subtitle">The fates have spoken. Build your deck and prove your worth.</p>
    <div id="quest-summary" class="quest-summary">
      <!-- Summary rows injected by summary.js -->
    </div>
    <div class="complete-actions">
      <button id="btn-copy-quest-link" class="btn-secondary hidden">Copy Link</button>
      <button id="btn-new-quest" class="btn-primary">Finish</button>
      <button id="btn-return-to-lobby" class="btn-primary hidden">← Return to Lobby</button>
    </div>
  </div>
</div>
