/**
 * data.js — CSV Data Loader
 *
 * Fetches the three quest CSV files and populates CRITERIA at
 * startup. Burdens and lore use burden_scryfall format (Category, Function,
 * Title, Text, Weights, scryfall_text, scryfall_link); events use
 * event_scryfall format (Category, Function, X, Title, Text, Weights,
 * scryfall_text, scryfall_link).
 *
 * To add new content: edit the CSV files in assets/files/criteria/.
 * No code changes are needed — the loader is fully generic.
 *
 * Dependencies: config.js (CRITERIA)
 */

'use strict';

/* =============================================================
   CSV PARSER
============================================================= */

/**
 * Parse a single CSV line, correctly handling quoted fields
 * that may contain commas.
 */
function parseCSVLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip the second quote of the "" escape
      } else {
        inQuotes = !inQuotes;
      }
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Generic CSV → object array converter.
 * Skips the header row and any rows without a title.
 */
function parseCSV(text) {
  return text.trim().split(/\r?\n/).slice(1).map(line => {
    const parts = parseCSVLine(line);
    return { function: parts[0] || '', title: parts[1] || '', text: parts[2] || '' };
  }).filter(row => row.title);
}

/**
 * Parser for burden_scryfall.csv format:
 * Category, Function, Title, Text, Weights, info, plausability, scryfall_text, scryfall_link, quantity, percentile
 */
function parseBurdenCSV(text) {
  return text.trim().split(/\r?\n/).slice(1).map(line => {
    const parts = parseCSVLine(line);
    const pctRaw = (parts[10] || '').replace(',', '.');
    return {
      category:      parts[0] || '',
      function:      parts[1] || '',
      title:         parts[2] || '',
      text:          parts[3] || '',
      weight:        parseFloat(parts[4]) || 1,
      info:          parts[5] || '',
      scryfall_text: parts[7] || '',
      scryfall_link: parts[8] || '',
      percentile:    pctRaw ? parseFloat(pctRaw) : null,
    };
  }).filter(row => row.title);
}

/**
 * Parser for lore_scryfall.csv format:
 * Category, Function, Title, Text, Weights, rerolls, scryfall_text, scryfall_link
 */
function parseLoreCSV(text) {
  return text.trim().split(/\r?\n/).slice(1).map(line => {
    const parts = parseCSVLine(line);
    return {
      category:      parts[0] || '',
      function:      parts[1] || '',
      title:         parts[2] || '',
      text:          parts[3] || '',
      weight:        parseFloat(parts[4]) || 1,
      rerolls:       parseInt(parts[5]) || 0,
      scryfall_text: parts[6] || '',
      scryfall_link: parts[7] || '',
      info:          parts[8] || '',
    };
  }).filter(row => row.title);
}

/**
 * Parser for event_scryfall.csv format:
 * Category, Function, Start, End, Title, Text, rerolls, Weights, info, scryfall_text, scryfall_link, plausability
 *
 * `plausability` is a semicolon-separated tag list. Two events that share any
 * tag are treated as mutually exclusive by Step 4's crossing-picker — once one
 * is chosen, future crossings won't offer any event sharing one of its tags.
 * Empty cell or "N/A" → no plausibility constraint.
 */
function parseEventScryfallCSV(text) {
  return text.trim().split(/\r?\n/).slice(1).map(line => {
    const parts    = parseCSVLine(line);
    const startVal = parseFloat(parts[2]);
    const endVal   = parseFloat(parts[3]);
    const plausRaw = (parts[11] || '').trim();
    const plausability = (!plausRaw || plausRaw.toUpperCase() === 'N/A')
      ? []
      : plausRaw.split(';').map(t => t.trim().toLowerCase()).filter(t => t && t !== 'n/a');
    return {
      category:      parts[0] || '',
      function:      parts[1] || '',
      start:         isNaN(startVal) ? null : startVal,
      end:           isNaN(endVal)   ? null : endVal,
      title:         parts[4] || '',
      text:          parts[5] || '',
      rerolls:       parseInt(parts[6]) || 0,
      weight:        parseFloat(parts[7]) || 1,
      info:          parts[8] || '',
      scryfall_text: parts[9] || '',
      scryfall_link: parts[10] || '',
      plausability,
    };
  }).filter(row => row.title);
}

/* =============================================================
   LOADERS
   Each async function fetches one file and populates the
   matching CRITERIA array. Errors are logged but non-fatal —
   the step will simply render no cards if the file is missing.
============================================================= */

async function loadCriteria() {
  try {
    const resp = await fetch('assets/files/criteria/burden_scryfall.csv');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    CRITERIA.commanderStats = parseBurdenCSV(await resp.text());
  } catch (e) {
    console.error('[Quest] Failed to load burdens CSV:', e);
  }
}

async function loadLore() {
  try {
    const resp = await fetch('assets/files/criteria/lore_scryfall.csv');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    CRITERIA.flavor = parseLoreCSV(await resp.text());
  } catch (e) {
    console.error('[Quest] Failed to load lore CSV:', e);
  }
}

async function loadEvents() {
  try {
    const resp = await fetch('assets/files/criteria/event_scryfall.csv');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    CRITERIA.events = parseEventScryfallCSV(await resp.text());
  } catch (e) {
    console.error('[Quest] Failed to load events CSV:', e);
  }
}
