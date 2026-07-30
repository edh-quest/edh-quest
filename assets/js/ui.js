/**
 * ui.js — Screen Manager & Quest Flow Controller
 *
 * Screen  — shows/hides the three full-page screens (landing,
 *            quest, complete) with a fade transition.
 *
 * QuestFlow — advances through the STEPS array in order,
 *             activates each step, and manages the progress bar.
 *
 * STEPS and PROGRESS_GROUPS are defined in main.js (after all
 * step modules are loaded) and referenced here as globals.
 *
 * Dependencies: state.js (QuestState), summary.js (renderQuestSummary)
 */

'use strict';

/* =============================================================
   SCREEN MANAGER
============================================================= */
const Screen = {
  current: null,

  /** Fade out the current screen and fade in the one with the given id. */
  show(id) {
    const next = document.getElementById(id);
    if (!next) return;

    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    next.style.display = 'flex';
    void next.offsetWidth; // force reflow so the transition fires
    next.classList.add('active', 'fade-in');
    next.addEventListener('animationend', () => next.classList.remove('fade-in'), { once: true });

    this.current = next;
  },
};

/* =============================================================
   QUEST FLOW CONTROLLER
============================================================= */
const QuestFlow = {
  currentStepIndex: 0,
  viewingStepIndex: 0,
  lobbyMode: false,

  /** Build the progress bar in the quest header. */
  initProgress() {
    const container = document.getElementById('quest-progress');
    container.innerHTML = '';

    PROGRESS_GROUPS.forEach(group => {
      const groupEl = document.createElement('div');
      groupEl.className = 'progress-group';

      const stepEl = document.createElement('div');
      stepEl.className = 'progress-step';
      stepEl.id        = group.id;
      stepEl.textContent = group.label;
      groupEl.appendChild(stepEl);

      if (group.dotCount > 0) {
        const dotsEl = document.createElement('div');
        dotsEl.className = 'progress-dots';
        for (let i = 0; i < group.dotCount; i++) {
          const dot = document.createElement('div');
          dot.className = 'progress-dot';
          dot.id = `${group.id}-dot-${i}`;
          dotsEl.appendChild(dot);
        }
        groupEl.appendChild(dotsEl);
      }

      container.appendChild(groupEl);
    });

    this._updateProgress();
  },

  /** Start a fresh solo quest from the difficulty step. */
  begin() {
    QuestState.reset();
    RerollState.clear();
    this.currentStepIndex = 0;
    this.viewingStepIndex = 0;
    this.resumeFromIndex  = 0;
    this.lobbyMode = false;
    // Save immediately so an accidental close during Step 0/1 is still recoverable
    QuestSave.save(this.currentStepIndex, 'solo', null);
    Screen.show('screen-quest');
    this.initProgress();
    const overviewEl = document.getElementById('pg-overview');
    if (overviewEl) overviewEl.classList.remove('active', 'complete');
    this._activateCurrentStep();
  },

  /** Start a lobby quest: difficulty pre-set, skip difficulty step. */
  beginLobby(lobby) {
    QuestState.reset();
    RerollState.clear();
    const diff = (typeof lobby === 'string') ? lobby : (lobby.difficulty || 'normal');
    QuestState.difficulty = diff;
    if (diff === 'custom' && lobby.custom_settings) {
      const cs = lobby.custom_settings;
      QuestState.customSettings = {
        budget:        cs.budget         ?? 150,
        rerolls:       cs.rerolls        ?? 1,
        curseLevel:    cs.curse_level    ?? 'normal',
        rewardLevel:   cs.reward_level   ?? 'normal',
        crossingCount: cs.crossing_count ?? 3,
      };
      QuestState.budget = QuestState.customSettings.budget;
    } else {
      QuestState.budget = diff === 'easy' ? 250 : diff === 'normal' ? 150 : 75;
    }
    this.currentStepIndex = 1; // skip step-difficulty
    this.viewingStepIndex = 1;
    this.resumeFromIndex  = 1;
    this.lobbyMode = true;
    // Save immediately so a mid-color-wheel disconnect is still recoverable
    QuestSave.save(this.currentStepIndex, 'lobby', LobbyState.code || null);
    Screen.show('screen-quest');
    this.initProgress();
    const overviewEl = document.getElementById('pg-overview');
    if (overviewEl) overviewEl.classList.remove('active', 'complete');
    this._activateCurrentStep();
  },

  /** Move to the next step, or complete the quest if on the last step. */
  advance() {
    if (this.currentStepIndex < STEPS.length - 1) {
      this.currentStepIndex++;
      // Save on entering any step from the color wheel onward so a mid-quest close is recoverable
      if (this.currentStepIndex >= 1) {
        const seed = QuestSave.save(
          this.currentStepIndex,
          this.lobbyMode ? 'lobby' : 'solo',
          this.lobbyMode ? (LobbyState.code || null) : null
        );
        // Apply the same seed now so the first draw matches future resumes
        if (seed !== undefined) RNG.setSeed(seed);
      }
      this._activateCurrentStep();
      RNG.reset();
    } else {
      QuestSave.clear();
      this.complete();
    }
  },

  /** Show the quest summary screen. */
  complete() {
    const results = exportQuestResults();
    renderQuestSummary();

    // Toggle lobby vs solo buttons on the complete screen
    const btnReturn = document.getElementById('btn-return-to-lobby');
    const btnNew    = document.getElementById('btn-new-quest');
    const shareBtn  = document.getElementById('btn-copy-quest-link');
    const mode      = this.lobbyMode ? 'lobby' : 'solo';
    if (this.lobbyMode) {
      if (btnReturn) btnReturn.classList.remove('hidden');
      if (btnNew)    btnNew.classList.add('hidden');
      LobbyFlow.saveResults(results);
    } else {
      if (btnReturn) btnReturn.classList.add('hidden');
      if (btnNew)    btnNew.classList.remove('hidden');
    }
    // Hide share button until the server save resolves with an id.
    if (shareBtn) shareBtn.classList.add('hidden');

    saveQuestToServer(results).then(questId => {
      HistoryStore.save(results, mode, questId);
      setQuestShareLink(shareBtn, questId);
    });

    this._showComplete();
  },

  _showComplete() {
    Screen.show('screen-complete');
    window.scrollTo(0, 0);
    const overviewEl = document.getElementById('pg-overview');
    if (overviewEl) overviewEl.classList.add('active');
  },

  /** Hide all steps, show and activate the current one, scroll to top. */
  _activateCurrentStep() {
    STEPS.forEach(step => {
      const el = document.getElementById(step.id);
      if (el) el.classList.remove('active-step');
    });

    const current = STEPS[this.currentStepIndex];
    const el = document.getElementById(current.id);
    if (el) {
      el.classList.add('active-step');
      window.scrollTo(0, 0);
    }

    this.viewingStepIndex = this.currentStepIndex;
    document.getElementById('quest-main').classList.remove('view-mode');
    this._updateProgress();
    this._updateNavArrows();
    current.activate();
  },

  /** Navigate to a step by index without re-activating it (read-only view). */
  navigateTo(stepIndex) {
    const minIndex = Math.max(1, this.resumeFromIndex || 0);
    if (stepIndex > this.currentStepIndex || stepIndex < minIndex) return;

    STEPS.forEach(step => {
      const el = document.getElementById(step.id);
      if (el) el.classList.remove('active-step');
    });

    const el = document.getElementById(STEPS[stepIndex].id);
    if (el) { el.classList.add('active-step'); window.scrollTo(0, 0); }

    this.viewingStepIndex = stepIndex;
    document.getElementById('quest-main').classList.toggle('view-mode', stepIndex < this.currentStepIndex);
    this._updateNavArrows();
  },

  /** Enable/disable the prev/next arrow buttons based on viewing position. */
  _updateNavArrows() {
    const prev     = document.getElementById('btn-nav-prev');
    const next     = document.getElementById('btn-nav-next');
    const minIndex = Math.max(1, this.resumeFromIndex || 0);
    if (prev) prev.disabled = this.viewingStepIndex <= minIndex;
    if (next) next.disabled = this.viewingStepIndex >= this.currentStepIndex;
  },

  /** Sync the progress bar indicators with the current step index. */
  _updateProgress() {
    const idx = this.currentStepIndex;

    // Find which group index is currently active (last group whose min step ≤ idx)
    let activeGroupIdx = 0;
    PROGRESS_GROUPS.forEach((group, i) => {
      if (group.steps.length > 0 && idx >= Math.min(...group.steps)) activeGroupIdx = i;
    });

    PROGRESS_GROUPS.forEach((group, i) => {
      const el = document.getElementById(group.id);
      if (!el) return;
      el.classList.remove('active', 'complete');

      // Tag each group with distance from active (used by mobile CSS to show/hide).
      // Groups with no steps (Overview) always get 'far' so they stay hidden on mobile.
      const groupEl = el.closest('.progress-group');
      if (groupEl) groupEl.dataset.rel = (group.steps.length === 0 || i > activeGroupIdx + 1)
        ? 'far'
        : i === activeGroupIdx     ? 'active'
        : i === activeGroupIdx - 1 ? 'prev'
        : 'next';

      if (group.steps.length === 0) return; // Overview — never auto-activated

      const min = Math.min(...group.steps);
      const max = Math.max(...group.steps);
      if (idx > max)       el.classList.add('complete');
      else if (idx >= min) el.classList.add('active');
    });

    // Colors dot: done when step 1 is complete
    const colorDot = document.getElementById('pg-colors-dot-0');
    if (colorDot) colorDot.classList.toggle('progress-dot--done', idx > 1);

    // Commander dot: done when both steps 2 and 3 are complete
    const commanderDot = document.getElementById('pg-commander-dot-0');
    if (commanderDot) commanderDot.classList.toggle('progress-dot--done', idx > 3);

    // Deck dot: done when step 4 is complete
    const deckDot = document.getElementById('pg-deck-dot-0');
    if (deckDot) deckDot.classList.toggle('progress-dot--done', idx > 4);
  },

};

