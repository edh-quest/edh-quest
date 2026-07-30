<!-- ============================================================
     SCREEN: User Dashboard
     Three tabs: History, Lobbies, Settings
     Shown when the user clicks their username on the landing screen.
============================================================ -->
<div id="screen-dashboard" class="screen">
  <div class="dashboard-wrap">

    <div class="dashboard-header">
      <button id="btn-dashboard-back" class="btn-ghost dashboard-back">← Back</button>
      <h2 class="dashboard-title">History &amp; Lobbies</h2>
    </div>

    <div class="dashboard-tabs" role="tablist">
      <button class="dashboard-tab dashboard-tab--active" data-tab="history"  role="tab">History</button>
      <button class="dashboard-tab"                       data-tab="lobbies"  role="tab">Lobbies</button>
      <button class="dashboard-tab"                       data-tab="settings" role="tab">Settings</button>
    </div>

    <!-- History -->
    <div id="dashboard-panel-history" class="dashboard-panel" role="tabpanel">
      <div id="history-list" class="history-list"></div>
    </div>

    <!-- Lobbies -->
    <div id="dashboard-panel-lobbies" class="dashboard-panel hidden" role="tabpanel">
      <div id="lobbies-list" class="lobbies-list"></div>
    </div>

    <!-- Settings -->
    <div id="dashboard-panel-settings" class="dashboard-panel hidden" role="tabpanel">
      <div class="settings-section">
        <p class="settings-section-title">Preferences</p>
        <div class="settings-row">
          <p class="settings-value">Currency</p>
          <div class="settings-currency-toggle" id="settings-currency-toggle">
            <button type="button" class="settings-currency-btn" data-currency="EUR">€ EUR</button>
            <button type="button" class="settings-currency-btn" data-currency="USD">$ USD</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
