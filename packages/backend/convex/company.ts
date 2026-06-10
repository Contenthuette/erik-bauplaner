import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { createAccount, getAuthUserId } from "@convex-dev/auth/server";
import { istBetrieb, requireCompanyId } from "./access";
import { Id, Doc } from "./_generated/dataModel";
import { rolleValidator } from "./schema";

// =============================================================================
// Firmenprofil & Team-Verwaltung (Betrieb)
// =============================================================================

/**
 * Firmenprofil des Betriebs (für Einstellungen).
 */
export const getMyCompany = authQuery({
    args: {},
    returns: v.union(
        v.null(),
        v.object({
            _id: v.id("companies"),
            name: v.string(),
            kontaktEmail: v.optional(v.string()),
            kontaktTelefon: v.optional(v.string()),
            adresse: v.optional(v.string()),
            logoUrl: v.optional(v.string()),
            meineRolle: v.optional(rolleValidator),
        })
    ),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return null;
        const company = await ctx.db.get(user.companyId);
        if (!company) return null;
        const logoUrl = company.logo
            ? (await ctx.storage.getUrl(company.logo)) ?? undefined
            : undefined;
        return {
            _id: company._id,
            name: company.name,
            kontaktEmail: company.kontaktEmail,
            kontaktTelefon: company.kontaktTelefon,
            adresse: company.adresse,
            logoUrl,
            meineRolle: user.rolle,
        };
    },
});

/**
 * Upload-URL für das Firmenlogo.
 */
export const generateLogoUploadUrl = authMutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        if (ctx.user.rolle !== "owner") {
            throw new Error("Nur der Inhaber darf das Firmenprofil ändern.");
        }
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Aktualisiert das Firmenprofil. Nur der Inhaber (owner) darf das.
 */
export const updateCompany = authMutation({
    args: {
        name: v.optional(v.string()),
        kontaktEmail: v.optional(v.string()),
        kontaktTelefon: v.optional(v.string()),
        adresse: v.optional(v.string()),
        logoId: v.optional(v.id("_storage")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (user.rolle !== "owner") {
            throw new Error("Nur der Inhaber darf das Firmenprofil ändern.");
        }
        const companyId = requireCompanyId(user);
        const patch: Partial<Doc<"companies">> = {};
        if (args.name !== undefined) {
            const n = args.name.trim();
            if (!n) throw new Error("Firmenname darf nicht leer sein.");
            patch.name = n;
        }
        if (args.kontaktEmail !== undefined)
            patch.kontaktEmail = args.kontaktEmail.trim() || undefined;
        if (args.kontaktTelefon !== undefined)
            patch.kontaktTelefon = args.kontaktTelefon.trim() || undefined;
        if (args.adresse !== undefined)
            patch.adresse = args.adresse.trim() || undefined;
        if (args.logoId !== undefined) patch.logo = args.logoId;
        await ctx.db.patch(companyId, patch);
        return null;
    },
});

/**
 * Team-Mitglieder des Betriebs (owner + mitarbeiter).
 */
export const listTeam = authQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("users"),
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            rolle: v.optional(rolleValidator),
            istIch: v.boolean(),
        })
    ),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return [];
        const team = await ctx.db
            .query("users")
            .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
            .collect();
        return team
            .filter((m) => m.rolle === "owner" || m.rolle === "mitarbeiter")
            .map((m) => ({
                _id: m._id,
                name: m.name,
                email: m.email,
                rolle: m.rolle,
                istIch: m._id === user._id,
            }))
            .sort((a, b) => {
                if (a.rolle !== b.rolle) return a.rolle === "owner" ? -1 : 1;
                return (a.name ?? "").localeCompare(b.name ?? "");
            });
    },
});

// --- Mitarbeiter einladen (Action, da createAccount) ---

function generateTempPassword(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
    return out;
}

export const _getOwnerForTeamInvite = internalQuery({
    args: { userId: v.id("users") },
    returns: v.union(
        v.null(),
        v.object({ companyId: v.union(v.id("companies"), v.null()), istOwner: v.boolean() })
    ),
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        return {
            companyId: user.companyId ?? null,
            istOwner: user.rolle === "owner",
        };
    },
});

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

export const _finalizeTeamMember = internalMutation({
    args: {
        userId: v.id("users"),
        companyId: v.id("companies"),
        name: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            companyId: args.companyId,
            rolle: "mitarbeiter",
            name: args.name,
        });
        return null;
    },
});

/**
 * Lädt einen Mitarbeiter ein (Rolle "mitarbeiter"). Nur der Inhaber darf das.
 * Gibt einmalig die Zugangsdaten zurück.
 */
export const inviteTeamMember = action({
    args: {
        name: v.string(),
        email: v.string(),
    },
    returns: v.object({
        userId: v.id("users"),
        login: v.string(),
        tempPassword: v.string(),
        name: v.string(),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Nicht angemeldet.");
        const caller = await ctx.runQuery(
            internal.company._getOwnerForTeamInvite,
            { userId }
        );
        if (!caller || !caller.istOwner || !caller.companyId) {
            throw new Error("Nur der Inhaber darf Mitarbeiter einladen.");
        }
        const name = args.name.trim();
        if (!name) throw new Error("Name ist erforderlich.");
        const login = args.email.trim().toLowerCase();
        if (!login) throw new Error("E-Mail ist erforderlich.");
        const exists = await ctx.runQuery(internal.company._loginExists, { login });
        if (exists) throw new Error("Diese E-Mail ist bereits vergeben.");

        const tempPassword = generateTempPassword();
        const created = (await createAccount(ctx, {
            provider: "password",
            account: { id: login, secret: tempPassword },
            profile: {
                email: login,
                name,
                rolle: "mitarbeiter",
                companyId: caller.companyId,
            } as Partial<Doc<"users">> as never,
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
        })) as { user: { _id: Id<"users"> } };

        await ctx.runMutation(internal.company._finalizeTeamMember, {
            userId: created.user._id,
            companyId: caller.companyId,
            name,
        });

        return { userId: created.user._id, login, tempPassword, name };
    },
});

/**
 * Entfernt einen Mitarbeiter aus dem Betrieb (nur Inhaber, nicht sich selbst).
 */
export const removeTeamMember = authMutation({
    args: { userId: v.id("users") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (user.rolle !== "owner") {
            throw new Error("Nur der Inhaber darf Mitarbeiter entfernen.");
        }
        if (args.userId === user._id) {
            throw new Error("Sie können sich nicht selbst entfernen.");
        }
        const member = await ctx.db.get(args.userId);
        if (!member || member.companyId !== user.companyId) {
            throw new Error("Mitarbeiter nicht gefunden.");
        }
        if (member.rolle !== "mitarbeiter") {
            throw new Error("Nur Mitarbeiter können entfernt werden.");
        }
        await ctx.db.patch(args.userId, {
            companyId: undefined,
            rolle: undefined,
        });
        return null;
    },
});
