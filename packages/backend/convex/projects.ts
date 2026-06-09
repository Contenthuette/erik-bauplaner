import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import {
    istBetrieb,
    requireCompanyId,
    loadProjectForUser,
} from "./access";
import { projectStatusValidator } from "./schema";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";

// =============================================================================
// Projekte — Liste, Detail, Anlegen, Bearbeiten (Betrieb)
// =============================================================================

const projectListItem = v.object({
    _id: v.id("projects"),
    titel: v.string(),
    typ: v.optional(v.string()),
    adresse: v.optional(v.string()),
    status: projectStatusValidator,
    startPlan: v.optional(v.number()),
    endePlan: v.optional(v.number()),
    auftragswert: v.optional(v.number()),
    fortschrittProzent: v.number(),
    kundeName: v.optional(v.string()),
    erstelltAm: v.number(),
});

async function kundeNameFor(
    ctx: { db: { get: (id: Id<"users">) => Promise<Doc<"users"> | null> } },
    customerId: Id<"users"> | undefined
): Promise<string | undefined> {
    if (!customerId) return undefined;
    const kunde = await ctx.db.get(customerId);
    return kunde?.name;
}

/**
 * Projekte des Betriebs. Optional gefiltert nach Status.
 */
export const listProjects = authQuery({
    args: {},
    returns: v.array(projectListItem),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istBetrieb(user) || !user.companyId) return [];
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
            .order("desc")
            .collect();

        const items = [];
        for (const p of projekte) {
            items.push({
                _id: p._id,
                titel: p.titel,
                typ: p.typ,
                adresse: p.adresse,
                status: p.status,
                startPlan: p.startPlan,
                endePlan: p.endePlan,
                auftragswert: p.auftragswert,
                fortschrittProzent: p.fortschrittProzent,
                kundeName: await kundeNameFor(ctx, p.customerId),
                erstelltAm: p.erstelltAm,
            });
        }
        return items;
    },
});

/**
 * Projekt-Detail (Stammdaten + Kundenname). Zugriff serverseitig geprüft.
 */
export const getProject = authQuery({
    args: { projectId: v.id("projects") },
    returns: v.union(
        v.null(),
        v.object({
            _id: v.id("projects"),
            titel: v.string(),
            typ: v.optional(v.string()),
            adresse: v.optional(v.string()),
            status: projectStatusValidator,
            startPlan: v.optional(v.number()),
            endePlan: v.optional(v.number()),
            auftragswert: v.optional(v.number()),
            fortschrittProzent: v.number(),
            aktuellerStageId: v.optional(v.id("stages")),
            customerId: v.optional(v.id("users")),
            kundeName: v.optional(v.string()),
            kundeEmail: v.optional(v.string()),
            erstelltAm: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const project = await loadProjectForUser(ctx, user, args.projectId);
        const kunde = project.customerId
            ? await ctx.db.get(project.customerId)
            : null;
        return {
            _id: project._id,
            titel: project.titel,
            typ: project.typ,
            adresse: project.adresse,
            status: project.status,
            startPlan: project.startPlan,
            endePlan: project.endePlan,
            auftragswert: project.auftragswert,
            fortschrittProzent: project.fortschrittProzent,
            aktuellerStageId: project.aktuellerStageId,
            customerId: project.customerId,
            kundeName: kunde?.name,
            kundeEmail: kunde?.email,
            erstelltAm: project.erstelltAm,
        };
    },
});

/**
 * Legt ein Projekt an. Optional werden Schritte aus einer Vorlage kopiert.
 */
export const createProject = authMutation({
    args: {
        customerId: v.optional(v.id("users")),
        titel: v.string(),
        typ: v.optional(v.string()),
        adresse: v.optional(v.string()),
        startPlan: v.optional(v.number()),
        endePlan: v.optional(v.number()),
        auftragswert: v.optional(v.number()),
        templateId: v.optional(v.id("templates")),
    },
    returns: v.id("projects"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const companyId = requireCompanyId(user);

        const titel = args.titel.trim();
        if (!titel) throw new Error("Projekttitel ist erforderlich.");

        // Kunde (falls angegeben) muss zur Company gehören.
        if (args.customerId) {
            const kunde = await ctx.db.get(args.customerId);
            if (!kunde || kunde.companyId !== companyId || kunde.rolle !== "kunde") {
                throw new Error("Ungültiger Kunde.");
            }
        }

        const projectId = await ctx.db.insert("projects", {
            companyId,
            customerId: args.customerId,
            titel,
            typ: args.typ?.trim() || undefined,
            adresse: args.adresse?.trim() || undefined,
            status: "geplant",
            startPlan: args.startPlan,
            endePlan: args.endePlan,
            auftragswert: args.auftragswert,
            fortschrittProzent: 0,
            erstelltAm: Date.now(),
        });

        // Schritte aus Vorlage kopieren.
        if (args.templateId) {
            const template = await ctx.db.get(args.templateId);
            if (template && template.companyId === companyId) {
                const schritte = Array.isArray(template.schritteJson)
                    ? (template.schritteJson as Array<{
                          titel: string;
                          beschreibung?: string;
                      }>)
                    : [];
                let reihenfolge = 0;
                for (const schritt of schritte) {
                    await ctx.db.insert("stages", {
                        projectId,
                        companyId,
                        reihenfolge,
                        titel: schritt.titel,
                        beschreibung: schritt.beschreibung,
                        status: "offen",
                    });
                    reihenfolge++;
                }
            }
        }

        return projectId;
    },
});

/**
 * Aktualisiert Stammdaten / Status / Auftragswert eines Projekts.
 */
export const updateProject = authMutation({
    args: {
        projectId: v.id("projects"),
        titel: v.optional(v.string()),
        typ: v.optional(v.string()),
        adresse: v.optional(v.string()),
        status: v.optional(projectStatusValidator),
        startPlan: v.optional(v.number()),
        endePlan: v.optional(v.number()),
        auftragswert: v.optional(v.number()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const project = await loadProjectForUser(ctx, user, args.projectId);
        if (!istBetrieb(user)) {
            throw new Error("Nur Betriebe dürfen Projekte bearbeiten.");
        }

        const patch: Partial<Doc<"projects">> = {};
        if (args.titel !== undefined) patch.titel = args.titel.trim();
        if (args.typ !== undefined) patch.typ = args.typ.trim() || undefined;
        if (args.adresse !== undefined)
            patch.adresse = args.adresse.trim() || undefined;
        if (args.status !== undefined) patch.status = args.status;
        if (args.startPlan !== undefined) patch.startPlan = args.startPlan;
        if (args.endePlan !== undefined) patch.endePlan = args.endePlan;
        if (args.auftragswert !== undefined)
            patch.auftragswert = args.auftragswert;

        await ctx.db.patch(project._id, patch);
        return null;
    },
});

/**
 * Hilfsfunktion: berechnet Fortschritt aus erledigten Schritten neu.
 * Wird von stages.ts aufgerufen.
 */
export async function recomputeProjectProgress(
    ctx: MutationCtx,
    projectId: Id<"projects">
): Promise<void> {
    const stages = await ctx.db
        .query("stages")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .collect();
    if (stages.length === 0) {
        await ctx.db.patch(projectId, { fortschrittProzent: 0 });
        return;
    }
    const erledigt = stages.filter((s) => s.status === "erledigt").length;
    const prozent = Math.round((erledigt / stages.length) * 100);
    await ctx.db.patch(projectId, { fortschrittProzent: prozent });
}
