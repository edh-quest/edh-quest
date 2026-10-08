/**
 * step-fate.js — Fate Events after Burden Pick
 *
 * After the player picks a burden card and presses Continue, a fate
 * event may trigger based on the criteria's percentile:
 *   - Low percentile (few commanders match) → chance of bonus rerolls
 *   - High percentile (many commanders match) → chance of extra burden
 *
 * Entry point: FateSystem.handleStep2Continue()
 * Called by the btn-step2-next click handler in main.js.
 */

'use strict';

const FateSystem = {

  /** Called instead of QuestFlow.advance() when Continue is clicked in Step 2. */
  handleStep2Continue() {
    // The reroll intro overlay may still be in its fade-out transition (opacity 0
    // but pointer-events still active). Force it fully hidden now so it can't
    // swallow clicks intended for the fate popup or the curse cards.
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay) {
      introOverlay.classList.add('hidden');
      introOverlay.classList.remove('reroll-intro-overlay--hiding');
    }

    const pct   = QuestState.commanderStat?.percentile ?? null;
    const event = QuestState.difficulty === 'custom'
      ? this._rollEventCustom(pct)
      : QuestState.difficulty === 'hard'
      ? this._rollEventHard(pct)
      : QuestState.difficulty === 'easy'
      ? this._rollEventEasy(pct)
      : this._rollEvent(pct);

    if (!event) {
      QuestFlow.advance();
      return;
    }

    this._showPopup(event, () => {
      if (event.type === 'positive') {
        RerollState.remaining += event.rerolls;
        RerollState.updateCounter();
        QuestFlow.advance();
      } else {
        this._triggerCurse();
      }
    });
  },

  /* ── RNG ──────────────────────────────────────────────────── */

  _rollEvent(pct) {
    if (pct === null || isNaN(pct)) return null;

    const roll = Math.random() * 100;

    // Positive events: low percentile = restrictive criteria = reward
    if (pct < 5) {
      return { type: 'positive', rerolls: Math.random() < 0.50 ? 2 : 1 };
    } else if (pct < 10) {
      if (roll < 90) return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
    } else if (pct < 20) {
      if (roll < 70) return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
    } else if (pct < 30) {
      if (roll < 50) return { type: 'positive', rerolls: 1 };
    } else if (pct < 40) {
      if (roll < 30) return { type: 'positive', rerolls: 1 };
    } else if (pct < 50) {
      if (roll < 10) return { type: 'positive', rerolls: 1 };
    }

    // Negative events: high percentile = easy criteria = penalty
    if (pct >= 95) {
      if (roll < 90) return { type: 'negative' };
    } else if (pct >= 90) {
      if (roll < 70) return { type: 'negative' };
    } else if (pct >= 80) {
      if (roll < 55) return { type: 'negative' };
    } else if (pct >= 70) {
      if (roll < 35) return { type: 'negative' };
    }

    return null;
  },

  _rollEventEasy(pct) {
    if (pct === null || isNaN(pct)) return null;

    const roll = Math.random() * 100;

    // Positive: generous rewards across a wide range
    if (pct < 5) {
      return { type: 'positive', rerolls: Math.random() < 0.75 ? 2 : 1 };
    } else if (pct < 10) {
      return { type: 'positive', rerolls: Math.random() < 0.50 ? 2 : 1 };
    } else if (pct < 20) {
      if (roll < 80) return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
    } else if (pct < 30) {
      if (roll < 60) return { type: 'positive', rerolls: 1 };
    } else if (pct < 40) {
      if (roll < 40) return { type: 'positive', rerolls: 1 };
    } else if (pct < 50) {
      if (roll < 20) return { type: 'positive', rerolls: 1 };
    } else if (pct < 60) {
      if (roll < 10) return { type: 'positive', rerolls: 1 };
    }

    // Negative: curses are rare and mild
    if (pct >= 95) {
      if (roll < 50) return { type: 'negative' };
    } else if (pct >= 90) {
      if (roll < 35) return { type: 'negative' };
    } else if (pct >= 80) {
      if (roll < 20) return { type: 'negative' };
    } else if (pct >= 70) {
      if (roll < 10) return { type: 'negative' };
    }

    return null;
  },

  _rollEventHard(pct) {
    if (pct === null || isNaN(pct)) return null;

    const roll = Math.random() * 100;

    // Positive: only the rarest criteria reward you
    if (pct < 5) {
      if (roll < 60) return { type: 'positive', rerolls: Math.random() < 0.50 ? 2 : 1 };
    } else if (pct < 10) {
      if (roll < 40) return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
    } else if (pct < 20) {
      if (roll < 20) return { type: 'positive', rerolls: 1 };
    }

    // Negative: curses start early and hit hard
    if (pct >= 95) {
      if (roll < 99) return { type: 'negative' };
    } else if (pct >= 90) {
      if (roll < 90) return { type: 'negative' };
    } else if (pct >= 80) {
      if (roll < 85) return { type: 'negative' };
    } else if (pct >= 70) {
      if (roll < 70) return { type: 'negative' };
    } else if (pct >= 60) {
      if (roll < 55) return { type: 'negative' };
    } else if (pct >= 50) {
      if (roll < 40) return { type: 'negative' };
    } else if (pct >= 40) {
      if (roll < 25) return { type: 'negative' };
    } else if (pct >= 30) {
      if (roll < 10) return { type: 'negative' };
    }

    return null;
  },

  _rollEventCustom(pct) {
    if (pct === null || isNaN(pct)) return null;
    const roll = Math.random() * 100;
    const rl   = QuestState.customSettings.rewardLevel;
    const cl   = QuestState.customSettings.curseLevel;

    // Positive (reward) thresholds
    if (rl === 'high') {
      if (pct < 5)                    return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
      if (pct < 10)                   return { type: 'positive', rerolls: Math.random() < 0.50 ? 2 : 1 };
      if (pct < 20 && roll < 80)      return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
      if (pct < 30 && roll < 60)      return { type: 'positive', rerolls: 1 };
      if (pct < 40 && roll < 40)      return { type: 'positive', rerolls: 1 };
      if (pct < 50 && roll < 20)      return { type: 'positive', rerolls: 1 };
      if (pct < 60 && roll < 10)      return { type: 'positive', rerolls: 1 };
    } else if (rl === 'normal') {
      if (pct < 5)                    return { type: 'positive', rerolls: Math.random() < 0.50 ? 2 : 1 };
      if (pct < 10 && roll < 90)      return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
      if (pct < 20 && roll < 70)      return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
      if (pct < 30 && roll < 50)      return { type: 'positive', rerolls: 1 };
      if (pct < 40 && roll < 30)      return { type: 'positive', rerolls: 1 };
      if (pct < 50 && roll < 10)      return { type: 'positive', rerolls: 1 };
    } else {
      if (pct < 5  && roll < 60)      return { type: 'positive', rerolls: Math.random() < 0.50 ? 2 : 1 };
      if (pct < 10 && roll < 40)      return { type: 'positive', rerolls: Math.random() < 0.25 ? 2 : 1 };
      if (pct < 20 && roll < 20)      return { type: 'positive', rerolls: 1 };
    }

    // Negative (curse) thresholds
    if (cl === 'high') {
      if (pct >= 95 && roll < 99)     return { type: 'negative' };
      if (pct >= 90 && roll < 90)     return { type: 'negative' };
      if (pct >= 80 && roll < 85)     return { type: 'negative' };
      if (pct >= 70 && roll < 70)     return { type: 'negative' };
      if (pct >= 60 && roll < 55)     return { type: 'negative' };
      if (pct >= 50 && roll < 40)     return { type: 'negative' };
      if (pct >= 40 && roll < 25)     return { type: 'negative' };
      if (pct >= 30 && roll < 10)     return { type: 'negative' };
    } else if (cl === 'normal') {
      if (pct >= 95 && roll < 90)     return { type: 'negative' };
      if (pct >= 90 && roll < 70)     return { type: 'negative' };
      if (pct >= 80 && roll < 55)     return { type: 'negative' };
      if (pct >= 70 && roll < 35)     return { type: 'negative' };
    } else {
      if (pct >= 95 && roll < 50)     return { type: 'negative' };
      if (pct >= 90 && roll < 35)     return { type: 'negative' };
      if (pct >= 80 && roll < 20)     return { type: 'negative' };
      if (pct >= 70 && roll < 10)     return { type: 'negative' };
    }

    return null;
  },

  /* ── Popup ────────────────────────────────────────────────── */

  _showPopup(event, onDismiss) {
    const overlay = document.getElementById('fate-overlay');
    const modal   = overlay.querySelector('.fate-modal');
    const icon    = overlay.querySelector('.fate-icon');
    const title   = overlay.querySelector('.fate-title');
    const text    = overlay.querySelector('.fate-text');
    const fill    = overlay.querySelector('.fate-timer-fill');

    modal.className = 'fate-modal fate-modal--' + event.type;

    if (event.type === 'positive') {
      icon.textContent  = event.rerolls === 2 ? '✦ ✦' : '✦';
      title.textContent = 'Fortune Favours the Bold';
      text.textContent  = event.rerolls === 2
        ? 'The fates are impressed — you have earned 2 additional rerolls.'
        : 'The fates are impressed — you have earned 1 additional reroll.';
    } else {
      icon.textContent  = '💀';
      title.textContent = 'Curse of Greed';
      text.textContent  = 'Ease has a price — you must now bear an additional burden.';
    }

    overlay.classList.remove('hidden');
    // Force reflow before adding visible class so transition fires
    void overlay.offsetWidth;
    overlay.classList.add('fate-overlay--visible');

    // Reset and start the countdown bar
    fill.style.transition = 'none';
    fill.style.width      = '100%';
    void fill.offsetWidth;
    fill.style.transition = 'width 15s linear';
    fill.style.width      = '0%';

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(autoTimer);
      overlay.removeEventListener('click', dismiss);
      overlay.classList.remove('fate-overlay--visible');
      overlay.classList.add('fate-overlay--hiding');
      setTimeout(() => {
        overlay.classList.remove('fate-overlay--hiding');
        overlay.classList.add('hidden');
        onDismiss();
      }, 400);
    };

    const autoTimer = setTimeout(dismiss, 15000);
    overlay.addEventListener('click', dismiss, { once: true });
  },

  /* ── Curse of Greed ───────────────────────────────────────── */

  _triggerCurse() {
    // Hide the original Continue button — the curse result will replace it
    document.getElementById('step2-result').classList.add('hidden');

    // Remove any leftover curse section from a previous quest
    document.getElementById('curse-section')?.remove();

    const section = document.createElement('div');
    section.id        = 'curse-section';
    section.className = 'curse-section';
    section.innerHTML = `
      <div class="curse-connector">
        <svg class="curse-connector-svg path-road-svg" viewBox="0 0 10 60"
             preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="5" y1="0" x2="5" y2="60" class="road-line curse-road-line"/>
        </svg>
      </div>
      <div class="curse-header">
        <span class="curse-icon-glyph">💀</span>
        <span class="curse-label">Curse of Greed</span>
        <p class="curse-desc">You must bear an additional burden.</p>
      </div>
      <div class="card-arena">
        <div class="drawn-cards-row" id="curse-cards-row"></div>
      </div>
      <div id="curse-result" class="step-result hidden">
        <button id="btn-curse-next" class="btn-primary">Continue Quest →</button>
      </div>
    `;

    document.getElementById('step-2').appendChild(section);

    // Animate in after a brief delay so the transition is visible
    requestAnimationFrame(() => requestAnimationFrame(() =>
      section.classList.add('curse-section--visible')
    ));

    // Scroll to the curse section
    setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);

    // Draw 3 new burden cards, excluding already-seen ones.
    CardState.flippedCount = 0;
    CardState.totalCards   = 3;

    const firstBurden = QuestState.commanderStat;

    // Build a combined Scryfall link so it filters by both burdens at once
    const withCombinedLink = (crit) => {
      if (!firstBurden?.scryfall_text || !crit.scryfall_text ||
          firstBurden.scryfall_text === 'N/A' || crit.scryfall_text === 'N/A') return crit;
      const combined = [
        _SCRYFALL_BASE,
        _stripScryfallBase(firstBurden.scryfall_text),
        _stripScryfallBase(crit.scryfall_text),
      ].filter(Boolean).join(' ');
      return { ...crit, scryfall_link: `https://scryfall.com/search?q=${encodeURIComponent(combined)}` };
    };

    // Only burdens that can coexist with the picked one — used for both the
    // initial draw and rerolls, so a reroll can never produce a contradiction.
    const pool = CRITERIA.commanderStats
      .filter(c => !firstBurden || _burdensCompatible(firstBurden, c))
      .map(withCombinedLink);

    // Exclude both RerollState-tracked cards AND the 3 currently displayed originals.
    const drawnTitles = new Set(
      [...document.querySelectorAll('#drawn-cards-row .flip-card')]
        .map(el => el._crit?.title).filter(Boolean)
    );
    const available = pool.filter(c => !RerollState.usedTitles.has(c.title) && !drawnTitles.has(c.title));
    const choices   = pickWithCategoryLimit(available, 3, 1);
    RerollState.markUsed(choices);

    const row = section.querySelector('#curse-cards-row');
    choices.forEach((crit, i) => {
      row.appendChild(buildQuestFlipCard(crit, i, {
        backClass:    'flip-card-back',
        pool:         pool,
        onAllFlipped: () => enableCardSelection('#curse-cards-row'),
        onPick: (wrapper) => {
          QuestState.extraBurden = wrapper._crit;
          resolveCardPick(wrapper, '#curse-cards-row', 'curse-result');
        },
      }));
    });

    // Curse Continue button goes straight to Step 3 — no further fate checks
    section.querySelector('#btn-curse-next')
      .addEventListener('click', () => QuestFlow.advance());
  },
};

