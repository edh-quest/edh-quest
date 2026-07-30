/**
 * history.js — Quest History (browser-local)
 *
 * The list of past quests is stored in localStorage. Each entry carries
 * a server-side questId so the full results are also retrievable via
 * ?quest=<id> from any browser until they expire (120 days).
 *
 * Dependencies: config.js (CRITERIA, COLOR_ORDER)
 */

'use strict';

const MAX_HISTORY   = 100;
const HISTORY_KEY   = 'mtgq_history';

const HistoryStore = {

  load() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch { return []; }
  },

  save(results, mode, questId) {
    const entry = {
      id:      Date.now(),
      questId: questId || null,
      date:    new Date().toISOString(),
      mode:    mode || 'solo',
      name:    '',
      results,
    };
    const entries = this.load();
    entries.unshift(entry);
    if (entries.length > MAX_HISTORY) entries.length = MAX_HISTORY;
    safeLocalStorageSet(HISTORY_KEY, JSON.stringify(entries));
    return entry;
  },

  updateName(id, name) {
    const entries = this.load();
    const entry   = entries.find(e => e.id === id);
    if (!entry) return;
    entry.name = name.trim();
    safeLocalStorageSet(HISTORY_KEY, JSON.stringify(entries));
  },

  updateDecklistUrl(id, url) {
    const entries = this.load();
    const entry   = entries.find(e => e.id === id);
    if (!entry) return;
    entry.decklistUrl = (url || '').trim();
    safeLocalStorageSet(HISTORY_KEY, JSON.stringify(entries));
  },

  delete(id) {
    const entries = this.load().filter(e => e.id !== id);
    safeLocalStorageSet(HISTORY_KEY, JSON.stringify(entries));
  },
};

/* Toggle a "Copy Link" button to share a bookmarkable quest URL.
   Pass questId=null to hide the button (e.g. other players' results). */
function setQuestShareLink(btn, questId) {
  if (!btn) return;
  if (!questId) { btn.classList.add('hidden'); btn.onclick = null; return; }
  btn.classList.remove('hidden');
  btn.textContent = 'Copy Link';
  btn.onclick = () => _copyQuestLink(questId, btn);
}

function _copyQuestLink(questId, btn) {
  const url = `${location.origin}${location.pathname}?quest=${questId}`;
  const done = () => {
    const orig = 'Copy Link';
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => _fallbackCopy(url, done));
  } else {
    _fallbackCopy(url, done);
  }
}

function _fallbackCopy(text, done) {
  const inp = document.createElement('input');
  inp.value = text;
  document.body.appendChild(inp);
  inp.select();
  try { document.execCommand('copy'); } catch (_) {}
  inp.remove();
  done();
}

/* Fire-and-forget: POST quest results to the server, return the id. */
async function saveQuestToServer(results) {
  try {
    const fd = new FormData();
    fd.append('action',  'save');
    fd.append('results', JSON.stringify(results));
    const res  = await fetch('api/quest.php', { method: 'POST', body: fd });
    const json = await res.json();
    return json.ok ? json.id : null;
  } catch (_) {
    return null;
  }
}

