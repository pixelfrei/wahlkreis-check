# Wahlkreis-Check

Web-App, die zu einer Adresse in Nordrhein-Westfalen den **Landtagswahlkreis** anzeigt.

Gedacht für Ehrenamtliche, die Unterstützungsunterschriften für Direktkandidaturen zur
Landtagswahl NRW 2027 sammeln. Eine Unterschrift zählt nur, wenn die Person im Wahlkreis
der Kandidatur wahlberechtigt ist – an der Haustür oder am Stand muss deshalb in wenigen
Sekunden klar sein, welcher Formularstapel gezogen wird.

## Was die App kann

- **Alle 396 Gemeinden in NRW.** 366 davon liegen vollständig in einem Wahlkreis – dort
  erscheint der Wahlkreis sofort nach der Stadtauswahl.
- **Straßensuche für die 30 geteilten Städte** (z. B. Köln, Essen, Bochum, Marl), die auf
  mehrere Wahlkreise verteilt sind. Liegt eine Straße selbst in mehreren Wahlkreisen, fragt
  die App nach der Hausnummer.
- **Für den Einsatz im Stehen gebaut:** einhändig bedienbar, die Wahlkreisnummer groß und
  kontrastreich, Ergebnis schon beim Tippen, automatischer Dunkelmodus.
- **Nachvollziehbar:** Die Seite [Datenquellen](src/frontend/seiten/quellen.html) (in der
  App unter „Menü → Datenquellen“) beschreibt für jede Stadt Quelle, Zuordnungsweg,
  Besonderheiten und korrigierte Datenfehler – mit Links zu den Originaldaten.

## Bewusst nicht enthalten

- **Keine Speicherung eingegebener Adressen.** Es werden Wohnorte realer Personen
  eingetippt. Die Suche läuft vollständig im Browser; nichts wird gespeichert oder
  übertragen. Gemerkt wird nur die zuletzt gewählte Stadt (lokal im Browser).
- **Kein Backend, keine Nutzerkonten, kein Tracking, keine Zählung von Unterschriften.**
- **Keine Kandidatennamen** – die stehen auf dem Formular.
- **Keine Karte.** Wahlkreisgrenzen als Fläche widersprechen teils der amtlichen
  Zuordnung (siehe unten).

## Wie die Zuordnung funktioniert

