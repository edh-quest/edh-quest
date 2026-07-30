# EDH Quest

 This is an app that challenges your Commander deck building. Inspired by roguelike mechanics, it lets you pick restrictions that must be fulfilled by your commander and by the rest of your deck.

  Live at **[edhquest.com](https://edhquest.com)**.


---

## How does it work?

Pick a difficulty → spin a colour wheel → flip cards that reveal commander constraints (lore and burdens) → roll deckbuilding restrictions (events). The output is a "quest" the player builds a real EDH deck around. Lobby mode lets multiple players run the same wheel together.


---

## Stack

- **PHP 8** — for rendering the page shell, generating link previews when a lobby is shared, two backend endpoints: lobbies and saved quests
- **Vanilla JS** (no modules, no bundler) for all client logic.
- **HTML / CSS**, one stylesheet.
-  **File-based storage** — lobbies and quest history are JSON files (lobbies) or localStorage (history). No database.
- IONOS webhosting.

---

## Folder map

```
mtg-quest/
├── index.php               # Page shell + template loader
├── api/                    # PHP endpoints (lobby, quest share/save)
├── assets/
│   ├── css/style.css       # All styles
│   ├── js/                 # Vanilla JS modules (globals, load order in index.php)
│   └── files/              # CSVs, mana symbols, card designs
├── templates/              # PHP partials, one per screen
├── scripts/                # Maintenance scripts (Scryfall count refresh)
└── data/                   # Runtime state — JSON files, never committed
```

Game content lives in three CSVs in `assets/files/criteria/` (`burden_scryfall.csv`, `lore_scryfall.csv`, `event_scryfall.csv`). Editing them adds new content — no code change required.

