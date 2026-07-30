/**
 * step-difficulty.js — Step 0: Difficulty Selection
 *
 * Before the quest begins the player picks Easy, Normal, Hard, or Custom.
 * The choice is stored in QuestState.difficulty and affects:
 *
 *   easy   — budget 250€, 1 reroll, mercy reroll on the color wheel, 3 cards per trial
 *   normal — budget 150€, 1 reroll, mercy reroll on the color wheel, 3 cards per trial (default)
 *   hard   — budget  75€, 1 reroll, mercy reroll on the color wheel, one extra crossing
 *   custom — fully configurable via the custom panel
 *
 * Dependencies: state.js (QuestState), ui.js (QuestFlow)
 */

'use strict';

const BUDGET_STEPS = [
  25, 50, 75, 100, 125, 150, 175, 200,
  250, 300, 350, 400,
  500, 600, 700, 800, 900, 1000,
  0, // No budget restriction
];

function activateStepDifficulty() {
  const panel = document.getElementById('custom-panel');
  panel.classList.add('hidden');

  // Reset custom panel to defaults
  const budgetSliderEl = document.getElementById('custom-budget-slider');
  const budgetDisplayEl = document.getElementById('custom-budget-display');
  if (budgetSliderEl) { budgetSliderEl.value = 5; budgetDisplayEl.textContent = '150' + Currency.symbol(); }

  const rerollsSliderEl = document.getElementById('custom-rerolls-slider');
  const rerollsDisplayEl = document.getElementById('custom-rerolls-display');
  if (rerollsSliderEl) { rerollsSliderEl.value = 1; rerollsDisplayEl.textContent = '1'; }

  const eventsSliderEl = document.getElementById('custom-events-slider');
  const eventsDisplayEl = document.getElementById('custom-events-display');
  if (eventsSliderEl) { eventsSliderEl.value = 3; eventsDisplayEl.textContent = '3'; }

  document.querySelectorAll('.custom-toggle').forEach(btn => {
    btn.classList.toggle('custom-toggle--active', btn.dataset.value === 'normal');
  });

  // Standard difficulty buttons
  ['easy', 'normal', 'hard'].forEach(level => {
    const btn = document.getElementById(`difficulty-${level}`);
    if (!btn) return;
    btn.onclick = () => {
      panel.classList.add('hidden');
      QuestState.difficulty = level;
      QuestState.budget = level === 'easy' ? 250 : level === 'normal' ? 150 : 75;
      QuestFlow.advance();
    };
  });

  // Custom button — show panel instead of advancing
  const customBtn = document.getElementById('difficulty-custom');
  if (customBtn) {
    customBtn.onclick = () => {
      panel.classList.toggle('hidden');
    };
  }

  // Budget slider
  const budgetSlider  = document.getElementById('custom-budget-slider');
  const budgetDisplay = document.getElementById('custom-budget-display');
  if (budgetSlider) {
    budgetSlider.oninput = () => {
      const val = BUDGET_STEPS[budgetSlider.value];
      budgetDisplay.textContent = val === 0 ? 'No budget restriction' : val + Currency.symbol();
    };
  }

  // Rerolls slider
  const rerollsSlider  = document.getElementById('custom-rerolls-slider');
  const rerollsDisplay = document.getElementById('custom-rerolls-display');
  if (rerollsSlider) {
    rerollsSlider.oninput = () => {
      rerollsDisplay.textContent = rerollsSlider.value;
    };
  }

  // Events slider
  const eventsSlider  = document.getElementById('custom-events-slider');
  const eventsDisplay = document.getElementById('custom-events-display');
  if (eventsSlider) {
    eventsSlider.oninput = () => {
      eventsDisplay.textContent = eventsSlider.value;
    };
  }

  // Toggle buttons (curse / reward level)
  document.querySelectorAll('.custom-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      document.querySelectorAll(`.custom-toggle[data-group="${group}"]`).forEach(b => {
        b.classList.remove('custom-toggle--active');
      });
      btn.classList.add('custom-toggle--active');
    });
  });

  // Begin Quest button
  const beginBtn = document.getElementById('btn-custom-begin');
  if (beginBtn) {
    beginBtn.onclick = () => {
      const curseBtn  = document.querySelector('.custom-toggle--active[data-group="curse"]');
      const rewardBtn = document.querySelector('.custom-toggle--active[data-group="reward"]');

      QuestState.difficulty = 'custom';
      QuestState.customSettings = {
        budget:        BUDGET_STEPS[parseInt(budgetSlider.value, 10)],
        rerolls:       parseInt(rerollsSlider.value, 10),
        curseLevel:    curseBtn  ? curseBtn.dataset.value  : 'normal',
        rewardLevel:   rewardBtn ? rewardBtn.dataset.value : 'normal',
        crossingCount: parseInt(eventsSlider.value, 10),
      };
      QuestState.budget = QuestState.customSettings.budget;
      QuestFlow.advance();
    };
  }
}
