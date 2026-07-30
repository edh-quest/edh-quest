/**
 * main.js — Application Entry Point
 *
 * This file wires everything together:
 *   1. Defines STEPS (the ordered quest step list) and
 *      PROGRESS_GROUPS (the top-bar navigation hierarchy).
 *   2. Loads CSV data from the server.
 *   3. Binds all button click handlers.
 *   4. Shows the landing screen.
 *
 * It must be loaded last so all other modules are in scope.
 *
 * To add a new step: append an entry to STEPS, create a matching
 * div in index.php, and write an activateStepN() function in a
 * new step-*.js file.
 *
 * Dependencies: all other modules
 */

'use strict';

/* =============================================================
   STEP REGISTRY
   Maps each step to its HTML element id and activation function.
   Order here determines the quest progression order.
============================================================= */
const STEPS = [
  { id: 'step-difficulty', activate: activateStepDifficulty },
  { id: 'step-1',          activate: activateStep1 },
  { id: 'step-2',          activate: activateStep2 },
  { id: 'step-3',          activate: activateStep3 },
  { id: 'step-4',          activate: activateStep4 },
];

/* =============================================================
   PROGRESS BAR GROUPS
   Maps the top-bar labels to the step indices they cover.
   steps: [] means the label is never auto-activated by QuestFlow.
============================================================= */
const PROGRESS_GROUPS = [
  { id: 'pg-colors',    label: 'Colors',    steps: [1],    dotCount: 1 },
  { id: 'pg-commander', label: 'Commander', steps: [2, 3], dotCount: 1 },
  { id: 'pg-deck',      label: 'Deck',      steps: [4],    dotCount: 1 },
  { id: 'pg-overview',  label: 'Overview',  steps: [],     dotCount: 0 },
];

