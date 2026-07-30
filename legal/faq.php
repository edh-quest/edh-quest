<?php
$page_title = 'FAQ — EDH Quest';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($page_title) ?></title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: #0e0c0a;
      color: #c8b89a;
      min-height: 100vh;
      padding: 2rem 1rem 4rem;
    }
    .legal-wrap {
      max-width: 680px;
      margin: 0 auto;
    }
    .legal-back {
      display: inline-block;
      margin-bottom: 2rem;
      color: #a08060;
      text-decoration: none;
      font-size: 0.9rem;
      letter-spacing: 0.05em;
    }
    .legal-back:hover { color: #d4a94a; }
    h1 {
      font-family: Georgia, serif;
      font-size: 1.8rem;
      font-weight: normal;
      color: #d4a94a;
      margin-bottom: 2rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #3a2e1e;
    }
    h2 {
      font-size: 0.75rem;
      font-weight: normal;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #d4a94a;
      opacity: 0.6;
      margin: 2.2rem 0 0.8rem;
    }
    .faq-item {
      padding: 0.9rem 0;
      border-bottom: 1px solid #1e1810;
    }
    .faq-q {
      font-size: 0.95rem;
      color: #c8b89a;
      margin-bottom: 0.4rem;
      line-height: 1.5;
    }
    .faq-a {
      font-size: 0.9rem;
      color: #a89880;
      line-height: 1.7;
    }
    a { color: #d4a94a; }
    a:hover { color: #f0d080; }
  </style>
</head>
<body>
<div class="legal-wrap">

  <a class="legal-back" href="/">← Back to EDH Quest</a>

  <h1>Rules &amp; FAQ</h1>

  <h2>The Sections</h2>

  <div class="faq-item">
    <p class="faq-q">What is the Color Wheel?</p>
    <p class="faq-a">The opening step of every quest. You spin the wheel three times and the combined results set your commander's color identity. If the same color comes up twice, you are granted one mercy reroll — but if it comes up three times in a row, the fates reward you instead.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">What is the Burden?</p>
    <p class="faq-a">A mechanical condition your commander must meet — mana value, card type, color identity, keyword abilities, and so on. You reveal three options and pick one. Very restrictive burdens may reward you with extra rerolls; less restrictive ones risk triggering a Curse of Greed.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">What is the Lore?</p>
    <p class="faq-a">A soft, flavour-based condition your commander must fulfil — visual theme, set of origin, or a specific detail in the card's artwork. Nothing you could look up in the rules.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">What are the Crossroads events?</p>
    <p class="faq-a">Deck-building restrictions that shape your 99. At each crossing you reveal three event cards and pick one. The difficulty setting determines how many crossings you face. Note: your commander and any other cards in the command zone are exempt from these restrictions.</p>
  </div>

  <h2>Commander Rules</h2>

  <div class="faq-item">
    <p class="faq-q">No commander fits both my Burden and my Lore. What now?</p>
    <p class="faq-a">After proceeding past the Lore you will be offered the Path of Greed — take it to redraw your cards and try again. However, there will be a penalty for choosing this path!</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">I'm playing a partner (or two-card) commander. How do the criteria apply?</p>
    <p class="faq-a">Declare one of the two cards as your main commander — it must be a creature. Both the Burden and the Lore apply only to that card. The second card is free of any criteria, except color criteria — those count for both cards in the command zone.</p>
  </div>

  <h2>Deck-Building Rules</h2>

  <div class="faq-item">
    <p class="faq-q">How does a rarity restriction work?</p>
    <p class="faq-a">If a restriction requires cards of a specific rarity (e.g. rare), any card that has at least one printing at that rarity qualifies — regardless of which printing you use.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">How do criteria apply to double-faced cards?</p>
    <p class="faq-a">Criteria are always evaluated against the front face — for both deck and commander restrictions. The one exception is color identity, which has to be fulfilled by both sides.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">Do Changelings count toward creature type restrictions?</p>
    <p class="faq-a">Yes. Creatures with the Changeling ability are every creature type simultaneously, so they always fulfil any creature type restriction in your deck.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">Do basic lands count toward set-specific card requirements?</p>
    <p class="faq-a">No. Basic lands are excluded from any "at least X cards from a specific set" restrictions.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">Why do event card numbers look different each time?</p>
    <p class="faq-a">The numeric values on event cards are drawn from a distribution when the card is revealed — so the exact number can change every time you play.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">How does the budget work?</p>
    <p class="faq-a">Each quest has a <span class="cur-symbol">€</span> budget that caps the total price of your whole deck, commander included. Easy grants 250<span class="cur-symbol">€</span>, Normal 150<span class="cur-symbol">€</span>, Hard 75<span class="cur-symbol">€</span>. Custom lets you pick any value or remove the limit entirely. Every reroll you do not spend by the end of the quest increases your final budget by 5%.</p>
  </div>

  <h2>Special Mechanics</h2>

  <div class="faq-item">
    <p class="faq-q">What is the Curse of Greed?</p>
    <p class="faq-a">If your Burden was considered too easy by the fates, there is a chance you must pick a second burden that also applies to your commander.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">What is the Path of Greed?</p>
    <p class="faq-a">After seeing all your picks, you may choose to redraw everything. Each redraw permanently adds one extra Crossroads restriction to your quest. After 10 redraws the quest is forfeit.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">What are the stars (✦) that appear under cards?</p>
    <p class="faq-a">Some Lore and Event cards carry a hidden bonus reroll. Stars only appear when the card is revealed. If you pick that card, you receive one or two extra rerolls added to your counter. Any reroll you don't spend by the end of the quest will increase your final budget by 5%.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">How do rerolls work?</p>
    <p class="faq-a">Hold down on any revealed card for about a second to spend one reroll and swap that card for a new one.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">What is a Fate Event?</p>
    <p class="faq-a">Between certain steps the fates may intervene — granting a boon, such as extra rerolls, or striking with a curse like the Curse of Greed. How often and how harshly fate acts depends on the curse and reward levels of your chosen difficulty.</p>
  </div>

  <h2>Difficulty &amp; Lobbies</h2>

  <div class="faq-item">
    <p class="faq-q">What's the difference between Easy, Normal, Hard, and Custom?</p>
    <p class="faq-a">Easy is forgiving — a 250<span class="cur-symbol">€</span> budget and gentler fate. Normal is the default with a 150<span class="cur-symbol">€</span> budget and three crossings. Hard tightens the budget to 75<span class="cur-symbol">€</span> and adds an extra crossing. Custom lets you dial in budget, starting rerolls, curse chance, reward generosity, and crossing count individually.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">Can I play with friends?</p>
    <p class="faq-a">Yes. Create a lobby to share a difficulty, budget, and house rules with your table, then invite friends with the lobby code. Each player runs their own quest under the same settings and sees everyone's results once the lobby completes.</p>
  </div>
  <div class="faq-item">
    <p class="faq-q">Where is my quest history?</p>
    <p class="faq-a">Every completed quest is saved locally in your browser and reachable from the Quests dashboard on the landing page. History lives on your device only — it isn't synced across browsers or devices.</p>
  </div>


</div>
<script>
  (function() {
    try {
      var sym = localStorage.getItem('mtgq_currency') === 'USD' ? '$' : '€';
      document.querySelectorAll('.cur-symbol').forEach(function(el) { el.textContent = sym; });
    } catch (_) {}
  })();
</script>
</body>
</html>
