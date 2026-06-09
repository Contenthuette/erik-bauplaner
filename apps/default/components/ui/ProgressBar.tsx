import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, radius } from "../../lib/theme";

interface ProgressBarProps {
    percent: number;
    showLabel?: boolean;
    tone?: string;
}

/**
 * Schlanker Fortschrittsbalken mit optionaler Prozentanzeige.
 */
export function ProgressBar({
    percent,
    showLabel = true,
    tone = colors.textPrimary,
}: ProgressBarProps) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    return (
        <View style={styles.row}>
            <View style={styles.track}>
                <View
                    style={[
                        styles.fill,
                        { width: `${clamped}%`, backgroundColor: tone },
                    ]}
                />
            </View>
            {showLabel ? (
                <Text style={styles.label}>{clamped} %</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    track: {
        flex: 1,
        height: 6,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: radius.pill,
    },
    label: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.textSecondary,
        fontVariant: ["tabular-nums"],
        minWidth: 38,
        textAlign: "right",
    },
});
