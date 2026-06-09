import { convexAuth } from "@convex-dev/auth/server";
import { PolierPassword } from "./providers/PolierPassword";

import { env } from "./env";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [PolierPassword],
    callbacks: {
        /**
         * Wird nach dem Anlegen/Aktualisieren eines Users aufgerufen.
         * - Bei Owner-Signup mit pendingCompanyName: Company erzeugen und
         *   am User verknüpfen.
         * - letzterLogin aktualisieren.
         */
        async afterUserCreatedOrUpdated(ctx, { userId }) {
            const user = await ctx.db.get(userId);
            if (!user) return;

            const updates: Record<string, unknown> = {
                letzterLogin: Date.now(),
            };

            // Owner-Signup: Company erzeugen, falls noch keine verknüpft ist.
            if (
                user.rolle === "owner" &&
                !user.companyId &&
                user.pendingCompanyName
            ) {
                const companyId = await ctx.db.insert("companies", {
                    name: user.pendingCompanyName,
                    kontaktEmail: user.email,
                    erstelltAm: Date.now(),
                });
                updates.companyId = companyId;
                updates.pendingCompanyName = undefined;
            }

            await ctx.db.patch(userId, updates);
        },
        async redirect({ redirectTo }) {
            const siteUrl = (env.SITE_URL ?? "").replace(/\/$/, "");
            if (redirectTo.startsWith("/") || redirectTo.startsWith("?")) {
                return `${siteUrl}${redirectTo}`;
            }
            if (redirectTo.startsWith(siteUrl)) {
                return redirectTo;
            }
            const match = redirectTo.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
            if (match && !["http", "https"].includes(match[1].toLowerCase())) {
                return redirectTo;
            }
            return siteUrl;
        },
    },
});
