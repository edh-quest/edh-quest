/**
 * step-crossroads.js — Step 4: The Crossroads
 *
 * Difficulty-aware crossing logic:
 *   easy / normal — 3 crossings, 3 event cards each (choose 1 per crossing)
 *   hard          — 4 crossings, 3 event cards each (no rerolls)
 *
 * Dependencies: state.js (QuestState, EventState, RerollState), utils.js (pickRandomUnique)
 */

'use strict';

/* =============================================================
   STEP ACTIVATION
============================================================= */

// Persist Step 4 progress so a mid-step close/refresh keeps prior
// crossings' drawn cards and picks intact on resume.
function _saveStep4() {
  QuestSave.save(
    4,
    QuestFlow.lobbyMode ? 'lobby' : 'solo',
    QuestFlow.lobbyMode ? (LobbyState.code || null) : null
  );
}

function activateStep4() {
  showIntroOverlay({
    slides: [
      {
        type: 'body',
        lines: [
          "Your commander's fate is sealed.",
          'The next picks will set deck-building rules for your 99.',
        ],
        duration: 15000,
      },
    ],
  });

  const diff = QuestState.difficulty;
  const baseCrossings = diff === 'custom' ? QuestState.customSettings.crossingCount : diff === 'hard' ? 4 : 3;
  EventState.crossingCount    = baseCrossings + QuestState.greedPenalty;
  EventState.cardsPerCrossing = 3;

  const restoredBatches = (EventState.crossingBatches || []).some(b => b && b.length);

  if (!restoredBatches) {
    EventState.chosen          = Array(EventState.crossingCount).fill(null);
    EventState.flippedCounts   = Array(EventState.crossingCount).fill(0);
    EventState.pendingBonus    = Array(EventState.crossingCount).fill(0);
    EventState.crossingBatches = Array(EventState.crossingCount).fill(null);
    EventState.chosenIdx       = Array(EventState.crossingCount).fill(null);
  } else {
    // Pad to crossingCount in case difficulty/greed changed shape (shouldn't, but be safe)
    while (EventState.chosen.length          < EventState.crossingCount) EventState.chosen.push(null);
    while (EventState.flippedCounts.length   < EventState.crossingCount) EventState.flippedCounts.push(0);
    while (EventState.pendingBonus.length    < EventState.crossingCount) EventState.pendingBonus.push(0);
    while (EventState.crossingBatches.length < EventState.crossingCount) EventState.crossingBatches.push(null);
    while (EventState.chosenIdx.length       < EventState.crossingCount) EventState.chosenIdx.push(null);
  }

  const journey = document.getElementById('crossroads-journey');
  journey.innerHTML = '';
  document.getElementById('step4-events-result').classList.add('hidden');

  if (!CRITERIA.events.length) return;

  // On fresh start: draw the first crossing now. On resume with saved batches,
  // reuse whatever was drawn last session. Events are resolved (X rolled,
  // guaranteedBonus set) before storing so a resume replays the exact same
  // cards without consuming any further RNG calls.
  const drewCrossing1 = !EventState.crossingBatches[0];
  if (drewCrossing1) {
    EventState.crossingBatches[0] = _pickEventsForCrossing().map(_rollEventX);
  }
  EventState.picks = EventState.crossingBatches[0].slice();

  // Crossing 1 is always visible immediately
  journey.appendChild(buildCrossing(1, EventState.crossingBatches[0]));

  // Subsequent crossings: build empty placeholders; cards drawn on Proceed
  // (or filled now from the saved batch if resumed mid-Step-4).
  for (let i = 2; i <= EventState.crossingCount; i++) {
    const savedBatch = EventState.crossingBatches[i - 1];
    const mid   = buildPathMid(i - 1);
    const cross = buildCrossing(i, savedBatch || []);
    cross.id = `crossing-${i}-el`;
    if (!savedBatch) cross.classList.add('crossing-hidden');
    else             mid.classList.remove('crossing-hidden');

    journey.appendChild(mid);
    journey.appendChild(cross);
  }

  if (restoredBatches) _replayRestoredCrossings();

  // Persist the freshly drawn crossing 1 batch so a close before any pick
  // still resumes to the same cards.
  if (drewCrossing1) _saveStep4();
}

