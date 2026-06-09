import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { loadProjectForUser, istBetrieb } from "./access";
import { updateTypValidator } from "./schema";

// =============================================================================
// Status-Updates am Projekt (Fortschritt / Verzögerung / Wetter / Info)
// =============================================================================

/**
 * Erzeugt eine Upload-URL für ein Foto (Convex File Storage).
 */
export const generateUploadUrl = authMutation({
    args: {},
    returns: v.string(),
    handler: async (ctx) => {
        if (!istBetrieb(ctx.user)) throw new Error("Kein Zugriff.");
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Postet ein Status-Update am Projekt. Fotos werden als Storage-IDs übergeben.
 */
export const postUpdate = authMutation({
    args: {
        projectId: v.id("projects"),
        typ: updateTypValidator,
        text: v.string(),
        fotoIds: v.optional(v.array(v.id("_storage"))),
    },
    returns: v.id("updates"),
    handler: async (ctx, args) => {
        const user = ctx.user;
        if (!istBetrieb(user)) throw new Error("Kein Zugriff.");
        const project = await loadProjectForUser(ctx, user, args.projectId);

        const text = args.text.trim();
        if (!text) throw new Error("Text ist erforderlich.");

        const updateId = await ctx.db.insert("updates", {
            projectId: project._id,
            companyId: project.companyId,
            typ: args.typ,
            text,
            fotoUrls: args.fotoIds && args.fotoIds.length > 0 ? args.fotoIds : undefined,
            erstelltVon: user._id,
            erstelltAm: Date.now(),
        });

        // Bei Verzögerung Projektstatus auf "verzoegert" setzen.
        if (args.typ === "verzoegerung" && project.status !== "abgeschlossen") {
            await ctx.db.patch(project._id, { status: "verzoegert" });
        }

        // Hinweis: Kundenbenachrichtigung folgt in einem späteren Schritt.
        return updateId;
    },
});

/**
 * Updates eines Projekts (neueste zuerst) inkl. aufgelöster Foto-URLs.
 */
export const listUpdates = authQuery({
    args: { projectId: v.id("projects") },
    returns: v.array(
        v.object({
            _id: v.id("updates"),
            typ: updateTypValidator,
            text: v.string(),
            fotoUrls: v.array(v.string()),
            erstelltAm: v.number(),
        })
    ),
    handler: async (ctx, args) => {
        const user = ctx.user;
        const project = await loadProjectForUser(ctx, user, args.projectId);
        const updates = await ctx.db
            .query("updates")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .order("desc")
            .collect();

        const result = [];
        for (const u of updates) {
            const urls: string[] = [];
            if (u.fotoUrls) {
                for (const id of u.fotoUrls) {
                    const url = await ctx.storage.getUrl(id);
                    if (url) urls.push(url);
                }
            }
            result.push({
                _id: u._id,
                typ: u.typ,
                text: u.text,
                fotoUrls: urls,
                erstelltAm: u.erstelltAm,
            });
        }
        return result;
    },
});
