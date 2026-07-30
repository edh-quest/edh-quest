<!-- ============================================================
     SCREEN: Create Lobby
============================================================ -->
<div id="screen-lobby-create" class="screen">
  <div class="lobby-screen-content">

    <div class="lobby-form-header">
      <div class="sigil">✦</div>
      <h2 class="step-title">Create a Lobby</h2>
    </div>

    <form id="form-lobby-create" class="lobby-form" novalidate>
      <div class="lobby-honeypot" aria-hidden="true">
        <input type="text" name="website" id="lobby-hp" tabindex="-1" autocomplete="off">
      </div>

      <!-- Difficulty — first selection -->
      <div class="lobby-field">
        <label>Difficulty</label>
        <div class="lobby-difficulty-row">
          <div class="lobby-diff-wrap">
            <button type="button" class="lobby-diff-btn" data-diff="easy">Easy</button>
            <div class="diff-tooltip">Budget: 250<span class="cur-symbol">€</span> · Higher chance for rewards · Lower chance for curses</div>
          </div>
          <div class="lobby-diff-wrap">
            <button type="button" class="lobby-diff-btn lobby-diff-btn--selected" data-diff="normal">Normal</button>
            <div class="diff-tooltip">Budget: 150<span class="cur-symbol">€</span></div>
          </div>
          <div class="lobby-diff-wrap">
            <button type="button" class="lobby-diff-btn" data-diff="hard">Hard</button>
            <div class="diff-tooltip">Budget: 75<span class="cur-symbol">€</span> · One additional deck restriction · Lower chance for rewards · Higher chance for curses</div>
          </div>
        </div>
        <div class="lobby-difficulty-custom-row">
          <div class="lobby-diff-wrap" style="flex:1">
            <button type="button" class="lobby-diff-btn lobby-diff-btn--custom" data-diff="custom">Custom</button>
            <div class="diff-tooltip">Configure your own rules</div>
          </div>
        </div>
        <input type="hidden" id="create-difficulty" value="normal">
      </div>

      <!-- Custom settings panel (shown only when Custom is selected) -->
      <div id="lobby-custom-panel" class="custom-panel custom-panel--lobby hidden">
        <div class="custom-field">
          <label class="custom-field-label">Budget <span id="lobby-custom-budget-display" class="budget-display">150<span class="cur-symbol">€</span></span></label>
          <div class="budget-slider-row">
            <span class="budget-label">25<span class="cur-symbol">€</span></span>
            <input id="lobby-custom-budget-slider" type="range" min="0" max="18" step="1" value="5" class="budget-slider">
            <span class="budget-label">No limit</span>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Starting Rerolls <span id="lobby-custom-rerolls-display" class="budget-display">1</span></label>
          <div class="budget-slider-row">
            <span class="budget-label">0</span>
            <input id="lobby-custom-rerolls-slider" type="range" min="0" max="5" step="1" value="1" class="budget-slider">
            <span class="budget-label">5</span>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Curse Chances</label>
          <div class="custom-toggle-row">
            <button type="button" class="lobby-custom-toggle" data-group="curse" data-value="low">Low</button>
            <button type="button" class="lobby-custom-toggle lobby-custom-toggle--active" data-group="curse" data-value="normal">Normal</button>
            <button type="button" class="lobby-custom-toggle" data-group="curse" data-value="high">High</button>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Reward Chances</label>
          <div class="custom-toggle-row">
            <button type="button" class="lobby-custom-toggle" data-group="reward" data-value="low">Low</button>
            <button type="button" class="lobby-custom-toggle lobby-custom-toggle--active" data-group="reward" data-value="normal">Normal</button>
            <button type="button" class="lobby-custom-toggle" data-group="reward" data-value="high">High</button>
          </div>
        </div>
        <div class="custom-field">
          <label class="custom-field-label">Number of Events <span id="lobby-custom-events-display" class="budget-display">3</span></label>
          <div class="budget-slider-row">
            <span class="budget-label">1</span>
            <input id="lobby-custom-events-slider" type="range" min="1" max="10" step="1" value="3" class="budget-slider">
            <span class="budget-label">10</span>
          </div>
        </div>
      </div>

      <div class="lobby-field">
        <label for="create-lobby-name">Lobby Name</label>
        <input id="create-lobby-name" type="text" maxlength="60" placeholder="e.g. Friday Night Pod" autocomplete="off">
      </div>

      <div class="lobby-field">
        <label for="create-username">Your Name</label>
        <input id="create-username" type="text" maxlength="30" placeholder="e.g. Alice"
               autocomplete="off" spellcheck="false">
      </div>

      <div class="lobby-field">
        <label>Quest Results</label>
        <div class="lobby-difficulty-row">
          <div class="lobby-diff-wrap">
            <button type="button" class="lobby-diff-btn lobby-diff-btn--selected" data-visibility="public">Public</button>
            <div class="diff-tooltip">Everyone can see each other's results and color roll.</div>
          </div>
          <div class="lobby-diff-wrap">
            <button type="button" class="lobby-diff-btn" data-visibility="hidden">Hidden</button>
            <div class="diff-tooltip">No one can see each other's results.</div>
          </div>
        </div>
        <input type="hidden" id="create-results-visibility" value="public">
      </div>

      <div class="lobby-field">
        <label>Additional Rules <span class="lobby-field-optional">(optional)</span></label>
        <div class="rules-input-row">
          <input id="rules-text-input" type="text" maxlength="120" placeholder="e.g. No land destruction" autocomplete="off">
          <button type="button" id="btn-add-rule" class="btn-ghost rules-add-btn">Add</button>
        </div>
        <div id="rules-chip-list" class="rules-chip-list"></div>
        <input type="hidden" id="create-rules" value="[]">
      </div>

      <div class="lobby-field">
        <label for="create-notes">Notes <span class="lobby-field-optional">(optional)</span></label>
        <textarea id="create-notes" maxlength="500" rows="3"
          placeholder="e.g. Meeting at my place Saturday 7pm. Bring snacks!"></textarea>
      </div>

      <p id="screen-lobby-create-error" class="lobby-error hidden"></p>

      <div class="lobby-form-actions">
        <div class="lobby-diff-wrap">
          <button type="submit" id="btn-do-create-lobby" class="btn-primary">Create Lobby</button>
          <div class="diff-tooltip">Lobbies are automatically deleted after 120 days.</div>
        </div>
        <button type="button" id="btn-create-back" class="btn-ghost">← Back</button>
      </div>

    </form>
  </div>
</div>