/**
 * After the crossings DOM is built from saved batches, re-apply the visual
 * state each crossing was in when the quest was saved: revealed cards, chosen
 * pick, decided-mark, Proceed button (or the final Reveal button) as needed.
 */
function _replayRestoredCrossings() {
  const crossingEls = document.querySelectorAll('.path-crossing');

  crossingEls.forEach((crossingEl, i) => {
    const idx     = i + 1;
    const cards   = crossingEl.querySelectorAll('.flip-card');
    const chosen  = EventState.chosenIdx[i];
    const batch   = EventState.crossingBatches[i];
    if (!batch) return;

    // At save time we treat this crossing's cards as fully revealed
    // (all cards are always visible during play).
    cards.forEach(card => {
      const inner = card.querySelector('.flip-card-inner');
      if (inner) inner.classList.add('flipped');
      card.classList.add('card-revealed');
      // Stars weren't persisted; re-derive from the resolved event data.
      const starsEl = card.parentElement.querySelector('.event-bonus-stars');
      if (starsEl && card._eventData) {
        _showBonusRerollStars(card._eventData.rerolls, starsEl, card, card._eventData.guaranteedBonus);
      }
    });
    EventState.flippedCounts[i] = cards.length;

    if (chosen == null || !cards[chosen]) {
      // No pick yet — leave cards selectable.
      cards.forEach(c => c.classList.add('card-selectable'));
      return;
    }

    EventState.chosen[i] = cards[chosen]._eventData;
    const nextBatchExists = idx < EventState.crossingCount && !!EventState.crossingBatches[idx];
    const isFinal         = idx === EventState.crossingCount;

    if (nextBatchExists) {
      // Fully proceeded: lock this crossing, reveal path to the next one.
      // Pending bonus was already applied on the original Proceed click.
      crossingEl.classList.add('crossing-decided');
      cards.forEach((card, ci) => {
        card.classList.add(ci === chosen ? 'card-chosen' : 'card-unchosen');
        card.classList.remove('card-selectable');
      });
      const nextMid = document.getElementById(`path-mid-${idx}`);
      const nextEl  = document.getElementById(`crossing-${idx + 1}-el`);
      if (nextMid) nextMid.classList.remove('crossing-hidden');
      if (nextEl)  nextEl.classList.remove('crossing-hidden');
    } else if (isFinal) {
      // Final crossing picked but not yet revealed — keep cards selectable
      // (player can still change their mind) and surface the Reveal button.
      cards.forEach((card, ci) => {
        card.classList.add(ci === chosen ? 'card-chosen' : 'card-unchosen');
        card.classList.add('card-selectable');
      });
      crossingEl.classList.add('crossing-decided');
      // pendingBonus for the final crossing is applied by finalizeLastCrossing().
      EventState.pendingBonus[i] = cards[chosen]._bonusRerolls || 0;
      document.getElementById('step4-events-result')?.classList.remove('hidden');
    } else {
      // Picked but hasn't clicked Proceed — replay onEventPick to rebuild the
      // Proceed button so the player can continue. pendingBonus will be applied
      // when Proceed is clicked.
      onEventPick(idx, cards[chosen]._eventData, cards[chosen]);
    }
  });
}

/* =============================================================
   PATH BUILDERS
============================================================= */

function buildPathMid(index) {
  const el = document.createElement('div');
  el.id        = `path-mid-${index}`;
  el.className = 'path-mid crossing-hidden';
  el.innerHTML = `
    <svg class="path-road-svg" viewBox="0 0 10 70" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="5" y1="0" x2="5" y2="70" class="road-line"/>
    </svg>
  `;
  return el;
}

