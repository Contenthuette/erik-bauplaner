import { v } from "convex/values";
import { authQuery } from "./functions";
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
