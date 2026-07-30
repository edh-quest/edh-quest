/**
 * step-cards.js — Steps 2 & 3: Flip Card Mechanic
 *
 * Steps 2 (The Burden) and 3 (The Lore) share the same mechanic:
 *   1. Three face-down cards appear.
 *   2. Player clicks each card to reveal it.
 *   3. After all three are revealed, any card can be selected.
 *   4. Hold a revealed card for 3 seconds to reroll it (spends 1 reroll).
 *   5. The chosen card is saved to QuestState.
 *
 * Dependencies: state.js (QuestState, CardState, RerollState), utils.js (pickRandomUnique)
 */

'use strict';

function showRerollIntroOverlay(r) {
  const hintLines = [
    'Tip: use the Scryfall icon on a card to browse available options.',
  ];

  const slides = [
    {
      type: 'body',
      lines: [
        'In the following trials, you have to choose between different cards.',
        'They will set the criteria your commander and deck have to fulfill.',
      ],
      duration: 15000,
    },
  ];
  if (r > 0) {
    slides.push({ type: 'reroll', r: r, duration: 15000 });
    slides.push({
      type: 'body',
      lines: ['Rerolls can be earned along the way. Save them wisely — each unused reroll increases your final budget.'],
      duration: 15000,
    });
  }
  slides.push({ type: 'body', lines: hintLines, duration: 15000 });
  showIntroOverlay(slides);
}

/* =============================================================
   SHARED FLIP CARD BUILDER
============================================================= */

/**
 * Build a single face-down flip card.
 *
 * @param {Object}   crit
 * @param {number}   index    - Position in the row (stagger delay)
 * @param {Object}   options
 * @param {string}   options.backClass
 * @param {Function} options.onAllFlipped
 * @param {Function} options.onPick       - Called with wrapper when selected
 * @param {Array}    options.pool         - Full data pool for rerolls
 * @param {Function} [options.urlBuilder] - Override URL computation (c => string | {disabled:true})
 */
function buildQuestFlipCard(crit, index, { backClass, onAllFlipped, onPick, pool, urlBuilder, onReveal }) {
  const wrapper = document.createElement('div');
  wrapper.className = 'flip-card';
  wrapper._crit = crit;
  wrapper.style.animationDelay = `${index * 0.18}s`;
  wrapper.classList.add('card-appear');

  const _getUrl = urlBuilder || (c => _buildScryfallUrl(c.scryfall_link));

  const inner = document.createElement('div');
  inner.className = 'flip-card-inner';

  const back = document.createElement('div');
  back.className = backClass;

  const front = document.createElement('div');
  front.className = 'flip-card-front quest-card';
  front.innerHTML = _cardFrontHTML(crit, _getUrl(crit));

  inner.appendChild(back);
  inner.appendChild(front);
  wrapper.appendChild(inner);

  setTimeout(() => _fitCardText(front), 0);

  // Reroll progress ring (hidden by default, shown during hold)
  const ring = _buildRerollRing();
  wrapper.appendChild(ring);

  // Track whether an in-progress hold should suppress the upcoming click
  let suppressClick = false;

  wrapper.addEventListener('click', () => {
    if (suppressClick) { suppressClick = false; return; }
    if (wrapper.classList.contains('card-rerolling')) return;

    if (!inner.classList.contains('flipped')) {
      inner.classList.add('flipped');
      wrapper.classList.add('card-revealed');
      CardState.flippedCount++;
      onReveal?.(wrapper);
      if (CardState.flippedCount >= CardState.totalCards) setTimeout(onAllFlipped, 500);
    } else if (wrapper.classList.contains('card-selectable')) {
      onPick(wrapper);
    }
  });

  // Hold-to-reroll (only when a pool is available)
  if (pool) {
    _attachRerollHold(wrapper, inner, front, ring, pool, () => { suppressClick = true; }, _getUrl, onReveal);
  }

  return wrapper;
}

/** Mark all cards in a row as selectable once the player has seen them all. */
function enableCardSelection(rowSelector) {
  document.querySelectorAll(`${rowSelector} .flip-card`).forEach(w => {
    w.classList.add('card-selectable');
  });
}

/** Apply chosen/unchosen classes and show the Continue button. */
function resolveCardPick(picked, rowSelector, resultId) {
  document.querySelectorAll(`${rowSelector} .flip-card`).forEach(w => {
    w.classList.remove('card-chosen', 'card-unchosen');
    w.classList.add(w === picked ? 'card-chosen' : 'card-unchosen');
  });

  const result = document.getElementById(resultId);
  if (result && result.classList.contains('hidden')) {
    setTimeout(() => result.classList.remove('hidden'), 400);
  }
}

/* =============================================================
   STEP 2 — THE BURDEN (commander stats)
============================================================= */

