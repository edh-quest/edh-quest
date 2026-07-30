/**
 * dashboard.js — History / Lobbies / Settings panel
 *
 * Opened from the landing screen. All data is browser-local
 * (localStorage) — lobbies also fetch live player counts from the
 * server so the badge is accurate.
 *
 * Dependencies: ui.js (Screen), currency.js, history.js, lobby.js
 */

'use strict';

const Dashboard = {

  open(tab = 'history') {
    this._syncCurrencyButtons();
    this._showTab(tab);
    Screen.show('screen-dashboard');
  },

  _syncCurrencyButtons() {
    const current = Currency.get();
    document.querySelectorAll('#settings-currency-toggle .settings-currency-btn').forEach(btn => {
      btn.classList.toggle('settings-currency-btn--active', btn.dataset.currency === current);
    });
  },

  _showTab(name) {
    document.querySelectorAll('.dashboard-tab').forEach(btn => {
      btn.classList.toggle('dashboard-tab--active', btn.dataset.tab === name);
    });
    document.querySelectorAll('.dashboard-panel').forEach(panel => {
      panel.classList.add('hidden');
    });
    const active = document.getElementById('dashboard-panel-' + name);
    if (active) active.classList.remove('hidden');

    if (name === 'history') {
      const list = document.getElementById('history-list');
      if (list) renderHistoryList(list);
    }
    if (name === 'lobbies') {
      const list = document.getElementById('lobbies-list');
      if (list) renderLobbiesList(list);
    }
  },

  init() {
    document.querySelectorAll('.dashboard-tab').forEach(btn => {
      btn.addEventListener('click', () => this._showTab(btn.dataset.tab));
    });

    document.getElementById('btn-dashboard-back')
      ?.addEventListener('click', () => Screen.show('screen-landing'));

    document.querySelectorAll('#settings-currency-toggle .settings-currency-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Currency.set(btn.dataset.currency);
        this._syncCurrencyButtons();
        const historyList = document.getElementById('history-list');
        if (historyList && !document.getElementById('dashboard-panel-history').classList.contains('hidden')) {
          renderHistoryList(historyList);
        }
        const lobbiesList = document.getElementById('lobbies-list');
        if (lobbiesList && !document.getElementById('dashboard-panel-lobbies').classList.contains('hidden')) {
          renderLobbiesList(lobbiesList);
        }
      });
    });
  },
};
