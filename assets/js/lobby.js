/**
 * lobby.js — Multiplayer Lobby System
 *
 * Create → Join → Lobby Room → Quest (one-shot) → Results
 *
 * There are no user accounts. A username is entered per-lobby and the
 * server hands out a 4-digit PIN which lets the player rejoin from
 * another browser. LobbyList (localStorage) keeps enough state that
 * the *same* browser rejoins automatically without needing the PIN.
 *
 * Dependencies: ui.js (Screen, QuestFlow), summary.js (exportQuestResults)
 */

'use strict';

/* =============================================================
   LOBBY STATE — currently-active lobby session
============================================================= */
const LobbyState = {
  code:       null,
  token:      null,
  pin:        null,
  username:   null,
  lobby:      null,   // last fetched lobby object (no tokens)
  ownResults: null,   // cached locally so hidden-lobby players can view their own results

  save() {
    safeLocalStorageSet('mtgq_lobby', JSON.stringify({
      code: this.code, token: this.token, pin: this.pin, username: this.username,
      ownResults: this.ownResults || null,
    }));
  },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem('mtgq_lobby') || 'null');
      if (d && d.code && d.token && d.username) {
        this.code       = d.code;
        this.token      = d.token;
        this.pin        = d.pin || null;
        this.username   = d.username;
        this.ownResults = d.ownResults || null;
        return true;
      }
    } catch (_) {}
    return false;
  },

  clear() {
    this.code = this.token = this.pin = this.username = this.lobby = this.ownResults = null;
    localStorage.removeItem('mtgq_lobby');
  },
};

