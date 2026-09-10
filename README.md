# MealMate – Clean Rebuild

Diese Version wurde technisch neu aufgebaut und ersetzt die bisherige Versionskette.

## Enthalten
- 4 Hauptbereiche: Start, Rezepte, Plan, Einkauf
- Rezepte: „Meine Rezepte“ + „Erkunden“
- Einkauf: „Einkaufsliste“ + „Vorrat“
- Persönliche Chefkoch-Empfehlungen direkt auf Start
- Empfehlungen lernen aus Favoriten, Bewertungen, gekochten und gespeicherten Rezepten
- Chefkoch-Suche über den fest eingebauten Worker
- Chefkoch-Rezepte speichern und direkt in den Wochenplan übernehmen
- Originalrezept eingebettet in MealMate
- Wochenplan für Frühstück, Mittagessen und Abendessen
- Drag & Drop / iPhone-Pointer-Drag zwischen Plan-Slots
- Wischgeste nach links zeigt erst „Löschen“; gelöscht wird erst nach Tipp
- Vorratsabzug bei Einkaufsliste
- Darkmode: Hell, Dunkel, Automatisch
- Bestehende `mealmate_data`-Daten werden beim Start bestmöglich migriert

## Wichtig zu Rezeptbildern
Bilder werden bewusst **nicht zugeschnitten**. Es gibt kein `object-fit: cover` für Rezeptbilder. Sie werden proportional mit `height: auto` und `object-fit: contain` dargestellt, sodass das komplette Bild sichtbar bleibt.

## Installation über GitHub Pages
Den Inhalt dieses Ordners in das bestehende GitHub-Pages-Repository hochladen und die alten Dateien ersetzen. Anschließend die PWA auf dem iPhone vollständig schließen und neu öffnen.

Fest eingebauter Worker:
`https://mealmate.grxq8hqb8r.workers.dev`
