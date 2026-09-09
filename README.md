# MealMate PWA – Version 2

Private iPhone-PWA ohne Konto und ohne Paywall.

Neu in v2:
- Rezeptbilder in Karten, Detailansicht und Wochenplan
- Bilder per URL oder direkt aus der iPhone-Fotomediathek
- Bereich „Entdecken“ mit Chefkoch-Suche
- Best-effort Import von Rezept-Links über strukturierte Recipe/JSON-LD-Daten
- Bewertung mit 1–5 Sternen und „Heute gekocht“
- Lokale Lernlogik: Favoriten, Bewertungen, Kochhistorie, Vorräte und Zeit fließen in Empfehlungen ein
- Automatischer 7-Tage-Wochenplan mit Abwechslung
- Service-Worker-Cache v2

## GitHub Pages aktualisieren
Ersetze im Repository die Dateien `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest` sowie den `icons`-Ordner durch die Dateien aus diesem Paket. Die ZIP selbst muss nicht ins Repository.

Nach dem Upload kann Safari noch die alte PWA aus dem Cache zeigen. Öffne die GitHub-Pages-Seite einmal in Safari und lade sie neu. Falls nötig, die App vom Home-Bildschirm entfernen und erneut über „Teilen → Zum Home-Bildschirm“ hinzufügen.

## Chefkoch
Die App nutzt keine offizielle Chefkoch-API. Die Suche öffnet die Chefkoch-Websuche. Beim Link-Import versucht MealMate strukturierte Rezeptdaten auszulesen; Browser-/CORS-Regeln können das blockieren. Dann steht der manuelle Text-/Bildimport als Fallback bereit.
