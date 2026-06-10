import { v } from "convex/values";
import { authQuery } from "./functions";
import { istBetrieb } from "./access";
import { projectStatusValidator } from "./schema";
import { Doc } from "./_generated/dataModel";
import { QueryCtx } from "./_generated/server";

// =============================================================================
// Admin-Dashboard — Auswertungen (alle Zahlen aus echten Projektdaten)
// =============================================================================

const TAG = 24 * 60 * 60 * 1000;
const WOCHE = 7 * TAG;

/**
 * Leitet aus einer Freitext-Adresse einen groben "Ort" ab.
 * "Müllerstr. 12, 50667 Köln" -> "Köln". Fällt auf die ganze Adresse zurück.
 */
function extractOrt(adresse: string | undefined): string {
    if (!adresse || !adresse.trim()) return "Ohne Ort";
    const segmente = adresse.split(",").map((s) => s.trim()).filter(Boolean);
    const letztes = segmente[segmente.length - 1] ?? adresse;
    // PLZ (5 Ziffern) am Anfang entfernen.
    const ohnePlz = letztes.replace(/^\d{4,5}\s*/, "").trim();
    return ohnePlz || letztes || "Ohne Ort";
}

/**
 * Verzug in Tagen für ein laufendes Projekt: positiver Wert = im Verzug.
 * Basis: geplantes Ende vs. heute, solange nicht abgeschlossen.
 */
function verzugTage(project: Doc<"projects">, now: number): number {
    if (project.status === "abgeschlossen") return 0;
    if (project.fortschrittProzent >= 100) return 0;
    if (!project.endePlan) return 0;
    if (now <= project.endePlan) return 0;
    return Math.floor((now - project.endePlan) / TAG);
}

function ampelFuerVerzug(tage: number): "green" | "amber" | "red" {
    if (tage <= 0) return "green";
    if (tage <= 14) return "amber";
    return "red";
}

async function inboxUnread(ctx: QueryCtx, user: Doc<"users">): Promise<number> {
    if (!user.companyId) return 0;
    const projekte = await ctx.db
        .query("projects")
        .withIndex("by_company", (q) => q.eq("companyId", user.companyId!))
        .collect();
    let count = 0;
    for (const p of projekte) {
        const msgs = await ctx.db
            .query("messages")
            .withIndex("by_project", (q) => q.eq("projectId", p._id))
            .collect();
        count += msgs.filter(
            (m) => m.senderRolle === "kunde" && !m.gelesenAm
        ).length;
    }
    return count;
}

const dashboardReturn = v.object({
    kpis: v.object({
        aktiveProjekte: v.number(),
        imVerzug: v.number(),
        offeneRechnungenSumme: v.number(),
        ungeleseneNachrichten: v.number(),
    }),
    statusVerteilung: v.array(
        v.object({
            status: projectStatusValidator,
            label: v.string(),
            anzahl: v.number(),
        })
    ),
    nachOrt: v.array(
        v.object({ ort: v.string(), anzahl: v.number() })
    ),
    umsatzProMonat: v.array(
        v.object({
            monat: v.string(),
            jahr: v.number(),
            summe: v.number(),
        })
    ),
    zeitplan: v.array(
        v.object({
            projectId: v.id("projects"),
            titel: v.string(),
            adresse: v.optional(v.string()),
            fortschrittProzent: v.number(),
            endePlan: v.optional(v.number()),
            verzugTage: v.number(),
            ampel: v.union(
                v.literal("green"),
                v.literal("amber"),
                v.literal("red")
            ),
        })
    ),
    brennpunkte: v.array(
        v.object({
            projectId: v.id("projects"),
            titel: v.string(),
            verzugTage: v.number(),
        })
    ),
});

