// =============================================================================
// Polier — Zentrale Design-Tokens
// =============================================================================
// Apple/iOS-clean, minimalistisch, premium. Referenz-Stil: reinweiß, fast-
// schwarze Schrift, Inter, sehr viel Weiÿraum.
// Alle Screens nutzen diese Werte — niemals Farben/Spacing hart kodieren.

export const colors = {
    // Flächen
    background: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceMuted: "#FAFAFA",

    // Text
    textPrimary: "#0A0A0A",
    textSecondary: "#6B6B6B",
    textTertiary: "#9B9B9B",
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
    statusGreenBg: "#ECF8F1",
    statusAmberBg: "#FBF4E2",
    statusRedBg: "#FCEDEE",
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
    card: 18,
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

// Klare Typo-Skala. Große Überschriften eng (letter-spacing ≈ -0.02em),
// Body luftig (line-height ≈ 1.5).
export const typography = {
    largeTitle: {
        fontFamily: fonts.bold,
        fontSize: 34,
        lineHeight: 40,
        color: colors.textPrimary,
        letterSpacing: -0.68,
    },
    title: {
        fontFamily: fonts.bold,
        fontSize: 28,
        lineHeight: 34,
        color: colors.textPrimary,
        letterSpacing: -0.56,
    },
    headline: {
        fontFamily: fonts.semibold,
        fontSize: 20,
        lineHeight: 26,
        color: colors.textPrimary,
        letterSpacing: -0.2,
    },
    body: {
        fontFamily: fonts.regular,
        fontSize: 17,
        lineHeight: 25,
        color: colors.textPrimary,
    },
    callout: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 24,
        color: colors.textPrimary,
    },
    subhead: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 22,
        color: colors.textSecondary,
    },
    footnote: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textSecondary,
    },
    // Caption (Apple-Skala): 13px.
    caption: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textSecondary,
    },
    // Eyebrow-Label über Sektions-Headlines (contenthütte-Signatur):
    // klein, medium, gedämpftes Grau, leichter letter-spacing.
    eyebrow: {
        fontFamily: fonts.medium,
        fontSize: 13,
        lineHeight: 16,
        color: colors.textTertiary,
        letterSpacing: 0.6,
    },
} as const;

// Ultraweiche, geschichtete iOS-Schatten für Cards. Keine harten/dunklen Schatten.
export const shadows = {
    card: {
        boxShadow:
            "0px 1px 3px rgba(10, 10, 10, 0.04), 0px 8px 24px rgba(10, 10, 10, 0.05)",
    },
} as const;

export const layout = {
    minTouchTarget: 44,
    buttonHeight: 52,
    screenPadding: spacing.xl,
} as const;
