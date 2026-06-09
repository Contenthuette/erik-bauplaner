import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rolleValidator } from "./schema";

/**
 * Liefert das Profil des aktuell eingeloggten Users inkl. Rolle und Company.
 * Wird vom Frontend genutzt, um nach Rolle die richtige Oberfläche zu laden.
 */
export const getCurrentUser = authQuery({
    args: {},
    returns: v.union(
        v.null(),
        v.object({
            _id: v.id("users"),
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            telefon: v.optional(v.string()),
            adresse: v.optional(v.string()),
            rolle: v.optional(rolleValidator),
            companyId: v.optional(v.id("companies")),
            companyName: v.optional(v.string()),
        })
    ),
    handler: async (ctx) => {
        const user = ctx.user;
        let companyName: string | undefined = undefined;
        if (user.companyId) {
            const company = await ctx.db.get(user.companyId);
            companyName = company?.name;
        }
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            telefon: user.telefon,
            adresse: user.adresse,
            rolle: user.rolle,
            companyId: user.companyId,
            companyName,
        };
    },
});

/**
 * Aktualisiert den letzterLogin-Zeitstempel des aktuell eingeloggten Users.
 * Wird vom Frontend nach erfolgreichem Login aufgerufen.
 */
export const touchLogin = mutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;
        await ctx.db.patch(userId, { letzterLogin: Date.now() });
        return null;
    },
});

const prefsValidator = v.object({
    statusUpdate: v.boolean(),
    schrittErledigt: v.boolean(),
    neueNachricht: v.boolean(),
    neueRechnung: v.boolean(),
});

const defaultPrefs = {
    statusUpdate: true,
    schrittErledigt: true,
    neueNachricht: true,
    neueRechnung: true,
};

/**
 * Benachrichtigungs-Einstellungen des aktuellen Users (mit Defaults).
 */
export const getNotificationPrefs = authQuery({
    args: {},
    returns: prefsValidator,
    handler: async (ctx) => {
        const prefs = ctx.user.benachrichtigungsPrefs as
            | Record<string, boolean>
            | undefined;
        if (prefs && typeof prefs === "object") {
            return {
                statusUpdate: prefs.statusUpdate ?? true,
                schrittErledigt: prefs.schrittErledigt ?? true,
                neueNachricht: prefs.neueNachricht ?? true,
                neueRechnung: prefs.neueRechnung ?? true,
            };
        }
        return defaultPrefs;
    },
});

/**
 * Speichert die Benachrichtigungs-Einstellungen.
 */
export const updateNotificationPrefs = authMutation({
    args: { prefs: prefsValidator },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(ctx.user._id, {
            benachrichtigungsPrefs: args.prefs,
        });
        return null;
    },
});

/**
 * Aktualisiert die eigenen Kontaktdaten (Name, Telefon, Adresse).
 */
export const updateMyProfile = authMutation({
    args: {
        name: v.optional(v.string()),
        telefon: v.optional(v.string()),
        adresse: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const patch: Record<string, string | undefined> = {};
        if (args.name !== undefined) patch.name = args.name.trim() || undefined;
        if (args.telefon !== undefined)
            patch.telefon = args.telefon.trim() || undefined;
        if (args.adresse !== undefined)
            patch.adresse = args.adresse.trim() || undefined;
        await ctx.db.patch(ctx.user._id, patch);
        return null;
    },
});
