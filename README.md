# MealMate PWA – Version 3

Private iPhone-PWA ohne Konto und ohne Paywall.

Neu in v3:
- Wochenplan für Frühstück, Mittagessen und Abendessen an allen 7 Tagen
- Automatischer Vorschlag für alle 21 Mahlzeiten
- Einkaufsliste mit Menge und Einheiten g, kg, ml, l und Stück
- Vorratsliste mit denselben Mengen und Einheiten
- Automatischer Abgleich Einkauf ↔ Vorrat
- Beispiel: 500 ml Milch benötigt, 250 ml vorhanden → nur 250 ml landen als Kaufmenge auf der Einkaufsliste
- Automatische Umrechnung g ↔ kg und ml ↔ l
- Vollständig durch Vorrat gedeckte Artikel werden separat als „durch Vorrat abgedeckt“ angezeigt
- Abgehakte Einkäufe können direkt in den Vorrat übernommen werden
- Alte v2-Daten werden automatisch migriert; alte Tagesplanung wird als Mittagessen übernommen
- Rezeptdetails zeigen pro Zutat, wie viel vorhanden bzw. noch fehlend ist
- Service-Worker-Cache v3

## GitHub Pages aktualisieren
Ersetze im Repository die bisherigen Dateien durch den Inhalt dieses Ordners. Die ZIP selbst muss nicht ins Repository.

Nach dem Upload die GitHub-Pages-Seite in Safari einmal neu laden. Falls die alte PWA hartnäckig gecacht bleibt, die App vom Home-Bildschirm entfernen, die Seite in Safari neu laden und erneut über „Teilen → Zum Home-Bildschirm“ hinzufügen.