/* =============================================================
   LOBBY API
============================================================= */
const LobbyAPI = {
  async _post(action, body = {}) {
    const fd = new FormData();
    fd.append('action', action);
    for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
    const res  = await fetch('api/lobby.php', { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Unknown error');
    return json.data;
  },

  async _get(action, params = {}) {
    const qs   = new URLSearchParams({ action, ...params }).toString();
    const res  = await fetch(`api/lobby.php?${qs}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Unknown error');
    return json.data;
  },

  create:   (name, difficulty, customSettings, rules, notes, username, resultsVisibility) =>
    LobbyAPI._post('create', {
      name,
      difficulty,
      custom_settings: customSettings ? JSON.stringify(customSettings) : '{}',
      rules:           JSON.stringify(rules),
      notes,
      username,
      results_visibility: resultsVisibility,
    }),

  get:      (code, token = '') =>
    LobbyAPI._get('get', token ? { code, token } : { code }),

  join:     (code, username) =>
    LobbyAPI._post('join', { code, username }),

  rejoin:   (code, pin) =>
    LobbyAPI._post('rejoin', { code, pin }),

  start:    (code, token) =>
    LobbyAPI._post('start', { code, token }),

  complete: (code, token, results) =>
    LobbyAPI._post('complete', { code, token, results: JSON.stringify(results) }),

  delete: (code, token) =>
    LobbyAPI._post('delete', { code, token }),
};

/* =============================================================
   LOBBY LIST — every lobby this browser has joined
============================================================= */
const LobbyList = {
  _max: 50,
  _key: 'mtgq_lobbies',

  load() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch (_) { return []; }
  },

  push(code, name, role, token, pin, username, difficulty) {
    let list = this.load().filter(e => e.code !== code);
    list.unshift({ code, name, role, token, pin, username, difficulty, joined_at: Date.now() });
    if (list.length > this._max) list.length = this._max;
    safeLocalStorageSet(this._key, JSON.stringify(list));
  },

  find(code) {
    return this.load().find(e => e.code === code) || null;
  },

  remove(code) {
    const list = this.load().filter(e => e.code !== code);
    safeLocalStorageSet(this._key, JSON.stringify(list));
  },
};

/* =============================================================
   LOBBY FLOW
============================================================= */
const LobbyFlow = {
  _pollTimer:     null,
  _pollFailCount: 0,
  _pinToReveal:   null, // shown once when entering room after a fresh join

  /* ── Navigation ──────────────────────────────────────────── */

  _joinCode:            null, // lobby code from invite link (used by both forms)
  _joinExistingNames:   [],   // usernames currently in the lobby (for client-side collision check)

  showCreate() {
    Screen.show('screen-lobby-create');
  },

  showJoin(code) {
    const cleanCode = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    this._joinCode          = cleanCode;
    this._joinExistingNames = [];

    // Already joined from this browser? Skip the Join/Rejoin choice and go straight in.
    if (cleanCode.length === 6) {
      const known = LobbyList.find(cleanCode);
      if (known && known.token) {
        this.returnToLobby(cleanCode, known.token);
        return;
      }
    }

    const titleEl = document.getElementById('lobby-join-title');
    const descEl  = document.getElementById('lobby-join-desc');
    if (titleEl) titleEl.textContent = 'Join a Lobby';
    if (descEl)  descEl.textContent  = "You've been invited to a lobby.";

    LobbyState.load();
    const alreadyOverlay = document.getElementById('join-already-in-lobby');
    if (alreadyOverlay) {
      // Only show the "already in a lobby" overlay if the *active* lobby is a different one
      const sameLobby = LobbyState.code === cleanCode;
      alreadyOverlay.classList.toggle('hidden', !(LobbyState.code && LobbyState.username && !sameLobby));
    }

    Screen.show('screen-lobby-join');

    if (cleanCode.length !== 6) {
      this._showError('screen-lobby-join', 'Invalid invite link.');
      return;
    }

    // Fetch lobby preview so we can show the name and pre-check for name collisions
    LobbyAPI.get(cleanCode).then(lobby => {
      if (descEl && lobby.name) descEl.textContent = `You've been invited to \u201C${lobby.name}\u201D.`;
      this._joinExistingNames = (lobby.players || []).map(p => (p.username || '').toLowerCase());
    }).catch(() => {
      this._showError('screen-lobby-join', 'Lobby not found or expired.');
    });
  },

  /* ── Create ──────────────────────────────────────────────── */

  async create(name, difficulty, customSettings, rules, notes, username, resultsVisibility) {
    this._setLoading('btn-do-create-lobby', true);
    try {
      const data = await LobbyAPI.create(name, difficulty, customSettings, rules, notes, username, resultsVisibility);
      LobbyState.code     = data.code;
      LobbyState.token    = data.token;
      LobbyState.pin      = data.pin;
      LobbyState.username = username;
      LobbyState.save();
      LobbyList.push(data.code, name, 'creator', data.token, data.pin, username, difficulty);
      this._pinToReveal = data.pin;
      await this.enterRoom();
    } catch (e) {
      this._showError('screen-lobby-create', e.message);
    } finally {
      this._setLoading('btn-do-create-lobby', false);
    }
  },

  /* ── Join ────────────────────────────────────────────────── */

  async join(code, username) {
    this._setLoading('btn-do-join-lobby', true);
    try {
      const data = await LobbyAPI.join(code.toUpperCase(), username);
      LobbyState.code     = code.toUpperCase();
      LobbyState.token    = data.token;
      LobbyState.pin      = data.pin;
      LobbyState.username = username;
      LobbyState.save();
      LobbyList.push(code.toUpperCase(), data.lobby_name || code.toUpperCase(), 'member',
                     data.token, data.pin, username, data.difficulty);
      this._pinToReveal = data.pin;
      await this.enterRoom();
    } catch (e) {
      this._showError('screen-lobby-join', e.message);
    } finally {
      this._setLoading('btn-do-join-lobby', false);
    }
  },

  /* ── Rejoin with PIN ─────────────────────────────────────── */

  async rejoin(code, pin) {
    this._setLoading('btn-do-rejoin-lobby', true);
    try {
      const data = await LobbyAPI.rejoin(code.toUpperCase(), pin);
      LobbyState.code     = code.toUpperCase();
      LobbyState.token    = data.token;
      LobbyState.pin      = pin;
      LobbyState.username = data.username;
      LobbyState.save();
      LobbyList.push(code.toUpperCase(), data.lobby_name || code.toUpperCase(), 'member',
                     data.token, pin, data.username, data.difficulty);
      await this.enterRoom();
    } catch (e) {
      this._showError('screen-lobby-join', e.message);
    } finally {
      this._setLoading('btn-do-rejoin-lobby', false);
    }
  },

  /* ── Return to lobby from dashboard (this browser already knows the token) ── */

  returnToLobby(code, token) {
    const entry = LobbyList.find(code);
    LobbyState.code     = code;
    LobbyState.token    = token;
    LobbyState.pin      = entry?.pin || null;
    LobbyState.username = entry?.username || 'Player';
    LobbyState.save();
    Screen.show('screen-dashboard');
    this.enterRoom();
  },

  /* ── Room ────────────────────────────────────────────────── */

  async enterRoom() {
    Screen.show('screen-lobby-room');
    this._pollFailCount = 0;
    this._hideDisconnectModal();
    await this.refreshRoom();
    this.startPolling();
    this._maybeRevealPin();
  },

  _maybeRevealPin() {
    const box = document.getElementById('lobby-pin-reveal');
    if (!box) return;
    if (!this._pinToReveal) {
      box.classList.add('hidden');
      return;
    }
    const pinEl = document.getElementById('lobby-pin-reveal-value');
    if (pinEl) pinEl.textContent = this._pinToReveal;
    box.classList.remove('hidden');
    this._pinToReveal = null;
  },

  dismissPinReveal() {
    const box = document.getElementById('lobby-pin-reveal');
    if (box) box.classList.add('hidden');
  },

  async refreshRoom() {
    try {
      const lobby = await LobbyAPI.get(LobbyState.code, LobbyState.token);
      LobbyState.lobby = lobby;
      this._pollFailCount = 0;
      if (!LobbyState.ownResults) {
        const me = lobby.players.find(p => p.username === LobbyState.username);
        if (me?.quest_results) {
          LobbyState.ownResults = me.quest_results;
          LobbyState.save();
        }
      }
      this._renderRoom(lobby);
    } catch (e) {
      const msg = (e && e.message) || '';
      const isGone = /not found|expired/i.test(msg);

      if (isGone) {
        this.stopPolling();
        this._showDisconnectModal(
          'This lobby is no longer available. It may have expired or been deleted.',
          { showRetry: false }
        );
        return;
      }

      this._pollFailCount++;
      if (this._pollFailCount >= 3) {
        this.stopPolling();
        this._showDisconnectModal(
          'Lost connection to the lobby. Check your internet and try again.',
          { showRetry: true }
        );
      }
    }
  },

  _showDisconnectModal(message, opts = {}) {
    const modal = document.getElementById('lobby-disconnect-modal');
    if (!modal) return;
    const msgEl = document.getElementById('lobby-disconnect-msg');
    const retry = document.getElementById('btn-lobby-retry');
    if (msgEl) msgEl.textContent = message;
    if (retry) retry.classList.toggle('hidden', !opts.showRetry);
    modal.classList.remove('hidden');
  },

  _hideDisconnectModal() {
    const modal = document.getElementById('lobby-disconnect-modal');
    if (modal) modal.classList.add('hidden');
  },

  _renderRoom(lobby) {
    document.getElementById('lobby-room-name').textContent = lobby.name;
    const diffBadge = document.getElementById('lobby-room-diff-badge');
    diffBadge.textContent = capitalize(lobby.difficulty);
    diffBadge.className = `lobby-diff-badge lobby-diff-badge--${lobby.difficulty}`;

    const linkEl = document.getElementById('lobby-room-link');
    if (linkEl) linkEl.value = `${location.origin}${location.pathname}?lobby=${lobby.code}`;

    const pinEl = document.getElementById('lobby-my-pin-value');
    if (pinEl) pinEl.textContent = LobbyState.pin || '----';

    const rulesList = document.getElementById('lobby-rules-list');
    rulesList.innerHTML = '';

    const budgetItem = document.createElement('li');
    budgetItem.textContent = lobby.budget > 0 ? `Budget: up to ${lobby.budget}${Currency.symbol()}` : 'No budget restriction';
    rulesList.appendChild(budgetItem);

    (lobby.rules || []).forEach(rule => {
      const li = document.createElement('li');
      li.textContent = rule;
      rulesList.appendChild(li);
    });

    const customBox  = document.getElementById('lobby-custom-settings-box');
    const customList = document.getElementById('lobby-custom-settings-list');
    if (customBox && customList) {
      if (lobby.difficulty === 'custom' && lobby.custom_settings) {
        const cs = lobby.custom_settings;
        customList.innerHTML = '';
        [
          `Budget: ${cs.budget > 0 ? cs.budget + Currency.symbol() : 'No limit'}`,
          `Starting rerolls: ${cs.rerolls}`,
          `Reward chances: ${capitalize(cs.reward_level)}`,
          `Curse chances: ${capitalize(cs.curse_level)}`,
          `Number of events: ${cs.crossing_count}`,
        ].forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          customList.appendChild(li);
        });
        customBox.classList.remove('hidden');
      } else {
        customBox.classList.add('hidden');
      }
    }

    const notesBox  = document.getElementById('lobby-notes-box');
    const notesText = document.getElementById('lobby-notes-text');
    if (lobby.notes && lobby.notes.trim()) {
      notesText.textContent = lobby.notes;
      notesBox.classList.remove('hidden');
    } else {
      notesBox.classList.add('hidden');
    }

    const countEl = document.getElementById('lobby-player-count');
    if (countEl) countEl.textContent = `(${lobby.players.length}/24)`;

    const list = document.getElementById('lobby-player-list');
    list.innerHTML = '';
    lobby.players.forEach(p => list.appendChild(this._buildPlayerRow(p)));
  },

  _buildPlayerRow(player) {
    const isMe    = player.username === LobbyState.username;
    const row     = document.createElement('div');
    row.className = 'lobby-player-row' + (isMe ? ' lobby-player-row--me' : '');

    const nameSpan = document.createElement('span');
    nameSpan.className   = 'lobby-player-name';
    nameSpan.textContent = player.username + (isMe ? ' (you)' : '');

    const actionSpan = document.createElement('span');
    actionSpan.className = 'lobby-player-action';

    if (player.quest_completed) {
      const isPublic = (LobbyState.lobby?.results_visibility ?? 'public') === 'public';
      if (isPublic || isMe) {
        const pips = this._buildColorPips(player.quest_results?.color_ids || []);
        if (pips) actionSpan.appendChild(pips);
        const btn = document.createElement('button');
        btn.className   = 'btn-ghost lobby-view-btn';
        btn.textContent = 'View Results';
        btn.addEventListener('click', () => {
          const full    = LobbyState.lobby.players.find(p => p.username === player.username);
          const results = full?.quest_results ?? (isMe ? LobbyState.ownResults : null);
          if (results) this.showResults(player.username, results);
        });
        actionSpan.appendChild(btn);
      } else {
        const badge = document.createElement('span');
        badge.className   = 'lobby-status lobby-status--done';
        badge.textContent = 'Done ✓';
        actionSpan.appendChild(badge);
      }

    } else if (player.quest_started) {
      if (isMe) {
        // If this browser still has the quest save, offer to resume it.
        // Otherwise show the plain badge — state can't be reconstructed
        // without the original device's localStorage.
        const saved = QuestSave.load();
        const canResume = !!(saved && saved.mode === 'lobby' && saved.lobbyCode === LobbyState.code);
        if (canResume) {
          const btn = document.createElement('button');
          btn.className   = 'btn-primary lobby-start-btn';
          btn.textContent = 'Rejoin Quest';
          btn.title       = 'Continue your quest from where you left off.';
          btn.addEventListener('click', () => this._rejoinQuest());
          actionSpan.appendChild(btn);
        } else {
          const s = document.createElement('span');
          s.className   = 'lobby-status lobby-status--active';
          s.textContent = 'In Quest…';
          s.title       = 'You started this quest on another device or browser — progress can only be resumed there.';
          actionSpan.appendChild(s);
        }
      } else {
        const s = document.createElement('span');
        s.className   = 'lobby-status lobby-status--active';
        s.textContent = 'In Quest…';
        actionSpan.appendChild(s);
      }

    } else if (isMe) {
      const btn = document.createElement('button');
      btn.className   = 'btn-primary lobby-start-btn';
      btn.textContent = 'Start Quest';
      btn.addEventListener('click', () => this._confirmStart());
      actionSpan.appendChild(btn);

    } else {
      const s = document.createElement('span');
      s.className   = 'lobby-status lobby-status--waiting';
      s.textContent = 'Waiting';
      actionSpan.appendChild(s);
    }

    row.appendChild(nameSpan);
    row.appendChild(actionSpan);
    return row;
  },

  _buildColorPips(colorIds) {
    if (!colorIds || !colorIds.length) return null;
    const wrap = document.createElement('span');
    wrap.className = 'player-color-pips';
    colorIds.forEach(id => {
      const color = CRITERIA.colors.find(c => c.id === id);
      if (!color) return;
      const img = document.createElement('img');
      img.src   = color.img;
      img.alt   = color.name;
      img.title = color.name;
      img.className = 'player-color-pip';
      wrap.appendChild(img);
    });
    return wrap;
  },

  /* ── Start Quest (one-shot) ──────────────────────────────── */

  _confirmStart() {
    const overlay = document.getElementById('lobby-start-confirm');
    if (overlay) overlay.classList.remove('hidden');
  },

  _cancelStart() {
    const overlay = document.getElementById('lobby-start-confirm');
    if (overlay) overlay.classList.add('hidden');
  },

  async _doStart() {
    try {
      await LobbyAPI.start(LobbyState.code, LobbyState.token);
    } catch (e) {
      alert('Could not start quest: ' + e.message);
      return;
    }
    this.stopPolling();
    QuestFlow.beginLobby(LobbyState.lobby || {});
  },

  /* ── Rejoin an in-progress quest from the lobby room ─────── */

  async _rejoinQuest() {
    this.stopPolling();
    await ResumeFlow.resume();
  },

  /* ── Save results after quest ────────────────────────────── */

  async saveResults(results) {
    LobbyState.ownResults = results;
    LobbyState.save();
    try {
      await LobbyAPI.complete(LobbyState.code, LobbyState.token, results);
    } catch (e) {
      console.error('Could not save lobby results:', e);
    }
  },

  /* ── Results viewer ──────────────────────────────────────── */

  showResults(username, results) {
    renderLobbyResults(username, results);
    // Cannot share other players' results — no client-side questId available
    setQuestShareLink(document.getElementById('btn-copy-quest-link-results'), null);
    Screen.show('screen-lobby-results');
  },

  /* ── Polling ─────────────────────────────────────────────── */

  startPolling() {
    this.stopPolling();
    this._pollTimer = setInterval(() => this.refreshRoom(), 15_000);
  },

  stopPolling() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
  },

  /* ── Leave ───────────────────────────────────────────────── */

  leave() {
    this.stopPolling();
    this._hideDisconnectModal();
    LobbyState.clear();
    Screen.show('screen-landing');
  },

  /* ── Helpers ─────────────────────────────────────────────── */

  copyLink() {
    const inp = document.getElementById('lobby-room-link');
    if (!inp) return;
    navigator.clipboard.writeText(inp.value).catch(() => {
      inp.select(); document.execCommand('copy');
    });
    const btn = document.getElementById('btn-copy-link');
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  },

  _showError(screenId, msg) {
    const el = document.getElementById(screenId + '-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 6000);
  },

  _setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.label || btn.textContent;
  },
};

