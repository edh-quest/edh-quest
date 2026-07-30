<?php
$page_title = 'Contact — EDH Quest';
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
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #3a2e1e;
    }
    p {
      font-size: 0.95rem;
      line-height: 1.7;
      color: #a89880;
      margin-bottom: 1.25rem;
    }
    a { color: #d4a94a; }
    a:hover { color: #f0d080; }
  </style>
</head>
<body>
<div class="legal-wrap">

  <a class="legal-back" href="/">← Back to EDH Quest</a>

  <h1>Contact</h1>

  <p>Feel free to reach out with feedback, rule suggestions, or bug reports — all of it is welcome and helps improve the quest.</p>

  <p><a href="mailto:info@edhquest.com">info@edhquest.com</a></p>

</div>
</body>
</html>
