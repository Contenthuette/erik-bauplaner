// =============================================================================
// Polier — Zentrale Laufzeit-Konfiguration
// =============================================================================
// Löst die Backend-URLs robust auf. EXPO_PUBLIC_-Variablen werden zur Buildzeit
// eingebettet; falls sie in einem eigenständigen Release-Build fehlen, greift
// ein sicherer Fallback auf das bekannte Produktions-Deployment. So crasht der
// App-Start NIE wegen einer fehlenden Umgebungsvariable.

import Constants from "expo-constants";

// Bekanntes Produktions-Deployment (öffentliche Backend-URL, kein Geheimnis).
const FALLBACK_CONVEX_URL = "https://blissful-magpie-18.convex.cloud";
const FALLBACK_CONVEX_SITE_URL = "https://blissful-magpie-18.convex.site";

function fromExtra(key: string): string | undefined {
    const extra = Constants.expoConfig?.extra as
        | Record<string, unknown>
        | undefined;
    const value = extra?.[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

export const convexUrl: string =
    process.env.EXPO_PUBLIC_CONVEX_URL ||
    fromExtra("convexUrl") ||
    FALLBACK_CONVEX_URL;

export const convexSiteUrl: string =
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ||
    fromExtra("convexSiteUrl") ||
    FALLBACK_CONVEX_SITE_URL;
