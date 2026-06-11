"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// =============================================================================
// Stripe — Checkout-Session & Webhook-Verarbeitung (Node-Runtime)
// =============================================================================
// Sicherheit: Stripe Secret Key und Webhook-Secret liegen ausschließlich als
// Backend-Umgebungsvariablen vor. Karteneingabe erfolgt über Stripe Checkout
// (gehostet) — es laufen keine Kartendaten durch die App (PCI).

const PLAN = {
    nettoCent: 4900,
    trialTage: 7,
    waehrung: "eur",
} as const;

function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error(
            "STRIPE_SECRET_KEY ist nicht gesetzt. Bitte in den Backend-Umgebungsvariablen hinterlegen."
        );
    }
    // apiVersion bewusst weggelassen — das SDK nutzt seine eingebaute Standardversion.
    return new Stripe(key);
}

function siteUrl(): string {
    return (process.env.SITE_URL ?? "").replace(/\/$/, "");
}

/**
 * Erstellt eine Stripe-Checkout-Session im Subscription-Modus mit 7 Tagen
 * Trial. Die Zahlungsmethode wird zu Beginn erfasst. Gibt die Checkout-URL
 * zurück, zu der die App weiterleitet.
 */
export const createCheckoutSession = action({
    args: {
        // Deep-Link/Web-URL, zu der nach Checkout zurückgeleitet wird.
        returnUrl: v.string(),
    },
    returns: v.object({ url: v.string() }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Nicht angemeldet.");

        const info = await ctx.runQuery(
            internal.subscriptions._getCompanyForUser,
            { userId }
        );
        if (!info) throw new Error("Kein Betrieb zugeordnet.");
        if (!info.istOwner) {
            throw new Error("Nur der Inhaber darf das Abo abschließen.");
        }

        const priceId = process.env.STRIPE_PRICE_ID;
        if (!priceId) {
            throw new Error(
                "STRIPE_PRICE_ID ist nicht gesetzt. Bitte den Abo-Preis in Stripe anlegen und die Price-ID hinterlegen."
            );
        }

        const stripe = getStripe();

        // Stripe-Customer sicherstellen (einer pro Betrieb).
        let customerId = info.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: info.email,
                name: info.name,
                metadata: { companyId: info.companyId },
            });
            customerId = customer.id;
            await ctx.runMutation(
                internal.subscriptions._setStripeCustomerId,
                { companyId: info.companyId, stripeCustomerId: customerId }
            );
        }

        // Stripe verlangt https-URLs. Wir leiten über eine Convex-Route, die
        // anschließend zurück in die App (Deep-Link) springt.
        const siteBase = (process.env.CONVEX_SITE_URL ?? "").replace(/\/$/, "");
        const redirectUrl = `${siteBase}/stripe/return?to=${encodeURIComponent(
            args.returnUrl
        )}`;

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            subscription_data: {
                trial_period_days: PLAN.trialTage,
                metadata: { companyId: info.companyId },
            },
            // MwSt. wird vom Preis (Steuerverhalten "exklusiv") bzw. Stripe Tax
            // "on top" berechnet.
            automatic_tax: { enabled: true },
            customer_update: { address: "auto" },
            payment_method_types: ["card"],
            success_url: redirectUrl,
            cancel_url: redirectUrl,
            metadata: { companyId: info.companyId },
        });

        if (!session.url) {
            throw new Error("Checkout-Session konnte nicht erstellt werden.");
        }
        return { url: session.url };
    },
});

/**
 * Merkt die Kündigung zum Periodenende vor (cancel_at_period_end).
 * Nur der Inhaber darf kündigen.
 */
export const cancelSubscription = action({
    args: {},
    returns: v.object({ cancelAtPeriodEnd: v.boolean() }),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Nicht angemeldet.");
        const info = await ctx.runQuery(
            internal.subscriptions._getCompanyForUser,
            { userId }
        );
        if (!info) throw new Error("Kein Betrieb zugeordnet.");
        if (!info.istOwner) {
            throw new Error("Nur der Inhaber darf kündigen.");
        }
        const ids = await ctx.runQuery(
            internal.subscriptions._getCompanyStripeIds,
            { companyId: info.companyId }
        );
        if (!ids?.stripeSubscriptionId) {
            throw new Error("Kein aktives Abo gefunden.");
        }
        const stripe = getStripe();
        await stripe.subscriptions.update(ids.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });
        return { cancelAtPeriodEnd: true };
    },
});

/**
 * Reaktiviert ein zur Kündigung vorgemerktes Abo (cancel_at_period_end=false).
 */
export const resumeSubscription = action({
    args: {},
    returns: v.object({ cancelAtPeriodEnd: v.boolean() }),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Nicht angemeldet.");
        const info = await ctx.runQuery(
            internal.subscriptions._getCompanyForUser,
            { userId }
        );
        if (!info) throw new Error("Kein Betrieb zugeordnet.");
        if (!info.istOwner) {
            throw new Error("Nur der Inhaber darf das Abo verwalten.");
        }
        const ids = await ctx.runQuery(
            internal.subscriptions._getCompanyStripeIds,
            { companyId: info.companyId }
        );
        if (!ids?.stripeSubscriptionId) {
            throw new Error("Kein Abo gefunden.");
        }
        const stripe = getStripe();
        await stripe.subscriptions.update(ids.stripeSubscriptionId, {
            cancel_at_period_end: false,
        });
        return { cancelAtPeriodEnd: false };
    },
});

function mapStatus(
    s: Stripe.Subscription.Status
):
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "incomplete" {
    switch (s) {
        case "trialing":
            return "trialing";
        case "active":
            return "active";
        case "past_due":
        case "unpaid":
            return "past_due";
        case "canceled":
            return "canceled";
        default:
            return "incomplete";
    }
}

/**
 * Verarbeitet einen Stripe-Webhook. Verifiziert die Signatur mit dem
 * Webhook-Secret und synchronisiert den Abo-Status in die Datenbank.
 */
export const handleWebhook = internalAction({
    args: { signature: v.string(), payload: v.string() },
    returns: v.object({ success: v.boolean() }),
    handler: async (ctx, args) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
            console.error("STRIPE_WEBHOOK_SECRET ist nicht gesetzt.");
            return { success: false };
        }
        const stripe = getStripe();
        let event: Stripe.Event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                args.payload,
                args.signature,
                secret
            );
        } catch (err) {
            console.error("Webhook-Signatur ungültig:", err);
            return { success: false };
        }

        try {
            switch (event.type) {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                case "customer.subscription.deleted": {
                    const sub = event.data.object as Stripe.Subscription;
                    const customerId =
                        typeof sub.customer === "string"
                            ? sub.customer
                            : sub.customer.id;
                    const periodEnd =
                        (sub as unknown as { current_period_end?: number })
                            .current_period_end;
                    await ctx.runMutation(
                        internal.subscriptions._syncSubscription,
                        {
                            stripeCustomerId: customerId,
                            stripeSubscriptionId: sub.id,
                            status:
                                event.type ===
                                "customer.subscription.deleted"
                                    ? "canceled"
                                    : mapStatus(sub.status),
                            currentPeriodEnd: periodEnd
                                ? periodEnd * 1000
                                : undefined,
                            cancelAtPeriodEnd:
                                sub.cancel_at_period_end ?? false,
                        }
                    );
                    break;
                }
                default:
                    // Andere Events ignorieren wir bewusst.
                    break;
            }
            return { success: true };
        } catch (err) {
            console.error("Fehler bei Webhook-Verarbeitung:", err);
            return { success: false };
        }
    },
});
