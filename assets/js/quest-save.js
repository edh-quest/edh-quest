'use strict';

/* =============================================================
   QUEST SAVE / LOAD
   Persists QuestState to localStorage after each step so the
   user can resume if they accidentally close the browser.
============================================================= */
const QuestSave = {
  KEY:        'mtgq_active_quest',
  MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,

  save(stepIndex, mode, lobbyCode) {
    // Preserve seeds already generated for earlier steps; create one for this step if new
    const existing = this.load();
    const seeds = (existing && existing.seeds) ? Object.assign({}, existing.seeds) : {};
    if (!seeds[stepIndex]) {
      seeds[stepIndex] = Math.floor(Math.random() * 0x7FFFFFFF);
    }
    const stepSeed = seeds[stepIndex];
    const data = {
      stepIndex,
      mode:      mode || 'solo',
      lobbyCode: lobbyCode || null,
      seeds,
      state: {
        difficulty:     QuestState.difficulty,
        budget:         QuestState.budget,
        budgetBonus:    QuestState.budgetBonus,
        customSettings: Object.assign({}, QuestState.customSettings),
        selectedColors: QuestState.selectedColors.slice(),
        commanderStat:  QuestState.commanderStat,
        extraBurden:    QuestState.extraBurden,
        flavorCriteria: QuestState.flavorCriteria,
        chosenEvents:   QuestState.chosenEvents.slice(),
        greedCount:     QuestState.greedCount,
        greedPenalty:   QuestState.greedPenalty,
        // Reroll counter carries across Steps 2–4, so persist it too.
        rerollsRemaining: RerollState.remaining,
        rerollsUsed:      Array.from(RerollState.usedTitles),
        // Step 4 in-progress state: batches drawn per crossing + which card was picked
        step4: (stepIndex === 4) ? {
          crossingBatches: EventState.crossingBatches.map(b => b ? b.slice() : null),
          chosenIdx:       EventState.chosenIdx.slice(),
          pendingBonus:    EventState.pendingBonus.slice(),
          flippedCounts:   EventState.flippedCounts.slice(),
        } : null,
      },
      savedAt: Date.now(),
    };
    safeLocalStorageSet(this.KEY, JSON.stringify(data));
    return stepSeed;
  },

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(this.KEY));
      if (!data) return null;
      if (Date.now() - data.savedAt > this.MAX_AGE_MS) { this.clear(); return null; }
      return data;
    } catch (_) { return null; }
  },

  clear() {
    localStorage.removeItem(this.KEY);
  },

  restore(data) {
    const s = data.state;
    QuestState.difficulty      = s.difficulty;
    QuestState.budget          = s.budget;
    QuestState.budgetBonus     = s.budgetBonus;
    QuestState.customSettings  = Object.assign({}, QuestState.customSettings, s.customSettings);
    QuestState.selectedColors  = s.selectedColors  || [];
    QuestState.commanderStat   = s.commanderStat   || null;
    QuestState.extraBurden     = s.extraBurden     || null;
    QuestState.flavorCriteria  = s.flavorCriteria  || null;
    QuestState.chosenEvents    = s.chosenEvents    || [];
    QuestState.greedCount      = s.greedCount      || 0;
    QuestState.greedPenalty    = s.greedPenalty    || 0;
    QuestState.pendingLoreBonus = 0;

    // RerollState — carries across Steps 2–4; without this, resume at Step 3/4
    // would show 0 rerolls and drop bonus rerolls the player has earned.
    if (typeof s.rerollsRemaining === 'number') {
      RerollState.remaining = s.rerollsRemaining;
    }
    RerollState.usedTitles = new Set(s.rerollsUsed || []);

    // Step 4: preserve prior crossings' picks + drawn cards so resume shows
    // decided crossings locked in rather than re-rolling them.
    if (s.step4) {
      EventState.crossingBatches = (s.step4.crossingBatches || []).map(b => b ? b.slice() : null);
      EventState.chosenIdx       = (s.step4.chosenIdx       || []).slice();
      EventState.pendingBonus    = (s.step4.pendingBonus    || []).slice();
      EventState.flippedCounts   = (s.step4.flippedCounts   || []).slice();
    } else {
      EventState.crossingBatches = [];
      EventState.chosenIdx       = [];
    }
  },
};

/* =============================================================
   RESUME FLOW
============================================================= */
const ResumeFlow = {
  _data: null,

  check() {
    const data = QuestSave.load();
    if (!data) return;
    this._data = data;
    const banner = document.getElementById('resume-banner');
    if (banner) banner.classList.remove('hidden');
  },

  show() {
    if (!this._data) this._data = QuestSave.load();
    if (!this._data) return;
    // Temporarily restore state so renderQuestSummary reads the right data
    QuestSave.restore(this._data);
    renderQuestSummary(document.getElementById('resume-recap'));
    QuestState.reset();
    document.getElementById('resume-overlay').classList.remove('hidden');
  },

  async resume() {
    const data = this._data || QuestSave.load();
    if (!data) return;

    // Card steps need CRITERIA populated; on a very fast Resume click this may
    // still be a pending promise.
    if (window.__dataReady) { try { await window.__dataReady; } catch (_) {} }

    document.getElementById('resume-overlay').classList.add('hidden');
    document.getElementById('resume-banner').classList.add('hidden');

    // Clear before restore so a stale DOM counter doesn't overwrite the restored value.
    RerollState.clear();
    QuestSave.restore(data);
    RerollState.updateCounter();

    if (data.mode === 'lobby') {
      LobbyState.load();
      QuestFlow.lobbyMode = true;
    } else {
      QuestFlow.lobbyMode = false;
    }

    QuestFlow.currentStepIndex = data.stepIndex;
    QuestFlow.viewingStepIndex = data.stepIndex;
    QuestFlow.resumeFromIndex  = data.stepIndex;
    Screen.show('screen-quest');
    QuestFlow.initProgress();
    const overviewEl = document.getElementById('pg-overview');
    if (overviewEl) overviewEl.classList.remove('active', 'complete');

    // Apply the saved seed so card draws are identical on every resume
    const seed = data.seeds && data.seeds[data.stepIndex];
    if (seed !== undefined) RNG.setSeed(seed);
    QuestFlow._activateCurrentStep();
    RNG.reset(); // restore true randomness for rerolls, fate rolls, etc.
  },

  dismiss() {
    QuestSave.clear();
    this._data = null;
    document.getElementById('resume-banner').classList.add('hidden');
  },

  startFresh() {
    QuestSave.clear();
    this._data = null;
    document.getElementById('resume-overlay').classList.add('hidden');
    document.getElementById('resume-banner').classList.add('hidden');
  },

};
