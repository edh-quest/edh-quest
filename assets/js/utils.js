/**
 * utils.js — Pure Utility Functions
 *
 * Stateless helpers shared across multiple modules.
 * Also manages WHEEL_SEGMENTS, the derived spin-target array
 * built from CRITERIA.colors once at startup.
 *
 * Dependencies: config.js (CRITERIA, COLOR_FLASH)
 */

'use strict';

/* =============================================================
   WHEEL SEGMENTS
   Derived from CRITERIA.colors — one 72° segment per color.
   Call initWheelSegments() once after the page loads.
============================================================= */
let WHEEL_SEGMENTS = [];

function initWheelSegments() {
  const segAngle = 360 / CRITERIA.colors.length;
  WHEEL_SEGMENTS = CRITERIA.colors.map((color, i) => ({
    ...color,
    startAngle: i * segAngle,
    angle:      segAngle,
  }));
}

/* =============================================================
   SEEDED PRNG
   Used during step activation on resume so the same cards are
   always drawn for a given seed. Resets to Math.random() after.
============================================================= */
const RNG = (() => {
  let _fn = null;
  return {
    setSeed(seed) {
      let a = seed >>> 0;
      _fn = () => {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    },
    reset()  { _fn = null; },
    random() { return _fn ? _fn() : Math.random(); },
  };
})();

/* =============================================================
   RANDOMISATION
============================================================= */

/** Return a random element from an array. */
function pickRandom(arr) {
  return arr[Math.floor(RNG.random() * arr.length)];
}

/** Return `count` unique elements from `arr` in random order. */
function pickRandomUnique(arr, count) {
  return [...arr].sort(() => RNG.random() - 0.5).slice(0, Math.min(count, arr.length));
}

/**
 * Return `count` unique elements from `arr` in random order,
 * ensuring no single category appears more than `maxPerCategory` times.
 * Falls back gracefully if the pool is too small or too homogeneous.
 */
function pickWithCategoryLimit(arr, count, maxPerCategory) {
  // Expand pool by weight so higher-weight cards appear proportionally more often
  const weighted = arr.flatMap(card =>
    Array(Math.max(1, Math.round(card.weight || 1))).fill(card)
  );

  const shuffled    = [...weighted].sort(() => RNG.random() - 0.5);
  const catCounts   = {};
  const pickedTitles = new Set();
  const picks       = [];

  for (const card of shuffled) {
    if (picks.length >= count) break;
    if (pickedTitles.has(card.title)) continue;
    const cat = card.category || '';
    const n   = catCounts[cat] || 0;
    if (n < maxPerCategory) {
      picks.push(card);
      pickedTitles.add(card.title);
      catCounts[cat] = n + 1;
    }
  }

  // Fallback: fill remaining slots ignoring the category limit
  if (picks.length < count) {
    for (const card of shuffled) {
      if (picks.length >= count) break;
      if (!pickedTitles.has(card.title)) {
        picks.push(card);
        pickedTitles.add(card.title);
      }
    }
  }

  return picks;
}

/** Remove duplicate color objects, preserving first-seen order. */
function deduplicateColors(colors) {
  const seen = new Set();
  return colors.filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

/* =============================================================
   SAFE LOCALSTORAGE WRITE
   Writes to localStorage; on QuotaExceededError shows a one-time
   alert so the user knows their data isn't being saved.
============================================================= */
let _storageQuotaWarned = false;
function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    const isQuota = err && (err.name === 'QuotaExceededError'
                         || err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
                         || err.code === 22 || err.code === 1014);
    if (isQuota && !_storageQuotaWarned) {
      _storageQuotaWarned = true;
      alert("Your browser's storage is full — this quest couldn't be saved. "
          + "Delete some entries from History to free up space.");
    } else if (!isQuota) {
      console.warn('localStorage write failed:', err);
    }
    return false;
  }
}

/* =============================================================
   HTML ESCAPING
============================================================= */

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Returns the URL only if it uses an http(s) scheme. Blocks javascript:, data:, etc.
function safeUrl(url) {
  const s = String(url ?? '').trim();
  return /^https?:\/\//i.test(s) ? escHtml(s) : '';
}

/* =============================================================
   BONUS REROLL HELPERS (shared by step-cards and step-crossroads)
============================================================= */

function _rollBonusRerolls(rerollValue) {
  const r = parseInt(rerollValue) || 0;
  const roll = RNG.random();
  if (r === 1) return roll < 0.15 ? 1 : 0;
  if (r === 2) return roll < 0.60 ? 1 : 0;
  if (r === 3) return roll < 0.25 ? 1 : 2;
  return 0;
}

function _showBonusRerollStars(rerollValue, starsEl, wrapper, guaranteedBonus) {
  const bonus = guaranteedBonus !== undefined ? guaranteedBonus : _rollBonusRerolls(rerollValue);
  wrapper._bonusRerolls = bonus;
  if (!bonus) return;
  starsEl.textContent = bonus === 2 ? '✦ ✦' : '✦';
  starsEl.title = bonus === 2 ? '+2 bonus rerolls if you pick this card' : '+1 bonus reroll if you pick this card';
  starsEl.classList.add('event-bonus-stars--visible');
}

/* =============================================================
   WHEEL HELPERS
============================================================= */

/**
 * Set the CSS custom properties that drive the wheel flash
 * animation for the color that just landed.
 */
function setWheelFlashColor(colorId) {
  const flash = COLOR_FLASH[colorId] || { full: 'rgba(240,201,110,0.9)', dim: 'rgba(240,201,110,0.3)' };
  const wheel = document.getElementById('color-wheel');
  wheel.style.setProperty('--flash-color',     flash.full);
  wheel.style.setProperty('--flash-color-dim', flash.dim);
}
