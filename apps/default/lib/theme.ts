// =============================================================================
// Polier — Zentrale Design-Tokens
// =============================================================================
// Apple/iOS-clean, minimalistisch, viel Weißraum.
// Alle Screens nutzen diese Werte — niemals Farben/Spacing hart kodieren.

export const colors = {
    // Flächen
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceMuted: "#FAFAFA",

    // Text
    textPrimary: "#0A0A0A",
    textSecondary: "#6B6B6B",
    textOnDark: "#FFFFFF",

    // Linien / Ränder
    border: "#ECECEC",

    // Buttons
    buttonPrimaryBg: "#0A0A0A",
    buttonPrimaryText: "#FFFFFF",
    buttonSecondaryBg: "#FFFFFF",
    buttonSecondaryText: "#0A0A0A",
    buttonSecondaryBorder: "#0A0A0A",

    // Status (nur für Badges/Indikatoren)
    statusGreen: "#1FAD66",
    statusAmber: "#E0A100",
    statusRed: "#E5484D",

    // dezente getönte Hintergründe für Status-Badges
    statusGreenBg: "#E7F6EE",
    statusAmberBg: "#FBF3DF",
    statusRedBg: "#FCE9EA",
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

export const radius = {
    button: 12,
    card: 16,
    pill: 999,
    input: 12,
} as const;

// Inter-Schriftfamilien (geladen in _layout via @expo-google-fonts/inter)
export const fonts = {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
} as const;

export const typography = {
    largeTitle: {
        fontFamily: fonts.bold,
        fontSize: 34,
        lineHeight: 41,
        color: colors.textPrimary,
        letterSpacing: 0.37,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 22,
        lineHeight: 28,
        color: colors.textPrimary,
    },
    headline: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        lineHeight: 22,
        color: colors.textPrimary,
    },
    body: {
        fontFamily: fonts.regular,
        fontSize: 17,
        lineHeight: 22,
        color: colors.textPrimary,
    },
    callout: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 21,
        color: colors.textPrimary,
    },
    subhead: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    footnote: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textSecondary,
    },
} as const;

// Sehr dezenter iOS-Schatten für Cards.
export const shadows = {
    card: {
        boxShadow: "0px 1px 3px rgba(10, 10, 10, 0.06)",
    },
} as const;

export const layout = {
    minTouchTarget: 44,
    screenPadding: spacing.lg,
} as const;
