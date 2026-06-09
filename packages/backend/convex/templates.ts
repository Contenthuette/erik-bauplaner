import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { istBetrieb, requireCompanyId, loadProjectForUser } from "./access";

// =============================================================================
// Vorlagen (Templates) für Ablaufpläne
// =============================================================================

const schrittValidator = v.object({
    titel: v.string(),
    beschreibung: v.optional(v.string()),
});

/**
 * Vorlagen des Betriebs.
 */
export const listTemplates = authQuery({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("templates"),
            name: v.string(),
            anzahlSchritte: v.number(),
        })
    ),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return [];
        const templates = await ctx.db
            .query("templates")
            .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
            .collect();
        return templates.map((t) => ({
            _id: t._id,
            name: t.name,
            anzahlSchritte: Array.isArray(t.schritteJson)
                ? t.schritteJson.length
                : 0,
        }));
    },
});

/**
 * Erstellt eine Vorlage aus expliziten Schritten.
 */
export const createTemplate = authMutation({
    args: {
        name: v.string(),
        schritte: v.array(schrittValidator),
    },
    returns: v.id("templates"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const companyId = requireCompanyId(user);
        const name = args.name.trim();
        if (!name) throw new Error("Name ist erforderlich.");
        return await ctx.db.insert("templates", {
            companyId,
            name,
            schritteJson: args.schritte,
        });
    },
});

/**
 * Speichert den Ablaufplan eines bestehenden Projekts als Vorlage.
 */
export const saveProjectAsTemplate = authMutation({
    args: {
        projectId: v.id("projects"),
        name: v.string(),
    },
    returns: v.id("templates"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const companyId = requireCompanyId(user);
        const project = await loadProjectForUser(ctx, user, args.projectId);
        const name = args.name.trim();
        if (!name) throw new Error("Name ist erforderlich.");

        const stages = await ctx.db
            .query("stages")
            .withIndex("by_project_and_reihenfolge", (q) =>
                q.eq("projectId", project._id)
            )
            .collect();
        stages.sort((a, b) => a.reihenfolge - b.reihenfolge);
        const schritte = stages.map((s) => ({
            titel: s.titel,
            beschreibung: s.beschreibung,
        }));

        return await ctx.db.insert("templates", {
            companyId,
            name,
            schritteJson: schritte,
        });
    },
});

/**
 * Löscht eine Vorlage.
 */
export const deleteTemplate = authMutation({
    args: { templateId: v.id("templates") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const companyId = requireCompanyId(user);
        const template = await ctx.db.get(args.templateId);
        if (!template || template.companyId !== companyId) {
            throw new Error("Vorlage nicht gefunden.");
        }
        await ctx.db.delete(args.templateId);
        return null;
    },
});

/**
 * Legt die zwei Dachdecker-Beispielvorlagen an, falls noch keine existieren.
 * Idempotent — kann gefahrlos mehrfach aufgerufen werden.
 */
export const seedDachdeckerTemplates = authMutation({
    args: {},
    returns: v.object({ erstellt: v.number() }),
    handler: async (ctx) => {
        const user = ctx.user;
        const companyId = requireCompanyId(user);

        const existing = await ctx.db
            .query("templates")
            .withIndex("by_company", (q) => q.eq("companyId", companyId))
            .collect();
        const namen = new Set(existing.map((t) => t.name));

        const vorlagen: Array<{ name: string; schritte: string[] }> = [
            {
                name: "Steildach Neueindeckung",
                schritte: [
                    "Aufmaß & Planung",
                    "Gerüst aufbauen",
                    "Alte Eindeckung abtragen",
                    "Dachlattung erneuern",
                    "Unterspannbahn",
                    "Neue Eindeckung",
                    "Spengler-/Klempnerarbeiten",
                    "Gerüst abbauen",
                    "Endabnahme",
                ],
            },
            {
                name: "Flachdach Sanierung",
                schritte: [
                    "Bestandsaufnahme",
                    "Gerüst/Absturzsicherung",
                    "Alte Abdichtung entfernen",
                    "Dämmung verlegen",
                    "Neue Abdichtung",
                    "Anschlüsse & Details",
                    "Dichtheitsprüfung",
                    "Endabnahme",
                ],
            },
        ];

        let erstellt = 0;
        for (const vorlage of vorlagen) {
            if (namen.has(vorlage.name)) continue;
            await ctx.db.insert("templates", {
                companyId,
                name: vorlage.name,
                schritteJson: vorlage.schritte.map((titel) => ({ titel })),
            });
            erstellt++;
        }
        return { erstellt };
    },
});
