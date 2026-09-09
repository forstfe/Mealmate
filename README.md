# MealMate PWA – Version 6

Private iPhone-PWA ohne Konto und ohne Paywall.

## Neu in v6

- Chefkoch-Feed über einen eigenen Cloudflare Worker statt über den unzuverlässigen öffentlichen AllOrigins-Proxy
- Worker-Adresse wird einmalig in MealMate unter **Einstellungen → Chefkoch-Verbindung** gespeichert
- Verbindungstest direkt in MealMate
- Chefkoch-Suche, Feed, „Merken“ und „+ Plan“ nutzen anschließend den Worker
- Der Worker ist absichtlich **kein offener Proxy**: Er akzeptiert nur `chefkoch.de` / `www.chefkoch.de` und nur Such- bzw. Rezeptpfade
- Service-Worker-Cache auf v6 erhöht

Die Funktionen aus v3–v5 bleiben erhalten: Wochenplan für Frühstück/Mittag/Abend, Drag & Drop, Einkauf ↔ Vorrat mit Mengenabgleich, Rezeptverwaltung und lokale Lern-/Empfehlungslogik.

# 1. MealMate auf GitHub aktualisieren

Ersetze in deinem bestehenden GitHub-Pages-Repository die bisherigen MealMate-Dateien durch den Inhalt dieses Ordners. Den Ordner `cloudflare-worker` kannst du ebenfalls hochladen; er wird von GitHub Pages nicht für die App benötigt, ist aber praktisch als Sicherung.

# 2. Kostenlosen Cloudflare Worker anlegen

1. Kostenlos bei Cloudflare anmelden bzw. einloggen.
2. Im Cloudflare-Dashboard **Workers & Pages** öffnen.
3. **Create application** auswählen und einen neuen Worker anlegen.
4. Als Namen z. B. `mealmate-chefkoch` verwenden.
5. Den Beispielcode im Worker-Editor komplett löschen.
6. Den Inhalt aus `cloudflare-worker/worker.js` einfügen.
7. **Deploy** / **Save and deploy** wählen.
8. Cloudflare zeigt danach eine Adresse ähnlich wie:
   `https://mealmate-chefkoch.DEIN-SUBDOMAIN.workers.dev`
9. Diese Adresse kopieren.

# 3. Worker in MealMate eintragen

1. MealMate öffnen.
2. Oben rechts auf **⚙︎**.
3. Unter **Chefkoch-Verbindung** die `https://…workers.dev`-Adresse einfügen.
4. **Speichern & testen** drücken.
5. Wenn „Verbindung erfolgreich“ erscheint, öffnet MealMate automatisch **Entdecken** und lädt den Chefkoch-Feed.

## Schnelltest des Workers

Öffne die Worker-Adresse im Browser und hänge `/health` an, z. B.:

`https://mealmate-chefkoch.DEIN-SUBDOMAIN.workers.dev/health`

Es sollte eine kleine JSON-Antwort mit `"ok": true` erscheinen.

## Hinweis

Der Worker löst das Browser-CORS-Problem, weil MealMate nicht mehr direkt von Safari auf Chefkoch zugreift. Chefkoch kann Zugriffe serverseitig trotzdem jederzeit ändern oder blockieren. In diesem Fall müsste der Worker angepasst werden; eine dauerhafte Garantie für eine inoffizielle Anbindung an eine fremde Website gibt es nicht.

## iPhone nach dem Update

Nach dem Upload GitHub Pages in Safari einmal neu laden. Falls die alte PWA hartnäckig gecacht bleibt, die App vom Home-Bildschirm entfernen, die Seite in Safari neu laden und anschließend wieder über **Teilen → Zum Home-Bildschirm** hinzufügen.
