import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

// =============================================================================
// Benachrichtigungen — Anzeige (Auslöse-Logik & Push folgen später)
// =============================================================================

const notificationItem = v.object({
    _id: v.id("notifications"),
    typ: v.string(),
    titel: v.string(),
    text: v.string(),
    bezugId: v.optional(v.string()),
    gelesen: v.boolean(),
    erstelltAm: v.number(),
});

/**
 * Alle Benachrichtigungen des eingeloggten Users (neueste zuerst).
 */
export const listMyNotifications = authQuery({
    args: {},
    returns: v.array(notificationItem),
    handler: async (ctx) => {
        const user = ctx.user;
        const items = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();
        return items.map((n) => ({
            _id: n._id,
            typ: n.typ,
            titel: n.titel,
            text: n.text,
            bezugId: n.bezugId,
            gelesen: n.gelesen,
            erstelltAm: n.erstelltAm,
        }));
    },
});

/**
 * Anzahl ungelesener Benachrichtigungen (für das Glocken-Badge).
 */
export const unreadCount = authQuery({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const user = ctx.user;
        const ungelesen = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_gelesen", (q) =>
                q.eq("userId", user._id).eq("gelesen", false)
            )
            .collect();
        return ungelesen.length;
    },
});

/**
 * Markiert eine Benachrichtigung als gelesen.
 */
export const markRead = authMutation({
    args: { notificationId: v.id("notifications") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const n = await ctx.db.get(args.notificationId);
        if (!n || n.userId !== user._id) {
            throw new Error("Benachrichtigung nicht gefunden.");
        }
        if (!n.gelesen) {
            await ctx.db.patch(n._id, { gelesen: true });
        }
        return null;
    },
});

/**
 * Markiert alle Benachrichtigungen des Users als gelesen.
 */
export const markAllRead = authMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const user = ctx.user;
        const ungelesen = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_gelesen", (q) =>
                q.eq("userId", user._id).eq("gelesen", false)
            )
            .collect();
        for (const n of ungelesen) {
            await ctx.db.patch(n._id, { gelesen: true });
        }
        return null;
    },
});
