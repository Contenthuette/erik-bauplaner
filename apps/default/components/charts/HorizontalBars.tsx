import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing, radius } from "../../lib/theme";

export interface BarDatum {
    label: string;
    value: number;
    color?: string;
    valueLabel?: string;
}

interface BarChartProps {
    data: BarDatum[];
    barColor?: string;
}

/**
 * Schlankes horizontales Balkendiagramm in reinem RN (kein SVG nötig).
 * Gut für Kategorien wie "Projekte nach Ort".
 */
export function HorizontalBars({ data, barColor = colors.textPrimary }: BarChartProps) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <View style={styles.wrap}>
            {data.map((d, i) => {
                const pct = Math.max(0.04, d.value / max);
                return (
                    <View key={i} style={styles.row}>
                        <Text style={styles.label} numberOfLines={1}>
                            {d.label}
                        </Text>
                        <View style={styles.barTrack}>
                            <View
                                style={[
                                    styles.barFill,
                                    {
                                        width: `${pct * 100}%`,
                                        backgroundColor: d.color ?? barColor,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.value}>
                            {d.valueLabel ?? String(d.value)}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.md },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    label: {
        width: 96,
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.textPrimary,
    },
    barTrack: {
        flex: 1,
        height: 12,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceMuted,
        overflow: "hidden",
    },
    barFill: {
        height: "100%",
        borderRadius: radius.pill,
    },
    value: {
        minWidth: 28,
        textAlign: "right",
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.textSecondary,
        fontVariant: ["tabular-nums"],
    },
});
