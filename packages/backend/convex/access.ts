import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// =============================================================================
// Tenancy & Zugriffskontrolle — serverseitig durchgesetzt
// =============================================================================
// Zentrale Helfer, damit jede Domain-Query/Mutation konsistent prüft:
// - Betrieb (owner/mitarbeiter): nur Daten der eigenen companyId
// - Kunde: nur eigene Projekte (customerId === user._id)

type Ctx = QueryCtx | MutationCtx;

export function istBetrieb(user: Doc<"users">): boolean {
    return user.rolle === "owner" || user.rolle === "mitarbeiter";
}

export function istKunde(user: Doc<"users">): boolean {
    return user.rolle === "kunde";
}

/**
 * Stellt sicher, dass der User einem Betrieb angehört und gibt die companyId
 * zurück. Wirft, wenn der User Kunde ist oder keiner Company zugeordnet ist.
 */
export function requireCompanyId(user: Doc<"users">): Id<"companies"> {
    if (!istBetrieb(user)) {
        throw new Error("Kein Zugriff: Diese Aktion ist nur für Betriebe.");
    }
    if (!user.companyId) {
        throw new Error("Kein Betrieb zugeordnet.");
    }
    return user.companyId;
}

/**
 * Lädt ein Projekt und prüft, dass der User es sehen darf.
 * - Betrieb: Projekt muss zur eigenen Company gehören.
 * - Kunde: Projekt muss dem Kunden zugeordnet sein.
 */
export async function loadProjectForUser(
    ctx: Ctx,
    user: Doc<"users">,
    projectId: Id<"projects">
): Promise<Doc<"projects">> {
    const project = await ctx.db.get(projectId);
    if (!project) {
        throw new Error("Projekt nicht gefunden.");
    }
    if (istBetrieb(user)) {
        if (project.companyId !== user.companyId) {
            throw new Error("Kein Zugriff auf dieses Projekt.");
        }
    } else if (istKunde(user)) {
        if (project.customerId !== user._id) {
            throw new Error("Kein Zugriff auf dieses Projekt.");
        }
    } else {
        throw new Error("Kein Zugriff auf dieses Projekt.");
    }
    return project;
}
