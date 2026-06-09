import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { loadProjectForUser, istBetrieb, requireCompanyId } from "./access";
import { stageStatusValidator } from "./schema";
import { recomputeProjectProgress } from "./projects";
import { Doc } from "./_generated/dataModel";
import { notifyUser } from "./notify";

// =============================================================================
// Ablaufplan-Schritte (Stages) — Herzstück der Admin-Seite
// =============================================================================

const stageItem = v.object({
    _id: v.id("stages"),
    projectId: v.id("projects"),
    reihenfolge: v.number(),
    titel: v.string(),
    beschreibung: v.optional(v.string()),
    status: stageStatusValidator,
    startPlan: v.optional(v.number()),
    endePlan: v.optional(v.number()),
    startIst: v.optional(v.number()),
    endeIst: v.optional(v.number()),
    notiz: v.optional(v.string()),
    istAktuell: v.boolean(),
});

/**
 * Alle Schritte eines Projekts in Reihenfolge.
 */
export const listStages = authQuery({
    args: { projectId: v.id("projects") },
    returns: v.array(stageItem),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const project = await loadProjectForUser(ctx, user, args.projectId);
        const stages = await ctx.db
            .query("stages")
            .withIndex("by_project_and_reihenfolge", (q) =>
                q.eq("projectId", project._id)
            )
            .collect();
        stages.sort((a, b) => a.reihenfolge - b.reihenfolge);
        return stages.map((s) => ({
            _id: s._id,
            projectId: s.projectId,
            reihenfolge: s.reihenfolge,
            titel: s.titel,
            beschreibung: s.beschreibung,
            status: s.status,
            startPlan: s.startPlan,
            endePlan: s.endePlan,
            startIst: s.startIst,
            endeIst: s.endeIst,
            notiz: s.notiz,
            istAktuell: project.aktuellerStageId === s._id,
        }));
    },
});

/**
 * Fügt einen Schritt am Ende des Ablaufplans hinzu.
 */
export const addStage = authMutation({
    args: {
        projectId: v.id("projects"),
        titel: v.string(),
        beschreibung: v.optional(v.string()),
        startPlan: v.optional(v.number()),
        endePlan: v.optional(v.number()),
    },
    returns: v.id("stages"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const project = await loadProjectForUser(ctx, user, args.projectId);
        const companyId = requireCompanyId(user);

        const titel = args.titel.trim();
        if (!titel) throw new Error("Titel ist erforderlich.");

        const existing = await ctx.db
            .query("stages")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect();
        const maxReihenfolge = existing.reduce(
            (max, s) => Math.max(max, s.reihenfolge),
            -1
        );

        const stageId = await ctx.db.insert("stages", {
            projectId: project._id,
            companyId,
            reihenfolge: maxReihenfolge + 1,
            titel,
            beschreibung: args.beschreibung?.trim() || undefined,
            status: "offen",
            startPlan: args.startPlan,
            endePlan: args.endePlan,
        });
        await recomputeProjectProgress(ctx, project._id);
        return stageId;
    },
});

/**
 * Aktualisiert Felder eines Schritts (Titel, Beschreibung, Zeitraum, Notiz).
 */
export const updateStage = authMutation({
    args: {
        stageId: v.id("stages"),
        titel: v.optional(v.string()),
        beschreibung: v.optional(v.string()),
        startPlan: v.optional(v.number()),
        endePlan: v.optional(v.number()),
        notiz: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const stage = await ctx.db.get(args.stageId);
        if (!stage) throw new Error("Schritt nicht gefunden.");
        await loadProjectForUser(ctx, user, stage.projectId);

        const patch: Partial<Doc<"stages">> = {};
        if (args.titel !== undefined) patch.titel = args.titel.trim();
        if (args.beschreibung !== undefined)
            patch.beschreibung = args.beschreibung.trim() || undefined;
        if (args.startPlan !== undefined) patch.startPlan = args.startPlan;
        if (args.endePlan !== undefined) patch.endePlan = args.endePlan;
        if (args.notiz !== undefined)
            patch.notiz = args.notiz.trim() || undefined;
        await ctx.db.patch(stage._id, patch);
        return null;
    },
});

/**
 * Setzt den Status eines Schritts. Beim Wechsel auf "erledigt" wird ein Update
 * erzeugt (Grundlage für spätere Kundenbenachrichtigung) und der Fortschritt
 * neu berechnet. Beim Start ("laeuft") wird startIst gesetzt.
 */
export const setStageStatus = authMutation({
    args: {
        stageId: v.id("stages"),
        status: stageStatusValidator,
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const stage = await ctx.db.get(args.stageId);
        if (!stage) throw new Error("Schritt nicht gefunden.");
        const project = await loadProjectForUser(ctx, user, stage.projectId);

        const patch: Partial<Doc<"stages">> = { status: args.status };
        const now = Date.now();
        if (args.status === "laeuft" && !stage.startIst) {
            patch.startIst = now;
        }
        if (args.status === "erledigt") {
            patch.endeIst = now;
            if (!stage.startIst) patch.startIst = now;
        }
        await ctx.db.patch(stage._id, patch);

        // Update erzeugen, wenn ein Schritt fertiggestellt wurde.
        if (args.status === "erledigt" && stage.status !== "erledigt") {
            await ctx.db.insert("updates", {
                projectId: project._id,
                companyId: stage.companyId,
                typ: "fortschritt",
                text: `Schritt abgeschlossen: ${stage.titel}`,
                erstelltVon: user._id,
                erstelltAm: now,
            });
            // Kunde benachrichtigen.
            if (project.customerId) {
                await notifyUser(ctx, {
                    userId: project.customerId,
                    typ: "schritt_erledigt",
                    titel: "Schritt abgeschlossen",
                    text: stage.titel,
                    bezugId: project._id,
                });
            }
        }

        await recomputeProjectProgress(ctx, project._id);
        return null;
    },
});

/**
 * Markiert einen Schritt als "aktuellen Schritt" (prominent für den Kunden).
 */
export const setCurrentStage = authMutation({
    args: { stageId: v.id("stages") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const stage = await ctx.db.get(args.stageId);
        if (!stage) throw new Error("Schritt nicht gefunden.");
        const project = await loadProjectForUser(ctx, user, stage.projectId);
        await ctx.db.patch(project._id, { aktuellerStageId: stage._id });
        return null;
    },
});

/**
 * Schritt löschen.
 */
export const deleteStage = authMutation({
    args: { stageId: v.id("stages") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const stage = await ctx.db.get(args.stageId);
        if (!stage) throw new Error("Schritt nicht gefunden.");
        const project = await loadProjectForUser(ctx, user, stage.projectId);
        if (project.aktuellerStageId === stage._id) {
            await ctx.db.patch(project._id, { aktuellerStageId: undefined });
        }
        await ctx.db.delete(stage._id);
        await recomputeProjectProgress(ctx, project._id);
        return null;
    },
});

/**
 * Schritte umsortieren (Drag-and-Drop). Erhält die neue Reihenfolge der IDs.
 */
export const reorderStages = authMutation({
    args: {
        projectId: v.id("projects"),
        stageIds: v.array(v.id("stages")),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const project = await loadProjectForUser(ctx, user, args.projectId);
        let reihenfolge = 0;
        for (const stageId of args.stageIds) {
            const stage = await ctx.db.get(stageId);
            if (stage && stage.projectId === project._id) {
                await ctx.db.patch(stageId, { reihenfolge });
                reihenfolge++;
            }
        }
        return null;
    },
});
