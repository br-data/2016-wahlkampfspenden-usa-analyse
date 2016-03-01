# Spenden deutscher Unternehmen im US-Wahlkampf
In den USA kostet der Wahlkampf eines Politikers viel Geld. Diese Geld wird überwiegend von großen Konzernen, auch aus Deutschland, bereitgestellt. Gespendet wird an Politiker, die viel Einfluss auf wirtschaftlich lukrative Bereiche wie Infrastruktur, Energie oder die Pharmaindustrie haben. Das Geld fließt nicht direkt, sondern über Umwege. BR Data hat die Spenden deutscher Unternehmen analysiert.

Die **Masterdatei** findet sich unter `analyse/final.xlsx`. Dort sind alle Daten und Ergebnisse enthalten. Die Datenblätter werden ausführlich unter *Analyse* erklärt.

## Analyse
Dateien im Verzeichnis `/analyse`. Sammlung verschiedener Skripten zum Scrapen, Analysieren und Transformieren der Wahldaten. Generell gibt es folgende Daten
- Spenden (Spender, Empfänger, Summe)
- PACs (Spendenvereine der Unternehmen)
- Abgeordnete und deren Komiteemitgliedschaften
- Komitees

### Verwendung
1. Erforderliche Module installieren `npm install`
2. Gewünschtes Skript ausführen mit `node getMembers.js`

### Skripten
- **convertCommittees**: Konvertiert das verschachtelte JSON aller Komitees in eine relationale Tabelle.
- **convertMembers**: Konvertiert das verschachtelte JSON aller Komiteemitglieder in eine relationale Tabelle.
- **getMembers**: Verbindet die Liste aller Abgeordneten mit ihren jeweiligen Komiteemitgliedschaften.
- **getRaisedMoney**: Scrapt die Gesamtspendensumme für alle Abgeordneten.
- **getRelations**: Verbindet alle Spenden mit allen Abgeordneten und allen Komitees.

### Datenblätter

##### Abgeordnete/Kandidaten (delegates)
- contribs-count: Anzahl der Spenden von deutschen PACs
- german-contribs-sum: Summe der Spenden deutscher PACs in Dollar 
- all-contribs-sum: Gesamtbudget des Kandidaten (Beispiel ED Markey)
- german-contribs-perc: Prozentualer Anteil der deutschen Spenden am Gesamtbudget
- membership-count: Anzahl der Mitgliedschaften in Komitees und Subkomitees

In delegates-2016 gibt es noch das Feld „2014“. Dieses gibt an, ob der Kandidat bereits 2014 kandidierte.

##### Deutsche Pacs (pacs)
- contrib-count: Anzahl der Spenden
- contrib-sum: Summe der Spenden in Dollar
- rep-count: Anzahl der Spenden an Republikaner
- dem-count: Anzahl der Spenden an Demokraten
- rep-sum: Summe der Spenden an Republikaner in Dollar
- dem-sum: Summe der Spenden an Demokraten in Dollar

##### Spenden (donations)
Alle Spenden deutscher Konzerne an Kandiaten der US-Wahl. Praktisch die Rohdaten die man direkt von http://opensecrets.org bekommt. 

##### Komiteemitgliedschaften (memberships): 
- committee-id: ID des Komitees. SSCM ist ein Hauptkomitee. SSCM01 ist ein Unterkomitee. SXXX bedeutet Senat, HXXX bedeutet Repräsentatenhaus, JXXX bedeutet gemeinsames Komitee (Joint)
- committee: Offizieller Name des Komitees oder Unterkomitees
- title: Titel den der Abgeordnete in einem Komitee führt
- rank: Rang auf der Komitee-Liste (1: Vorsitz, 2: Vize, <= 3: Mitglied oder andere)
- name-matched und score: Technische Felder

##### Kampagnenfinanzierung (raised):
- raised: total receipts reported by candidate
- spent: total expenditures reported by candidate
- cash: cash on hand as reported by candidate
- debt: debts reported by candidate

##### Beziehungen (relations)
Verbindung von Abgeordneten mit PACs mit Kommitee (dyadische Relationen). Welches PAC finanziert welchen Kandidaten und in welchem Komitee sitzt dieser?

## Karte
Dateien im Verzeichnis `/karte`. Visualisierung der Wahlkampfspenden deutscher Unternehmen pro Bundesstaat.

## Netzwerk
Dateien im Verzeichnis `/netzwerk`. Netzwerk-Visualisierung der PACs, Abgeordneten und Komitees. Welches PAC spendet an welchen Abgeordneten. Welcher Abgeordneter sitzt in welchem Komitee?
