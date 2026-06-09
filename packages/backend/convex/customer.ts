import { v } from "convex/values";
import { authQuery } from "./functions";
import { istKunde } from "./access";
import { projectStatusValidator } from "./schema";
import { Doc } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

// =============================================================================
// Kunden-Oberfläche — nur lesender Zugriff auf eigene Projekte
// =============================================================================
// Alle Queries hier filtern strikt auf customerId === user._id.
// Ein Kunde sieht niemals Daten anderer Kunden oder anderer Betriebe.

const kundenProjektItem = v.object({
    _id: v.id("projects"),
    titel: v.string(),
    adresse: v.optional(v.string()),
    status: projectStatusValidator,
    fortschrittProzent: v.number(),
    aktuellerSchrittTitel: v.optional(v.string()),
    naechsterSchrittTitel: v.optional(v.string()),
    naechsterSchrittStart: v.optional(v.number()),
    naechsterSchrittEnde: v.optional(v.number()),
});

/**
 * Ermittelt aktuellen + nächsten Schritt eines Projekts für die Kundenansicht.
 */
async function schritteInfo(
    ctx: QueryCtx,
    project: Doc<"projects">
): Promise<{
    aktuellerSchrittTitel?: string;
    naechsterSchrittTitel?: string;
    naechsterSchrittStart?: number;
    naechsterSchrittEnde?: number;
}> {
    const stages = await ctx.db
        .query("stages")
        .withIndex("by_project_and_reihenfolge", (q) =>
            q.eq("projectId", project._id)
        )
        .collect();
    stages.sort((a, b) => a.reihenfolge - b.reihenfolge);

    let aktuellerSchrittTitel: string | undefined;
    if (project.aktuellerStageId) {
        const aktuell = stages.find((s) => s._id === project.aktuellerStageId);
        aktuellerSchrittTitel = aktuell?.titel;
    }
    if (!aktuellerSchrittTitel) {
        const laeuft = stages.find((s) => s.status === "laeuft");
        aktuellerSchrittTitel = laeuft?.titel;
    }

    // Nächster Schritt = erster nicht erledigter Schritt nach dem aktuellen.
    const naechster = stages.find(
        (s) => s.status === "offen" && s._id !== project.aktuellerStageId
    );

    return {
        aktuellerSchrittTitel,
        naechsterSchrittTitel: naechster?.titel,
        naechsterSchrittStart: naechster?.startPlan,
        naechsterSchrittEnde: naechster?.endePlan,
    };
}

/**
 * Alle Projekte des eingeloggten Kunden (nur eigene).
 */
export const listMyProjects = authQuery({
    args: {},
    returns: v.array(kundenProjektItem),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istKunde(user)) return [];
        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_customer", (q) => q.eq("customerId", user._id))
            .order("desc")
            .collect();

        const items = [];
        for (const p of projekte) {
            const info = await schritteInfo(ctx, p);
            items.push({
                _id: p._id,
                titel: p.titel,
                adresse: p.adresse,
                status: p.status,
                fortschrittProzent: p.fortschrittProzent,
                ...info,
            });
        }
        return items;
    },
});

/**
 * Kontaktdaten des Betriebs, der das Projekt des Kunden betreut.
 * Gibt nur Kontaktinfo zurück — keine internen Betriebsdaten.
 */
export const getMyCompanyContact = authQuery({
    args: {},
    returns: v.union(
        v.null(),
        v.object({
            name: v.string(),
            kontaktTelefon: v.optional(v.string()),
            kontaktEmail: v.optional(v.string()),
            adresse: v.optional(v.string()),
        })
    ),
    handler: async (ctx) => {
        const user = ctx.user;
        if (!istKunde(user)) return null;
        // companyId des Kunden wurde bei Anlage gesetzt.
        if (!user.companyId) return null;
        const company = await ctx.db.get(user.companyId);
        if (!company) return null;
        return {
            name: company.name,
            kontaktTelefon: company.kontaktTelefon,
            kontaktEmail: company.kontaktEmail,
            adresse: company.adresse,
        };
    },
});