/* =============================================================
   LOBBY RESULTS RENDERER
   Renders a read-only quest summary from a saved results object.
============================================================= */

function _lobbyScryfallLink(url) {
  const safe = safeUrl(Currency.queryize(url));
  if (!safe) return '';
  return `<a class="summary-scryfall-link" href="${safe}" target="_blank" rel="noopener noreferrer"><img src="assets/files/designs/scryfall_logo.png" alt=""> Search Scryfall</a>`;
}
function renderLobbyResults(username, results) {
  document.getElementById('lobby-results-title').textContent = `${username}'s Quest`;

  // Remove the history decklist row if present (history detail leftover)
  const decklistRow = document.getElementById('history-decklist-row');
  if (decklistRow) decklistRow.remove();

  const container = document.getElementById('lobby-results-summary');
  container.innerHTML = '';

  // Difficulty
  const diffRow = document.createElement('div');
  diffRow.className = 'summary-item';
  diffRow.style.animationDelay = '0s';
  diffRow.innerHTML = `
    <span class="summary-key">Difficulty</span>
    <span class="summary-value">${capitalize(results.difficulty || 'normal')}</span>
  `;
  container.appendChild(diffRow);

  // Budget
  const budgetBonus = results.budgetBonus || 0;
  const baseBudget  = results.budget - budgetBonus;
  const cur         = Currency.symbol();
  const budgetText  = results.budget === 0 ? 'No budget restriction' : `${results.budget}${cur} (including commander)`;
  const bonusTip    = budgetBonus > 0
    ? `<span class="summary-budget-tip">${baseBudget}${cur} + ${budgetBonus}${cur} from unused rerolls</span>`
    : '';
  const budgetRow = document.createElement('div');
  budgetRow.className = 'summary-item';
  budgetRow.style.animationDelay = '0.05s';
  budgetRow.innerHTML = `
    <span class="summary-key">Budget</span>
    <span class="summary-value">
      <span class="summary-budget-wrap">${budgetText}${bonusTip}</span>
    </span>
  `;
  container.appendChild(budgetRow);

  // Color identity
  const colorRow = document.createElement('div');
  colorRow.className = 'summary-item';
  colorRow.style.animationDelay = '0.1s';
  const colors = (results.color_ids || [])
    .map(id => CRITERIA.colors.find(c => c.id === id))
    .filter(Boolean);
  colorRow.innerHTML = `
    <span class="summary-key">Color Identity</span>
    <span class="summary-value">
      ${colors.length
        ? colors.map(c =>
            `<span class="result-color-pill ${c.id}">
               <img src="${c.img}" alt="${c.name}" class="pill-img"> ${c.name}
             </span>`).join('')
        : `<span class="summary-placeholder">${escHtml(results.color_combo) || '—'}</span>`
      }
    </span>
  `;
  container.appendChild(colorRow);

  // Commander (burden + optional curse + lore)
  const cmdRow = document.createElement('div');
  cmdRow.className = 'summary-item summary-item--rotated-key';
  cmdRow.style.animationDelay = '0.15s';
  const burden      = results.burden;
  const extraBurden = results.extraBurden;
  const lore        = results.lore;
  cmdRow.innerHTML = `
    <span class="summary-key summary-key--rotated">Commander</span>
    <div class="summary-criteria-stack">
      ${burden
        ? `<div class="summary-criteria">
             <strong class="summary-criteria-title">${escHtml(burden.title)}</strong>
             <p class="summary-criteria-rule">${escHtml(burden.text)}</p>
             ${_lobbyScryfallLink(burden.scryfall_url)}
           </div>`
        : `<div class="summary-criteria"><span class="summary-placeholder">—</span></div>`}
      ${extraBurden
        ? `<div class="summary-criteria-divider"></div>
           <div class="summary-criteria summary-criteria--curse">
             <span class="summary-criteria-curse-label">💀 Curse of Greed</span>
             <strong class="summary-criteria-title">${escHtml(extraBurden.title)}</strong>
             <p class="summary-criteria-rule">${escHtml(extraBurden.text)}</p>
             ${_lobbyScryfallLink(extraBurden.scryfall_url)}
           </div>`
        : ''}
      <div class="summary-criteria-divider"></div>
      ${lore
        ? `<div class="summary-criteria">
             <strong class="summary-criteria-title">${escHtml(lore.title)}</strong>
             <p class="summary-criteria-rule">${escHtml(lore.text)}</p>
             ${_lobbyScryfallLink(lore.scryfall_url)}
           </div>`
        : `<div class="summary-criteria"><span class="summary-placeholder">—</span></div>`}
    </div>
  `;
  container.appendChild(cmdRow);

  // Deck events
  const deckRow = document.createElement('div');
  deckRow.className = 'summary-item summary-item--rotated-key';
  deckRow.style.animationDelay = '0.2s';
  const events    = results.events || [];
  const greedBase = events.length - (results.greedPenalty || 0);
  deckRow.innerHTML = `
    <span class="summary-key summary-key--rotated">Deck</span>
    <div class="summary-criteria-stack">
      ${events.length
        ? events.map((e, i) => {
            const fromGreed = i >= greedBase;
            return `
              ${i > 0 ? '<div class="summary-criteria-divider"></div>' : ''}
              <div class="summary-criteria${fromGreed ? ' summary-criteria--curse' : ''}">
                ${fromGreed ? '<span class="summary-criteria-curse-label">💀 Path of Greed</span>' : ''}
                <strong class="summary-criteria-title">${escHtml(e.title)}</strong>
                <p class="summary-criteria-rule">${escHtml(e.text)}</p>
                ${_lobbyScryfallLink(e.scryfall_url)}
              </div>`;
          }).join('')
        : `<div class="summary-criteria"><span class="summary-placeholder">—</span></div>`}
    </div>
  `;
  container.appendChild(deckRow);

  // Decklist (read-only) — only when the results carry a valid URL
  const decklistSafe = safeUrl(results.decklistUrl);
  if (decklistSafe) {
    const decklistRow = document.createElement('div');
    decklistRow.className = 'summary-item';
    decklistRow.style.animationDelay = '0.25s';
    decklistRow.innerHTML = `
      <span class="summary-key">Decklist</span>
      <span class="summary-value summary-value--decklist">
        <a class="history-decklist-link" href="${decklistSafe}" target="_blank" rel="noopener noreferrer">
          <span class="history-decklist-url">${escHtml(results.decklistUrl)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </span>
    `;
    container.appendChild(decklistRow);
  }
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* =============================================================
   LOBBIES DASHBOARD LIST
============================================================= */
function renderLobbiesList(container) {
  const entries = LobbyList.load();

  if (!entries.length) {
    container.innerHTML = '<p class="dashboard-empty">Lobbies you create or join will appear here.</p>';
    return;
  }

  container.innerHTML = entries.map((entry) => {
    const d    = new Date(entry.joined_at);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const diff = entry.difficulty || 'normal';
    const role = entry.role === 'creator' ? 'Creator' : 'Member';

    const isCreator = entry.role === 'creator';
    const confirmMsg = isCreator ? 'Delete lobby for everyone?' : 'Remove from your list?';

    return `
      <div class="lobbies-row" data-code="${escHtml(entry.code)}" data-token="${escHtml(entry.token)}">
        <div class="lobbies-row-main">
          <span class="lobbies-row-name">${escHtml(entry.name)}</span>
          <span class="lobbies-row-date">${date}</span>
          <span class="lobbies-row-badges">
            <span class="history-badge lobbies-badge--players" data-code="${entry.code}">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span class="lobbies-badge-count">…</span>
            </span>
            <span class="history-badge lobbies-badge--role">${role}</span>
            <span class="history-badge history-badge--diff history-badge--diff-${diff}">${capitalize(diff)}</span>
          </span>
        </div>
        <span class="lobbies-row-delete" data-code="${entry.code}" data-token="${entry.token}" data-role="${entry.role}" title="Remove">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </span>
        <span class="lobbies-row-delete-confirm hidden" data-code="${entry.code}" data-token="${entry.token}" data-role="${entry.role}">
          ${confirmMsg} <button class="hist-del-yes">Yes</button><button class="hist-del-no">No</button>
        </span>
      </div>
    `;
  }).join('');

  entries.forEach(entry => {
    LobbyAPI.get(entry.code, entry.token).then(data => {
      const count = (data.players || []).length;
      const el = container.querySelector(`.lobbies-badge--players[data-code="${entry.code}"] .lobbies-badge-count`);
      if (el) el.textContent = count;
    }).catch(() => {
      const el = container.querySelector(`.lobbies-badge--players[data-code="${entry.code}"] .lobbies-badge-count`);
      if (el) el.textContent = '—';
    });
  });

  container.querySelectorAll('.lobbies-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.lobbies-row-delete')) return;
      if (e.target.closest('.lobbies-row-delete-confirm')) return;
      LobbyFlow.returnToLobby(row.dataset.code, row.dataset.token);
    });
  });

  container.querySelectorAll('.lobbies-row-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row     = btn.closest('.lobbies-row');
      const confirm = row.querySelector('.lobbies-row-delete-confirm');
      btn.classList.add('hidden');
      confirm.classList.remove('hidden');
    });
  });

  container.querySelectorAll('.lobbies-row-delete-confirm').forEach(confirm => {
    confirm.querySelector('.hist-del-no').addEventListener('click', (e) => {
      e.stopPropagation();
      const row = confirm.closest('.lobbies-row');
      confirm.classList.add('hidden');
      row.querySelector('.lobbies-row-delete').classList.remove('hidden');
    });

    confirm.querySelector('.hist-del-yes').addEventListener('click', async (e) => {
      e.stopPropagation();
      const { code, token, role } = confirm.dataset;
      if (role === 'creator') {
        try { await LobbyAPI.delete(code, token); } catch (_) { /* lobby may already be gone */ }
      }
      LobbyList.remove(code);
      renderLobbiesList(container);
    });
  });
}