Welche Gebiete zu welchem Wahlkreis gehören, legt die
[Anlage zu § 13 Abs. 1 Landeswahlgesetz NRW](https://recht.nrw.de/system/files/2026-02/gv2026-4-5anlage1.pdf)
fest. Die Städte veröffentlichen meist nur, welche Straße in welchem Bezirk liegt. Je nach
verfügbaren Daten ergibt sich der Wahlkreis auf einem von drei Wegen:

1. **Amtlich** – die Stadt nennt den Wahlkreis selbst (Dortmund, Köln, Duisburg).
2. **Über das Landeswahlgesetz** – die Stadt nennt Stimmbezirk, Stadtteil o. Ä.; der
   Wahlkreis dieses Bezirks steht in der Anlage zum Landeswahlgesetz.
3. **Aus Koordinaten berechnet** – nur wo es kein Straßenverzeichnis mit Bezirken gibt:
   amtliche Adresspunkte werden den Bezirks- bzw. Wahlkreisgrenzen zugeordnet (Aachen,
   Altenbeken, Bielefeld, Marl, Sankt Augustin, Wuppertal).

Eine Straßenliste wird einer Berechnung immer vorgezogen. Beispiel Dortmund: Stimmbezirk
09106 liegt heute zu 95,8 % in der Fläche von Wahlkreis 112, gehört amtlich aber zu 111 –
eine reine Flächenberechnung hätte dort für 16 bewohnte Straßen das falsche Ergebnis
geliefert.

### Prüfungen

- Beim Aufbereiten wird für jede Stadt jede Hausnummer jeder geteilten Straße
  durchprobiert: Keine Hausnummer darf zwei Wahlkreise ergeben. Widersprüche in den
  Quelldaten werden einzeln korrigiert und auf der Datenquellen-Seite dokumentiert.
- Für Dortmund wurden zehn Adressen, darunter die schwierigen Grenzfälle, von Hand mit dem
  Kartenviewer der Stadt verglichen: [docs/doris-stichprobe.md](docs/doris-stichprobe.md).
- Unit- und Komponententests für Hausnummernlogik, Suche, Datenaufbereitung und
  Oberfläche (`npm test`).

## Bekannte Einschränkungen

- **Nicht offline nutzbar.** Die App braucht eine Internetverbindung, um die Straßendaten
  einer Stadt zu laden. Einmal geladen, funktioniert die Suche ohne weitere Anfragen –
  eine installierbare Offline-Version (PWA) gibt es aber noch nicht.
- **Ältere Verzeichnisse:** Für einige Städte gibt es nur Straßenverzeichnisse früherer
  Wahlen (2016–2022). Die Zuordnung zum Wahlkreis stammt immer aus der aktuellen Anlage,
  seitdem neu entstandene Straßen können aber fehlen.
- **Buchstabenzusätze** („5b“) werden nicht unterschieden. In den wenigen Fällen, in denen
  „5“ und „5b“ in verschiedenen Wahlkreisen liegen, gilt die Hausnummer ohne Buchstaben.
- **Datteln:** Ein Zwischenschritt (Wahlbezirk → Statistischer Bezirk) ist nicht amtlich
  belegt, sondern aus Straßennamen erschlossen – Details auf der Datenquellen-Seite.
- **Keine Gewähr.** Im Zweifel gilt die Auskunft des Wahlamts der jeweiligen Stadt.

## Entwicklung

Voraussetzung: [Node.js](https://nodejs.org/) 22 oder neuer.

```sh
npm install
npm run dev        # Entwicklungsserver auf http://localhost:5173
npm test           # alle Tests
npx tsc --noEmit   # Typprüfung
npm run build      # fertige App nach dist/
```

### Aufbau

```
src/frontend/            React-App (Vite)
  App.tsx                Oberfläche, Kopfleiste, Menü
  seiten/                Inhalte von Datenquellen, Impressum und Datenschutz (HTML)
src/build/               Skripte, die die Quelldaten laden, prüfen und aufbereiten
  <stadt>/               je geteilter Stadt ein eigener Ordner
src/shared/              gemeinsame Typen und Logik
public/data/             aufbereitete Daten, die die App lädt
  gemeinden.json         alle Gemeinden in NRW mit Wahlkreis bzw. Straßendatei
  <stadt>.json           Straßen und Hausnummernbereiche einer geteilten Stadt
docs/                    Dokumentation der Stichprobe gegen den Dortmunder Kartenviewer
```

### Daten aktualisieren

Die Skripte laden die Originaldaten direkt von den Quellen, prüfen sie und schreiben das
Ergebnis nach `public/data/`:

```sh
npm run build:data:essen   # eine Stadt
npm run build:data         # alle 30 Städte nacheinander
```

Hinweise:

- Für Marl, Altenbeken und Sankt Augustin wird das landesweite Adressverzeichnis
  „Gebäudereferenzen NW“ geladen (rund 100 MB).
- Bricht ein Skript ab, hat sich meist die Quelle geändert (neue Adresse, andere Spalten,
  neue Widersprüche). Die Meldung nennt den Grund.
- `public/data/gemeinden.json` wurde aus der Anlage zum Landeswahlgesetz erstellt und wird
  bei einer neuen Wahlkreiseinteilung von Hand angepasst.

### Veröffentlichen

Die App besteht nur aus statischen Dateien und läuft als
[Cloudflare Worker mit Static Assets](https://developers.cloudflare.com/workers/static-assets/)
(Konfiguration in `wrangler.jsonc`):

```sh
npx wrangler login   # einmalig
npm run build
npx wrangler deploy
```

Jeder andere Hoster für statische Seiten funktioniert ebenfalls, solange unbekannte Pfade
(z. B. `/essen`, `/quellen`) auf `index.html` umgeleitet werden.

## Lizenz

- **Code:** MIT-Lizenz, siehe [LICENSE](LICENSE).
- **Straßen- und Wahlkreisdaten** in `public/data/`: Es gelten die Lizenzen der jeweiligen
  Quellen (u. a. Datenlizenz Deutschland, CC BY) – aufgeführt je Stadt auf der
  Datenquellen-Seite.
- **Schrift Ubuntu:** Ubuntu Font Licence 1.0, siehe [public/fonts/UFL.txt](public/fonts/UFL.txt).
