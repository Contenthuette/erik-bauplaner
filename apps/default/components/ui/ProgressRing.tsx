import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts } from "../../lib/theme";

interface ProgressRingProps {
    percent: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
}

/**
 * Fortschritts-Ring (Donut) mit Prozentzahl in der Mitte.
 * Nutzt react-native-svg — funktioniert auf iOS, Android und Web.
 */
export function ProgressRing({
    percent,
    size = 96,
    strokeWidth = 9,
    color = colors.statusGreen,
}: ProgressRingProps) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped / 100);
    const center = size / 2;

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={colors.border}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
            <View style={styles.center}>
                <Text style={styles.percent}>{clamped}</Text>
                <Text style={styles.unit}>%</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    percent: {
        fontFamily: fonts.bold,
        fontSize: 26,
        color: colors.textPrimary,
        fontVariant: ["tabular-nums"],
    },
    unit: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 1,
        marginTop: 4,
    },
});
