# Stichprobe gegen DORIS

Zehn Dortmunder Adressen, davon fünf aus Straßen, die auf mehrere Wahlkreise verteilt
sind, wurden von Hand im amtlichen Kartenviewer der Stadt nachgeschlagen und mit der App
verglichen. Ausgewählt wurden bewusst auch die Grenzfälle, für die die Datenaufbereitung
eine Sonderbehandlung braucht.

- **Datum der Prüfung:** 2026-09-13
- **Kartenviewer:** DORIS Dortmund, "Wahlgebiete Dortmund"
  (https://geoweb1.digistadtdo.de/doris_gdi/mapapps4/resources/apps/kommunalwahl2020/index.html),
  Layer "Landtagswahlkreise" aktiviert.
- **Ergebnis:** 10/10 Treffer stimmen mit der App überein.

| # | Adresse | Straße in App | App-Ergebnis | DORIS-Ergebnis | Treffer |
|---|---|---|---|---|---|
| 1 | Nasses Holz | eindeutig | 114 | 114 | ✓ |
| 2 | Bachstelzenweg 5 | eindeutig | 114 | 114 | ✓ |
| 3 | Am Brauckacker 5 | eindeutig | 111 | 111 | ✓ |
| 4 | Rotkäppchenweg 5 | eindeutig | 112 | 112 | ✓ |
| 5 | Feineisenstraße 5 | eindeutig | 112 | 112 | ✓ |
| 6 | Hannöversche Straße 30 | geteilt | 112 | 112 | ✓ |
| 7 | Hagener Straße 200 | geteilt | 114 | 114 | ✓ |
| 8 | Ernst-Mehlich-Straße 13 | geteilt, Paritätsgrenze (11–15 ungerade vs. 2–16 gerade) | 111 | 111 | ✓ |
| 9 | Deutsch-Luxemburger Straße 45 | geteilt | 112 | 112 | ✓ |
| 10 | Schilfweg 17 | geteilt, Buchstabenzusatz-Grenzfall (15 vs. 15b) | 113 | 113 | ✓ |

## Bemerkenswerte Einzelfälle

**Deutsch-Luxemburger Straße 45/49/51:** In DORIS verläuft die Wahlkreisgrenze exakt
entlang der Kuntzestraße, unmittelbar zwischen Hausnummer 49 (WK 112) und 51 (WK 114).
Das deckt sich exakt mit dem in `dortmund.json` gespeicherten Bereichsende `bis: 49`.

**Schilfweg 15/15b/17:** Dies ist der Fall, für den die Build-Pipeline eine
Sonderbehandlung für Hausnummern mit Buchstabenzusatz an der unteren Bereichsgrenze
implementiert (`hatBuchstabenzusatz`, siehe `src/build/join.ts`). In DORIS verläuft die
Wahlkreisgrenze exakt zwischen Hausnummer 15 (WK 114, Stimmbezirk 25104) und 15b/17/17a/19/19a
(WK 113, Stimmbezirk 21108). Das bestätigt, dass die Basisnummer 15 korrekt beim
vorherigen Bereich verbleibt und nicht fälschlich auch dem Bereich ab 15b zugerechnet wird.

**Ernst-Mehlich-Straße 13:** Die Wahlkreisgrenze folgt hier der Straße selbst
(Nordseite = WK 112 mit den geraden Nummern 2–16, Südseite = WK 111 mit den ungeraden
Nummern 11–15). Bestätigt die Paritätslogik an einer echten Straßengrenze.

## Fazit

Keine Abweichung gefunden. Insbesondere die beiden Fälle, die in der Build-Logik
Sonderbehandlung brauchten (Paritätsgrenze, Buchstabenzusatz-Grenze), stimmen exakt mit
der amtlichen Kartendarstellung überein.
