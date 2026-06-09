import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { loadProjectForUser, istBetrieb, istKunde } from "./access";
import { rolleValidator } from "./schema";
import { notifyUser } from "./notify";
import { Doc, Id } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

// =============================================================================
// Nachrichten — ein Thread pro Projekt zwischen Kunde und Betrieb
// =============================================================================

const messageItem = v.object({
    _id: v.id("messages"),
    senderId: v.id("users"),
    senderRolle: rolleValidator,
    text: v.string(),
    anhaenge: v.array(
        v.object({
            url: v.string(),
            istPdf: v.boolean(),
        })
    ),
    erstelltAm: v.number(),
    gelesenAm: v.optional(v.number()),
    vonMir: v.boolean(),
});

async function aufgeloesteAnhaenge(
    ctx: QueryCtx,
    ids: Id<"_storage">[] | undefined
): Promise<{ url: string; istPdf: boolean }[]> {
    if (!ids || ids.length === 0) return [];
    const result: { url: string; istPdf: boolean }[] = [];
    for (const id of ids) {
        const url = await ctx.storage.getUrl(id);
        if (!url) continue;
        const meta = await ctx.db.system.get(id);
        const istPdf = meta?.contentType === "application/pdf";
        result.push({ url, istPdf });
    }
    return result;
}

/**
 * Erzeugt eine Upload-URL für einen Nachrichten-Anhang (Foto/PDF).
 */
export const generateUploadUrl = authMutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Nachrichten eines Projekts (älteste zuerst für Chat-Darstellung).
 * Markiert eingehende Nachrichten beim Lesen NICHT automatisch — dafür
 * gibt es markThreadRead (separate Mutation).
 */
export const listMessages = authQuery({
    args: { projectId: v.id("projects") },
    returns: v.array(messageItem),
    handler: async (ctx, args) => {
        const user = ctx.user;
        await loadProjectForUser(ctx, user, args.projectId);
        const msgs = await ctx.db
            .query("messages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .order("asc")
            .collect();
        const result = [];
        for (const m of msgs) {
            result.push({
                _id: m._id,
                senderId: m.senderId,
                senderRolle: m.senderRolle,
                text: m.text,
                anhaenge: await aufgeloesteAnhaenge(ctx, m.anhaenge),
                erstelltAm: m.erstelltAm,
                gelesenAm: m.gelesenAm,
                vonMir: m.senderId === user._id,
            });
        }
        return result;
    },
});

/**
 * Sendet eine Nachricht im Projekt-Thread. Erlaubt für Kunde und Betrieb.
 * Benachrichtigt jeweils die andere Seite.
 */
export const sendMessage = authMutation({
    args: {
        projectId: v.id("projects"),
        text: v.string(),
        anhaenge: v.optional(v.array(v.id("_storage"))),
    },
    returns: v.id("messages"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const project = await loadProjectForUser(ctx, user, args.projectId);

        const text = args.text.trim();
        const hatAnhaenge = (args.anhaenge?.length ?? 0) > 0;
        if (!text && !hatAnhaenge) {
            throw new Error("Nachricht darf nicht leer sein.");
        }
        if (!user.rolle) throw new Error("Keine Rolle.");

        const messageId = await ctx.db.insert("messages", {
            projectId: project._id,
            companyId: project.companyId,
            senderId: user._id,
            senderRolle: user.rolle,
            text,
            anhaenge: hatAnhaenge ? args.anhaenge : undefined,
            erstelltAm: Date.now(),
        });

        const vorschau = text
            ? text.length > 100
                ? `${text.slice(0, 97)}\u2026`
                : text
            : "\ud83d\udcce Anhang";

        if (istKunde(user)) {
            // Kunde schreibt → alle Betriebs-Mitglieder benachrichtigen.
            const team = await ctx.db
                .query("users")
                .withIndex("by_company", (q) =>
                    q.eq("companyId", project.companyId)
                )
                .collect();
            for (const member of team) {
                if (member.rolle === "owner" || member.rolle === "mitarbeiter") {
                    await notifyUser(ctx, {
                        userId: member._id,
                        typ: "neue_nachricht",
                        titel: `Nachricht von ${user.name ?? "Kunde"}`,
                        text: vorschau,
                        bezugId: project._id,
                    });
                }
            }
        } else if (istBetrieb(user) && project.customerId) {
            // Betrieb schreibt → Kunde benachrichtigen.
            await notifyUser(ctx, {
                userId: project.customerId,
                typ: "neue_nachricht",
                titel: "Neue Nachricht",
                text: vorschau,
                bezugId: project._id,
            });
        }

        return messageId;
    },
});

/**
 * Markiert alle eingehenden Nachrichten (von der anderen Seite) im Thread
 * als gelesen.
 */
export const markThreadRead = authMutation({
    args: { projectId: v.id("projects") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        await loadProjectForUser(ctx, user, args.projectId);
        const msgs = await ctx.db
            .query("messages")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
        const now = Date.now();
        for (const m of msgs) {
            if (m.senderId !== user._id && !m.gelesenAm) {
                await ctx.db.patch(m._id, { gelesenAm: now });
            }
        }
        return null;
    },
});

/**
 * Anzahl ungelesener Nachrichten für den Kunden über alle eigenen Projekte.
 */
export const myUnreadMessageCount = authQuery({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istKunde(user)) return 0;
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_customer", (q) => q.eq("customerId", user._id))
            .collect();
        let count = 0;
        for (const p of projekte) {
            const msgs = await ctx.db
                .query("messages")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .collect();
            count += msgs.filter(
                (m) => m.senderId !== user._id && !m.gelesenAm
            ).length;
        }
        return count;
    },
});

