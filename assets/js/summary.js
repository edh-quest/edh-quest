/**
 * summary.js — Quest Complete Summary
 *
 * Renders the final summary card on the completion screen.
 * Reads from QuestState — call this only after QuestFlow.complete().
 *
 * Dependencies: config.js (getColorComboName), state.js (QuestState),
 *               utils.js (deduplicateColors)
 */

'use strict';

function _summaryScryfall(urlOrObj) {
  if (!urlOrObj || (typeof urlOrObj === 'object' && urlOrObj.disabled)) return '';
  const href = safeUrl(Currency.queryize(urlOrObj));
  if (!href) return '';
  return `<a class="summary-scryfall-link" href="${href}" target="_blank" rel="noopener noreferrer"><img src="assets/files/designs/scryfall_logo.png" alt=""> Search Scryfall</a>`;
}

/** Serialize the current QuestState into a storable results object. */
function exportQuestResults() {
  const unique = deduplicateColors(QuestState.selectedColors);

  const loreUrl = QuestState.flavorCriteria ? _buildLoreScryfallUrl(QuestState.flavorCriteria) : null;

  return {
    difficulty:  QuestState.difficulty,
    color_ids:   unique.map(c => c.id),
    color_combo: getColorComboName(unique.map(c => c.id)),
    burden: QuestState.commanderStat ? {
      title:       QuestState.commanderStat.title,
      text:        QuestState.commanderStat.text,
      scryfall_url: _buildScryfallUrl(QuestState.commanderStat.scryfall_link) || null,
    } : null,
    extraBurden: QuestState.extraBurden ? {
      title:       QuestState.extraBurden.title,
      text:        QuestState.extraBurden.text,
      scryfall_url: _buildScryfallUrl(QuestState.extraBurden.scryfall_link) || null,
    } : null,
    lore: QuestState.flavorCriteria ? {
      title:       QuestState.flavorCriteria.title,
      text:        QuestState.flavorCriteria.text,
      scryfall_url: (!loreUrl || loreUrl.disabled) ? null : loreUrl,
    } : null,
    events: (QuestState.chosenEvents || []).map(e => {
      const r = _buildEventScryfallUrl(e);
      return { title: e.title, text: e.text, scryfall_url: (!r || r.disabled) ? null : r };
    }),
    greedPenalty: QuestState.greedPenalty || 0,
    budget:       QuestState.budget      || 0,
    budgetBonus:  QuestState.budgetBonus || 0,
  };
}