/* =============================================================
   INITIALISATION
============================================================= */
document.addEventListener('DOMContentLoaded', async () => {

  // Load CSV data (in parallel) and initialise wheel segments.
  // Auto-restore paths further down MUST await this — otherwise activateStep2/3/4
  // sees an empty CRITERIA pool and silently renders no cards.
  // Exposed on window so ResumeFlow.resume() (banner click) can await it too.
  window.__dataReady = Promise.all([loadCriteria(), loadLore(), loadEvents()]);
  initWheelSegments();

  // Set up lobby form interactivity
  initLobbyCreateForm();
  initLobbyJoinForm();

  // ── Solo quest ───────────────────────────────────────────
  document.getElementById('btn-embark')
    .addEventListener('click', () => QuestFlow.begin());

  // ── Quest header navigation ──────────────────────────────
  const retreatModal   = document.getElementById('retreat-modal');
  const retreatCancel  = document.getElementById('btn-retreat-cancel');
  const retreatConfirm = document.getElementById('btn-retreat-confirm');

  function doRetreat() {
    retreatModal.hidden = true;
    WheelState.isSpinning = false;
    RerollState.clear();
    QuestSave.clear();
    if (QuestFlow.lobbyMode) {
      LobbyFlow.enterRoom();
    } else {
      Screen.show('screen-landing');
    }
  }

  document.getElementById('btn-back')
    .addEventListener('click', () => { retreatModal.hidden = false; retreatConfirm.focus(); });

  retreatCancel .addEventListener('click', () => { retreatModal.hidden = true; });
  retreatConfirm.addEventListener('click', doRetreat);

  retreatModal.addEventListener('keydown', e => {
    if (e.key === 'Escape') retreatModal.hidden = true;
  });

  document.getElementById('btn-nav-prev')
    .addEventListener('click', () => QuestFlow.navigateTo(QuestFlow.viewingStepIndex - 1));

  document.getElementById('btn-nav-next')
    .addEventListener('click', () => QuestFlow.navigateTo(QuestFlow.viewingStepIndex + 1));

  // ── Complete screen ──────────────────────────────────────
  document.getElementById('btn-new-quest')
    .addEventListener('click', () => {
      QuestSave.clear();
      QuestState.reset();
      Screen.show('screen-landing');
    });

  document.getElementById('btn-return-to-lobby')
    .addEventListener('click', () => LobbyFlow.enterRoom());

  GreedSystem.init();
  Dashboard.init();

  document.getElementById('btn-open-dashboard')
    ?.addEventListener('click', () => Dashboard.open('history'));

  // ── Resume flow (banner + overlay) ───────────────────────
  document.getElementById('resume-banner-btn')
    ?.addEventListener('click', () => ResumeFlow.show());
  document.getElementById('resume-banner-dismiss')
    ?.addEventListener('click', () => ResumeFlow.dismiss());
  document.getElementById('btn-resume-continue')
    ?.addEventListener('click', () => ResumeFlow.resume());
  document.getElementById('btn-resume-start-fresh')
    ?.addEventListener('click', () => ResumeFlow.startFresh());

  // ── Lobby: PIN reveal dismiss ────────────────────────────
  document.getElementById('btn-lobby-pin-dismiss')
    ?.addEventListener('click', () => LobbyFlow.dismissPinReveal());

  // ── Step "Continue" buttons ──────────────────────────────
  document.getElementById('btn-next-step')
    ?.addEventListener('click', () => QuestFlow.advance());

  document.getElementById('btn-step4-events-next')
    ?.addEventListener('click', () => { finalizeLastCrossing(); QuestFlow.advance(); });

  // Step 3 Continue grants any pending lore bonus rerolls, then opens the Path of Greed review
  document.getElementById('btn-step3-next')
    ?.addEventListener('click', () => {
      if (QuestState.pendingLoreBonus > 0) {
        RerollState.remaining += QuestState.pendingLoreBonus;
        RerollState.updateCounter();
        QuestState.pendingLoreBonus = 0;
      }
      GreedSystem.show();
    });

  // Step 2 Continue is intercepted by the fate event system
  document.getElementById('btn-step2-next')
    ?.addEventListener('click', () => FateSystem.handleStep2Continue());

  // ── Lobby: landing buttons ──────────────────────────────
  document.getElementById('btn-create-lobby')
    .addEventListener('click', () => LobbyFlow.showCreate());

  // ── Lobby: back buttons ──────────────────────────────────
  ['btn-create-back', 'btn-join-back'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => Screen.show('screen-landing'));
  });

  // ── Lobby: already-in-lobby overlay ─────────────────────────
  document.getElementById('btn-already-return')
    ?.addEventListener('click', () => {
      document.getElementById('join-already-in-lobby').classList.add('hidden');
      LobbyFlow.enterRoom();
    });

  document.getElementById('btn-already-join-new')
    ?.addEventListener('click', () => {
      document.getElementById('join-already-in-lobby').classList.add('hidden');
    });

  // ── Lobby: start quest confirmation overlay ──────────────
  document.getElementById('btn-confirm-start')
    .addEventListener('click', () => {
      document.getElementById('lobby-start-confirm').classList.add('hidden');
      LobbyFlow._doStart();
    });

  document.getElementById('btn-cancel-start')
    .addEventListener('click', () => LobbyFlow._cancelStart());

  document.getElementById('btn-lobby-leave')
    .addEventListener('click', () => LobbyFlow.leave());

  // ── Lobby: disconnect modal buttons ──────────────────────
  document.getElementById('btn-lobby-retry')
    ?.addEventListener('click', () => {
      LobbyFlow._hideDisconnectModal();
      LobbyFlow._pollFailCount = 0;
      LobbyFlow.refreshRoom();
      LobbyFlow.startPolling();
    });

  document.getElementById('btn-lobby-disconnect-leave')
    ?.addEventListener('click', () => {
      LobbyFlow._hideDisconnectModal();
      LobbyFlow.leave();
    });

  document.getElementById('btn-results-back-to-lobby')
    .addEventListener('click', () => {
      const btn = document.getElementById('btn-results-back-to-lobby');
      if (btn.dataset.fromHistory) {
        btn.dataset.fromHistory = '';
        btn.textContent = '← Back to Lobby';
        history.replaceState(null, '', location.pathname);
        Dashboard.open('history');
      } else if (btn.dataset.fromShared) {
        btn.dataset.fromShared = '';
        btn.textContent = '← Back to Lobby';
        history.replaceState(null, '', location.pathname);
        Screen.show('screen-landing');
      } else {
        LobbyFlow.enterRoom();
      }
    });

  // ── Lobby: copy link ─────────────────────────────────────
  document.getElementById('btn-copy-link')
    .addEventListener('click', () => LobbyFlow.copyLink());

  // Wait for CSV data before auto-restore paths — a mid-quest resume into
  // Step 2/3/4 needs CRITERIA populated or it silently renders no cards.
  await window.__dataReady;

  // ── URL param: ?quest=<id> → load a saved quest from the server ──
  const questIdParam = new URLSearchParams(location.search).get('quest');
  if (questIdParam) {
    Screen.show('screen-landing');
    fetch(`api/quest.php?action=get&id=${encodeURIComponent(questIdParam)}`)
      .then(r => r.json())
      .then(json => {
        if (!json.ok) throw new Error('Not found');
        const results = json.data.results;
        renderLobbyResults('Quest', results);
        document.getElementById('lobby-results-title').textContent = 'Quest Results';
        const backBtn = document.getElementById('btn-results-back-to-lobby');
        backBtn.textContent        = '← Back to Home';
        backBtn.dataset.fromShared = '1';
        setQuestShareLink(document.getElementById('btn-copy-quest-link-results'), questIdParam);
        Screen.show('screen-lobby-results');
      })
      .catch(() => {
        history.replaceState(null, '', location.pathname);
        Screen.show('screen-landing');
        ResumeFlow.check();
      });
    return;
  }

  // ── URL param: ?lobby=CODE → auto-open join screen ──────
  const urlCode = new URLSearchParams(location.search).get('lobby');
  if (urlCode) {
    history.replaceState(null, '', location.pathname);
    LobbyFlow.showJoin(urlCode);
    return;
  }

  // ── Restore active lobby session from localStorage ───────
  if (LobbyState.load()) {
    // If a mid-quest save matches this lobby, resume it instead of showing the room
    const savedQuest = QuestSave.load();
    if (savedQuest && savedQuest.mode === 'lobby' && savedQuest.lobbyCode === LobbyState.code) {
      ResumeFlow.resume();
      return;
    }
    LobbyFlow.enterRoom();
    return;
  }

  // Default: show landing, then check for a resumable quest
  Screen.show('screen-landing');
  ResumeFlow.check();
});
