import { v } from "convex/values";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { authQuery } from "./functions";
import { internal } from "./_generated/api";
import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";
import { istBetrieb } from "./access";

// =============================================================================
// Kunden — Anlegen & Auflisten (Betrieb)
// =============================================================================
// Kunden-Accounts werden vom Betrieb erstellt. Dabei wird ein User mit Rolle
// "kunde" angelegt (an die companyId des Betriebs gebunden) und ein temporäres
// Passwort generiert. Da createAccount nur im Action-Kontext läuft, ist das
// Anlegen eine Action.

function generateTempPassword(): string {
    // 10 Zeichen, gut lesbar (keine 0/O/1/l Verwechslungen).
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < bytes.length; i++) {
        out += chars[bytes[i] % chars.length];
    }
    return out;
}

/**
 * Liefert das Profil des Betriebs-Users für die Action (Action hat kein ctx.db).
 */
export const _getCallerForCustomerCreate = internalQuery({
    args: { userId: v.id("users") },
    returns: v.union(
        v.null(),
        v.object({
            companyId: v.union(v.id("companies"), v.null()),
            istBetrieb: v.boolean(),
        })
    ),
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        return {
            companyId: user.companyId ?? null,
            istBetrieb: istBetrieb(user),
        };
    },
});

/**
 * Prüft, ob ein Login (E-Mail oder Benutzername) bereits vergeben ist.
 */
export const _loginExists = internalQuery({
    args: { login: v.string() },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", args.login))
            .first();
        return existing !== null;
    },
});

/**
 * Ergänzt den frisch angelegten Kunden-User um Polier-Felder.
 */
export const _finalizeCustomer = internalMutation({
    args: {
        userId: v.id("users"),
        companyId: v.id("companies"),
        name: v.string(),
        telefon: v.optional(v.string()),
        adresse: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            companyId: args.companyId,
            rolle: "kunde",
            name: args.name,
            telefon: args.telefon,
            adresse: args.adresse,
        });
        return null;
    },
});

/**
 * Legt einen Kunden-Account an. Gibt die Zugangsdaten zurück (einmalig sichtbar).
 */
export const createCustomer = action({
    args: {
        name: v.string(),
        email: v.string(),
        telefon: v.optional(v.string()),
        adresse: v.optional(v.string()),
        benutzername: v.optional(v.string()),
    },
    returns: v.object({
        userId: v.id("users"),
        login: v.string(),
        tempPassword: v.string(),
        name: v.string(),
        accessCode: v.string(),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Nicht angemeldet.");

        const caller = await ctx.runQuery(
            internal.customers._getCallerForCustomerCreate,
            { userId }
        );
        if (!caller || !caller.istBetrieb || !caller.companyId) {
            throw new Error("Nur Betriebe dürfen Kunden anlegen.");
        }

        const name = args.name.trim();
        if (!name) throw new Error("Name ist erforderlich.");

        // Login: Benutzername falls angegeben, sonst E-Mail.
        const login = (args.benutzername?.trim() || args.email.trim()).toLowerCase();
        if (!login) throw new Error("E-Mail oder Benutzername ist erforderlich.");

        const exists = await ctx.runQuery(internal.customers._loginExists, {
            login,
        });
        if (exists) {
            throw new Error(
                "Dieser Login ist bereits vergeben. Bitte einen Benutzernamen wählen."
            );
        }

        const tempPassword = generateTempPassword();

        const created = (await createAccount(ctx, {
            provider: "password",
            account: { id: login, secret: tempPassword },
            profile: {
                email: login,
                name,
                rolle: "kunde",
                telefon: args.telefon?.trim() || undefined,
                adresse: args.adresse?.trim() || undefined,
                companyId: caller.companyId,
            } as Partial<Doc<"users">> as never,
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
        })) as { user: { _id: Id<"users"> } };

        // Sicherstellen, dass alle Felder gesetzt sind (companyId/rolle).
        await ctx.runMutation(internal.customers._finalizeCustomer, {
            userId: created.user._id,
            companyId: caller.companyId,
            name,
            telefon: args.telefon?.trim() || undefined,
            adresse: args.adresse?.trim() || undefined,
        });

        // Passwortlosen Zugangscode für den Kunden erzeugen.
        const accessCode: string = await ctx.runMutation(
            internal.accessCodes._generateForCustomer,
            { companyId: caller.companyId, customerId: created.user._id }
        );

        return {
            userId: created.user._id,
            login,
            tempPassword,
            name,
            accessCode,
        };
    },
});

/**
 * Liste aller Kunden des Betriebs (für Dropdowns und Kundenübersicht).
 */
export const listCustomers = authQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("users"),
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            telefon: v.optional(v.string()),
            adresse: v.optional(v.string()),
        })
    ),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return [];
        const kunden = await ctx.db
            .query("users")
            .withIndex("by_company_and_rolle", (q) =>
                q.eq("companyId", user.companyId).eq("rolle", "kunde")
            )
            .collect();
        return kunden
            .map((k) => ({
                _id: k._id,
                name: k.name,
                email: k.email,
                telefon: k.telefon,
                adresse: k.adresse,
            }))
            .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    },
});
