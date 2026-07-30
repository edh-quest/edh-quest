/**
 * state.js — Live Game State
 *
 * All mutable state that changes during a quest session lives here.
 * Each state object is reset by its owning module when a new step
 * or quest begins — state.js only defines the initial shape.
 *
 * Dependencies: none
 */

'use strict';

/* =============================================================
   QUEST STATE
   Tracks the player's choices across all four steps.
   Reset at the start of each new quest (see QuestFlow.begin).
============================================================= */
const QuestState = {
  difficulty:     'normal', // 'easy' | 'normal' | 'hard' | 'custom'
  budget:         150,      // € budget for the quest, set by difficulty (updated at end with reroll bonus)
  budgetBonus:    0,        // € bonus added from unused rerolls
  customSettings: {         // Only used when difficulty === 'custom'
    budget:       150,
    rerolls:      1,
    curseLevel:   'normal', // 'low' | 'normal' | 'high'
    rewardLevel:  'normal', // 'low' | 'normal' | 'high'
    crossingCount: 3,
  },
  selectedColors: [],       // Color objects chosen on the wheel (may contain dupes before dedup)
  commanderStat:  null,     // The burden card picked in Step 2
  extraBurden:    null,     // An additional burden from the Curse of Greed event
  flavorCriteria:   null,     // The lore card picked in Step 3
  chosenEvents:     [],       // The events picked in Step 4
  greedCount:       0,        // Times Path of Greed was taken
  greedPenalty:     0,        // Extra crossings added as penalty
  pendingLoreBonus: 0,        // Bonus rerolls from lore card, granted on Continue

  reset() {
    this.difficulty       = 'normal';
    this.budget           = 150;
    this.budgetBonus      = 0;
    this.customSettings   = { budget: 150, rerolls: 1, curseLevel: 'normal', rewardLevel: 'normal', crossingCount: 3 };
    this.selectedColors   = [];
    this.commanderStat    = null;
    this.extraBurden      = null;
    this.flavorCriteria   = null;
    this.chosenEvents     = [];
    this.greedCount       = 0;
    this.greedPenalty     = 0;
    this.pendingLoreBonus = 0;
  },
};

/* =============================================================
   WHEEL STATE
   Tracks the spinning wheel across the three main spins and
   the optional mercy reroll.
============================================================= */
const WheelState = {
  isSpinning:   false,
  rotation:     0,   // Cumulative degrees (never resets to 0 mid-quest)
  pickedColors: [],  // Color IDs in slot order (can contain dupes)
  spinsNeeded:  3,
  // Pre-computed color picks so wheel outcomes stay identical on resume.
  // Populated at activateStep1 while RNG is seeded; consumed at spin time.
  predetermined:      [],
  mercyRerollTargets: [],
};

/* =============================================================
   CARD STATE
   Shared flip counter for Steps 2 and 3.
   Reset by activateStep2 / activateStep3 before each step.
============================================================= */
const CardState = {
  flippedCount: 0,
  totalCards:   3, // Set by activateStep2/3 based on difficulty
};

/* =============================================================
   EVENT STATE
   Tracks the two crossings in Step 4.
============================================================= */
const EventState = {
  picks:            [],       // Unique event objects drawn at the start
  chosen:           [],       // Set by activateStep4 based on difficulty
  flippedCounts:    [],       // Set by activateStep4 based on difficulty
  crossingCount:    2,        // 2 for easy/normal, 3 for hard
  cardsPerCrossing: 3,        // always 3
  pendingBonus:     [],       // Bonus rerolls per crossing, granted on Proceed/Continue
  // Persisted for mid-quest resume: the raw event objects drawn per crossing,
  // and the index (0..cardsPerCrossing-1) the player picked at each crossing.
  crossingBatches:  [],       // e.g. [ [ev,ev,ev], [ev,ev,ev], null, null ]
  chosenIdx:        [],       // e.g. [ 0, 2, null, null ]
};

/* =============================================================
   REROLL STATE
   Tracks the player's remaining card rerolls (steps 2–4).
   Initialised by activateStep2 once the difficulty is known.
============================================================= */
const RerollState = {
  remaining:  0,
  usedTitles: new Set(),

  init(difficulty) {
    this.remaining  = difficulty === 'custom' ? QuestState.customSettings.rerolls : 1;
    this.usedTitles = new Set();
  },

  markUsed(crits) {
    crits.forEach(c => this.usedTitles.add(c.title));
  },

  /** Pick a random card from pool not yet seen this quest. Marks it used. */
  pickNew(pool) {
    const available = pool.filter(c => !this.usedTitles.has(c.title));
    if (!available.length) return null;
    const picked = available[Math.floor(Math.random() * available.length)];
    this.usedTitles.add(picked.title);
    return picked;
  },

  use() {
    if (this.remaining <= 0) return false;
    this.remaining--;
    return true;
  },

  updateCounter() {
    const wrap = document.getElementById('reroll-counter-wrap');
    const el   = document.getElementById('reroll-counter');
    const tip  = document.getElementById('reroll-counter-tip');
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < this.remaining; i++) {
      const pip = document.createElement('span');
      pip.className   = 'reroll-pip';
      pip.textContent = '✦';
      el.appendChild(pip);
    }
    if (wrap) wrap.classList.toggle('hidden', this.remaining <= 0);
    if (tip) {
      const r = this.remaining;
      tip.textContent = `⟳  You have ${r} reroll${r !== 1 ? 's' : ''} — hold a card to use one.`;
    }
  },

  clear() {
    this.remaining  = 0;
    this.usedTitles = new Set();
    this.updateCounter();
  },
};