function renderQuestSummary(container) {
  if (!container) container = document.getElementById('quest-summary');
  container.innerHTML = '';

  const unique = deduplicateColors(QuestState.selectedColors);

  // ── Difficulty ───────────────────────────────────────────────
  const diffRow = document.createElement('div');
  diffRow.className = 'summary-item';
  diffRow.style.animationDelay = '0s';
  const diffLabel = QuestState.difficulty.charAt(0).toUpperCase() + QuestState.difficulty.slice(1);
  diffRow.innerHTML = `
    <span class="summary-key">Difficulty</span>
    <span class="summary-value">${diffLabel}</span>
  `;
  container.appendChild(diffRow);

  // ── Budget ───────────────────────────────────────────────────
  const budgetRow = document.createElement('div');
  budgetRow.className = 'summary-item';
  budgetRow.style.animationDelay = '0.05s';
  const baseBudget = QuestState.budget - QuestState.budgetBonus;
  const cur = Currency.symbol();
  const bonusTip = QuestState.budgetBonus > 0
    ? `<span class="summary-budget-tip">${baseBudget}${cur} + ${QuestState.budgetBonus}${cur} from unused rerolls</span>`
    : '';
  const budgetText = QuestState.budget === 0
    ? 'No budget restriction'
    : `${QuestState.budget}${cur} (including commander)`;
  budgetRow.innerHTML = `
    <span class="summary-key">Budget</span>
    <span class="summary-value">
      <span class="summary-budget-wrap">
        ${budgetText}${bonusTip}
      </span>
    </span>
  `;
  container.appendChild(budgetRow);

  // ── Color Identity ───────────────────────────────────────────
  const colorRow = document.createElement('div');
  colorRow.className = 'summary-item';
  colorRow.style.animationDelay = '0.1s';
  colorRow.innerHTML = `
    <span class="summary-key">Color Identity</span>
    <span class="summary-value">
      ${unique.length > 0
        ? unique.map(c =>
            `<span class="result-color-pill ${c.id}">
               <img src="${c.img}" alt="${c.name}" class="pill-img"> ${c.name}
             </span>`
          ).join('')
        : '<span class="summary-placeholder">Not yet determined</span>'
      }
    </span>
  `;
  container.appendChild(colorRow);

  // ── Commander (burden + optional curse burden + lore) ────────
  const burden      = QuestState.commanderStat;
  const extraBurden = QuestState.extraBurden;
  const lore        = QuestState.flavorCriteria;

  const commanderRow = document.createElement('div');
  commanderRow.className = 'summary-item summary-item--rotated-key';
  commanderRow.style.animationDelay = '0.1s';
  commanderRow.innerHTML = `
    <span class="summary-key summary-key--rotated">Commander</span>
    <div class="summary-criteria-stack">
      ${burden
        ? `<div class="summary-criteria">
             <strong class="summary-criteria-title">${escHtml(burden.title)}</strong>
             <p class="summary-criteria-rule">${escHtml(burden.text)}</p>
             ${_summaryScryfall(_buildScryfallUrl(QuestState.commanderStat?.scryfall_link))}
           </div>`
        : `<div class="summary-criteria"><span class="summary-placeholder">Trial II not yet active</span></div>`
      }
      ${extraBurden
        ? `<div class="summary-criteria-divider"></div>
           <div class="summary-criteria summary-criteria--curse">
             <span class="summary-criteria-curse-label">💀 Curse of Greed</span>
             <strong class="summary-criteria-title">${escHtml(extraBurden.title)}</strong>
             <p class="summary-criteria-rule">${escHtml(extraBurden.text)}</p>
             ${_summaryScryfall(_buildScryfallUrl(QuestState.extraBurden?.scryfall_link))}
           </div>`
        : ''
      }
      <div class="summary-criteria-divider"></div>
      ${lore
        ? `<div class="summary-criteria">
             <strong class="summary-criteria-title">${escHtml(lore.title)}</strong>
             <p class="summary-criteria-rule">${escHtml(lore.text)}</p>
             ${_summaryScryfall(_buildLoreScryfallUrl(QuestState.flavorCriteria))}
           </div>`
        : `<div class="summary-criteria"><span class="summary-placeholder">Trial III not yet active</span></div>`
      }
    </div>
  `;
  container.appendChild(commanderRow);

  // ── Deck (chosen events) ─────────────────────────────────────
  const events    = QuestState.chosenEvents;
  const greedBase = events ? events.length - QuestState.greedPenalty : 0;

  const deckRow = document.createElement('div');
  deckRow.className = 'summary-item summary-item--rotated-key';
  deckRow.style.animationDelay = '0.2s';
  deckRow.innerHTML = `
    <span class="summary-key summary-key--rotated">Deck</span>
    <div class="summary-criteria-stack">
      ${events && events.length > 0
        ? events.map((e, i) => {
            const fromGreed = i >= greedBase;
            return `
              ${i > 0 ? '<div class="summary-criteria-divider"></div>' : ''}
              <div class="summary-criteria${fromGreed ? ' summary-criteria--curse' : ''}">
                ${fromGreed ? '<span class="summary-criteria-curse-label">💀 Path of Greed</span>' : ''}
                <strong class="summary-criteria-title">${escHtml(e.title)}</strong>
                <p class="summary-criteria-rule">${escHtml(e.text)}</p>
                ${_summaryScryfall(_buildEventScryfallUrl(e))}
              </div>
            `;
          }).join('')
        : `<div class="summary-criteria"><span class="summary-placeholder">Crossroads not yet faced</span></div>`
      }
    </div>
  `;
  container.appendChild(deckRow);
}