/* =============================================================
   SHARED INTRO OVERLAY
   slides: array of { type, lines?, r?, duration }
     type 'body'   — lines[] rendered as paragraphs (first normal, rest with gap)
     type 'reroll' — dynamic reroll count text (r required)
     type 'luck'   — large "Good luck!" text
============================================================= */
function showIntroOverlay(config) {
  const overlay  = document.getElementById('intro-overlay');
  const content  = document.getElementById('intro-overlay-content');
  const fill     = document.getElementById('intro-progress-fill');
  if (!overlay || !content) return;

  const slides = Array.isArray(config) ? config : config.slides;

  function buildSlideEl(slide) {
    const el = document.createElement('div');
    el.className = 'intro-slide';

    if (slide.type === 'luck') {
      const p = document.createElement('p');
      p.className   = 'intro-slide-luck';
      p.textContent = 'Good luck!';
      el.appendChild(p);

    } else if (slide.type === 'reroll') {
      const stars = '✦ '.repeat(slide.r).trim();
      const p = document.createElement('p');
      p.className   = 'intro-slide-body';
      p.textContent = slide.r === 1
        ? `Don't like your options? Press and hold a card to spend a reroll — you start with one (✦).`
        : `Don't like your options? Press and hold a card to spend a reroll — you start with ${slide.r} (${stars}).`;
      el.appendChild(p);

    } else {
      (slide.lines || []).forEach((line, i) => {
        const p = document.createElement('p');
        p.className = i === 0 ? 'intro-slide-body' : 'intro-slide-body intro-slide-body--gap';
        if (line && typeof line === 'object' && line.html) {
          p.innerHTML = line.html;
        } else {
          p.textContent = line;
        }
        el.appendChild(p);
      });
    }
    return el;
  }

  content.innerHTML = '';
  const slideEls = slides.map(buildSlideEl);
  slideEls.forEach(el => content.appendChild(el));

  let current = 0;
  let timer   = null;

  function startProgress(ms) {
    if (!fill) return;
    fill.style.transition = 'none';
    fill.style.width = '0%';
    fill.getBoundingClientRect();
    fill.style.transition = 'width ' + (ms / 1000) + 's linear';
    fill.style.width = '100%';
  }

  function showSlide(i) {
    slideEls.forEach(function(el, idx) {
      el.classList.toggle('intro-slide--hidden', idx !== i);
      el.classList.toggle('intro-slide--active',  idx === i);
    });
    startProgress(slides[i].duration);
  }

  function advance() {
    clearTimeout(timer);
    current++;
    if (current >= slides.length) { dismiss(); return; }
    showSlide(current);
    timer = setTimeout(advance, slides[current].duration);
  }

  function dismiss() {
    clearTimeout(timer);
    overlay.removeEventListener('click', onClick);
    overlay.classList.add('reroll-intro-overlay--hiding');
    overlay.addEventListener('transitionend', function() {
      overlay.classList.add('hidden');
      overlay.classList.remove('reroll-intro-overlay--hiding');
    }, { once: true });
  }

  function onClick() { advance(); }

  overlay.classList.toggle('reroll-intro-overlay--solid', !Array.isArray(config) && !!config.solid);
  overlay.classList.remove('hidden', 'reroll-intro-overlay--hiding');
  showSlide(0);
  overlay.addEventListener('click', onClick);
  timer = setTimeout(advance, slides[0].duration);
}
