# MealMate PWA v7

- Chefkoch Cloudflare Worker ist fest in der App hinterlegt.
- Keine manuelle Worker-Einrichtung in MealMate mehr nötig.
- Chefkoch-Feed, Merken und + Plan verwenden automatisch den hinterlegten Worker.
- Wochenplan mit Frühstück, Mittagessen und Abendessen sowie Drag & Drop bleibt erhalten.
- Einkaufsliste und Vorrat bleiben mengenbasiert miteinander verknüpft.
- Service-Worker-Cache auf v7 erhöht.

## GitHub Pages
Ersetze die bisherigen MealMate-Dateien in deinem Repository durch den Inhalt des Ordners `MealMate-PWA`.

## v11
- Untere Navigation auf vier Hauptbereiche reduziert: Start, Rezepte, Plan, Einkauf.
- Rezepte und Entdecken sind jetzt ein gemeinsamer Bereich mit den Reitern „Meine Rezepte“ und „Erkunden“.
- Einkauf und Vorrat sind jetzt ein gemeinsamer Bereich mit den Reitern „Einkaufsliste“ und „Vorrat“.


## v12
- Wochenplan: Wischen nach links zeigt erst die rote Aktion „Löschen“. Erst ein Tipp darauf entfernt die Mahlzeit.
- Startseite: Empfehlungen ohne Bild versuchen automatisch ein passendes Rezeptbild über den eingerichteten Chefkoch-Worker zu laden.


## v15
- Bilddarstellung der Rezeptkarten wurde auf das Verhalten von v11 zurückgesetzt.
- Die Startseite bezieht persönliche Empfehlungen direkt aus Chefkoch und lernt Suchthemen aus Bewertungen, Favoriten und Kochhistorie.
- „Neue Vorschläge“ lädt neue Chefkoch-Rezepte statt nur gespeicherte Rezepte durchzutauschen.
