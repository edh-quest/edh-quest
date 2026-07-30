<?php
/**
 * Example Privacy Policy file for EDH Quest forks.
 *
 * The real datenschutz.php is gitignored so the maintainer's address never
 * lands in the public repo. To deploy your own fork legally, copy this
 * file to datenschutz.php and replace the placeholders with your own
 * contact details. You are the "controller" under Art. 4 GDPR for any
 * personal data processed by your deployment.
 *
 *     cp legal/datenschutz.example.php legal/datenschutz.php
 */
$page_title = 'Privacy Policy — EDH Quest';
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
    p {
      font-size: 0.95rem;
      line-height: 1.7;
      color: #a89880;
      margin-bottom: 0.5rem;
    }
    ul {
      margin: 0.5rem 0 0.5rem 1.5rem;
      font-size: 0.95rem;
      line-height: 1.7;
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

  <h1>Privacy Policy</h1>

  <h2>1. Controller</h2>
  <p>
    The controller within the meaning of the General Data Protection Regulation (GDPR) is:<br><br>
    [YOUR NAME]<br>
    [STREET AND NUMBER]<br>
    [POSTAL CODE AND CITY]<br>
    [COUNTRY]<br>
    Email: <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a>
  </p>

  <h2>2. Overview</h2>
  <p>
    EDH Quest is a private, non-commercial hobby project. It does not use user accounts,
    passwords, email sign-up, tracking cookies, or analytics. No personal profile is created
    for you and no data is sold or shared for advertising.
  </p>
  <p>
    The features that involve any data processing are: server log files kept by our hosting
    provider, a short-lived abuse-prevention log we keep ourselves, temporary lobby files
    while a shared game is in progress, and quest result snapshots created when you finish
    a quest. Each of these is described below.
  </p>

  <h2>3. Server log files and abuse prevention</h2>
  <p>
    The hosting provider (IONOS SE, Elgendorfer Str. 57, 56410 Montabaur, Germany)
    automatically records information in server log files that your browser transmits
    with every request. This includes:
  </p>
  <ul>
    <li>IP address of the requesting device</li>
    <li>Date and time of access</li>
    <li>Name and URL of the requested file</li>
    <li>Website from which access was made (referrer URL)</li>
    <li>Browser used and, if applicable, the operating system</li>
  </ul>
  <p>
    IONOS's privacy policy is available at:
    <a href="https://www.ionos.com/terms-gtc/privacy-policy/" target="_blank" rel="noopener noreferrer">www.ionos.com/terms-gtc/privacy-policy/</a>.
  </p>
  <p>
    In addition, EDH Quest keeps its own short-lived rate-limit log
    (<code>data/rate_limits.json</code>) containing a hashed identifier derived from your
    IP address (not the IP itself) together with timestamps of recent API calls (lobby
    creation, joins, quest saves). The hash is produced with a server-side secret, so the
    stored value cannot be reversed back to your IP address by us or by anyone reading
    the file. Entries older than 24 hours are removed automatically. This log is used
    solely to block spam and abuse and is not merged with any other data.
  </p>
  <p>
    The legal basis for both is Art. 6 (1) lit. f GDPR (legitimate interest in the secure
    and functional operation of the website).
  </p>

  <h2>4. Lobbies</h2>
  <p>
    When you create or join a lobby, a JSON file is stored on our IONOS server containing:
  </p>
  <ul>
    <li>The lobby code and settings (difficulty, budget, house rules, notes) you entered.</li>
    <li>A display name of your choice (2–30 characters). This is not linked to any account
        and can be anything you want.</li>
    <li>A random access token and a 4-digit rejoin PIN generated by the server. These let
        you rejoin the lobby from another device or after clearing your browser data.</li>
    <li>Your quest progress while the lobby is running (chosen colours, criteria, events).</li>
  </ul>
  <p>
    Lobby files are deleted automatically 120 days after the last activity. There is no
    permanent user profile — once the file is gone, so is every trace of that lobby.
  </p>
  <p>
    The legal basis is Art. 6 (1) lit. b GDPR (provision of the requested feature).
  </p>

  <h2>5. Quest result snapshots</h2>
  <p>
    When you complete a quest (solo or in a lobby), a snapshot of the result is stored
    server-side under a random 24-character identifier. The snapshot contains only game
    content — chosen colour identity, commander and lore constraints, deck events,
    difficulty level, and budget setting. It does <strong>not</strong> contain your display
    name, email, IP address, or any other identifier that links the record to you.
  </p>
  <p>
    Your browser keeps a local list of your quest identifiers so it can fetch the full
    result on demand (see section 6). The snapshots themselves are deleted from the server
    automatically 120 days after creation.
  </p>
  <p>
    The legal basis is Art. 6 (1) lit. b GDPR (provision of the requested feature).
  </p>

  <h2>6. Local browser storage</h2>
  <p>
    EDH Quest does not use tracking or analytics cookies. The following data is stored
    locally in your browser's <code>localStorage</code>. It never leaves your device unless
    you actively use the associated feature (e.g. calling the lobby API), and it is never
    shared with third parties:
  </p>
  <ul>
    <li><strong>Currency preference</strong> (<code>mtgq_currency</code>) — whether budget
        is displayed in EUR or USD.</li>
    <li><strong>Quest history</strong> (<code>mtgq_history</code>) — a list of your recent
        quest result identifiers, plus optional custom names you have given each entry. Used
        to display your history dashboard and fetch full results on demand.</li>
    <li><strong>Active quest</strong> (<code>mtgq_active_quest</code>) — a snapshot of your
        current in-progress quest, so you can resume after a page refresh. Cleared once the
        quest is finished or discarded.</li>
    <li><strong>Active lobby session</strong> (<code>mtgq_lobby</code>) — lobby code, your
        player token, PIN and chosen display name. Stored so you can refresh the page without
        losing your session. Cleared when you leave the lobby.</li>
    <li><strong>Lobby list</strong> (<code>mtgq_lobbies</code>) — code, name, role, access
        token, PIN and display name for up to 50 lobbies you have recently created or joined.
        Used by the dashboard to list your lobbies. Individual entries can be removed from
        the dashboard; all entries can be cleared via your browser settings.</li>
  </ul>
  <p>
    The legal basis is Art. 6 (1) lit. b GDPR (provision of the requested feature). No
    consent banner is required because this storage is strictly functional and contains
    no tracking or advertising data.
  </p>

  <h2>7. External services</h2>
  <p>
    <strong>Scryfall</strong> — cards and criteria in EDH Quest link out to
    <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">scryfall.com</a>.
    When you click such a link, Scryfall's own privacy policy applies. EDH Quest itself does
    not send any of your data to Scryfall.
  </p>

  <h2>8. Your rights</h2>
  <p>You have the following rights with respect to the controller:</p>
  <ul>
    <li>Right of access (Art. 15 GDPR)</li>
    <li>Right to rectification (Art. 16 GDPR)</li>
    <li>Right to erasure (Art. 17 GDPR)</li>
    <li>Right to restriction of processing (Art. 18 GDPR)</li>
    <li>Right to data portability (Art. 20 GDPR)</li>
    <li>Right to object (Art. 21 GDPR)</li>
  </ul>
  <p>
    Because EDH Quest holds no user accounts, most of your data lives either in your own
    browser (which you fully control via browser settings) or in short-lived server files
    that expire automatically. To exercise your rights regarding server-side data, please
    contact us by email: <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a>.
  </p>
  <p>
    You also have the right to lodge a complaint with a data protection supervisory
    authority. The competent authority depends on your place of residence or the location
    of the controller.
  </p>

  <h2>9. Currency of this policy</h2>
  <p>
    This privacy policy is current as of July 2026 and may be updated as necessary.
  </p>

  <p class="legal-note">
    This website is a private, non-commercial hobby project with no advertising or commercial
    data processing.
  </p>

  <hr class="lang-divider">
  <p class="lang-label">Deutsche Version</p>

  <h1>Datenschutzerklärung</h1>

  <h2>1. Verantwortlicher</h2>
  <p>
    Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:<br><br>
    [YOUR NAME]<br>
    [STREET AND NUMBER]<br>
    [POSTAL CODE AND CITY]<br>
    [COUNTRY]<br>
    E-Mail: <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a>
  </p>

  <h2>2. Überblick</h2>
  <p>
    EDH Quest ist ein privates, nicht-kommerzielles Freizeitprojekt. Es gibt keine
    Nutzerkonten, keine Passwörter, keine E-Mail-Anmeldung, keine Tracking-Cookies und
    keine Analyse-Tools. Es wird kein persönliches Profil über Sie angelegt und keine
    Daten werden verkauft oder für Werbezwecke weitergegeben.
  </p>
  <p>
    Datenverarbeitung findet nur in folgenden Bereichen statt: Server-Logfiles beim
    Hosting-Anbieter, ein kurzlebiges Missbrauchs-Präventionsprotokoll, temporäre
    Lobby-Dateien während eines gemeinsamen Spiels sowie Quest-Ergebnis-Snapshots beim
    Abschluss einer Quest. Jeder dieser Bereiche wird nachfolgend beschrieben.
  </p>

  <h2>3. Server-Logfiles und Missbrauchsprävention</h2>
  <p>
    Der Hosting-Anbieter (IONOS SE, Elgendorfer Str. 57, 56410 Montabaur) erhebt und
    speichert automatisch Informationen in Server-Logfiles, die Ihr Browser bei jeder
    Anfrage übermittelt. Dies sind:
  </p>
  <ul>
    <li>IP-Adresse des anfragenden Geräts</li>
    <li>Datum und Uhrzeit des Zugriffs</li>
    <li>Name und URL der abgerufenen Datei</li>
    <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
    <li>Verwendeter Browser und ggf. das Betriebssystem</li>
  </ul>
  <p>
    Die Datenschutzerklärung von IONOS ist abrufbar unter:
    <a href="https://www.ionos.de/terms-gtc/datenschutzerklaerung/" target="_blank" rel="noopener noreferrer">www.ionos.de/terms-gtc/datenschutzerklaerung/</a>.
  </p>
  <p>
    Zusätzlich führt EDH Quest ein eigenes kurzlebiges Rate-Limit-Protokoll
    (<code>data/rate_limits.json</code>), das eine aus Ihrer IP-Adresse abgeleitete
    Hash-Kennung (nicht die IP-Adresse selbst) zusammen mit Zeitstempeln kürzlicher
    API-Aufrufe (Lobby-Erstellung, Beitritte, Quest-Speicherungen) enthält. Der Hash wird
    mit einem serverseitigen Geheimnis erzeugt, sodass der gespeicherte Wert weder von
    uns noch von jemandem, der die Datei liest, auf Ihre IP-Adresse zurückgeführt werden
    kann. Einträge, die älter als 24 Stunden sind, werden automatisch entfernt. Dieses
    Protokoll dient ausschließlich der Abwehr von Spam und Missbrauch und wird nicht mit
    anderen Daten zusammengeführt.
  </p>
  <p>
    Rechtsgrundlage für beides ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
    einem sicheren und funktionsfähigen Betrieb der Website).
  </p>

  <h2>4. Lobbys</h2>
  <p>
    Wenn Sie eine Lobby erstellen oder betreten, wird eine JSON-Datei auf unserem
    IONOS-Server gespeichert. Diese enthält:
  </p>
  <ul>
    <li>Den Lobby-Code und die von Ihnen gewählten Einstellungen (Schwierigkeitsgrad,
        Budget, Hausregeln, Notizen).</li>
    <li>Einen von Ihnen frei gewählten Anzeigenamen (2–30 Zeichen). Dieser ist nicht mit
        einem Konto verknüpft und kann beliebig lauten.</li>
    <li>Einen zufälligen Zugriffs-Token und eine 4-stellige Rejoin-PIN, die vom Server
        erzeugt werden. Damit können Sie der Lobby von einem anderen Gerät oder nach dem
        Löschen Ihrer Browserdaten erneut beitreten.</li>
    <li>Ihren Quest-Fortschritt während die Lobby läuft (gewählte Farben, Kriterien,
        Ereignisse).</li>
  </ul>
  <p>
    Lobby-Dateien werden 120 Tage nach der letzten Aktivität automatisch gelöscht. Es gibt
    kein dauerhaftes Nutzerprofil – ist die Datei entfernt, bleibt keine Spur der Lobby
    zurück.
  </p>
  <p>
    Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der angeforderten
    Funktion).
  </p>

  <h2>5. Quest-Ergebnis-Snapshots</h2>
  <p>
    Wenn Sie eine Quest abschließen (solo oder in einer Lobby), wird ein Snapshot des
    Ergebnisses serverseitig unter einer zufälligen 24-stelligen Kennung gespeichert. Der
    Snapshot enthält ausschließlich Spielinhalte – gewählte Farbidentität, Anführer- und
    Lore-Kriterien, Deck-Ereignisse, Schwierigkeitsgrad und Budget. Er enthält
    <strong>keinen</strong> Anzeigenamen, keine E-Mail-Adresse, keine IP-Adresse und keine
    sonstige Kennung, die den Datensatz mit Ihnen verknüpft.
  </p>
  <p>
    Ihr Browser bewahrt eine lokale Liste Ihrer Quest-Kennungen auf, um bei Bedarf das
    vollständige Ergebnis abzurufen (siehe Abschnitt 6). Die Snapshots selbst werden 120
    Tage nach Erstellung automatisch vom Server gelöscht.
  </p>
  <p>
    Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der angeforderten
    Funktion).
  </p>

  <h2>6. Lokaler Browser-Speicher</h2>
  <p>
    EDH Quest verwendet keine Tracking- oder Analyse-Cookies. Folgende Daten werden lokal
    im <code>localStorage</code> Ihres Browsers gespeichert. Sie verlassen Ihr Gerät nur,
    wenn Sie aktiv die zugehörige Funktion nutzen (z. B. einen Lobby-API-Aufruf), und
    werden nicht an Dritte weitergegeben:
  </p>
  <ul>
    <li><strong>Währungspräferenz</strong> (<code>mtgq_currency</code>) – ob Budgets in
        EUR oder USD angezeigt werden.</li>
    <li><strong>Quest-Historie</strong> (<code>mtgq_history</code>) – eine Liste Ihrer
        kürzlichen Quest-Ergebnis-Kennungen sowie optionale, von Ihnen vergebene Namen für
        einzelne Einträge. Dient zur Anzeige des Historie-Dashboards und zum Abruf der
        vollständigen Ergebnisse.</li>
    <li><strong>Aktive Quest</strong> (<code>mtgq_active_quest</code>) – ein Snapshot Ihrer
        aktuell laufenden Quest, damit Sie nach dem Neuladen der Seite fortfahren können.
        Wird gelöscht, sobald die Quest beendet oder verworfen wird.</li>
    <li><strong>Aktive Lobby-Sitzung</strong> (<code>mtgq_lobby</code>) – Lobby-Code, Ihr
        Spieler-Token, PIN und der gewählte Anzeigename. Gespeichert, damit Sie die Seite
        neu laden können, ohne Ihre Sitzung zu verlieren. Wird beim Verlassen der Lobby
        gelöscht.</li>
    <li><strong>Lobby-Liste</strong> (<code>mtgq_lobbies</code>) – Code, Name, Rolle,
        Zugriffs-Token, PIN und Anzeigename für bis zu 50 kürzlich erstellte oder
        beigetretene Lobbys. Ermöglicht die Anzeige Ihrer Lobbys im Dashboard. Einzelne
        Einträge können im Dashboard entfernt werden; alle Einträge lassen sich über die
        Browser-Einstellungen löschen.</li>
  </ul>
  <p>
    Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der angeforderten
    Funktion). Ein Cookie-Banner ist nicht erforderlich, da diese Speicherung rein
    funktional ist und keine Tracking- oder Werbedaten enthält.
  </p>

  <h2>7. Externe Dienste</h2>
  <p>
    <strong>Scryfall</strong> – Karten und Kriterien in EDH Quest verweisen auf
    <a href="https://scryfall.com" target="_blank" rel="noopener noreferrer">scryfall.com</a>.
    Beim Anklicken solcher Links gelten die Datenschutzbestimmungen von Scryfall. EDH Quest
    selbst übermittelt keine Ihrer Daten an Scryfall.
  </p>

  <h2>8. Ihre Rechte</h2>
  <p>Sie haben gegenüber dem Verantwortlichen folgende Rechte:</p>
  <ul>
    <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
    <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
    <li>Recht auf Löschung (Art. 17 DSGVO)</li>
    <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
    <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
    <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
  </ul>
  <p>
    Da EDH Quest keine Nutzerkonten führt, liegen die meisten Ihrer Daten entweder in
    Ihrem eigenen Browser (den Sie über die Browser-Einstellungen vollständig kontrollieren)
    oder in kurzlebigen Serverdateien, die automatisch ablaufen. Zur Wahrnehmung Ihrer
    Rechte in Bezug auf serverseitige Daten wenden Sie sich bitte per E-Mail an:
    <a href="mailto:[YOUR EMAIL]">[YOUR EMAIL]</a>.
  </p>
  <p>
    Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
    Die zuständige Behörde richtet sich nach Ihrem Wohnsitz oder dem Sitz des Verantwortlichen.
  </p>

  <h2>9. Aktualität dieser Erklärung</h2>
  <p>
    Diese Datenschutzerklärung hat den Stand Juli 2026 und kann bei Bedarf aktualisiert werden.
  </p>

  <p class="legal-note">
    Diese Website ist ein privates, nicht-kommerzielles Freizeitprojekt ohne Werbung oder
    kommerzielle Datenverarbeitung.
  </p>

</div>
</body>
</html>
