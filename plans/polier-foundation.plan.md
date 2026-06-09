# Polier — Fundament

## Status: completed

## Goal
Native iOS/Android-App (Deutsch), die Handwerksbetriebe mit Kunden verbindet.
Dieser Schritt: Design-System, Datenmodell, rollenbasierte Auth (owner/mitarbeiter/kunde),
Multi-Tenancy serverseitig, leere Navigations-Grundgerüste für Admin + Kunde.

## Steps
- [x] Pakete: @expo-google-fonts/inter, resend
- [x] Datenmodell (schema.ts): companies, users(+auth), projects, stages, updates, messages, invoices, notifications, templates
- [x] Custom Password Provider mit Rolle + companyName beim Signup
- [x] Auth-Callbacks: Company anlegen für owner-Signup, letzterLogin
- [x] Passwort-Reset via Resend OTP (Basis)
- [x] Tenancy-Helfer (access.ts) + getCurrentUser query
- [x] Design-Tokens (theme.ts) + UI-Primitiven (Button, Card, Screen, Badge, Input)
- [x] Inter laden in _layout, Auth-Routing nach Rolle
- [x] Auth-Screens: Login, Company-Signup, Passwort vergessen
- [x] Admin-Tabs (Dashboard, Projekte, Nachrichten, Einstellungen) — Platzhalter
- [x] Kunden-Tabs (Mein Bauvorhaben, Nachrichten, Dokumente, Profil) — Platzhalter

## Decisions
- Convex Auth (Password) mit Custom-Provider; Rolle als Profilfeld.
- Company wird in afterUserCreatedOrUpdated für owner erzeugt (pendingCompanyName transient).
- Tenancy: jede Domain-Query filtert per companyId; Kunde nur eigene Projekte (customerId).
- Kunden-Self-Signup deaktiviert; Kunden legt der Betrieb später an.

## Notes
- Farben: bg #FFFFFF, text #0A0A0A/#6B6B6B, border #ECECEC, status grün/amber/rot.
- Buttons radius 12, Cards radius 16.
