# MealMate PWA

Private, installierbare iPhone-Web-App für Rezepte, Vorräte, Wochenplanung und Einkauf.

## Auf dem iPhone installieren

Eine PWA muss über HTTPS ausgeliefert werden. Die Dateien daher z. B. auf GitHub Pages, Netlify, Cloudflare Pages oder einem eigenen HTTPS-Webserver bereitstellen.

Danach auf dem iPhone:
1. URL in Safari öffnen.
2. Teilen-Symbol antippen.
3. „Zum Home-Bildschirm“ auswählen.
4. „Hinzufügen“.

MealMate startet anschließend im Vollbild wie eine normale App.

## Daten
Alle Rezept-, Vorrats-, Planer- und Einkaufsdaten werden lokal im Browser via localStorage gespeichert. Unter Einstellungen kann eine JSON-Sicherung exportiert und wieder importiert werden.

## Enthalten
- Rezeptbibliothek
- Suche und Filter
- Favoriten
- Eigene Rezepte anlegen/bearbeiten/löschen
- Rezepttext-Import mit einfacher automatischer Zerlegung
- Vorrat pflegen
- Matching „Was kann ich essen?“
- Wochenplaner
- Zutaten direkt zur Einkaufsliste
- Einkaufsliste mit Abhaken
- Nährwerte pro Rezept
- Offline-Cache über Service Worker
- Home-Screen-Icon / Standalone-Modus
- Backup und Restore als JSON

## Hinweis
Das direkte automatische Auslesen von Instagram, TikTok, YouTube oder beliebigen fremden Websites ist in einer rein lokalen PWA nicht zuverlässig möglich, weil Browser-CORS, Login-/API-Beschränkungen und Plattformregeln greifen. Dafür wäre ein eigenes Backend bzw. eine API-Anbindung notwendig.
