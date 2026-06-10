import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors, fonts } from "../../lib/theme";

export interface DonutSegment {
    label: string;
    value: number;
    color: string;
}

interface DonutChartProps {
    segments: DonutSegment[];
    size?: number;
    strokeWidth?: number;
    centerLabel?: string;
    centerSub?: string;
}

/**
 * Minimalistisches Donut-Diagramm (react-native-svg).
 */
export function DonutChart({
    segments,
    size = 160,
    strokeWidth = 22,
    centerLabel,
    centerSub,
}: DonutChartProps) {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let offsetAkk = 0;

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <G rotation={-90} origin={`${center}, ${center}`}>
                    {/* Hintergrundring */}
                    <Circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={colors.border}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {total > 0 &&
                        segments.map((seg, i) => {
                            const fraction = seg.value / total;
                            const dash = fraction * circumference;
                            const gap = circumference - dash;
                            const dashOffset = -offsetAkk * circumference;
                            offsetAkk += fraction;
                            return (
                                <Circle
                                    key={i}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    stroke={seg.color}
                                    strokeWidth={strokeWidth}
                                    fill="none"
                                    strokeDasharray={`${dash} ${gap}`}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="butt"
                                />
                            );
                        })}
                </G>
            </Svg>
            {(centerLabel || centerSub) && (
                <View style={styles.center} pointerEvents="none">
                    {centerLabel ? (
                        <Text style={styles.centerLabel}>{centerLabel}</Text>
                    ) : null}
                    {centerSub ? (
                        <Text style={styles.centerSub}>{centerSub}</Text>
                    ) : null}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    centerLabel: {
        fontFamily: fonts.bold,
        fontSize: 28,
        color: colors.textPrimary,
        fontVariant: ["tabular-nums"],
    },
    centerSub: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
