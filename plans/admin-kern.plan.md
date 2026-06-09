# Polier — Admin-Kern (Handwerksbetrieb)

## Status: completed

## Goal
Kern der Admin-Oberflaeche: Projektuebersicht, Kunden/Projekte anlegen,
Ablaufplan-Editor, Vorlagen und Status-Updates — im bestehenden iOS-cleanen Design.

## Steps
- [x] Schema erweitern (users.adresse, projects.aktuellerStageId)
- [x] Backend: customers (createCustomer via createAccount, listCustomers)
- [x] Backend: projects (list, get, create, update, recomputeProgress)
- [x] Backend: stages (add, update, setStatus, setCurrent, reorder, delete)
- [x] Backend: updates (generateUploadUrl, postUpdate, listUpdates + Foto-Storage)
- [x] Backend: templates (list, create, saveProjectAsTemplate, seedDachdecker)
- [x] Admin-Navigation: Stack + (tabs)-Subgroup fuer Detail/Formular-Screens
- [x] Projekte-Uebersicht: Suche, Filter-Pills, Cards, FAB mit Auswahl
- [x] Kunde anlegen + Bestaetigung mit Zugangsdaten und Einladungstext
- [x] Projekt anlegen: Kunden-Dropdown, Vorlagen-Auswahl, Datumsfelder
- [x] Projekt-Detail: Header, Bearbeiten, Ablaufplan-Editor, Schnellaktionen
- [x] Ablaufplan-Editor: Drag&Drop, Status-Toggle, aktueller Schritt
- [x] Update-Composer: Typ, Text, Foto-Upload + Schnellaktionen
- [x] 2 Dachdecker-Beispielvorlagen geseedet

## Decisions
- Kunden-Login: Benutzername falls angegeben, sonst E-Mail. Temp-Passwort serverseitig generiert.
- createCustomer als Action (createAccount benoetigt Action-Kontext).
- Schritt auf erledigt erzeugt automatisch ein Update (Grundlage fuer spaetere Kundenbenachrichtigung).
- Fortschritt = erledigte Schritte / Gesamtschritte, serverseitig berechnet.

## Notes
- expo-image-picker: Ambient-Deklaration in types/expo-image-picker.d.ts als Absicherung gegen TS-Watcher Negativ-Cache.
- Naechste Phasen: Push-Benachrichtigungen, Chat, Dashboard-Umsatzauswertung, Kundenansicht.
