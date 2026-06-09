import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { pushNotifications } from "./push";

// =============================================================================
// Benachrichtigungs-Engine
// =============================================================================
// Zentrale Stelle, die bei Domain-Ereignissen ausgelöst wird. Sie:
//  1. respektiert die Benachrichtigungs-Einstellungen des Users (Typ abschaltbar)
//  2. legt eine In-App-Benachrichtigung an (erscheint im Feed)
//  3. sendet Push, falls ein Token vorhanden ist
//  4. Fallback: sendet E-Mail, falls kein Push-Token registriert ist

export type NotifyTyp =
    | "status_update"
    | "schritt_erledigt"
    | "neue_nachricht"
    | "neue_rechnung"
    | "rechnung_ueberfaellig";

// Ordnet einen Benachrichtigungstyp dem zugehörigen Einstellungs-Schalter zu.
function prefKeyFor(typ: NotifyTyp): string {
    switch (typ) {
        case "status_update":
            return "statusUpdate";
        case "schritt_erledigt":
            return "schrittErledigt";
        case "neue_nachricht":
            return "neueNachricht";
        case "neue_rechnung":
        case "rechnung_ueberfaellig":
            return "neueRechnung";
    }
}

/**
 * Löst eine Benachrichtigung für genau einen User aus.
 * Wird aus Mutationen heraus aufgerufen (Update posten, Nachricht senden ...).
 */
export async function notifyUser(
    ctx: MutationCtx,
    args: {
        userId: Id<"users">;
        typ: NotifyTyp;
        titel: string;
        text: string;
        bezugId?: string;
    }
): Promise<void> {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    // Einstellungen respektieren.
    const prefs = user.benachrichtigungsPrefs as
        | Record<string, boolean>
        | undefined;
    const key = prefKeyFor(args.typ);
    if (prefs && prefs[key] === false) {
        return; // Dieser Typ ist vom User abgeschaltet.
    }

    // 1. In-App-Benachrichtigung anlegen.
    await ctx.db.insert("notifications", {
        userId: args.userId,
        typ: args.typ,
        titel: args.titel,
        text: args.text,
        bezugId: args.bezugId,
        gelesen: false,
        erstelltAm: Date.now(),
    });

    // 2. Push, falls Token vorhanden — sonst E-Mail-Fallback.
    if (user.pushToken) {
        try {
            await pushNotifications.sendPushNotification(ctx, {
                userId: args.userId,
                notification: {
                    title: args.titel,
                    body: args.text,
                    data: args.bezugId
                        ? { typ: args.typ, bezugId: args.bezugId }
                        : { typ: args.typ },
                },
                allowUnregisteredTokens: true,
            });
        } catch {
            // Push-Fehler dürfen die Mutation nicht scheitern lassen.
        }
    } else if (user.email) {
        // Scheduler safe: einmaliger Fallback-Versand, kein Loop/Burst.
        await ctx.scheduler.runAfter(0, internal.notify.sendEmailFallback, {
            email: user.email,
            titel: args.titel,
            text: args.text,
        });
    }
}

/**
 * E-Mail-Fallback über Resend (HTTP-API). Wird nur genutzt, wenn der User
 * keinen Push-Token registriert hat.
 */
export const sendEmailFallback = internalAction({
    args: {
        email: v.string(),
        titel: v.string(),
        text: v.string(),
    },
    returns: v.null(),
    handler: async (_ctx, args) => {
        const apiKey = process.env.AUTH_RESEND_KEY;
        if (!apiKey) {
            console.warn(
                "AUTH_RESEND_KEY nicht gesetzt — E-Mail-Fallback übersprungen."
            );
            return null;
        }
        try {
            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: "Polier <onboarding@resend.dev>",
                    to: [args.email],
                    subject: `Polier — ${args.titel}`,
                    text: `${args.titel}\n\n${args.text}\n\nÖffne die Polier-App, um mehr zu sehen.`,
                }),
            });
        } catch (e) {
            console.error("E-Mail-Fallback fehlgeschlagen:", e);
        }
        return null;
    },
});
