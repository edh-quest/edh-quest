/**
 * step-greed.js — Path of Greed (review overlay between Steps 3 and 4)
 *
 * Shows the player their chosen burden, optional curse, and lore before
 * the Crossroads. If unsatisfied they may take the Path of Greed: new
 * random cards are assigned and one extra event is added as a penalty.
 * After 10 uses the quest fails.
 *
 * Entry point: GreedSystem.show()  — called by btn-step3-next in main.js.
 * Dependencies: state.js, step-cards.js (_cardFrontHTML, _buildScryfallUrl,
 *               _buildLoreScryfallUrl, _fitCardText), ui.js (QuestFlow, Screen)
 */

'use strict';

const GreedSystem = {

  _flippedCount: 0,
  _totalCards:   0,

  /** Wire overlay button listeners once at DOMContentLoaded. */
  init() {
    const overlay = document.getElementById('greed-overlay');
    overlay.querySelector('.btn-greed-accept')
      .addEventListener('click', () => this.accept());
    overlay.querySelector('.btn-greed-path')
      .addEventListener('click', () => this._showPathWarning());
    overlay.querySelector('.btn-greed-path-confirm')
      .addEventListener('click', () => this.takePath());
    overlay.querySelector('.btn-greed-path-cancel')
      .addEventListener('click', () => this._hidePathWarning());
    overlay.querySelector('.btn-greed-retreat')
      .addEventListener('click', () => this.retreat());
  },

  _showPathWarning() {
    const overlay = document.getElementById('greed-overlay');
    overlay.querySelector('.greed-path-warning').classList.remove('hidden');
    overlay.querySelector('.btn-greed-path').classList.add('hidden');
    overlay.querySelector('.btn-greed-accept').disabled = true;
  },

  _hidePathWarning() {
    const overlay = document.getElementById('greed-overlay');
    overlay.querySelector('.greed-path-warning').classList.add('hidden');
    overlay.querySelector('.btn-greed-path').classList.remove('hidden');
    overlay.querySelector('.btn-greed-accept').disabled = false;
  },

  /** Show the initial review with all current picks face-up. */
  show() {
    const overlay = document.getElementById('greed-overlay');
    overlay.querySelector('.greed-title').textContent    = 'Commander';
    overlay.querySelector('.greed-subtitle').textContent = '';
    overlay.querySelector('.greed-fail').classList.add('hidden');
    overlay.querySelector('.greed-path-warning').classList.add('hidden');
    overlay.querySelector('.btn-greed-accept').classList.remove('hidden');
    overlay.querySelector('.btn-greed-path').classList.remove('hidden');
    this._updatePenalty();
    this._buildCards(true);
    this._setButtons(true);
    this._openOverlay();
  },

  /* ── Penalty notice ───────────────────────────────────────── */

  _updatePenalty() {
    const el = document.getElementById('greed-overlay').querySelector('.greed-penalty-notice');
    // Always set text first so element height is stable before toggling visibility
    el.textContent = QuestState.greedPenalty > 0
      ? `⚠  Penalty: +${QuestState.greedPenalty} deck restriction${QuestState.greedPenalty !== 1 ? 's' : ''}`
      : '\u00A0';
    el.classList.toggle('hidden', QuestState.greedPenalty === 0);
  },

  /* ── Card row ─────────────────────────────────────────────── */

  /**
   * Build (or rebuild) the cards row.
   * revealed=true  → cards start face-up, not clickable (overview)
   * revealed=false → cards start face-down with red glow, clickable
   */
  _buildCards(revealed) {
    const row = document.getElementById('greed-overlay').querySelector('.greed-cards-row');
    row.innerHTML    = '';
    this._flippedCount = 0;

    const defs = [
      { label: 'The Burden', crit: QuestState.commanderStat,  back: 'flip-card-back',                           url: c => _buildScryfallUrl(c.scryfall_link || '') },
    ];
    if (QuestState.extraBurden) {
      defs.push({ label: 'The Curse', crit: QuestState.extraBurden, back: 'flip-card-back', url: c => _buildScryfallUrl(c.scryfall_link || '') });
    }
    defs.push({ label: 'The Lore', crit: QuestState.flavorCriteria, back: 'flip-card-back flip-card-back--lore', url: c => _buildLoreScryfallUrl(c) });

    this._totalCards = revealed ? 0 : defs.length;

    defs.forEach((def, i) => {
      const card = this._buildFlipCard(def.crit, def.back, i, def.url, revealed);
      row.appendChild(this._buildCardSlot(def.label, card));
    });
  },

  _buildCardSlot(label, cardEl) {
    const slot = document.createElement('div');
    slot.className = 'greed-card-slot';
    const lbl = document.createElement('p');
    lbl.className   = 'greed-card-label';
    lbl.textContent = label;
    slot.appendChild(lbl);
    slot.appendChild(cardEl);
    return slot;
  },

  _buildFlipCard(crit, backClass, cardIndex, urlFn, startRevealed) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flip-card greed-flip-card card-appear';
    wrapper.style.animationDelay = `${cardIndex * 0.18}s`;
    if (startRevealed) wrapper.classList.add('card-revealed');

    const inner = document.createElement('div');
    inner.className = 'flip-card-inner';
    if (startRevealed) inner.classList.add('flipped');

    const back = document.createElement('div');
    back.className = backClass;

    const front = document.createElement('div');
    front.className = 'flip-card-front quest-card';
    front.innerHTML = _cardFrontHTML(crit, urlFn(crit));

    inner.appendChild(back);
    inner.appendChild(front);
    wrapper.appendChild(inner);

    if (!startRevealed) {
      wrapper.addEventListener('click', () => {
        if (inner.classList.contains('flipped')) return;
        inner.classList.add('flipped');
        wrapper.classList.add('card-revealed');
        this._flippedCount++;
        if (this._flippedCount >= this._totalCards) {
          setTimeout(() => this._setButtons(true), 400);
        }
      });
    }

    setTimeout(() => _fitCardText(front), 0);
    return wrapper;
  },

  /* ── Button state ─────────────────────────────────────────── */

  _setButtons(enabled) {
    const overlay = document.getElementById('greed-overlay');
    overlay.querySelector('.btn-greed-accept').disabled = !enabled;
    overlay.querySelector('.btn-greed-path').disabled   = !enabled;
  },

  /* ── Overlay open / close ─────────────────────────────────── */

  _openOverlay() {
    const overlay = document.getElementById('greed-overlay');
    overlay.classList.remove('hidden', 'greed-overlay--hiding');
    void overlay.offsetWidth;
    overlay.classList.add('greed-overlay--visible');
    setTimeout(() => {
      overlay.querySelectorAll('.quest-card').forEach(card => _fitCardText(card));
    }, 60);
  },

  _closeOverlay(onDone) {
    const overlay = document.getElementById('greed-overlay');
    overlay.classList.remove('greed-overlay--visible');
    overlay.classList.add('greed-overlay--hiding');
    overlay.addEventListener('transitionend', () => {
      overlay.classList.remove('greed-overlay--hiding');
      overlay.classList.add('hidden');
      onDone?.();
    }, { once: true });
  },

  /* ── Actions ─────────────────────────────────────────────── */

  accept() {
    this._closeOverlay(() => QuestFlow.advance());
  },

  takePath() {
    this._hidePathWarning();
    QuestState.greedCount++;
    QuestState.greedPenalty++;
    QuestState.extraBurden = null;

    const newBurden = RerollState.pickNew(CRITERIA.commanderStats);
    if (newBurden) QuestState.commanderStat = newBurden;
    const newLore = RerollState.pickNew(CRITERIA.flavor);
    if (newLore) QuestState.flavorCriteria = newLore;

    if (QuestState.greedCount >= 10) {
      this._renderFail();
      return;
    }

    // Lock buttons and reveal penalty notice
    this._setButtons(false);
    this._updatePenalty();

    // Crossfade the card row: fade out → rebuild face-down with red glow → fade in
    const row = document.getElementById('greed-overlay').querySelector('.greed-cards-row');
    row.style.transition = 'opacity 0.3s ease';
    row.style.opacity    = '0';
    setTimeout(() => {
      this._buildCards(false);
      row.style.opacity = '1';
      setTimeout(() => {
        document.getElementById('greed-overlay')
          .querySelectorAll('.quest-card').forEach(c => _fitCardText(c));
      }, 60);
    }, 310);
  },

  _renderFail() {
    const overlay = document.getElementById('greed-overlay');
    overlay.querySelector('.greed-title').textContent = 'Your Quest Has Failed';
    overlay.querySelector('.greed-penalty-notice').classList.add('hidden');
    overlay.querySelector('.greed-cards-row').innerHTML = '';
    overlay.querySelector('.btn-greed-accept').classList.add('hidden');
    overlay.querySelector('.btn-greed-path').classList.add('hidden');
    const failEl = overlay.querySelector('.greed-fail');
    failEl.classList.remove('hidden');
    failEl.querySelector('.greed-fail-text').textContent =
      'You walked the Path of Greed too many times. Your quest is forfeit — there is nothing left to offer you.';
  },

  retreat() {
    this._closeOverlay(() => {
      QuestState.reset();
      RerollState.clear();
      Screen.show('screen-landing');
    });
  },
};
