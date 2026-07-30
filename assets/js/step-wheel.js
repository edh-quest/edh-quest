/**
 * step-wheel.js — Step 1: The Wheel of Mana
 *
 * The player clicks the wheel to spin it three times. Each spin
 * lands on a random color. After all three picks:
 *
 *   All 3 the same  → rainbow: all 5 colors granted
 *   Exactly 2 same  → mercy: player may reroll one slot
 *   All different   → normal result, proceed to Step 2
 *
 * Dependencies: config.js, state.js (WheelState, QuestState), utils.js
 */

'use strict';

/* =============================================================
   WHEEL CONSTRUCTION
============================================================= */

/** Build the color wheel DOM from WHEEL_SEGMENTS. */
function buildColorWheel() {
  const wheel = document.getElementById('color-wheel');
  wheel.innerHTML = '';

  // Conic gradient background — one slice per color
  const gradientParts = WHEEL_SEGMENTS.map(seg => {
    const s = seg.startAngle.toFixed(3);
    const e = (seg.startAngle + seg.angle).toFixed(3);
    return `${seg.hex} ${s}deg ${e}deg`;
  });
  wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

  const SIZE = 280; // logical px matching the CSS clamp baseline
  const half = SIZE / 2;

  // Divider lines between segments
  WHEEL_SEGMENTS.forEach(seg => {
    const divider = document.createElement('div');
    divider.className = 'wheel-divider';
    divider.style.transform = `rotate(${seg.startAngle}deg)`;
    wheel.appendChild(divider);
  });

  // Mana symbol positioned at the visual centroid of each segment
  WHEEL_SEGMENTS.forEach(seg => {
    const midAngle = seg.startAngle + seg.angle / 2;
    const midRad   = (midAngle - 90) * (Math.PI / 180);
    const symR     = half * 0.62; // 62% radius sits at the visual centroid of a 72° slice

    const sx = half + Math.cos(midRad) * symR;
    const sy = half + Math.sin(midRad) * symR;

    const symbol = document.createElement('div');
    symbol.className = 'wheel-symbol';
    symbol.innerHTML = `<img src="${seg.img}" alt="${seg.name}">`;
    symbol.style.cssText = `
      left: ${(sx / SIZE) * 100}%;
      top:  ${(sy / SIZE) * 100}%;
      transform: translate(-50%, -50%) rotate(${midAngle}deg);
    `;
    wheel.appendChild(symbol);
  });

  // Central decorative hub
  const hub = document.createElement('div');
  hub.className = 'wheel-hub';
  hub.innerHTML  = '<span class="hub-sigil">✦</span>';
  wheel.appendChild(hub);
}

/* =============================================================
   SPIN MECHANICS
============================================================= */

/** Pick a random wheel segment (equal probability, duplicates allowed). */
function pickRandomTarget() {
  return WHEEL_SEGMENTS[Math.floor(RNG.random() * WHEEL_SEGMENTS.length)];
}

/** Consume the next pre-computed pick, or fall back to a fresh RNG pick. */
function nextWheelTarget() {
  return WheelState.predetermined.shift() || pickRandomTarget();
}

function nextMercyRerollTarget() {
  return WheelState.mercyRerollTargets.shift() || pickRandomTarget();
}

/**
 * Animate the wheel to a pre-determined target segment.
 * @param {Object}   target      - A WHEEL_SEGMENTS entry to land on
 * @param {number}   extraSpins  - Minimum full extra rotations before landing
 * @param {number}   durationBase - Base animation duration in seconds
 * @param {Function} callback    - Called when the animation completes
 */
function spinToTarget(target, extraSpins, durationBase, callback) {
  const wheel = document.getElementById('color-wheel');

  // Land at a random position within the middle 60% of the target segment
  const randomOffset = (Math.random() - 0.5) * target.angle * 0.6;
  const targetCenter = target.startAngle + target.angle / 2 + randomOffset;
  const currentMod   = ((WheelState.rotation % 360) + 360) % 360;
  const desiredMod   = (360 - targetCenter + 360) % 360;
  let   delta        = (desiredMod - currentMod + 360) % 360;
  if (delta < 90) delta += 360; // ensure a visible spin

  const spins    = extraSpins + Math.floor(Math.random() * 4);
  const totalRot = WheelState.rotation + spins * 360 + delta;
  const duration = durationBase + Math.random();

  WheelState.rotation = totalRot;

  wheel.style.transition = 'none';
  void wheel.offsetWidth; // flush pending style before applying transition
  wheel.style.transition = `transform ${duration.toFixed(2)}s cubic-bezier(0, 0, 0.2, 1)`;
  wheel.style.transform  = `rotate(${totalRot}deg)`;

  setTimeout(callback, Math.round(duration * 1000) + 200);
}

