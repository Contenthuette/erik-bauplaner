import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing, radius } from "../../lib/theme";

export interface ColumnDatum {
    label: string;
    value: number;
    valueLabel?: string;
}

interface ColumnChartProps {
    data: ColumnDatum[];
    height?: number;
}

/**
 * Vertikales Säulendiagramm in reinem RN — für Umsatz pro Monat.
 */
export function ColumnChart({ data, height = 140 }: ColumnChartProps) {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <View style={styles.wrap}>
            <View style={[styles.bars, { height }]}>
                {data.map((d, i) => {
                    const h = d.value > 0 ? Math.max(6, (d.value / max) * height) : 3;
                    return (
                        <View key={i} style={styles.col}>
                            {d.valueLabel ? (
                                <Text style={styles.value} numberOfLines={1}>
                                    {d.valueLabel}
                                </Text>
                            ) : null}
                            <View
                                style={[
                                    styles.bar,
                                    {
                                        height: h,
                                        backgroundColor:
                                            d.value > 0
                                                ? colors.textPrimary
                                                : colors.border,
                                    },
                                ]}
                            />
                        </View>
                    );
                })}
            </View>
            <View style={styles.labels}>
                {data.map((d, i) => (
                    <Text key={i} style={styles.label} numberOfLines={1}>
                        {d.label}
                    </Text>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
    bars: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
    },
    col: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
    },
    bar: {
        width: "100%",
        maxWidth: 32,
        borderRadius: radius.button,
        borderCurve: "continuous",
    },
    value: {
        fontFamily: fonts.medium,
        fontSize: 9,
        color: colors.textSecondary,
    },
    labels: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    label: {
        flex: 1,
        textAlign: "center",
        fontFamily: fonts.medium,
        fontSize: 11,
        color: colors.textSecondary,
    },
});