function buildCrossing(index, events) {
  const labels = [
    'First Event', 'Second Event', 'Third Event', 'Fourth Event',
    'Fifth Event', 'Sixth Event', 'Seventh Event', 'Eighth Event',
    'Ninth Event', 'Tenth Event', 'Eleventh Event', 'Twelfth Event',
    'Thirteenth Event', 'Fourteenth Event',
  ];
  const el = document.createElement('div');
  el.className = 'path-crossing';

  el.innerHTML = `
    <div class="crossing-header">
      <div class="crossing-map-marker">
        <div class="crossing-map-marker-tick crossing-map-marker-tick--h"></div>
        <div class="crossing-map-marker-tick crossing-map-marker-tick--v"></div>
        <div class="crossing-map-marker-center"></div>
      </div>
      <div class="crossing-label">${labels[index - 1] || `Event ${index}`}</div>
    </div>
  `;

  el.appendChild(buildForkSVG(EventState.cardsPerCrossing));

  // Cards may be added later via _populateCrossingCards (placeholders start empty)
  const fork = document.createElement('div');
  fork.className = 'crossing-fork crossing-fork--triple';
  events.forEach((event, i) => {
    fork.appendChild(buildEventCard(event, index, i));
  });
  el.appendChild(fork);

  return el;
}

/** Y-fork SVG connecting the crossing marker to the event cards below. */
function buildForkSVG(count) {
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'fork-svg');
  svg.setAttribute('viewBox', '0 0 460 58');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('xmlns', ns);

  const lines = count === 3
    ? [['230','0','230','26'], ['230','26','80','58'], ['230','26','230','58'], ['230','26','380','58']]
    : [['230','0','230','26'], ['230','26','108','58'], ['230','26','352','58']];

  lines.forEach(([x1, y1, x2, y2]) => {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', 'fork-path-line');
    svg.appendChild(line);
  });

  const dots = count === 3
    ? [['80','58'], ['230','58'], ['380','58']]
    : [['108','58'], ['352','58']];

  dots.forEach(([cx, cy]) => {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    dot.setAttribute('r',  '4');
    dot.setAttribute('class', 'fork-end-dot');
    svg.appendChild(dot);
  });

  return svg;
}

/* =============================================================
   EVENT CARD BUILDER
============================================================= */

function buildEventCard(event, crossingIndex, cardIndex) {
  // Already-resolved events (from a restored save) carry guaranteedBonus.
  // Re-rolling would change bonus stars on resume.
  const resolved = ('guaranteedBonus' in event) ? event : _rollEventX(event);

  const slot = document.createElement('div');
  slot.className = 'event-card-slot';

  const wrapper = document.createElement('div');
  wrapper.className = 'flip-card';
  wrapper._eventData = resolved;
  wrapper.style.animationDelay = `${cardIndex * 0.18}s`;
  wrapper.classList.add('card-appear');

  const inner = document.createElement('div');
  inner.className = 'flip-card-inner';

  const back = document.createElement('div');
  back.className = 'flip-card-back flip-card-back--event';

  const front = document.createElement('div');
  front.className = 'flip-card-front quest-card';
  front.innerHTML = _eventCardFrontHTML(resolved);

  inner.appendChild(back);
  inner.appendChild(front);
  wrapper.appendChild(inner);

  const ring = _buildRerollRing();
  wrapper.appendChild(ring);

  const starsEl = document.createElement('div');
  starsEl.className = 'event-bonus-stars';

  slot.appendChild(wrapper);
  slot.appendChild(starsEl);

  let suppressClick = false;

  wrapper.addEventListener('click', () => {
    if (suppressClick) { suppressClick = false; return; }
    if (wrapper.classList.contains('card-rerolling')) return;

    if (!inner.classList.contains('flipped')) {
      inner.classList.add('flipped');
      wrapper.classList.add('card-revealed');
      EventState.flippedCounts[crossingIndex - 1]++;
      _showBonusRerollStars(wrapper._eventData.rerolls, starsEl, wrapper, wrapper._eventData.guaranteedBonus);
      if (EventState.flippedCounts[crossingIndex - 1] >= EventState.cardsPerCrossing) {
        setTimeout(() => enableEventSelection(crossingIndex), 500);
      }
    } else if (wrapper.classList.contains('card-selectable')) {
      onEventPick(crossingIndex, wrapper._eventData, wrapper);
    }
  });

  _attachEventRerollHold(wrapper, inner, front, ring, starsEl, crossingIndex, cardIndex, () => { suppressClick = true; });

  return slot;
}