/** Begin one of the three main spins. */
function startSpin() {
  if (WheelState.isSpinning) return;
  if (WheelState.pickedColors.length >= WheelState.spinsNeeded) return;
  WheelState.isSpinning = true;
  document.getElementById('color-wheel').classList.add('wheel-spinning');

  const target = nextWheelTarget();
  spinToTarget(target, 5, 3, () => onSpinComplete(target));
}

/** Called when a main spin animation finishes. */
function onSpinComplete(target) {
  WheelState.isSpinning = false;

  const wheel = document.getElementById('color-wheel');
  setWheelFlashColor(target.id);
  wheel.classList.add('color-selected');
  wheel.addEventListener('animationend', () => wheel.classList.remove('color-selected'), { once: true });

  WheelState.pickedColors.push(target.id);
  QuestState.selectedColors.push(target);
  fillColorSlot(WheelState.pickedColors.length - 1, target);
  updateNextToFill(WheelState.pickedColors.length);

  if (WheelState.pickedColors.length >= WheelState.spinsNeeded) {
    wheel.onclick = null; // all spins used — disable direct wheel clicking
    setTimeout(checkResultForDuplicates, 900);
  } else {
    wheel.classList.remove('wheel-spinning');
  }
}

/* =============================================================
   DUPLICATE RESOLUTION
============================================================= */

/** After all 3 picks: branch to rainbow, mercy, or normal result. */
function checkResultForDuplicates() {
  const counts = {};
  WheelState.pickedColors.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

  const tripled = Object.values(counts).includes(3);
  const doubled = Object.values(counts).includes(2);

  if (tripled)      triggerRainbowAll();
  else if (doubled) triggerMercyReroll();
  else              showStep1Result();
}

/* ── All three the same: grant all 5 colors ─────────────────── */

function triggerRainbowAll() {
  const wheel = document.getElementById('color-wheel');
  const slots = document.querySelectorAll('.color-slot');

  wheel.classList.add('rainbow-flash');
  slots.forEach(s => s.classList.add('rainbow-flash'));

  setTimeout(() => {
    wheel.classList.remove('rainbow-flash');
    slots.forEach(s => s.classList.remove('rainbow-flash'));

    // Expand to five slots
    const container = document.getElementById('selected-colors');
    for (let i = 3; i < 5; i++) {
      if (!document.getElementById(`slot-${i}`)) {
        const slot = document.createElement('div');
        slot.className = 'color-slot empty';
        slot.id = `slot-${i}`;
        slot.setAttribute('aria-label', `Slot ${i + 1}`);
        container.appendChild(slot);
      }
    }

    QuestState.selectedColors = [...CRITERIA.colors];
    CRITERIA.colors.forEach((color, i) => {
      setTimeout(() => fillColorSlot(i, color), i * 90);
    });

    const delay = CRITERIA.colors.length * 90 + 300;
    setTimeout(() => showStep1Result('From a single source, your whole might is unleashed — all colors available.'), delay);
  }, 4200); // 5 rainbow cycles × 0.8s each
}

/* ── Exactly two the same: mercy reroll ─────────────────────── */

function triggerMercyReroll(msg) {
  const wheel = document.getElementById('color-wheel');
  wheel.onclick = null; // reroll only via slot buttons
  wheel.classList.add('wheel-reroll');
  showMercyMessage(msg);

  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) continue;
    slot.classList.add('rerollable');
    slot._rerollHandler = () => onSlotRerollClick(i);
    slot.addEventListener('click', slot._rerollHandler);
  }
}

function showMercyMessage(msg) {
  const mercyEl = document.getElementById('result-mercy-msg');
  mercyEl.textContent = msg || 'The gods are favourable — you may reroll one color.';
  mercyEl.classList.remove('hidden');
  setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), 50);
}

function onSlotRerollClick(slotIndex) {
  clearRerollableSlots();
  document.getElementById('result-mercy-msg').classList.add('hidden');
  startMercyRerollSpin(slotIndex);
}

function clearRerollableSlots() {
  document.getElementById('color-wheel').classList.remove('wheel-reroll');
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) continue;
    slot.classList.remove('rerollable');
    if (slot._rerollHandler) {
      slot.removeEventListener('click', slot._rerollHandler);
      delete slot._rerollHandler;
    }
  }
}

function startMercyRerollSpin(slotIndex) {
  const target = nextMercyRerollTarget();
  spinToTarget(target, 3, 2.5, () => onMercyRerollComplete(slotIndex, target));
}