/* Show/hide a sibling .caps-lock-hint based on CapsLock state. */
function _attachCapsLockHint(inp) {
  const hint = inp.nextElementSibling;
  if (!hint || !hint.classList.contains('caps-lock-hint')) return;
  inp.addEventListener('keydown', e => {
    hint.classList.toggle('hidden', !e.getModifierState('CapsLock'));
  });
  inp.addEventListener('blur', () => hint.classList.add('hidden'));
}

/* Client-side mirror of api/lobby.php isValidUsername(). */
function isValidUsername(u) {
  return /^[A-Za-z0-9_\- ]{2,30}$/.test(u);
}

/* =============================================================
   CREATE LOBBY FORM SETUP
============================================================= */
function initLobbyCreateForm() {
  const BUDGET_STEPS = [
    25, 50, 75, 100, 125, 150, 175, 200,
    250, 300, 350, 400,
    500, 600, 700, 800, 900, 1000,
    0,
  ];

  const customPanel = document.getElementById('lobby-custom-panel');

  document.querySelectorAll('[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('lobby-diff-btn--selected'));
      btn.classList.add('lobby-diff-btn--selected');
      document.getElementById('create-difficulty').value = btn.dataset.diff;
      customPanel.classList.toggle('hidden', btn.dataset.diff !== 'custom');
    });
  });

  const budgetSlider  = document.getElementById('lobby-custom-budget-slider');
  const budgetDisplay = document.getElementById('lobby-custom-budget-display');
  budgetSlider.addEventListener('input', () => {
    const val = BUDGET_STEPS[budgetSlider.value];
    budgetDisplay.textContent = val === 0 ? 'No budget restriction' : val + Currency.symbol();
  });

  const rerollsSlider  = document.getElementById('lobby-custom-rerolls-slider');
  const rerollsDisplay = document.getElementById('lobby-custom-rerolls-display');
  rerollsSlider.addEventListener('input', () => {
    rerollsDisplay.textContent = rerollsSlider.value;
  });

  const eventsSlider  = document.getElementById('lobby-custom-events-slider');
  const eventsDisplay = document.getElementById('lobby-custom-events-display');
  eventsSlider.addEventListener('input', () => {
    eventsDisplay.textContent = eventsSlider.value;
  });

  document.querySelectorAll('.lobby-custom-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      document.querySelectorAll(`.lobby-custom-toggle[data-group="${group}"]`).forEach(b => {
        b.classList.remove('lobby-custom-toggle--active');
      });
      btn.classList.add('lobby-custom-toggle--active');
    });
  });

  document.querySelectorAll('[data-visibility]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-visibility]').forEach(b => b.classList.remove('lobby-diff-btn--selected'));
      btn.classList.add('lobby-diff-btn--selected');
      document.getElementById('create-results-visibility').value = btn.dataset.visibility;
    });
  });

  const rulesInput  = document.getElementById('rules-text-input');
  const rulesHidden = document.getElementById('create-rules');
  const rulesChips  = document.getElementById('rules-chip-list');
  const addRuleBtn  = document.getElementById('btn-add-rule');
  let   rules       = [];

  function renderChips() {
    rulesChips.innerHTML = '';
    rules.forEach((rule, i) => {
      const chip = document.createElement('span');
      chip.className = 'rules-chip';
      chip.textContent = rule;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'rules-chip-remove';
      removeBtn.setAttribute('aria-label', 'Remove');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        rules.splice(i, 1);
        rulesHidden.value = JSON.stringify(rules);
        renderChips();
      });
      chip.appendChild(removeBtn);
      rulesChips.appendChild(chip);
    });
  }

  function addRule() {
    const val = rulesInput.value.trim();
    if (!val || rules.length >= 20) return;
    rules.push(val);
    rulesHidden.value = JSON.stringify(rules);
    rulesInput.value = '';
    renderChips();
  }

  addRuleBtn.addEventListener('click', addRule);
  rulesInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addRule(); } });

  document.getElementById('form-lobby-create').addEventListener('submit', e => {
    e.preventDefault();
    const name              = document.getElementById('create-lobby-name').value.trim();
    const username          = document.getElementById('create-username').value.trim();
    const difficulty        = document.getElementById('create-difficulty').value;
    const notes             = document.getElementById('create-notes').value.trim();
    const resultsVisibility = document.getElementById('create-results-visibility').value;

    if (!name)     { LobbyFlow._showError('screen-lobby-create', 'Please enter a lobby name.'); return; }
    if (!username) { LobbyFlow._showError('screen-lobby-create', 'Please enter your name.'); return; }
    if (!isValidUsername(username)) {
      LobbyFlow._showError('screen-lobby-create', 'Name must be 2–30 characters (letters, numbers, spaces, hyphens, underscores).');
      return;
    }

    let customSettings = null;
    if (difficulty === 'custom') {
      const curseBtn  = document.querySelector('.lobby-custom-toggle--active[data-group="curse"]');
      const rewardBtn = document.querySelector('.lobby-custom-toggle--active[data-group="reward"]');
      customSettings = {
        budget:         BUDGET_STEPS[parseInt(budgetSlider.value, 10)],
        rerolls:        parseInt(rerollsSlider.value, 10),
        curse_level:    curseBtn  ? curseBtn.dataset.value  : 'normal',
        reward_level:   rewardBtn ? rewardBtn.dataset.value : 'normal',
        crossing_count: parseInt(eventsSlider.value, 10),
      };
    }

    LobbyFlow.create(name, difficulty, customSettings, rules, notes, username, resultsVisibility);
  });
}