/* =============================================================
   SELECTION & REVEAL
============================================================= */

function enableEventSelection(crossingIndex) {
  const crossings = document.querySelectorAll('.path-crossing');
  const crossing  = crossings[crossingIndex - 1];
  if (crossing) {
    crossing.querySelectorAll('.flip-card').forEach(c => c.classList.add('card-selectable'));
  }
}

function onEventPick(crossingIndex, event, pickedWrapper) {
  EventState.chosen[crossingIndex - 1] = event;
  EventState.pendingBonus[crossingIndex - 1] = pickedWrapper._bonusRerolls || 0;

  const fork  = pickedWrapper.closest('.crossing-fork');
  const cards = [...fork.querySelectorAll('.flip-card')];
  EventState.chosenIdx[crossingIndex - 1] = cards.indexOf(pickedWrapper);

  const crossingEl = pickedWrapper.closest('.path-crossing');
  crossingEl.classList.add('crossing-decided');

  cards.forEach(card => {
    card.classList.remove('card-chosen', 'card-unchosen');
    card.classList.add(card === pickedWrapper ? 'card-chosen' : 'card-unchosen');
  });

  _saveStep4();

  if (crossingIndex < EventState.crossingCount) {
    // Only add the Proceed button once
    if (!crossingEl.querySelector('.crossing-proceed-btn')) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary crossing-proceed-btn';
      btn.textContent = 'Proceed →';
      btn.addEventListener('click', () => {
        btn.disabled = true;
        btn.remove();
        crossingEl.querySelectorAll('.flip-card').forEach(c => c.classList.remove('card-selectable'));
        const bonus = EventState.pendingBonus[crossingIndex - 1];
        if (bonus > 0) {
          RerollState.remaining += bonus;
          RerollState.updateCounter();
        }
        EventState.flippedCounts[crossingIndex] = 0;
        // Draw the next crossing's cards now that we know what was picked,
        // so plausibility tags from the current pick can filter the pool.
        const nextEl = document.getElementById(`crossing-${crossingIndex + 1}-el`);
        if (nextEl) _populateCrossingCards(nextEl, crossingIndex + 1);
        revealNextCrossing(crossingIndex);
      }, { once: true });
      crossingEl.appendChild(btn);
      setTimeout(() => btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
    }
  } else {
    // Keep cards selectable so the player can change their mind before revealing.
    // Finalization happens in finalizeLastCrossing(), called by the Reveal button.
    const result = document.getElementById('step4-events-result');
    if (result.classList.contains('hidden')) {
      setTimeout(() => {
        result.classList.remove('hidden');
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 450);
    }
  }
}

function finalizeLastCrossing() {
  const lastIndex = EventState.crossingCount;
  const crossings = document.querySelectorAll('.path-crossing');
  const crossingEl = crossings[lastIndex - 1];
  if (crossingEl) {
    crossingEl.querySelectorAll('.flip-card').forEach(c => c.classList.remove('card-selectable'));
  }
  const bonus = EventState.pendingBonus[lastIndex - 1];
  if (bonus > 0) {
    RerollState.remaining += bonus;
    RerollState.updateCounter();
  }
  QuestState.chosenEvents = EventState.chosen.slice();

  if (QuestState.budget > 0) {
    const bonusPerReroll = Math.round(QuestState.budget * 0.05);
    QuestState.budgetBonus = RerollState.remaining * bonusPerReroll;
    QuestState.budget += QuestState.budgetBonus;
  }
}

function revealNextCrossing(currentIndex) {
  const mid   = document.getElementById(`path-mid-${currentIndex}`);
  const cross = document.getElementById(`crossing-${currentIndex + 1}-el`);

  if (mid) {
    mid.classList.remove('crossing-hidden');
    mid.classList.add('path-road-reveal');
  }

  setTimeout(() => {
    if (cross) {
      cross.classList.remove('crossing-hidden');
      cross.classList.add('crossing-reveal');
      cross.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 420);
}

/* =============================================================
   INTERNAL HELPERS
============================================================= */

/**
 * Tags claimed by events the player has already PICKED in earlier crossings.
 * Two events that share a tag are treated as incompatible (e.g. "no artifacts"
 * + "at least X artifacts"), so any event whose tags overlap with this set is
 * filtered out of subsequent crossings and rerolls.
 */
function _getClaimedPlausabilityTags() {
  const tags = new Set();
  for (const ev of EventState.chosen) {
    if (ev?.plausability) ev.plausability.forEach(t => tags.add(t));
  }
  return tags;
}

function _hasPlausabilityConflict(event, claimed) {
  if (!event.plausability || !event.plausability.length) return false;
  return event.plausability.some(t => claimed.has(t));
}

function _pickEventsForCrossing() {
  const claimed = _getClaimedPlausabilityTags();
  let pool = CRITERIA.events.filter(e =>
    !RerollState.usedTitles.has(e.title) && !_hasPlausabilityConflict(e, claimed)
  );
  // Safety net: if filtering empties the pool below what we need, fall back to
  // the unfiltered remainder so the step can always be completed.
  if (pool.length < EventState.cardsPerCrossing) {
    pool = CRITERIA.events.filter(e => !RerollState.usedTitles.has(e.title));
  }
  const batch = pickWithCategoryLimit(pool, EventState.cardsPerCrossing, 1);
  RerollState.markUsed(batch);
  RerollState.updateCounter();
  return batch;
}

function _populateCrossingCards(crossingEl, crossingIndex) {
  const fork = crossingEl.querySelector('.crossing-fork');
  if (!fork || fork.children.length > 0) return; // already populated
  // Resolve X before storing so a resume replays these exact cards.
  const events = _pickEventsForCrossing().map(_rollEventX);
  EventState.crossingBatches[crossingIndex - 1] = events.slice();
  events.forEach((event, i) => {
    fork.appendChild(buildEventCard(event, crossingIndex, i));
  });
  _saveStep4();
}

function _rollEventX(event) {
  const start = event.start;
  const end   = event.end;
  if (typeof start !== 'number' || typeof end !== 'number') return event;

  const lo     = Math.min(start, end);
  const hi     = Math.max(start, end);
  const rolled = lo + Math.floor(RNG.random() * (hi - lo + 1));
  if (!Number.isFinite(rolled)) return event;

  // Position 0 = at start (easy), 1 = at end (hard) → guaranteed 0 / 1 / 2 bonus rerolls
  const range           = Math.abs(end - start);
  const position        = range === 0 ? 0 : Math.abs(rolled - start) / range;
  const guaranteedBonus = position < 1 / 3 ? 0 : position < 2 / 3 ? 1 : 2;

  // Replace X but preserve "(X)" mana-cost references. Placeholder avoids regex
  // lookbehind for broader browser support (Safari < 16.4).
  const PLACEHOLDER = '\u0000XP\u0000';
  const newText = (event.text || '')
    .replace(/\(X\)/g, PLACEHOLDER)
    .replace(/X/g, rolled)
    .replace(new RegExp(PLACEHOLDER, 'g'), '(X)');

  return { ...event, text: newText, guaranteedBonus };
}

function _buildEventScryfallUrl(event) {
  if (!event.scryfall_text || event.scryfall_text === 'N/A') return { disabled: true };
  const seen = new Set();
  const letters = QuestState.selectedColors
    .map(c => _SCRYFALL_COLOR_MAP[c.id] || '')
    .filter(l => l && !seen.has(l) && seen.add(l))
    .join('');
  const q = letters
    ? `(${event.scryfall_text}) id<=${letters}`
    : `(${event.scryfall_text})`;
  return Currency.queryize(`https://scryfall.com/search?q=${encodeURIComponent(q)}`);
}

function _eventCardFrontHTML(event) {
  const scryfallResult = _buildEventScryfallUrl(event);
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
  const infoBadge = (event.info && event.info !== 'N/A') ? `
    <span class="card-info-badge" onclick="event.stopPropagation()">?</span>
    <div class="card-info-overlay" onclick="event.stopPropagation()">
      <p class="card-info-overlay-text">${escHtml(event.info)}</p>
    </div>` : '';
  return `
    ${infoBadge}
    <span class="card-ornament">✦ · ✦ · ✦</span>
    <h3 class="quest-card-title">${escHtml(event.title)}</h3>
    <div class="card-divider"></div>
    <p class="quest-card-text">${escHtml(event.text)}</p>
    <span class="card-ornament">✦ · ✦ · ✦</span>
    ${iconHtml}
  `;
}

function _attachEventRerollHold(wrapper, inner, front, ring, starsEl, crossingIndex, cardIndex, onSuppress) {
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

  wrapper.addEventListener('pointerdown', () => {
    if (!inner.classList.contains('flipped'))           return;
    if (!wrapper.classList.contains('card-selectable')) return;
    if (wrapper.classList.contains('card-rerolling'))   return;
    if (RerollState.remaining <= 0)                     return;

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

        const fork = wrapper.closest('.crossing-fork');
        const revealedCategories = new Set(
          [...(fork ? fork.querySelectorAll('.flip-card.card-revealed') : [])]
            .filter(c => c !== wrapper)
            .map(c => c._eventData?.category)
            .filter(Boolean)
        );
        const claimedTags = _getClaimedPlausabilityTags();
        let rerollPool = CRITERIA.events.filter(c =>
          !revealedCategories.has(c.category || '') && !_hasPlausabilityConflict(c, claimedTags)
        );
        if (!rerollPool.length) {
          rerollPool = CRITERIA.events.filter(c => !_hasPlausabilityConflict(c, claimedTags));
        }
        if (!rerollPool.length) rerollPool = CRITERIA.events;
        const newEvent = RerollState.pickNew(rerollPool);
        if (!newEvent) return;

        // Reset selection state for this crossing so the player must pick again
        wrapper.closest('.crossing-fork').querySelectorAll('.flip-card').forEach(c => {
          c.classList.remove('card-chosen', 'card-unchosen');
        });
        const crossingEl = wrapper.closest('.path-crossing');
        if (crossingEl) {
          crossingEl.classList.remove('crossing-decided');
          crossingEl.querySelector('.crossing-proceed-btn')?.remove();
        }
        EventState.chosen[crossingIndex - 1] = null;
        EventState.chosenIdx[crossingIndex - 1] = null;
        const resolvedNew = _rollEventX(newEvent);
        wrapper._eventData = resolvedNew;
        if (EventState.crossingBatches[crossingIndex - 1]) {
          EventState.crossingBatches[crossingIndex - 1][cardIndex] = resolvedNew;
        }
        _saveStep4();
        wrapper.classList.add('card-rerolling');
        inner.classList.remove('flipped');
        starsEl.classList.remove('event-bonus-stars--visible');
        starsEl.textContent = '';

        setTimeout(() => {
          front.innerHTML = _eventCardFrontHTML(resolvedNew);
          setTimeout(() => {
            inner.classList.add('flipped');
            wrapper.classList.add('card-reroll-reveal');
            _showBonusRerollStars(resolvedNew.rerolls, starsEl, wrapper, resolvedNew.guaranteedBonus);
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
