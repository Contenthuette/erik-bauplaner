import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { internalMutation } from "./_generated/server";
import { loadProjectForUser, istBetrieb, istKunde } from "./access";
import { invoiceStatusValidator } from "./schema";
import { notifyUser } from "./notify";
import { QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Rechnungen — Upload (Betrieb), Anzeige (Kunde), Status-Verwaltung
// =============================================================================

const invoiceItem = v.object({
    _id: v.id("invoices"),
    projectId: v.id("projects"),
    betrag: v.number(),
    status: invoiceStatusValidator,
    ausgestelltAm: v.number(),
    faelligAm: v.optional(v.number()),
    bezahltAm: v.optional(v.number()),
    notiz: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
});

async function pdfUrlFor(
    ctx: QueryCtx,
    id: Id<"_storage"> | undefined
): Promise<string | undefined> {
    if (!id) return undefined;
    const url = await ctx.storage.getUrl(id);
    return url ?? undefined;
}

/**
 * Upload-URL für eine Rechnungs-PDF.
 */
export const generateUploadUrl = authMutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        if (!istBetrieb(ctx.user)) throw new Error("Kein Zugriff.");
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Rechnungen eines Projekts (neueste zuerst). Für Betrieb und Kunde.
 */
export const listInvoices = authQuery({
    args: { projectId: v.id("projects") },
    returns: v.array(invoiceItem),
    handler: async (ctx, args) => {
        const user = ctx.user;
        await loadProjectForUser(ctx, user, args.projectId);
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("desc")
            .collect();
        const result = [];
        for (const inv of invoices) {
            result.push({
                _id: inv._id,
                projectId: inv.projectId,
                betrag: inv.betrag,
                status: inv.status,
                ausgestelltAm: inv.ausgestelltAm,
                faelligAm: inv.faelligAm,
                bezahltAm: inv.bezahltAm,
                notiz: inv.notiz,
                pdfUrl: await pdfUrlFor(ctx, inv.pdfUrl),
            });
        }
        return result;
    },
});

/**
 * Offene/überfällige Rechnungen des Kunden über alle Projekte (für Hinweise).
 */
export const myOpenInvoices = authQuery({
    args: {},
    returns: v.array(invoiceItem),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istKunde(user)) return [];
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_customer", (q) => q.eq("customerId", user._id))
            .collect();
        const result = [];
        for (const p of projekte) {
            const invoices = await ctx.db
                .query("invoices")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .collect();
            for (const inv of invoices) {
                if (inv.status === "offen" || inv.status === "ueberfaellig") {
                    result.push({
                        _id: inv._id,
                        projectId: inv.projectId,
                        betrag: inv.betrag,
                        status: inv.status,
                        ausgestelltAm: inv.ausgestelltAm,
                        faelligAm: inv.faelligAm,
                        bezahltAm: inv.bezahltAm,
                        notiz: inv.notiz,
                        pdfUrl: await pdfUrlFor(ctx, inv.pdfUrl),
                    });
                }
            }
        }
        return result;
    },
});

/**
 * Alle Rechnungen des Kunden über alle eigenen Projekte (neueste zuerst).
 */
export const myAllInvoices = authQuery({
    args: {},
    returns: v.array(invoiceItem),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istKunde(user)) return [];
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_customer", (q) => q.eq("customerId", user._id))
            .collect();
        const result = [];
        for (const p of projekte) {
            const invoices = await ctx.db
                .query("invoices")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .order("desc")
                .collect();
            for (const inv of invoices) {
                result.push({
                    _id: inv._id,
                    projectId: inv.projectId,
                    betrag: inv.betrag,
                    status: inv.status,
                    ausgestelltAm: inv.ausgestelltAm,
                    faelligAm: inv.faelligAm,
                    bezahltAm: inv.bezahltAm,
                    notiz: inv.notiz,
                    pdfUrl: await pdfUrlFor(ctx, inv.pdfUrl),
                });
            }
        }
        result.sort((a, b) => b.ausgestelltAm - a.ausgestelltAm);
        return result;
    },
});