function activateStep2() {
  const count = 3;
  RerollState.init(QuestState.difficulty);
  CardState.flippedCount = 0;
  CardState.totalCards   = count;

  const row    = document.getElementById('drawn-cards-row');
  const result = document.getElementById('step2-result');
  row.innerHTML = '';
  result.classList.add('hidden');
  document.getElementById('curse-section')?.remove();

  if (!CRITERIA.commanderStats.length) return;

  const choices = pickWithCategoryLimit(CRITERIA.commanderStats, count, 1);
  RerollState.markUsed(choices);
  RerollState.updateCounter();

  const r = RerollState.remaining;
  showRerollIntroOverlay(r);

  choices.forEach((crit, i) => {
    row.appendChild(buildQuestFlipCard(crit, i, {
      backClass:    'flip-card-back',
      pool:         CRITERIA.commanderStats,
      onAllFlipped: () => {
        enableCardSelection('#drawn-cards-row');
      },
      onPick: (wrapper) => {
        QuestState.commanderStat = wrapper._crit;
        resolveCardPick(wrapper, '#drawn-cards-row', 'step2-result');
      },
    }));
  });
}

/* =============================================================
   STEP 3 — THE LORE (flavor / lore bindings)
============================================================= */

function activateStep3() {
  const count = 3;
  CardState.flippedCount = 0;
  CardState.totalCards   = count;

  const row    = document.getElementById('drawn-lore-row');
  const result = document.getElementById('step3-result');
  row.innerHTML = '';
  result.classList.add('hidden');

  if (!CRITERIA.flavor.length) return;

  const choices = pickWithCategoryLimit(CRITERIA.flavor, count, 1);
  RerollState.markUsed(choices);
  RerollState.updateCounter();

  choices.forEach((crit, i) => {
    const slot = document.createElement('div');
    slot.className = 'event-card-slot';

    const starsEl = document.createElement('div');
    starsEl.className = 'event-bonus-stars';

    const card = buildQuestFlipCard(crit, i, {
      backClass:    'flip-card-back flip-card-back--lore',
      pool:         CRITERIA.flavor,
      urlBuilder:   _buildLoreScryfallUrl,
      onAllFlipped: () => enableCardSelection('#drawn-lore-row'),
      onReveal: (wrapper) => {
        _showBonusRerollStars(wrapper._crit.rerolls, starsEl, wrapper);
      },
      onPick: (wrapper) => {
        QuestState.pendingLoreBonus = wrapper._bonusRerolls || 0;
        QuestState.flavorCriteria = wrapper._crit;
        resolveCardPick(wrapper, '#drawn-lore-row', 'step3-result');
      },
    });

    card._starsEl = starsEl;
    slot.appendChild(card);
    slot.appendChild(starsEl);
    row.appendChild(slot);
  });
}

/* =============================================================
   INTERNAL HELPERS
============================================================= */

const _SCRYFALL_COLOR_MAP = { white: 'w', blue: 'u', black: 'b', red: 'r', green: 'g' };

const _SCRYFALL_BASE = 'is:commander legal:commander';

function _stripScryfallBase(text) {
  return text.replace(_SCRYFALL_BASE, '').trim();
}

function _buildLoreScryfallUrl(crit) {
  const isNA = !crit.scryfall_text || crit.scryfall_text === 'N/A';
  if (isNA) return { disabled: true };

  const extras = [];
  const bs = QuestState.commanderStat?.scryfall_text;
  if (bs && bs !== 'N/A') extras.push(`(${_stripScryfallBase(bs)})`);
  const es = QuestState.extraBurden?.scryfall_text;
  if (es && es !== 'N/A') extras.push(`(${_stripScryfallBase(es)})`);
  extras.push(`(${_stripScryfallBase(crit.scryfall_text)})`);

  const combined = [_SCRYFALL_BASE, ...extras.filter(Boolean)].join(' ');
  const base = `https://scryfall.com/search?q=${encodeURIComponent(combined)}`;
  return _buildScryfallUrl(base);
}

function _buildScryfallUrl(baseLink) {
  if (!baseLink) return '';
  const seen = new Set();
  const letters = QuestState.selectedColors
    .map(c => _SCRYFALL_COLOR_MAP[c.id] || '')
    .filter(l => l && !seen.has(l) && seen.add(l))
    .join('');
  const out = letters
    // Append id<=XYZ into the q= parameter value (before any following & or end of string)
    ? baseLink.replace(/(\?q=[^&]*)/, '$1+id%3C%3D' + letters)
    : baseLink;
  return Currency.queryize(out);
}

function _cardFrontHTML(crit, scryfallResult) {
  const disabled  = scryfallResult && typeof scryfallResult === 'object' && scryfallResult.disabled;
  const activeUrl = !disabled && scryfallResult ? scryfallResult : null;
  let iconHtml = '';
  if (activeUrl) {
    iconHtml = `
    <a class="card-scryfall-link"
       href="${activeUrl}"
       target="_blank"
       rel="noopener noreferrer"
       title="View on Scryfall"
       onclick="event.stopPropagation()">
      <img src="assets/files/designs/scryfall_logo.png" alt="Scryfall" />
    </a>`;
  } else if (disabled) {
    iconHtml = `
    <span class="card-scryfall-link card-scryfall-link--disabled"
          title="Criteria not supported in Scryfall">
      <img src="assets/files/designs/scryfall_logo.png" alt="Scryfall" />
    </span>`;
  }
  const infoBadge = (crit.info && crit.info !== 'N/A') ? `
    <span class="card-info-badge" onclick="event.stopPropagation()">?</span>
    <div class="card-info-overlay" onclick="event.stopPropagation()">
      <p class="card-info-overlay-text">${escHtml(crit.info)}</p>
    </div>` : '';
  return `
    ${infoBadge}
    <span class="card-ornament">✦ · ✦ · ✦</span>
    <h3 class="quest-card-title">${escHtml(crit.title)}</h3>
    <div class="card-divider"></div>
    <p class="quest-card-text">${escHtml(crit.text)}</p>
    <span class="card-ornament">✦ · ✦ · ✦</span>
    ${iconHtml}
  `;
}

