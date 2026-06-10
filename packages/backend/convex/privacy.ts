import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { istBetrieb, istKunde } from "./access";
import { Doc } from "./_generated/dataModel";

// =============================================================================
// DSGVO — Einwilligung, Datenauskunft (Export) & Recht auf Löschung
// =============================================================================

/**
 * Hat der aktuelle User der Datenschutzerklärung zugestimmt?
 */
export const getConsentStatus = authQuery({
    args: {},
    returns: v.object({
        akzeptiert: v.boolean(),
        akzeptiertAm: v.optional(v.number()),
    }),
    handler: async (ctx) => {
        const ts = ctx.user.datenschutzAkzeptiertAm;
        return { akzeptiert: !!ts, akzeptiertAm: ts };
    },
});

/**
 * Speichert die Zustimmung zur Datenschutzerklärung.
 */
export const acceptDatenschutz = authMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        if (!ctx.user.datenschutzAkzeptiertAm) {
            await ctx.db.patch(ctx.user._id, {
                datenschutzAkzeptiertAm: Date.now(),
            });
        }
        return null;
    },
});

/**
 * Datenauskunft (Art. 15 DSGVO): exportiert alle zum User gespeicherten Daten
 * als strukturiertes Objekt. Der Client kann daraus eine Datei erzeugen/teilen.
 */
export const exportMyData = authQuery({
    args: {},
    returns: v.object({
        exportiertAm: v.number(),
        profil: v.object({
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            telefon: v.optional(v.string()),
            adresse: v.optional(v.string()),
            rolle: v.optional(v.string()),
            registriertAm: v.number(),
        }),
        projekte: v.array(
            v.object({
                titel: v.string(),
                status: v.string(),
                adresse: v.optional(v.string()),
                fortschrittProzent: v.number(),
            })
        ),
        nachrichten: v.array(
            v.object({
                text: v.string(),
                gesendetAm: v.number(),
                vonMir: v.boolean(),
            })
        ),
        rechnungen: v.array(
            v.object({
                betrag: v.number(),
                status: v.string(),
                ausgestelltAm: v.number(),
            })
        ),
        benachrichtigungen: v.number(),
    }),
    handler: async (ctx) => {
        const user = ctx.user;

        // Projekte: Kunde -> eigene; Betrieb -> der Company.
        let projekte: Doc<"projects">[] = [];
        if (istKunde(user)) {
            projekte = await ctx.db
                .query("projects")
                .withIndex("by_customer", (q) => q.eq("customerId", user._id))
                .collect();
        } else if (istBetrieb(user) && user.companyId) {
            projekte = await ctx.db
                .query("projects")
                .withIndex("by_company", (q) =>
                    q.eq("companyId", user.companyId!)
                )
                .collect();
        }

        // Nachrichten des Users (über die zugänglichen Projekte).
        const nachrichten: { text: string; gesendetAm: number; vonMir: boolean }[] =
            [];
        const rechnungen: {
            betrag: number;
            status: string;
            ausgestelltAm: number;
        }[] = [];
        for (const p of projekte) {
            const msgs = await ctx.db
                .query("messages")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .collect();
            for (const m of msgs) {
                nachrichten.push({
                    text: m.text,
                    gesendetAm: m.erstelltAm,
                    vonMir: m.senderId === user._id,
                });
            }
            const invs = await ctx.db
                .query("invoices")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .collect();
            for (const inv of invs) {
                rechnungen.push({
                    betrag: inv.betrag,
                    status: inv.status,
                    ausgestelltAm: inv.ausgestelltAm,
                });
            }
        }

        const benachrichtigungen = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        return {
            exportiertAm: Date.now(),
            profil: {
                name: user.name,
                email: user.email,
                telefon: user.telefon,
                adresse: user.adresse,
                rolle: user.rolle,
                registriertAm: user._creationTime,
            },
            projekte: projekte.map((p) => ({
                titel: p.titel,
                status: p.status,
                adresse: p.adresse,
                fortschrittProzent: p.fortschrittProzent,
            })),
            nachrichten,
            rechnungen,
            benachrichtigungen: benachrichtigungen.length,
        };
    },
});

/**
 * Recht auf Löschung (Art. 17 DSGVO).
 * - Kunde: löscht eigene Nachrichten, Benachrichtigungen, Auth-Daten und das
 *   Benutzerkonto. Projekte des Betriebs bleiben bestehen, werden aber vom
 *   Kunden entkoppelt (customerId entfernt).
 * - Mitarbeiter: entkoppelt sich vom Betrieb und löscht das Konto.
 * - Inhaber (owner): nur löschbar, wenn er der einzige Account ist — sonst
 *   muss zuerst die Übergabe erfolgen (vereinfachte Regel).
 */
export const deleteMyAccount = authMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const user = ctx.user;

        if (user.rolle === "owner") {
            // Sicherheits-Check: Inhaber mit aktiven Projekten/Team kann nicht
            // einfach gelöscht werden (Datenintegrität für Kunden).
            if (user.companyId) {
                const team = await ctx.db
                    .query("users")
                    .withIndex("by_company", (q) =>
                        q.eq("companyId", user.companyId!)
                    )
                    .collect();
                const andereMitglieder = team.filter(
                    (m) =>
                        m._id !== user._id &&
                        (m.rolle === "owner" || m.rolle === "mitarbeiter")
                );
                if (andereMitglieder.length > 0) {
                    throw new Error(
                        "Bitte übertragen Sie zuerst die Inhaberschaft oder entfernen Sie alle Mitarbeiter."
                    );
                }
            }
        }

        // Kunde: Projekte entkoppeln.
        if (istKunde(user)) {
            const projekte = await ctx.db
                .query("projects")
                .withIndex("by_customer", (q) => q.eq("customerId", user._id))
                .collect();
            for (const p of projekte) {
                await ctx.db.patch(p._id, { customerId: undefined });
            }
        }

        // Eigene Nachrichten löschen.
        // (Über alle Projekte, in denen der User Sender ist — wir durchsuchen
        //  die Projekte der Company bzw. des Kunden.)
        const eigeneNachrichten = await ctx.db
            .query("messages")
            .collect();
        for (const m of eigeneNachrichten) {
            if (m.senderId === user._id) {
                await ctx.db.delete(m._id);
            }
        }

        // Benachrichtigungen löschen.
        const notifs = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();
        for (const n of notifs) {
            await ctx.db.delete(n._id);
        }

        // Auth-Daten löschen (accounts, sessions, refresh tokens).
        const authAccounts = await ctx.db
            .query("authAccounts")
            .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
            .collect();
        for (const a of authAccounts) {
            await ctx.db.delete(a._id);
        }
        const sessions = await ctx.db
            .query("authSessions")
            .withIndex("userId", (q) => q.eq("userId", user._id))
            .collect();
        for (const s of sessions) {
            await ctx.db.delete(s._id);
        }

        // Zuletzt: User-Dokument löschen.
        await ctx.db.delete(user._id);
        return null;
    },
});