/* =============================================================
   JOIN LOBBY FORM SETUP
   Invite-link-only: the lobby code lives in LobbyFlow._joinCode
   (set by showJoin from the ?lobby=CODE URL param).
============================================================= */
function initLobbyJoinForm() {
  // ── Join as new player ─────────────────────────────────
  document.getElementById('form-lobby-join')?.addEventListener('submit', e => {
    e.preventDefault();
    const code     = LobbyFlow._joinCode || '';
    const username = document.getElementById('join-username-input').value.trim();
    if (code.length !== 6) { LobbyFlow._showError('screen-lobby-join', 'Invalid invite link.'); return; }
    if (!username)         { LobbyFlow._showError('screen-lobby-join', 'Please enter your name.'); return; }
    if (!isValidUsername(username)) {
      LobbyFlow._showError('screen-lobby-join', 'Name must be 2–30 characters (letters, numbers, spaces, hyphens, underscores).');
      return;
    }
    // Client-side collision check (server is still authoritative)
    if (LobbyFlow._joinExistingNames.includes(username.toLowerCase())) {
      LobbyFlow._showError('screen-lobby-join', 'That name is already taken in this lobby. Pick a different one, or use Rejoin if it was you.');
      return;
    }
    LobbyFlow.join(code, username);
  });

  // ── Rejoin with PIN ────────────────────────────────────
  const rejoinPinInp = document.getElementById('rejoin-pin-input');
  if (rejoinPinInp) {
    rejoinPinInp.addEventListener('input', () => {
      rejoinPinInp.value = rejoinPinInp.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  document.getElementById('form-lobby-rejoin')?.addEventListener('submit', e => {
    e.preventDefault();
    const code = LobbyFlow._joinCode || '';
    const pin  = rejoinPinInp ? rejoinPinInp.value.trim() : '';
    if (code.length !== 6)    { LobbyFlow._showError('screen-lobby-join', 'Invalid invite link.'); return; }
    if (!/^\d{4}$/.test(pin)) { LobbyFlow._showError('screen-lobby-join', 'PIN must be 4 digits.'); return; }
    LobbyFlow.rejoin(code, pin);
  });
}
