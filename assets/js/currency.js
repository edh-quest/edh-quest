/**
 * currency.js — User currency preference (EUR / USD)
 *
 * Persisted in localStorage. The chosen symbol is used everywhere
 * a budget is displayed. Layout stays suffix-style (e.g. "150€"
 * becomes "150$") to keep the existing visual rhythm.
 *
 * HTML usage: write `<span class="cur-symbol">€</span>` in any
 * static template and Currency.apply() will swap the glyph on load.
 *
 * JS usage: build strings with `${amount}${Currency.symbol()}`.
 *
 * Dependencies: none. Load before any module that renders budgets.
 */

'use strict';

const Currency = {
  _key: 'mtgq_currency',

  get() {
    try { return localStorage.getItem(this._key) === 'USD' ? 'USD' : 'EUR'; }
    catch (_) { return 'EUR'; }
  },

  set(code) {
    const c = code === 'USD' ? 'USD' : 'EUR';
    try { localStorage.setItem(this._key, c); } catch (_) {}
    this.apply();
    if (typeof Currency.onChange === 'function') Currency.onChange();
  },

  symbol() {
    return this.get() === 'USD' ? '$' : '€';
  },

  /** Replace the content of every <… class="cur-symbol"> with the current glyph. */
  apply(root) {
    const s = this.symbol();
    (root || document).querySelectorAll('.cur-symbol').forEach(el => {
      el.textContent = s;
    });
  },

  /**
   * Rewrite a Scryfall query/URL so its price operator matches the user's
   * currency. Handles raw (eur<0.10) and URL-encoded (eur%3C0.10) forms.
   * No-op when the user is on EUR or the input is empty.
   */
  queryize(urlOrQuery) {
    if (!urlOrQuery || this.get() !== 'USD') return urlOrQuery;
    return String(urlOrQuery)
      .replace(/\beur(?=[<>:=])/gi, 'usd')
      .replace(/\beur(?=%3[A-Da-d])/gi, 'usd');
  },
};

// Apply on initial load so static templates pick up the saved choice.
document.addEventListener('DOMContentLoaded', () => Currency.apply());