const inboxItem = v.object({
    projectId: v.id("projects"),
    projektTitel: v.string(),
    kundeName: v.optional(v.string()),
    letzteNachricht: v.optional(v.string()),
    letzteAktivitaet: v.optional(v.number()),
    ungelesen: v.number(),
});

/**
 * Inbox des Betriebs: ein Eintrag pro Projekt mit Kunde, sortiert nach
 * neuester Aktivität. Nur Projekte mit zugeordnetem Kunden erscheinen.
 */
export const listInbox = authQuery({
    args: {},
    returns: v.array(inboxItem),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return [];
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
            .collect();

        const items: {
            projectId: Id<"projects">;
            projektTitel: string;
            kundeName?: string;
            letzteNachricht?: string;
            letzteAktivitaet?: number;
            ungelesen: number;
        }[] = [];

        for (const p of projekte) {
            if (!p.customerId) continue;
            const msgs = await ctx.db
                .query("messages")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .order("asc")
                .collect();
            const kunde: Doc<"users"> | null = await ctx.db.get(p.customerId);
            const letzte = msgs[msgs.length - 1];
            const ungelesen = msgs.filter(
                (m) => m.senderRolle === "kunde" && !m.gelesenAm
            ).length;
            items.push({
                projectId: p._id,
                projektTitel: p.titel,
                kundeName: kunde?.name,
                letzteNachricht: letzte
                    ? letzte.text || "\ud83d\udcce Anhang"
                    : undefined,
                letzteAktivitaet: letzte?.erstelltAm,
                ungelesen,
            });
        }

        items.sort(
            (a, b) => (b.letzteAktivitaet ?? 0) - (a.letzteAktivitaet ?? 0)
        );
        return items;
    },
});

/**
 * Gesamtzahl ungelesener Kunden-Nachrichten für den Betrieb (Tab-Badge).
 */
export const inboxUnreadCount = authQuery({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return 0;
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
            .collect();
        let count = 0;
        for (const p of projekte) {
            const msgs = await ctx.db
                .query("messages")
                .withIndex("by_project", (q) => q.eq("projectId", p._id))
                .collect();
            count += msgs.filter(
                (m) => m.senderRolle === "kunde" && !m.gelesenAm
            ).length;
        }
        return count;
    },
});