/**
 * Legt eine Rechnung an (Betrieb). Status startet als "offen".
 * Benachrichtigt den Kunden.
 */
export const createInvoice = authMutation({
    args: {
        projectId: v.id("projects"),
        betrag: v.number(),
        ausgestelltAm: v.number(),
        faelligAm: v.optional(v.number()),
        pdfId: v.optional(v.id("_storage")),
        notiz: v.optional(v.string()),
    },
    returns: v.id("invoices"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const project = await loadProjectForUser(ctx, user, args.projectId);
        if (args.betrag <= 0) throw new Error("Betrag muss positiv sein.");

        const invoiceId = await ctx.db.insert("invoices", {
            projectId: project._id,
            companyId: project.companyId,
            pdfUrl: args.pdfId,
            betrag: args.betrag,
            status: "offen",
            ausgestelltAm: args.ausgestelltAm,
            faelligAm: args.faelligAm,
            notiz: args.notiz?.trim() || undefined,
        });

        if (project.customerId) {
            await notifyUser(ctx, {
                userId: project.customerId,
                typ: "neue_rechnung",
                titel: "Neue Rechnung",
                text: `Eine Rechnung über ${args.betrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} steht bereit.`,
                bezugId: project._id,
            });
        }
        return invoiceId;
    },
});

/**
 * Markiert eine Rechnung als bezahlt (Betrieb). Setzt bezahltAm.
 */
export const markPaid = authMutation({
    args: { invoiceId: v.id("invoices") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const inv = await ctx.db.get(args.invoiceId);
        if (!inv) throw new Error("Rechnung nicht gefunden.");
        await loadProjectForUser(ctx, user, inv.projectId);
        await ctx.db.patch(inv._id, {
            status: "bezahlt",
            bezahltAm: Date.now(),
        });
        return null;
    },
});

/**
 * Rechnung löschen (Betrieb).
 */
export const deleteInvoice = authMutation({
    args: { invoiceId: v.id("invoices") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const inv = await ctx.db.get(args.invoiceId);
        if (!inv) throw new Error("Rechnung nicht gefunden.");
        await loadProjectForUser(ctx, user, inv.projectId);
        await ctx.db.delete(inv._id);
        return null;
    },
});

/**
 * Cron-Job: setzt fällige, unbezahlte Rechnungen auf "überfällig".
 * Benachrichtigt Kunde UND alle Betriebs-Mitglieder.
 */
export const markOverdueInvoices = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const now = Date.now();
        const offene = await ctx.db
            .query("invoices")
            .filter((q) => q.eq(q.field("status"), "offen"))
            .collect();
        for (const inv of offene) {
            if (inv.faelligAm && inv.faelligAm < now) {
                await ctx.db.patch(inv._id, { status: "ueberfaellig" });

                const project = await ctx.db.get(inv.projectId);
                if (!project) continue;
                const betragText = inv.betrag.toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                });
                // Kunde benachrichtigen.
                if (project.customerId) {
                    await notifyUser(ctx, {
                        userId: project.customerId,
                        typ: "rechnung_ueberfaellig",
                        titel: "Rechnung überfällig",
                        text: `Eine Rechnung über ${betragText} ist überfällig.`,
                        bezugId: project._id,
                    });
                }
                // Betrieb benachrichtigen.
                const team = await ctx.db
                    .query("users")
                    .withIndex("by_company", (q) =>
                        q.eq("companyId", inv.companyId)
                    )
                    .collect();
                for (const member of team) {
                    if (
                        member.rolle === "owner" ||
                        member.rolle === "mitarbeiter"
                    ) {
                        await notifyUser(ctx, {
                            userId: member._id,
                            typ: "rechnung_ueberfaellig",
                            titel: "Rechnung überfällig",
                            text: `${betragText} bei "${project.titel}" ist überfällig.`,
                            bezugId: project._id,
                        });
                    }
                }
            }
        }
        return null;
    },
});