/* =============================================================
   HISTORY LIST RENDERING
============================================================= */
function renderHistoryList(container) {
  const entries = HistoryStore.load();

  if (!entries.length) {
    container.innerHTML = '<p class="dashboard-empty">Your completed quests will appear here.</p>';
    return;
  }

  container.innerHTML = entries.map((entry, i) => {
    const d    = new Date(entry.date);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const diff = entry.results.difficulty || 'normal';
    const diffLabel = diff.charAt(0).toUpperCase() + diff.slice(1);
    const mode = entry.mode === 'lobby' ? 'Lobby' : 'Solo';
    const name = entry.name || '';

    const colorImgs = (entry.results.color_ids || [])
      .map(id => {
        const c = CRITERIA.colors.find(x => x.id === id);
        return c ? `<img src="${c.img}" alt="${c.name}" class="hist-color-icon" title="${c.name}">` : '';
      }).join('');

    const nameSlot = name
      ? `<span class="history-row-name-text">${escHtml(name)}</span>`
      : `<input class="history-row-name" type="text" value=""
               placeholder="Name this quest…" maxlength="40" data-id="${entry.id}">`;

    return `
      <div class="history-row" data-index="${i}" data-id="${entry.id}">
        <div class="history-row-main">
          <span class="history-row-colors">${colorImgs || '<span class="history-row-colorless">Colorless</span>'}</span>
          <span class="history-row-date">${date}</span>
          ${nameSlot}
          <span class="history-row-badges">
            <span class="history-badge history-badge--mode">${mode}</span>
            <span class="history-badge history-badge--diff history-badge--diff-${diff}">${diffLabel}</span>
          </span>
        </div>
        <span class="history-row-delete" data-id="${entry.id}" title="Delete quest">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </span>
        <span class="history-row-delete-confirm hidden" data-id="${entry.id}">
          Delete? <button class="hist-del-yes">Yes</button><button class="hist-del-no">No</button>
        </span>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.history-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('.history-row-name')) return;
      if (e.target.closest('.history-row-delete')) return;
      if (e.target.closest('.history-row-delete-confirm')) return;
      const entry = entries[+row.dataset.index];
      openHistoryDetail(entry);
    });
  });

  container.querySelectorAll('.history-row-name').forEach(input => {
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    input.addEventListener('blur', () => {
      const newName = input.value.trim();
      HistoryStore.updateName(+input.dataset.id, newName);
      const entry = entries.find(e => e.id === +input.dataset.id);
      if (entry) entry.name = newName;
    });
  });

  container.querySelectorAll('.history-row-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row     = btn.closest('.history-row');
      const confirm = row.querySelector('.history-row-delete-confirm');
      btn.classList.add('hidden');
      confirm.classList.remove('hidden');
    });
  });

  container.querySelectorAll('.history-row-delete-confirm').forEach(confirm => {
    confirm.querySelector('.hist-del-yes').addEventListener('click', (e) => {
      e.stopPropagation();
      HistoryStore.delete(+confirm.dataset.id);
      renderHistoryList(container);
    });
    confirm.querySelector('.hist-del-no').addEventListener('click', (e) => {
      e.stopPropagation();
      const row = confirm.closest('.history-row');
      confirm.classList.add('hidden');
      row.querySelector('.history-row-delete').classList.remove('hidden');
    });
  });
}

/* =============================================================
   DETAIL OVERLAY
============================================================= */
function openHistoryDetail(entry) {
  const d    = new Date(entry.date);
  const date = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const titleEl = document.getElementById('lobby-results-title');
  titleEl.textContent = entry.name || date;

  let subtitleEl = document.getElementById('history-results-subtitle');
  if (!subtitleEl) {
    subtitleEl = document.createElement('p');
    subtitleEl.id        = 'history-results-subtitle';
    subtitleEl.className = 'complete-subtitle';
    titleEl.insertAdjacentElement('afterend', subtitleEl);
  }
  subtitleEl.textContent = entry.name ? date : '';

  renderLobbyResults('__history__', entry.results);
  // renderLobbyResults sets the title to "__history__'s Quest" — fix it back
  titleEl.textContent = entry.name || date;

  const backBtn = document.getElementById('btn-results-back-to-lobby');
  backBtn.textContent         = '← Back to History';
  backBtn.dataset.fromHistory = '1';

  setQuestShareLink(document.getElementById('btn-copy-quest-link-results'), entry.questId);

  _appendDecklistRow(entry);

  // Publish the quest id in the URL so this view is bookmarkable
  if (entry.questId) {
    history.replaceState(null, '', location.pathname + '?quest=' + entry.questId);
  }

  Screen.show('screen-lobby-results');
  window.scrollTo(0, 0);
}

/* =============================================================
   DECKLIST SUMMARY ROW (history detail only)
============================================================= */
function _appendDecklistRow(entry) {
  const summaryEl = document.getElementById('lobby-results-summary');
  if (!summaryEl) return;

  const row = document.createElement('div');
  row.id = 'history-decklist-row';
  row.className = 'summary-item';
  row.style.animationDelay = '0.25s';
  summaryEl.appendChild(row);

  _renderDecklistRowContent(row, entry);
}

function _renderDecklistRowContent(row, entry) {
  const safe = safeUrl(entry.decklistUrl);

  if (safe) {
    row.innerHTML = `
      <span class="summary-key">Decklist</span>
      <span class="summary-value summary-value--decklist">
        <a class="history-decklist-link" href="${safe}" target="_blank" rel="noopener noreferrer">
          <span class="history-decklist-url">${escHtml(entry.decklistUrl)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
        <button type="button" class="history-decklist-edit-btn" title="Edit link">Edit</button>
      </span>
    `;
    row.querySelector('.history-decklist-edit-btn').addEventListener('click', () => {
      _renderDecklistRowEditor(row, entry);
    });
  } else {
    row.innerHTML = `
      <span class="summary-key">Decklist</span>
      <span class="summary-value">
        <button type="button" class="history-decklist-add-link">+ Add link</button>
      </span>
    `;
    row.querySelector('.history-decklist-add-link').addEventListener('click', () => {
      _renderDecklistRowEditor(row, entry);
    });
  }
}

function _renderDecklistRowEditor(row, entry) {
  const current = entry.decklistUrl || '';
  row.innerHTML = `
    <span class="summary-key">Decklist</span>
    <span class="summary-value summary-value--decklist-edit">
      <input type="url" class="history-decklist-input"
             placeholder="https://moxfield.com/decks/..."
             value="${escHtml(current)}" maxlength="500">
      <button type="button" class="history-decklist-save" title="Save">✓</button>
      <button type="button" class="history-decklist-cancel" title="Cancel">✕</button>
      ${current ? '<button type="button" class="history-decklist-remove" title="Remove link">Remove</button>' : ''}
    </span>
  `;

  const input = row.querySelector('.history-decklist-input');
  input.focus();
  input.select();

  const save = () => {
    const value = input.value.trim();
    if (value && !safeUrl(value)) {
      input.classList.add('history-decklist-input--error');
      return;
    }
    HistoryStore.updateDecklistUrl(entry.id, value);
    entry.decklistUrl = value;
    _renderDecklistRowContent(row, entry);
  };

  row.querySelector('.history-decklist-save').addEventListener('click', save);
  row.querySelector('.history-decklist-cancel').addEventListener('click', () => {
    _renderDecklistRowContent(row, entry);
  });

  const removeBtn = row.querySelector('.history-decklist-remove');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      HistoryStore.updateDecklistUrl(entry.id, '');
      entry.decklistUrl = '';
      _renderDecklistRowContent(row, entry);
    });
  }

  input.addEventListener('input', () => input.classList.remove('history-decklist-input--error'));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  save();
    if (e.key === 'Escape') _renderDecklistRowContent(row, entry);
  });
}
