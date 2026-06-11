import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// =============================================================================
// Polier — Datenmodell
// =============================================================================
// Multi-Tenancy: Jeder Domain-Datensatz ist an eine companyId gebunden.
// Kunden sehen nur eigene Projekte (customerId), Betriebe nur eigene Daten.
// Die Zugriffstrennung wird serverseitig in access.ts durchgesetzt.

export const rolleValidator = v.union(
    v.literal("owner"),
    v.literal("mitarbeiter"),
    v.literal("kunde")
);

export const projectStatusValidator = v.union(
    v.literal("geplant"),
    v.literal("laeuft"),
    v.literal("pausiert"),
    v.literal("verzoegert"),
    v.literal("abgeschlossen")
);

export const stageStatusValidator = v.union(
    v.literal("offen"),
    v.literal("laeuft"),
    v.literal("erledigt")
);

export const updateTypValidator = v.union(
    v.literal("fortschritt"),
    v.literal("verzoegerung"),
    v.literal("wetter"),
    v.literal("info")
);

export const invoiceStatusValidator = v.union(
    v.literal("offen"),
    v.literal("bezahlt"),
    v.literal("ueberfaellig")
);

// Stripe-Abo-Status, synchronisiert über Webhooks.
export const subscriptionStatusValidator = v.union(
    v.literal("none"),
    v.literal("trialing"),
    v.literal("active"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("incomplete")
);

export default defineSchema({
    ...authTables,

    // users-Tabelle inline definiert, um Polier-Felder zu ergänzen.
    // Felder aus authTables (name, email, image, phone ...) bleiben optional,
    // damit Convex Auth sie weiter verwalten kann.
    users: defineTable({
        // --- von Convex Auth verwaltet ---
        name: v.optional(v.string()),
        image: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerificationTime: v.optional(v.number()),
        phone: v.optional(v.string()),
        phoneVerificationTime: v.optional(v.number()),
        isAnonymous: v.optional(v.boolean()),
        // --- Polier-spezifisch ---
        companyId: v.optional(v.id("companies")),
        rolle: v.optional(rolleValidator),
        telefon: v.optional(v.string()),
        adresse: v.optional(v.string()),
        pushToken: v.optional(v.string()),
        benachrichtigungsPrefs: v.optional(v.any()),
        letzterLogin: v.optional(v.number()),
        // DSGVO: Zeitpunkt der Zustimmung zur Datenschutzerklärung.
        datenschutzAkzeptiertAm: v.optional(v.number()),
        // Temporär beim Owner-Signup: Firmenname, bis die Company erzeugt wurde.
        pendingCompanyName: v.optional(v.string()),
    })
        .index("email", ["email"])
        .index("by_company", ["companyId"])
        .index("by_company_and_rolle", ["companyId", "rolle"]),

    companies: defineTable({
        name: v.string(),
        logo: v.optional(v.id("_storage")),
        kontaktEmail: v.optional(v.string()),
        kontaktTelefon: v.optional(v.string()),
        adresse: v.optional(v.string()),
        erstelltAm: v.number(),
        // --- Stripe-Abo ---
        stripeCustomerId: v.optional(v.string()),
        stripeSubscriptionId: v.optional(v.string()),
        subscriptionStatus: v.optional(subscriptionStatusValidator),
        // Ende der laufenden Abrechnungsperiode bzw. Trial (ms).
        currentPeriodEnd: v.optional(v.number()),
        // Ob die Kündigung zum Periodenende vorgemerkt ist.
        cancelAtPeriodEnd: v.optional(v.boolean()),
    })
        .index("by_stripe_customer", ["stripeCustomerId"])
        .index("by_stripe_subscription", ["stripeSubscriptionId"]),

    projects: defineTable({
        companyId: v.id("companies"),
        customerId: v.optional(v.id("users")),
        titel: v.string(),
        typ: v.optional(v.string()),
        adresse: v.optional(v.string()),
        status: projectStatusValidator,
        startPlan: v.optional(v.number()),
        endePlan: v.optional(v.number()),
        auftragswert: v.optional(v.number()),
        fortschrittProzent: v.number(),
        aktuellerStageId: v.optional(v.id("stages")),
        erstelltAm: v.number(),
    })
        .index("by_company", ["companyId"])
        .index("by_company_and_status", ["companyId", "status"])
        .index("by_customer", ["customerId"]),

    stages: defineTable({
        projectId: v.id("projects"),
        companyId: v.id("companies"),
        reihenfolge: v.number(),
        titel: v.string(),
        beschreibung: v.optional(v.string()),
        status: stageStatusValidator,
        startPlan: v.optional(v.number()),
        endePlan: v.optional(v.number()),
        startIst: v.optional(v.number()),
        endeIst: v.optional(v.number()),
        notiz: v.optional(v.string()),
    })
        .index("by_project", ["projectId"])
        .index("by_project_and_reihenfolge", ["projectId", "reihenfolge"]),

    updates: defineTable({
        projectId: v.id("projects"),
        companyId: v.id("companies"),
        typ: updateTypValidator,
        text: v.string(),
        fotoUrls: v.optional(v.array(v.id("_storage"))),
        erstelltVon: v.id("users"),
        erstelltAm: v.number(),
    })
        .index("by_project", ["projectId"]),

    messages: defineTable({
        projectId: v.id("projects"),
        companyId: v.id("companies"),
        senderId: v.id("users"),
        senderRolle: rolleValidator,
        text: v.string(),
        anhaenge: v.optional(v.array(v.id("_storage"))),
        erstelltAm: v.number(),
        gelesenAm: v.optional(v.number()),
    })
        .index("by_project", ["projectId"]),

    invoices: defineTable({
        projectId: v.id("projects"),
        companyId: v.id("companies"),
        pdfUrl: v.optional(v.id("_storage")),
        betrag: v.number(),
        status: invoiceStatusValidator,
        ausgestelltAm: v.number(),
        faelligAm: v.optional(v.number()),
        bezahltAm: v.optional(v.number()),
        notiz: v.optional(v.string()),
    })
        .index("by_project", ["projectId"])
        .index("by_company_and_status", ["companyId", "status"]),

    notifications: defineTable({
        userId: v.id("users"),
        typ: v.string(),
        titel: v.string(),
        text: v.string(),
        bezugId: v.optional(v.string()),
        gelesen: v.boolean(),
        erstelltAm: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_gelesen", ["userId", "gelesen"]),

    templates: defineTable({
        companyId: v.id("companies"),
        name: v.string(),
        schritteJson: v.any(),
    })
        .index("by_company", ["companyId"]),

    // Zugangscodes für den passwortlosen Kundenzugang.
    // Ein Code ist an einen Kunden-User (rolle "kunde") gebunden und optional
    // an ein konkretes Projekt. Der Kunde meldet sich per Code an (statt Passwort).
    accessCodes: defineTable({
        code: v.string(),
        companyId: v.id("companies"),
        customerId: v.id("users"),
        projectId: v.optional(v.id("projects")),
        aktiv: v.boolean(),
        erstelltAm: v.number(),
        ersteEinloesungAm: v.optional(v.number()),
        letzteEinloesungAm: v.optional(v.number()),
    })
        .index("by_code", ["code"])
        .index("by_customer", ["customerId"])
        .index("by_company", ["companyId"]),
});