function onMercyRerollComplete(slotIndex, target) {
  const wheel = document.getElementById('color-wheel');
  setWheelFlashColor(target.id);
  wheel.classList.add('color-selected');
  wheel.addEventListener('animationend', () => wheel.classList.remove('color-selected'), { once: true });

  WheelState.pickedColors[slotIndex]   = target.id;
  QuestState.selectedColors[slotIndex] = target;
  fillColorSlot(slotIndex, target);

  setTimeout(checkAfterMercyReroll, 900);
}

/** Post-reroll duplicate check: rainbow on triple, otherwise proceed. */
function checkAfterMercyReroll() {
  const counts = {};
  WheelState.pickedColors.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

  if (Object.values(counts).includes(3)) {
    triggerRainbowAll();
  } else {
    showStep1Result();
  }
}

/* =============================================================
   SHARED HELPERS
============================================================= */

/** Mark the next empty slot as the one about to be filled. */
function updateNextToFill(filledCount) {
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) continue;
    slot.classList.toggle('next-to-fill', i === filledCount);
  }
}

/** Populate a color slot with the chosen color's mana symbol. */
function fillColorSlot(index, color) {
  const slot = document.getElementById(`slot-${index}`);
  if (!slot) return;
  slot.classList.remove('empty', 'next-to-fill');
  slot.classList.add('filled');
  slot.setAttribute('data-color', color.id);
  slot.innerHTML = `<img src="${color.img}" alt="${color.name}" class="slot-img">`;
  slot.title = color.name;
}

/** Reveal the combo box, Continue button (and optional rainbow message) after Step 1. */
function showStep1Result(rainbowMsg = null) {
  const rainbowEl  = document.getElementById('result-rainbow-msg');
  const comboBoxEl = document.getElementById('color-combo-box');
  const btnEl      = document.getElementById('btn-next-step');

  document.getElementById('color-wheel').classList.add('wheel-done');

  if (rainbowMsg) {
    rainbowEl.textContent = rainbowMsg;
    rainbowEl.classList.remove('hidden');
  } else {
    rainbowEl.classList.add('hidden');
  }

  comboBoxEl.classList.remove('hidden');

  btnEl.classList.remove('hidden');
  setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }), 50);
}

/* =============================================================
   STEP ACTIVATION
============================================================= */

function activateStep1() {
  // Reset wheel state
  WheelState.isSpinning          = false;
  WheelState.pickedColors        = [];
  WheelState.rotation            = 0;
  WheelState.easyExtraRerollUsed = false;

  // Pre-compute wheel outcomes while RNG is still seeded (it gets reset right
  // after step activation). Without this, the wheel would use fresh Math.random()
  // at click time and produce different colors on resume — exploitable.
  WheelState.predetermined = [
    pickRandomTarget(),
    pickRandomTarget(),
    pickRandomTarget(),
  ];
  WheelState.mercyRerollTargets = [
    pickRandomTarget(),
    pickRandomTarget(), // safety buffer in case the first reroll re-triples
  ];

  // Reset UI elements
  clearRerollableSlots();
  document.getElementById('result-mercy-msg').classList.add('hidden');
  document.getElementById('result-rainbow-msg').classList.add('hidden');
  document.getElementById('color-combo-box').classList.add('hidden');
  document.getElementById('btn-next-step').classList.add('hidden');

  // Remove extra slots added by a five-color rainbow result
  for (let i = 3; i < 5; i++) {
    const extra = document.getElementById(`slot-${i}`);
    if (extra) extra.remove();
  }

  // Reset the three base slots to empty
  for (let i = 0; i < 3; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (slot) {
      slot.className = 'color-slot empty';
      slot.textContent = '';
      slot.removeAttribute('data-color');
    }
  }

  // Rebuild and reset the wheel
  buildColorWheel();
  const wheel = document.getElementById('color-wheel');
  wheel.classList.remove('rainbow-flash', 'wheel-spinning', 'wheel-done', 'wheel-reroll');
  wheel.style.transition = 'none';
  void wheel.offsetWidth;
  wheel.style.transform = 'rotate(0deg)';
  wheel.onclick = startSpin;
  updateNextToFill(0);

  showIntroOverlay({
    solid: true,
    slides: [
      {
        type: 'body',
        lines: [
          { html: 'Welcome to <span class="intro-title">EDH Quest</span>!' },
          'Ahead of you lie a series of trials that will set the rules your next commander deck must follow.',
        ],
        duration: 15000,
      },
      {
        type: 'body',
        lines: [`You have a budget of ${QuestState.budget}${Currency.symbol()} to build your deck — commander included.`],
        duration: 15000,
      },
      {
        type: 'body',
        lines: ['The first trial will reveal which colors your commander is allowed to use.'],
        duration: 15000,
      },
      { type: 'luck', duration: 5000 },
    ],
  });
}
