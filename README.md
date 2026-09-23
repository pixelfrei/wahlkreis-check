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
- **Suche mit Fehlertoleranz:** Groß-/Kleinschreibung, Umlaute, Bindestriche, Punkte und
  Schreibweisen wie „str“, „straße“ oder „strasse“ sind egal, ebenso „St.“ statt „Sankt“.
  Findet die Suche nichts, schlägt sie ähnlich geschriebene Namen vor („ardeystrase“ →
  „ARDEYSTRAßE“) – ohne Netzanfrage, direkt im Browser.
- **Offline nutzbar:** Nach dem ersten Aufruf liegt alles im Gerät – App und Daten aller
  30 Städte (rund 0,4 MB übertragen). Die App lässt sich auf dem Startbildschirm
  installieren und funktioniert im Keller, Hinterhof oder Funkloch. Neue Daten spielt sie
  nicht stillschweigend ein, sondern fragt vorher.
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
- Jede Hausnummer mit Buchstabenzusatz aus den Quelldaten (über 50.000) wird mit der
  Suche der App nachgeschlagen. Wo „5b“ woanders liegt als „5“, ergänzt die Aufbereitung
  eine Ausnahme an der Straße; bleibt danach eine Adresse falsch, bricht sie ab.
- Für Dortmund wurden zehn Adressen, darunter die schwierigen Grenzfälle, von Hand mit dem
  Kartenviewer der Stadt verglichen: [docs/doris-stichprobe.md](docs/doris-stichprobe.md).
- Unit- und Komponententests für Hausnummernlogik, Suche, Datenaufbereitung und
  Oberfläche (`npm test`).

## Bekannte Einschränkungen

- **Erster Aufruf braucht Internet.** Danach läuft die App offline. Beim iPhone muss sie
  über „Teilen → Zum Home-Bildschirm“ installiert werden, das ist etwas versteckt.
- **Ältere Verzeichnisse:** Für einige Städte gibt es nur Straßenverzeichnisse früherer
  Wahlen (2016–2022). Die Zuordnung zum Wahlkreis stammt immer aus der aktuellen Anlage,
  seitdem neu entstandene Straßen können aber fehlen.
- **Buchstabenzusätze:** Liegen „5“ und „5b“ laut Quelle in verschiedenen Wahlkreisen,
  führt die App „5b“ als Ausnahme. Buchstaben, die in den Quelldaten nicht vorkommen,
  zählen wie die Hausnummer ohne Buchstaben.
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
npm run build      # fertige App nach dist/ (inklusive Service Worker)
```

### Aufbau

```
src/frontend/            React-App (Vite)
  App.tsx                Oberfläche, Kopfleiste, Menü
  seiten/                Inhalte von Datenquellen, Impressum und Datenschutz (HTML)
src/build/               Skripte, die die Quelldaten laden, prüfen und aufbereiten
  <stadt>/               je geteilter Stadt ein eigener Ordner
  sw.js, pwaPlugin.ts    Service Worker für die Offline-Nutzung (beim Build erzeugt)
src/shared/              gemeinsame Typen und Logik
public/data/             aufbereitete Daten, die die App lädt
  gemeinden.json         alle Gemeinden in NRW mit Wahlkreis bzw. Straßendatei
  <stadt>.json           Straßen und Hausnummernbereiche einer geteilten Stadt
docs/                    Stichprobe gegen den Dortmunder Kartenviewer,
                         festgehaltener Stand der Quellen (quellen-stand.json)
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

### Quellen auf Änderungen prüfen

Die Städte aktualisieren ihre Verzeichnisse ohne Ankündigung. Dieses Skript fragt alle
Quell-Adressen ab und vergleicht sie mit dem festgehaltenen Stand
(`docs/quellen-stand.json`):

```sh
npm run check:quellen                    # prüfen
npm run check:quellen -- --uebernehmen   # aktuellen Stand festschreiben
```

Als Fingerabdruck dient, was der Server hergibt: ETag, Änderungsdatum oder der Inhalt
selbst. Antworten von Geodiensten werden vorher vereinheitlicht, weil sie bei jeder
Anfrage andere Kennungen, Zeitstempel und Reihenfolgen liefern. Bei einer Änderung oder
einer nicht erreichbaren Quelle endet das Skript mit Fehlercode 1, eignet sich also für
eine automatische Prüfung.

Ablauf bei einer Meldung: betroffene Stadt neu bauen (`npm run build:data:<stadt>`),
Unterschiede in `public/data/` ansehen, Tests laufen lassen, dann den Stand
festschreiben.

Zwei Eigenheiten, die in der Praxis auffielen und berücksichtigt sind:

- **Vier Quellen** (Bochum, Hagen, Jüchen, Mönchengladbach) lassen sich aus Rechenzentren
  nicht abfragen. Die automatische Prüfung überspringt sie und weist darauf hin; von einem
  normalen Anschluss aus werden sie ganz normal geprüft.
- **Duisburg** erzeugt seinen Export jede Nacht neu, Änderungsdatum und ETag wechseln also
  täglich. Dort wird deshalb der Inhalt verglichen statt der Kopfzeilen.

Dieselbe Prüfung läuft automatisch **jeden Montag** als GitHub-Action
(`.github/workflows/quellen.yml`) und lässt sich dort auch von Hand starten. Meldet sie
eine Änderung, schlägt der Lauf fehl; welche Stadt betroffen ist, steht in der
Zusammenfassung des Laufs.

### Impressum und Datenschutz

Die Seiten in `src/frontend/seiten/` enthalten für die verantwortliche Stelle nur
Platzhalter – persönliche Daten gehören nicht in ein öffentliches Repository. Für den
eigenen Betrieb legt man daneben eine Datei mit denselben Namen und der Endung
`.lokal.html` an:

```
src/frontend/seiten/impressum.lokal.html
src/frontend/seiten/datenschutz.lokal.html
```

Existieren sie, nimmt der Build diese statt der Platzhalter-Fassungen. Sie sind über
`.gitignore` ausgeschlossen und landen daher nie im Repository – wohl aber in der
veröffentlichten App, wo die Angaben ja hingehören.

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
