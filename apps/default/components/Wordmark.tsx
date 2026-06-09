import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../lib/theme";

interface WordmarkProps {
    size?: number;
}

/**
 * Polier-Wortmarke. Minimalistisch, schwarz, mit Akzentpunkt.
 */
export function Wordmark({ size = 40 }: WordmarkProps) {
    return (
        <View style={styles.row}>
            <Text style={[styles.text, { fontSize: size }]}>Polier</Text>
            <View
                style={[
                    styles.dot,
                    { width: size * 0.14, height: size * 0.14, borderRadius: size * 0.07 },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    text: {
        fontFamily: fonts.bold,
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    dot: {
        backgroundColor: colors.statusGreen,
        marginLeft: 3,
        marginBottom: 8,
    },
});
