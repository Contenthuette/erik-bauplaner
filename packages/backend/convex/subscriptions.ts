import { v } from "convex/values";
import { authQuery } from "./functions";
import { internalMutation, internalQuery } from "./_generated/server";
import { istBetrieb } from "./access";
import { subscriptionStatusValidator } from "./schema";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Abo-Status (Stripe) — Lesezugriff & interne Synchronisation
// =============================================================================
// Das Abo gehört dem Betrieb (companies). Der Inhaber schließt es ab; alle
// Mitglieder des Betriebs erben den Zugriff. Kunden (rolle "kunde") benötigen
// kein Abo und haben immer Zugriff.

// Plan-Eckdaten (für die UI; Netto, MwSt. wird von Stripe "on top" berechnet).
export const PLAN = {
    nettoCent: 4900,
    mwstProzent: 19,
    bruttoCent: 5831,
    waehrung: "EUR",
    trialTage: 7,
} as const;

/**
 * Ob ein Abo-Status vollen Zugriff gewährt (Trial oder aktiv).
 */
export function hatZugriff(status: string | undefined): boolean {
    return status === "trialing" || status === "active";
}

/**
 * Liefert den Abo-Status für den aktuellen Nutzer.
 * - Kunden: immer freigeschaltet (kein Abo nötig).
 * - Betrieb: Status der zugehörigen Company.
 */
export const getMySubscription = authQuery({
    args: {},
    returns: v.object({
        // Ob die App freigeschaltet ist.
        freigeschaltet: v.boolean(),
        // Ob für diesen Nutzer überhaupt ein Abo relevant ist.
        aboRelevant: v.boolean(),
        // Ob der aktuelle Nutzer das Abo verwalten darf (Inhaber).
        kannVerwalten: v.boolean(),
        status: v.optional(subscriptionStatusValidator),
        currentPeriodEnd: v.optional(v.number()),
        cancelAtPeriodEnd: v.optional(v.boolean()),
        // Plan-Eckdaten für die UI.
        plan: v.object({
            nettoCent: v.number(),
            mwstProzent: v.number(),
            bruttoCent: v.number(),
            waehrung: v.string(),
            trialTage: v.number(),
        }),
    }),
    handler: async (ctx) => {
        const user = ctx.user;
        const planObj = {
            nettoCent: PLAN.nettoCent,
            mwstProzent: PLAN.mwstProzent,
            bruttoCent: PLAN.bruttoCent,
            waehrung: PLAN.waehrung,
            trialTage: PLAN.trialTage,
        };

        // Kunden brauchen kein Abo.
        if (!istBetrieb(user)) {
            return {
                freigeschaltet: true,
                aboRelevant: false,
                kannVerwalten: false,
                status: undefined,
                currentPeriodEnd: undefined,
                cancelAtPeriodEnd: undefined,
                plan: planObj,
            };
        }

        const company = user.companyId
            ? await ctx.db.get(user.companyId)
            : null;
        const status = company?.subscriptionStatus ?? "none";
        return {
            freigeschaltet: hatZugriff(status),
            aboRelevant: true,
            kannVerwalten: user.rolle === "owner",
            status,
            currentPeriodEnd: company?.currentPeriodEnd,
            cancelAtPeriodEnd: company?.cancelAtPeriodEnd,
            plan: planObj,
        };
    },
});

// --- Interne Helfer für die Stripe-Action/Webhooks ---

export const _getCompanyForUser = internalQuery({
    args: { userId: v.id("users") },
    returns: v.union(
        v.null(),
        v.object({
            companyId: v.id("companies"),
            istOwner: v.boolean(),
            stripeCustomerId: v.optional(v.string()),
            email: v.optional(v.string()),
            name: v.optional(v.string()),
        })
    ),
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.companyId) return null;
        const company = await ctx.db.get(user.companyId);
        if (!company) return null;
        return {
            companyId: company._id,
            istOwner: user.rolle === "owner",
            stripeCustomerId: company.stripeCustomerId,
            email: user.email,
            name: company.name,
        };
    },
});

export const _getCompanyStripeIds = internalQuery({
    args: { companyId: v.id("companies") },
    returns: v.union(
        v.null(),
        v.object({
            stripeCustomerId: v.optional(v.string()),
            stripeSubscriptionId: v.optional(v.string()),
        })
    ),
    handler: async (ctx, args) => {
        const company = await ctx.db.get(args.companyId);
        if (!company) return null;
        return {
            stripeCustomerId: company.stripeCustomerId,
            stripeSubscriptionId: company.stripeSubscriptionId,
        };
    },
});

export const _setStripeCustomerId = internalMutation({
    args: { companyId: v.id("companies"), stripeCustomerId: v.string() },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.companyId, {
            stripeCustomerId: args.stripeCustomerId,
        });
        return null;
    },
});

/**
 * Findet eine Company anhand der Stripe-Customer-ID.
 */
export const _findCompanyByCustomer = internalQuery({
    args: { stripeCustomerId: v.string() },
    returns: v.union(v.null(), v.id("companies")),
    handler: async (ctx, args) => {
        const company = await ctx.db
            .query("companies")
            .withIndex("by_stripe_customer", (q) =>
                q.eq("stripeCustomerId", args.stripeCustomerId)
            )
            .first();
        return company?._id ?? null;
    },
});

/**
 * Synchronisiert den Abo-Status einer Company (aus Stripe-Webhook).
 */
export const _syncSubscription = internalMutation({
    args: {
        stripeCustomerId: v.string(),
        stripeSubscriptionId: v.string(),
        status: subscriptionStatusValidator,
        currentPeriodEnd: v.optional(v.number()),
        cancelAtPeriodEnd: v.boolean(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const company = await ctx.db
            .query("companies")
            .withIndex("by_stripe_customer", (q) =>
                q.eq("stripeCustomerId", args.stripeCustomerId)
            )
            .first();
        if (!company) {
            console.error(
                "Keine Company für Stripe-Customer gefunden:",
                args.stripeCustomerId
            );
            return null;
        }
        await ctx.db.patch(company._id, {
            stripeSubscriptionId: args.stripeSubscriptionId,
            subscriptionStatus: args.status,
            currentPeriodEnd: args.currentPeriodEnd,
            cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        });
        return null;
    },
});
