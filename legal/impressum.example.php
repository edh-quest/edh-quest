<?php
/**
 * Example Impressum file for EDH Quest forks.
 *
 * The real impressum.php is gitignored so the maintainer's address never
 * lands in the public repo. To deploy your own fork legally, copy this
 * file to impressum.php and replace the placeholders with your own
 * "ladungsfähige Anschrift" (a physical address at which legal documents
 * can be served — a P.O. box is not sufficient under German law).
 *
 *     cp legal/impressum.example.php legal/impressum.php
 */
$page_title = 'Legal Notice — EDH Quest';
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
      font-size: 1.05rem;
      font-weight: bold;
      color: #c8b89a;
      margin: 1.75rem 0 0.4rem;
    }
    p, address {
      font-size: 0.95rem;
      line-height: 1.7;
      font-style: normal;
      color: #a89880;
    }
    a { color: #d4a94a; }
    a:hover { color: #f0d080; }
    .legal-note {
      margin-top: 2.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #3a2e1e;
      font-size: 0.85rem;
      color: #706050;
    }
    .lang-divider {
      margin: 3.5rem 0 3rem;
      border: none;
      border-top: 1px solid #3a2e1e;
    }
    .lang-label {
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #706050;
      margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>
<div class="legal-wrap">

  <a class="legal-back" href="/">← Back to EDH Quest</a>

  <h1>Legal Notice</h1>

  <h2>Information pursuant to § 5 TMG</h2>
  <address>
    [YOUR NAME]<br>
    [STREET AND NUMBER]<br>
    [POSTAL CODE AND CITY]<br>
    [COUNTRY]
  </address>

  <h2>Contact</h2>
  <p>Email: <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a></p>

  <h2>Responsible for content pursuant to § 18 (2) MStV</h2>
  <address>
    [YOUR NAME]<br>
    [STREET AND NUMBER]<br>
    [POSTAL CODE AND CITY]
  </address>

  <h2>Liability for content</h2>
  <p>
    As a service provider we are responsible for our own content on these pages in accordance
    with general law pursuant to § 7 (1) TMG. However, pursuant to §§ 8 to 10 TMG, we are not
    obliged as a service provider to monitor transmitted or stored third-party information or to
    investigate circumstances that indicate illegal activity.
  </p>

  <h2>Liability for links</h2>
  <p>
    Our site contains links to external third-party websites over whose content we have no
    influence. We therefore accept no liability for this external content. The respective
    provider or operator of the linked pages is always responsible for their content. The linked
    pages were checked for possible legal violations at the time of linking. No illegal content
    was apparent at the time of linking.
  </p>

  <h2>Copyright</h2>
  <p>
    The content and works on these pages created by the site operator are subject to German
    copyright law. Magic: The Gathering is a registered trademark of Wizards of the Coast LLC.
    This website is not affiliated with Wizards of the Coast.
  </p>

  <p class="legal-note">
    This website is a private, non-commercial hobby project.
  </p>

  <hr class="lang-divider">
  <p class="lang-label">Deutsche Version</p>

  <h1>Impressum</h1>

  <h2>Angaben gemäß § 5 TMG</h2>
  <address>
    [YOUR NAME]<br>
    [STREET AND NUMBER]<br>
    [POSTAL CODE AND CITY]<br>
    [COUNTRY]
  </address>

  <h2>Kontakt</h2>
  <p>E-Mail: <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a></p>

  <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
  <address>
    [YOUR NAME]<br>
    [STREET AND NUMBER]<br>
    [POSTAL CODE AND CITY]
  </address>

  <h2>Haftung für Inhalte</h2>
  <p>
    Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten
    nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
    Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
    Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
    Tätigkeit hinweisen.
  </p>

  <h2>Haftung für Links</h2>
  <p>
    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
    Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
    Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
    Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf
    mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der
    Verlinkung nicht erkennbar.
  </p>

  <h2>Urheberrecht</h2>
  <p>
    Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
    dem deutschen Urheberrecht. Magic: The Gathering ist ein eingetragenes Warenzeichen von
    Wizards of the Coast LLC. Diese Website steht in keiner Verbindung zu Wizards of the Coast.
  </p>

  <p class="legal-note">
    Diese Website ist ein privates, nicht-kommerzielles Freizeitprojekt.
  </p>

</div>
</body>
</html>
