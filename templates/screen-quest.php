<!-- ============================================================
     SCREEN: Quest Flow
     Contains all four step panels. JS shows/hides them via
     the `active-step` class as the player progresses.
     Add a new step here and register it in main.js → STEPS.
============================================================ -->
<div id="screen-quest" class="screen">

  <!-- Quest header: back button + progress bar (built by JS) -->
  <header class="quest-header">
    <div class="nav-arrows">
      <button id="btn-nav-prev" class="btn-nav-arrow" aria-label="Previous section" disabled>←</button>
      <button id="btn-nav-next" class="btn-nav-arrow" aria-label="Next section" disabled>→</button>
      <div id="reroll-counter-wrap" class="reroll-counter-wrap hidden">
        <div id="reroll-counter" class="reroll-counter"></div>
        <div id="reroll-counter-tip" class="reroll-counter-tip"></div>
      </div>
    </div>
    <div class="quest-progress" id="quest-progress"></div>
  </header>
  <button id="btn-back" class="btn-retreat" aria-label="Return to landing">← Retreat</button>

  <!-- Retreat confirmation modal -->
  <div id="retreat-modal" class="retreat-modal" role="dialog" aria-modal="true" aria-labelledby="retreat-modal-msg" hidden>
    <div class="retreat-modal-box">
      <p id="retreat-modal-msg">Are you sure you want to retreat to the main menu? Your current quest progress will be lost.</p>
      <div class="retreat-modal-actions">
        <button id="btn-retreat-cancel" class="btn-retreat-cancel">Cancel</button>
        <button id="btn-retreat-confirm" class="btn-retreat-confirm">Retreat</button>
      </div>
    </div>
  </div>

  <main class="quest-main" id="quest-main">

    <!-- ========================================================
         STEP 0 — Difficulty Selection
         Player chooses Easy / Normal / Hard before the quest begins.
         Choice is stored in QuestState.difficulty.
    ======================================================== -->
    <div id="step-difficulty" class="step">
      <div class="rune rune-1">⟁</div>
      <div class="rune rune-2">⟃</div>
      <div class="rune rune-3">⟂</div>
      <div class="rune rune-4">⟇</div>
      <div class="step-header">
        <h2 class="step-title">Choose a difficulty</h2>
      </div>

      <div class="difficulty-options">

        <div class="difficulty-wrap">
          <button id="difficulty-easy" class="difficulty-card difficulty-card--easy">
            <span class="difficulty-label">Easy</span>
            <span class="btn-glow"></span>
          </button>
          <div class="diff-tooltip">Budget: 250<span class="cur-symbol">€</span> · Higher chance for rewards · Lower chance for curses</div>
        </div>
        <div class="difficulty-wrap">
          <button id="difficulty-normal" class="difficulty-card difficulty-card--normal">
            <span class="difficulty-label">Normal</span>
            <span class="btn-glow"></span>
          </button>
          <div class="diff-tooltip">Budget: 150<span class="cur-symbol">€</span></div>
        </div>
        <div class="difficulty-wrap">
          <button id="difficulty-hard" class="difficulty-card difficulty-card--hard">
            <span class="difficulty-label">Hard</span>
            <span class="btn-glow"></span>
          </button>
          <div class="diff-tooltip">Budget: 75<span class="cur-symbol">€</span> · One additional deck restriction · Lower chance for rewards · Higher chance for curses</div>
        </div>

        <div class="difficulty-wrap difficulty-wrap--custom">
          <button id="difficulty-custom" class="difficulty-card difficulty-card--custom">
            <span class="difficulty-label">Custom</span>
            <span class="btn-glow"></span>
          </button>
          <div class="diff-tooltip">Configure your own rules</div>
        </div>

      </div>

      <div id="custom-panel" class="custom-panel hidden">
        <div class="custom-field">
          <label class="custom-field-label">Budget <span id="custom-budget-display" class="budget-display">150<span class="cur-symbol">€</span></span></label>
          <div class="budget-slider-row">
            <span class="budget-label">25<span class="cur-symbol">€</span></span>
            <input id="custom-budget-slider" type="range" min="0" max="18" step="1" value="5" class="budget-slider">
            <span class="budget-label">No limit</span>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Starting Rerolls <span id="custom-rerolls-display" class="budget-display">1</span></label>
          <div class="budget-slider-row">
            <span class="budget-label">0</span>
            <input id="custom-rerolls-slider" type="range" min="0" max="5" step="1" value="1" class="budget-slider">
            <span class="budget-label">5</span>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Curse Chances</label>
          <div class="custom-toggle-row">
            <button class="custom-toggle" data-group="curse" data-value="low">Low</button>
            <button class="custom-toggle custom-toggle--active" data-group="curse" data-value="normal">Normal</button>
            <button class="custom-toggle" data-group="curse" data-value="high">High</button>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Reward Chances</label>
          <div class="custom-toggle-row">
            <button class="custom-toggle" data-group="reward" data-value="low">Low</button>
            <button class="custom-toggle custom-toggle--active" data-group="reward" data-value="normal">Normal</button>
            <button class="custom-toggle" data-group="reward" data-value="high">High</button>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Number of Events <span id="custom-events-display" class="budget-display">3</span></label>
          <div class="budget-slider-row">
            <span class="budget-label">1</span>
            <input id="custom-events-slider" type="range" min="1" max="10" step="1" value="3" class="budget-slider">
            <span class="budget-label">10</span>
          </div>
        </div>
        <button id="btn-custom-begin" class="btn-primary custom-begin-btn">Begin Quest →</button>
      </div>

    </div><!-- /step-difficulty -->

    <!-- ========================================================
         STEP 1 — The Wheel of Mana
         Player clicks the wheel three times. Each spin reveals
         a color. Duplicates trigger mercy reroll or rainbow.
    ======================================================== -->
    <div id="step-1" class="step active-step">
      <div class="step-header">
        <h2 class="step-title">The Wheel of Mana</h2>
        <p class="step-desc">
          Spin the wheel thrice.
        </p>
      </div>

      <div class="wheel-arena">
        <div class="wheel-container">
          <div class="wheel-pointer">
            <img src="assets/files/designs/pointer.png" alt="" width="36" height="52" aria-hidden="true">
          </div>
          <!-- Wheel segments are injected by step-wheel.js -->
          <div id="color-wheel" class="color-wheel"></div>
        </div>
      </div>

      <div class="selected-colors-area">
        <div id="selected-colors" class="selected-colors">
          <div class="color-slot empty" id="slot-0" aria-label="Slot 1"></div>
          <div class="color-slot empty" id="slot-1" aria-label="Slot 2"></div>
          <div class="color-slot empty" id="slot-2" aria-label="Slot 3"></div>
        </div>
      </div>

      <!-- Messages and Continue button appear here after spins complete -->
      <div id="step1-result" class="step-result">
        <p id="result-mercy-msg"  class="result-rainbow-msg hidden"></p>
        <p id="result-rainbow-msg" class="result-rainbow-msg hidden"></p>
        <div id="color-combo-box" class="color-combo-box hidden">
          <p class="color-combo-rule">Your commander may use any color or combination of colors you revealed.</p>
        </div>
        <button id="btn-next-step" class="btn-primary hidden">Continue Quest →</button>
      </div>
    </div><!-- /step-1 -->

    <!-- ========================================================
         STEP 2 — The Burden (Commander Stats)
         Three flip cards drawn from quest_burdens.csv.
         Player reveals all three, then picks one.
    ======================================================== -->
    <div id="step-2" class="step">
      <div class="step-header">
        <span class="step-group-label">Commander</span>
        <h2 class="step-title">The Burden</h2>
        <p class="step-desc">Reveal three fates and choose one.</p>
      </div>

      <div class="card-arena" id="card-arena">
        <!-- Flip cards injected by step-cards.js on activation -->
        <div class="drawn-cards-row" id="drawn-cards-row"></div>
      </div>

      <div id="step2-result" class="step-result hidden">
        <button id="btn-step2-next" class="btn-primary">Continue Quest →</button>
      </div>
    </div><!-- /step-2 -->

    <!-- ========================================================
         STEP 3 — The Lore (Flavor / Lore Bindings)
         Same mechanic as Step 2, using lore_scryfall.csv.
    ======================================================== -->
    <div id="step-3" class="step">
      <div class="step-header">
        <span class="step-group-label">Commander</span>
        <h2 class="step-title">The Lore</h2>
        <p class="step-desc">Reveal three lore fragments and choose one.</p>
      </div>

      <div class="card-arena" id="omens-arena">
        <!-- Flip cards injected by step-cards.js on activation -->
        <div class="drawn-cards-row" id="drawn-lore-row"></div>
      </div>

      <div id="step3-result" class="step-result hidden">
        <button id="btn-step3-next" class="btn-primary">Continue Quest →</button>
      </div>
    </div><!-- /step-3 -->

    <!-- ========================================================
         STEP 4 — The Crossroads (Event Choices)
         Four events from quest_events.csv. Player faces two
         sequential forks and picks one event at each.
    ======================================================== -->
    <div id="step-4" class="step">
      <div class="step-header">
        <h2 class="step-title">The Crossroads</h2>
        <p class="step-desc">Choose events that restrict your deck.</p>
      </div>

      <div class="crossroads-journey" id="crossroads-journey">
        <span class="map-corner map-corner-tl">✦</span>
        <span class="map-corner map-corner-tr">✦</span>
        <span class="map-corner map-corner-bl">✦</span>
        <span class="map-corner map-corner-br">✦</span>
        <!-- Path and crossings injected by step-crossroads.js -->
      </div>

      <div id="step4-events-result" class="step-result hidden">
        <button id="btn-step4-events-next" class="btn-primary btn-complete">✦ Reveal Your Full Quest ✦</button>
      </div>
    </div><!-- /step-4 -->

    <!-- Fate event overlay — shown after a burden pick triggers a positive or negative event -->
    <div id="fate-overlay" class="fate-overlay hidden">
      <div class="fate-modal">
        <div class="fate-icon"></div>
        <h3 class="fate-title"></h3>
        <p class="fate-text"></p>
        <div class="fate-timer-bar">
          <div class="fate-timer-fill"></div>
        </div>
        <p class="fate-dismiss-hint">click anywhere to dismiss</p>
      </div>
    </div>

    <!-- Path of Greed review overlay — shown between Step 3 and Step 4 -->
    <div id="greed-overlay" class="greed-overlay hidden">
      <div class="greed-modal">
        <span class="greed-overview-label">Overview</span>
        <h2 class="greed-title"></h2>
        <p class="greed-subtitle"></p>
        <div class="greed-penalty-notice hidden"></div>
        <div class="greed-cards-row"></div>
        <div class="greed-actions">
          <button class="btn-primary btn-greed-accept">Accept the Path →</button>
          <div class="greed-path-wrap">
            <button class="btn-greed-path">💀 Path of Greed</button>
            <div class="greed-path-tooltip">All your choices will be lost. A new burden and lore are drawn at random. You gain +1 deck restriction in the next section.</div>
          </div>
          <div class="greed-path-warning hidden">
            <div class="greed-path-warning-actions">
              <button class="btn-greed-path-confirm">💀 Confirm the Path</button>
              <button class="btn-greed-path-cancel">← Cancel</button>
            </div>
          </div>
          <div class="greed-fail hidden">
            <p class="greed-fail-text"></p>
            <button class="btn-primary btn-greed-retreat">← Return to Start</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Shared intro overlay — content built dynamically by showIntroOverlay() in ui.js -->
    <div id="intro-overlay" class="reroll-intro-overlay hidden">
      <div class="intro-overlay-runes">
        <div class="rune rune-1">⟁</div>
        <div class="rune rune-2">⟃</div>
        <div class="rune rune-3">⟂</div>
        <div class="rune rune-4">⟇</div>
      </div>
      <div id="intro-overlay-content" class="intro-overlay-content"></div>
      <div class="intro-progress-bar">
        <div id="intro-progress-fill" class="intro-progress-fill"></div>
      </div>
      <p class="intro-skip-hint">click anywhere to skip</p>
    </div>

  </main><!-- /#quest-main -->
</div><!-- /#screen-quest -->