const MONATE = [
    "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
    "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

/**
 * Komplettes Dashboard in einer Query — alle Werte live aus den Projektdaten.
 * `now` wird vom Client übergeben, damit die Query cachebar/reaktiv bleibt.
 */
export const getDashboard = authQuery({
    args: { now: v.number() },
    returns: dashboardReturn,
    handler: async (ctx, args) => {
        const user = ctx.user;
        const leer = {
            kpis: {
                aktiveProjekte: 0,
                imVerzug: 0,
                offeneRechnungenSumme: 0,
                ungeleseneNachrichten: 0,
            },
            statusVerteilung: [],
            nachOrt: [],
            umsatzProMonat: [],
            zeitplan: [],
            brennpunkte: [],
        };
        if (!istBetrieb(user) || !user.companyId) return leer;
        const companyId = user.companyId;
        const now = args.now;

        const projekte = await ctx.db
            .query("projects")
            .withIndex("by_company", (q) => q.eq("companyId", companyId))
            .collect();

        // --- Status-Verteilung ---
        const statusReihenfolge = [
            "geplant", "laeuft", "pausiert", "verzoegert", "abgeschlossen",
        ] as const;
        const statusLabel: Record<string, string> = {
            geplant: "Geplant",
            laeuft: "Läuft",
            pausiert: "Pausiert",
            verzoegert: "Im Verzug",
            abgeschlossen: "Abgeschlossen",
        };
        const statusCount: Record<string, number> = {};
        for (const p of projekte) {
            statusCount[p.status] = (statusCount[p.status] ?? 0) + 1;
        }
        const statusVerteilung = statusReihenfolge
            .map((s) => ({
                status: s,
                label: statusLabel[s],
                anzahl: statusCount[s] ?? 0,
            }))
            .filter((s) => s.anzahl > 0);

        // --- KPIs ---
        const aktiveProjekte = projekte.filter(
            (p) => p.status !== "abgeschlossen"
        ).length;
        const imVerzug = projekte.filter(
            (p) => p.status === "verzoegert"
        ).length;

        const offeneRechnungen = await ctx.db
            .query("invoices")
            .withIndex("by_company_and_status", (q) =>
                q.eq("companyId", companyId).eq("status", "offen")
            )
            .collect();
        const ueberfaellige = await ctx.db
            .query("invoices")
            .withIndex("by_company_and_status", (q) =>
                q.eq("companyId", companyId).eq("status", "ueberfaellig")
            )
            .collect();
        const offeneRechnungenSumme =
            offeneRechnungen.reduce((s, i) => s + i.betrag, 0) +
            ueberfaellige.reduce((s, i) => s + i.betrag, 0);

        const ungeleseneNachrichten = await inboxUnread(ctx, user);

        // --- Nach Ort ---
        const ortCount: Record<string, number> = {};
        for (const p of projekte) {
            if (p.status === "abgeschlossen") continue;
            const ort = extractOrt(p.adresse);
            ortCount[ort] = (ortCount[ort] ?? 0) + 1;
        }
        const nachOrt = Object.entries(ortCount)
            .map(([ort, anzahl]) => ({ ort, anzahl }))
            .sort((a, b) => b.anzahl - a.anzahl)
            .slice(0, 6);

        // --- Umsatz-Prognose pro Monat (nächste 6 Monate, nach geplantem Ende) ---
        const monatsBuckets: { monat: string; jahr: number; summe: number }[] = [];
        const startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        for (let i = 0; i < 6; i++) {
            const d = new Date(startDate);
            d.setMonth(d.getMonth() + i);
            monatsBuckets.push({
                monat: MONATE[d.getMonth()],
                jahr: d.getFullYear(),
                summe: 0,
            });
        }
        for (const p of projekte) {
            if (!p.auftragswert || p.status === "abgeschlossen") continue;
            // Stichtag: geplantes Ende, sonst dieser Monat.
            const ende = p.endePlan ? new Date(p.endePlan) : new Date(now);
            const bucket = monatsBuckets.find(
                (b) =>
                    b.jahr === ende.getFullYear() &&
                    b.monat === MONATE[ende.getMonth()]
            );
            if (bucket) {
                bucket.summe += p.auftragswert;
            } else if (ende.getTime() < now) {
                // Überfällige Aufträge dem ersten Monat zuschlagen.
                monatsBuckets[0].summe += p.auftragswert;
            }
        }

        // --- Zeitplan-Übersicht (aktive Projekte) ---
        const aktive = projekte.filter((p) => p.status !== "abgeschlossen");
        const zeitplan = aktive
            .map((p) => {
                const tage = verzugTage(p, now);
                return {
                    projectId: p._id,
                    titel: p.titel,
                    adresse: p.adresse,
                    fortschrittProzent: p.fortschrittProzent,
                    endePlan: p.endePlan,
                    verzugTage: tage,
                    ampel: ampelFuerVerzug(tage),
                };
            })
            .sort((a, b) => b.verzugTage - a.verzugTage);

        // --- Brennpunkte (am stärksten verzögert) ---
        const brennpunkte = zeitplan
            .filter((z) => z.verzugTage > 0)
            .slice(0, 3)
            .map((z) => ({
                projectId: z.projectId,
                titel: z.titel,
                verzugTage: z.verzugTage,
            }));

        void WOCHE;
        return {
            kpis: {
                aktiveProjekte,
                imVerzug,
                offeneRechnungenSumme,
                ungeleseneNachrichten,
            },
            statusVerteilung,
            nachOrt,
            umsatzProMonat: monatsBuckets,
            zeitplan,
            brennpunkte,
        };
    },
});
