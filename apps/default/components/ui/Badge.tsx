import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius, fonts, spacing } from "../../lib/theme";

type StatusTone = "green" | "amber" | "red" | "neutral";

interface BadgeProps {
    label: string;
    tone?: StatusTone;
}

const toneMap: Record<StatusTone, { bg: string; fg: string }> = {
    green: { bg: colors.statusGreenBg, fg: colors.statusGreen },
    amber: { bg: colors.statusAmberBg, fg: colors.statusAmber },
    red: { bg: colors.statusRedBg, fg: colors.statusRed },
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
    const { bg, fg } = toneMap[tone];
    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        alignSelf: "flex-start",
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
    },
    label: {
        fontFamily: fonts.semibold,
        fontSize: 13,
    },
});
