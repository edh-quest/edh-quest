/**
 * config.js — Static Game Data
 *
 * All content that defines the game lives here: colors, color
 * combination names, and flash colors for animations.
 *
 * To add a new MTG color: push a new entry into CRITERIA.colors.
 * To add combo names: extend COLOR_COMBO_NAMES with the WUBRG key.
 *
 * Dependencies: none
 */

'use strict';

/* =============================================================
   CRITERIA
   Central data container. commanderStats, flavor, and events
   are populated at runtime by data.js (loaded from CSV files).
============================================================= */
const CRITERIA = {

  colors: [
    { id: 'white', name: 'White', img: 'assets/files/symbols/white.png', hex: '#d4c480', textHex: '#2c1e00' },
    { id: 'blue',  name: 'Blue',  img: 'assets/files/symbols/blue.png',  hex: '#0b4a82', textHex: '#d0eaff' },
    { id: 'black', name: 'Black', img: 'assets/files/symbols/black.png', hex: '#1c0d38', textHex: '#d4b8ff' },
    { id: 'red',   name: 'Red',   img: 'assets/files/symbols/red.png',   hex: '#8c1a0a', textHex: '#ffd8c0' },
    { id: 'green', name: 'Green', img: 'assets/files/symbols/green.png', hex: '#0a4820', textHex: '#a8ffcc' },
  ],

  // Populated at startup by data.js
  commanderStats: [],
  flavor:         [],
  events:         [],
};

/* =============================================================
   COLOR COMBINATION NAMES
   WUBRG-sorted comma-joined key → official MTG name.
   Used by the quest summary screen.
============================================================= */
const COLOR_ORDER = ['white', 'blue', 'black', 'red', 'green'];

const COLOR_COMBO_NAMES = {
  // Mono
  'white':                      'Mono-White',
  'blue':                       'Mono-Blue',
  'black':                      'Mono-Black',
  'red':                        'Mono-Red',
  'green':                      'Mono-Green',
  // Guilds (2-color)
  'white,blue':                 'Azorius',
  'blue,black':                 'Dimir',
  'black,red':                  'Rakdos',
  'red,green':                  'Gruul',
  'white,green':                'Selesnya',
  'white,black':                'Orzhov',
  'blue,red':                   'Izzet',
  'black,green':                'Golgari',
  'white,red':                  'Boros',
  'blue,green':                 'Simic',
  // Shards (3-color)
  'white,blue,green':           'Bant',
  'white,blue,black':           'Esper',
  'blue,black,red':             'Grixis',
  'black,red,green':            'Jund',
  'white,red,green':            'Naya',
  // Wedges (3-color)
  'white,black,green':          'Abzan',
  'white,blue,red':             'Jeskai',
  'blue,black,green':           'Sultai',
  'white,black,red':            'Mardu',
  'blue,red,green':             'Temur',
  // Five-color
  'white,blue,black,red,green': 'Five-Color (WUBRG)',
};

/** Return the official MTG name for a sorted set of color IDs. */
function getColorComboName(colorIds) {
  const sorted = [...new Set(colorIds)]
    .sort((a, b) => COLOR_ORDER.indexOf(a) - COLOR_ORDER.indexOf(b));
  return COLOR_COMBO_NAMES[sorted.join(',')]
    || sorted.map(id => id.charAt(0).toUpperCase() + id.slice(1)).join('–');
}

/* =============================================================
   COLOR FLASH
   RGBA values used when the wheel flashes after a color lands.
============================================================= */
const COLOR_FLASH = {
  white: { full: 'rgba(220,210,140,0.9)', dim: 'rgba(220,210,140,0.3)' },
  blue:  { full: 'rgba(74,159,239,0.9)',  dim: 'rgba(74,159,239,0.3)'  },
  black: { full: 'rgba(136,85,204,0.9)',  dim: 'rgba(136,85,204,0.3)'  },
  red:   { full: 'rgba(255,100,60,0.9)',  dim: 'rgba(255,100,60,0.3)'  },
  green: { full: 'rgba(60,200,100,0.9)',  dim: 'rgba(60,200,100,0.3)'  },
};