/* ── Burden compatibility ───────────────────────────────────── */

const _MV_MAX = 20;

/**
 * Set of commander mana values a burden allows, parsed from its Scryfall
 * query (e.g. "mv=4", "mv>=5", "(mv=1 or mv>=8)"). Returns null when the
 * burden doesn't constrain mana value.
 */
function _burdenManaValues(crit) {
  const text  = crit?.scryfall_text || '';
  const terms = [...text.matchAll(/(?:^|[^-\w])mv\s*(<=|>=|=|:|<|>)\s*(\d+)/g)];
  if (!terms.length) return null;

  const allows = (mv, op, n) =>
    op === '<=' ? mv <= n : op === '>=' ? mv >= n :
    op === '<'  ? mv <  n : op === '>'  ? mv >  n : mv === n;
  const isOr = /\bor\b/i.test(text);

  const set = new Set();
  for (let mv = 0; mv <= _MV_MAX; mv++) {
    const hits = terms.map(([, op, n]) => allows(mv, op, parseInt(n, 10)));
    if (isOr ? hits.some(Boolean) : hits.every(Boolean)) set.add(mv);
  }
  return set;
}

/**
 * Whether two burdens can both apply to the same commander. Burdens of the
 * same category constrain the same axis and never combine; mana value
 * constraints are also checked across categories (e.g. "exactly 4" vs "odd").
 */
function _burdensCompatible(a, b) {
  if (a.title === b.title) return false;
  if (a.category && a.category === b.category) return false;

  const mvA = _burdenManaValues(a);
  const mvB = _burdenManaValues(b);
  if (mvA && mvB && ![...mvA].some(mv => mvB.has(mv))) return false;

  return true;
}