function _fitCardText(front) {
  const p = front.querySelector('.quest-card-text');
  if (!p) return;
  const minPx = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.62;
  let sizePx = parseFloat(getComputedStyle(p).fontSize);
  while (p.scrollHeight > p.offsetHeight && sizePx > minPx) {
    sizePx -= 0.5;
    p.style.fontSize = sizePx + 'px';
  }
}

function _buildRerollRing() {
  const wrap = document.createElement('div');
  wrap.className = 'reroll-ring';
  wrap.innerHTML = `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle class="reroll-ring-track" cx="32" cy="32" r="26"/>
      <circle class="reroll-ring-fill"  cx="32" cy="32" r="26"/>
    </svg>
  `;
  return wrap;
}

/**
 * Attach hold-to-reroll behaviour to an already-built flip card.
 * onSuppress() is called when a hold (partial or complete) should
 * prevent the card's click handler from firing.
 */
function _attachRerollHold(wrapper, inner, front, ring, pool, onSuppress, urlBuilder, onReveal) {
  let holdDelayTimer = null;
  let ringActive     = false;
  let fillEndHandler = null;

  const ringFill = ring.querySelector('.reroll-ring-fill');

  function cancelHold() {
    if (holdDelayTimer) { clearTimeout(holdDelayTimer); holdDelayTimer = null; }
    if (ringActive) {
      ringActive = false;
      if (fillEndHandler) {
        ringFill.removeEventListener('animationend', fillEndHandler);
        fillEndHandler = null;
      }
      ring.classList.remove('reroll-ring--filling');
      wrapper.classList.remove('card-reroll-holding');
      onSuppress();
    }
  }

  wrapper.addEventListener('pointerdown', (e) => {
    if (!inner.classList.contains('flipped'))           return;
    if (!wrapper.classList.contains('card-selectable')) return;
    if (wrapper.classList.contains('card-rerolling'))   return;
    if (RerollState.remaining <= 0)                     return;
    e.preventDefault();

    holdDelayTimer = setTimeout(() => {
      holdDelayTimer = null;
      ring.classList.remove('reroll-ring--filling'); // reset before reflow
      void ringFill.offsetWidth;                     // force reflow to restart animation
      ring.classList.add('reroll-ring--filling');
      wrapper.classList.add('card-reroll-holding');
      ringActive = true;

      fillEndHandler = () => {
        fillEndHandler = null;
        ringActive = false;
        ring.classList.remove('reroll-ring--filling');
        wrapper.classList.remove('card-reroll-holding');
        onSuppress();

        if (!RerollState.use()) return;
        RerollState.updateCounter();

        const arena = wrapper.closest('.card-arena');
        const revealedCategories = new Set(
          [...(arena ? arena.querySelectorAll('.flip-card.card-revealed') : [])]
            .filter(c => c !== wrapper)
            .map(c => c._crit?.category)
            .filter(Boolean)
        );
        let rerollPool = pool.filter(c => !revealedCategories.has(c.category || ''));
        if (!rerollPool.length) rerollPool = pool;
        const newCrit = RerollState.pickNew(rerollPool);
        if (!newCrit) return;

        // Reset selection state so the player must pick again
        wrapper.parentElement.querySelectorAll('.flip-card').forEach(c => {
          c.classList.remove('card-chosen', 'card-unchosen');
        });
        wrapper.closest('.step')?.querySelector('.step-result')?.classList.add('hidden');

        wrapper._crit = newCrit;
        wrapper._bonusRerolls = 0;
        if (wrapper._starsEl) {
          wrapper._starsEl.classList.remove('event-bonus-stars--visible');
          wrapper._starsEl.textContent = '';
        }
        wrapper.classList.add('card-rerolling');
        inner.classList.remove('flipped');

        setTimeout(() => {
          front.innerHTML = _cardFrontHTML(newCrit, urlBuilder(newCrit));
          _fitCardText(front);
          setTimeout(() => {
            inner.classList.add('flipped');
            wrapper.classList.add('card-reroll-reveal');
            onReveal?.(wrapper);
            setTimeout(() => wrapper.classList.remove('card-rerolling', 'card-reroll-reveal'), 900);
          }, 200);
        }, 360);
      };

      ringFill.addEventListener('animationend', fillEndHandler, { once: true });
    }, 300);
  });

  wrapper.addEventListener('pointerup',     cancelHold);
  wrapper.addEventListener('pointerleave',  cancelHold);
  wrapper.addEventListener('pointercancel', cancelHold);
}
