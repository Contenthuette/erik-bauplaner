import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authMutation, authQuery } from "./functions";
import { istBetrieb, loadProjectForUser } from "./access";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Zugangscodes — passwortloser Kundenzugang
// =============================================================================
// Ein Code verknüpft: Code -> Kunde (users, rolle "kunde") -> optional Projekt
// -> Betrieb (companyId). Der Betrieb erzeugt Codes, der Kunde löst sie beim
// Login ein (siehe providers/AccessCode.ts). Die Einlösung selbst läuft im
// Auth-Action-Kontext über die interne Mutation _redeemCode.

// Zeichen ohne Verwechslungsgefahr (kein 0/O/1/I).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 8): string {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    return out;
}

/**
 * Interne Code-Erzeugung für einen frisch angelegten Kunden (aus der
 * createCustomer-Action heraus aufgerufen). Erzeugt einen eindeutigen Code.
 */
export const _generateForCustomer = internalMutation({
    args: {
        companyId: v.id("companies"),
        customerId: v.id("users"),
    },
    returns: v.string(),
    handler: async (ctx, args) => {
        let code = randomCode();
        for (let i = 0; i < 5; i++) {
            const clash = await ctx.db
                .query("accessCodes")
                .withIndex("by_code", (q) => q.eq("code", code))
                .first();
            if (!clash) break;
            code = randomCode();
        }
        await ctx.db.insert("accessCodes", {
            code,
            companyId: args.companyId,
            customerId: args.customerId,
            aktiv: true,
            erstelltAm: Date.now(),
        });
        return code;
    },
});

/**
 * Interne Einlösung eines Codes beim Login. Gibt die customerId zurück oder
 * null, wenn der Code ungültig/inaktiv ist. Aktualisiert Einlöse-Zeitstempel.
 */
export const _redeemCode = internalMutation({
    args: { code: v.string() },
    returns: v.union(v.null(), v.id("users")),
    handler: async (ctx, args) => {
        const entry = await ctx.db
            .query("accessCodes")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();
        if (!entry || !entry.aktiv) return null;

        const customer = await ctx.db.get(entry.customerId);
        if (!customer || customer.rolle !== "kunde") return null;

        const now = Date.now();
        await ctx.db.patch(entry._id, {
            ersteEinloesungAm: entry.ersteEinloesungAm ?? now,
            letzteEinloesungAm: now,
        });
        await ctx.db.patch(customer._id, { letzterLogin: now });
        return customer._id;
    },
});

/**
 * Erzeugt (oder liefert den bestehenden aktiven) Zugangscode für einen Kunden.
 * Optional an ein Projekt gebunden. Nur Betriebe dürfen Codes erzeugen.
 */
export const createForCustomer = authMutation({
    args: {
        customerId: v.id("users"),
        projectId: v.optional(v.id("projects")),
        neu: v.optional(v.boolean()),
    },
    returns: v.object({ code: v.string() }),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) {
            throw new Error("Nur Betriebe dürfen Zugangscodes erstellen.");
        }

        const customer = await ctx.db.get(args.customerId);
        if (
            !customer ||
            customer.rolle !== "kunde" ||
            customer.companyId !== user.companyId
        ) {
            throw new Error("Kunde nicht gefunden.");
        }

        if (args.projectId) {
            // Stellt sicher, dass das Projekt zum Betrieb gehört.
            await loadProjectForUser(ctx, user, args.projectId);
        }

        // Bestehenden aktiven Code wiederverwenden, sofern nicht "neu" verlangt.
        if (!args.neu) {
            const existing = await ctx.db
                .query("accessCodes")
                .withIndex("by_customer", (q) =>
                    q.eq("customerId", args.customerId)
                )
                .collect();
            const aktiv = existing.find((e) => e.aktiv);
            if (aktiv) return { code: aktiv.code };
        }

        // Eindeutigen Code erzeugen.
        let code = randomCode();
        for (let i = 0; i < 5; i++) {
            const clash = await ctx.db
                .query("accessCodes")
                .withIndex("by_code", (q) => q.eq("code", code))
                .first();
            if (!clash) break;
            code = randomCode();
        }

        await ctx.db.insert("accessCodes", {
            code,
            companyId: user.companyId,
            customerId: args.customerId,
            projectId: args.projectId,
            aktiv: true,
            erstelltAm: Date.now(),
        });
        return { code };
    },
});

/**
 * Liefert den aktiven Zugangscode eines Kunden (oder null).
 */
export const getForCustomer = authQuery({
    args: { customerId: v.id("users") },
    returns: v.union(v.null(), v.string()),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return null;
        const codes = await ctx.db
            .query("accessCodes")
            .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
            .collect();
        const aktiv = codes.find(
            (c) => c.aktiv && c.companyId === user.companyId
        );
        return aktiv?.code ?? null;
    },
});
