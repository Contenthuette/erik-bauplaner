// =============================================================================
// Polier — Formatierung & Status-Mapping (Deutsch)
// =============================================================================

import { colors } from "./theme";

export type ProjectStatus =
    | "geplant"
    | "laeuft"
    | "pausiert"
    | "verzoegert"
    | "abgeschlossen";

export type StageStatus = "offen" | "laeuft" | "erledigt";

export type UpdateTyp = "fortschritt" | "verzoegerung" | "wetter" | "info";

type Tone = "green" | "amber" | "red" | "neutral";

export const projectStatusMeta: Record<
    ProjectStatus,
    { label: string; tone: Tone }
> = {
    geplant: { label: "Geplant", tone: "neutral" },
    laeuft: { label: "L\u00e4uft", tone: "green" },
    pausiert: { label: "Pausiert", tone: "amber" },
    verzoegert: { label: "Im Verzug", tone: "red" },
    abgeschlossen: { label: "Abgeschlossen", tone: "neutral" },
};

export const stageStatusMeta: Record<
    StageStatus,
    { label: string; tone: Tone; color: string }
> = {
    offen: { label: "Offen", tone: "neutral", color: colors.textSecondary },
    laeuft: { label: "L\u00e4uft", tone: "amber", color: colors.statusAmber },
    erledigt: { label: "Erledigt", tone: "green", color: colors.statusGreen },
};

export const updateTypMeta: Record<
    UpdateTyp,
    { label: string; icon: string; tone: Tone }
> = {
    fortschritt: { label: "Fortschritt", icon: "trending-up-outline", tone: "green" },
    verzoegerung: { label: "Verz\u00f6gerung", icon: "alert-circle-outline", tone: "red" },
    wetter: { label: "Wetter", icon: "rainy-outline", tone: "amber" },
    info: { label: "Info", icon: "information-circle-outline", tone: "neutral" },
};

/**
 * Formatiert einen Zeitstempel als deutsches Datum (z.B. "12. M\u00e4rz 2026").
 */
export function formatDate(ms: number | undefined): string {
    if (!ms) return "\u2014";
    return new Date(ms).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/**
 * Kurzes Datum (z.B. "12.03.26").
 */
export function formatDateShort(ms: number | undefined): string {
    if (!ms) return "\u2014";
    return new Date(ms).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
    });
}

/**
 * Formatiert einen Euro-Betrag (z.B. "24.500 \u20ac").
 */
export function formatEuro(value: number | undefined): string {
    if (value === undefined || value === null) return "\u2014";
    return value.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    });
}

/**
 * Kurzes Datum mit Wochentag (z.B. "Do 12.06.").
 */
export function formatDateWeekday(ms: number | undefined): string {
    if (!ms) return "\u2014";
    return new Date(ms).toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
    });
}

/**
 * Zeitraum aus Start/Ende (z.B. "12.06. \u2013 18.06." oder "ab 12.06.").
 */
export function formatZeitraum(
    start: number | undefined,
    ende: number | undefined
): string {
    if (!start && !ende) return "Termin offen";
    if (start && ende)
        return `${formatDateWeekday(start)} \u2013 ${formatDateWeekday(ende)}`;
    if (start) return `ab ${formatDateWeekday(start)}`;
    return `bis ${formatDateWeekday(ende)}`;
}

/**
 * Relative Zeitangabe (z.B. "vor 3 Std.", "Gestern", "vor 2 Tagen").
 */
export function formatRelative(ms: number, now: number): string {
    const diff = now - ms;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "gerade eben";
    if (min < 60) return `vor ${min} Min.`;
    const std = Math.floor(min / 60);
    if (std < 24) return `vor ${std} Std.`;
    const tage = Math.floor(std / 24);
    if (tage === 1) return "Gestern";
    if (tage < 7) return `vor ${tage} Tagen`;
    return formatDateShort(ms);
}
