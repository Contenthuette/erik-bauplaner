import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { colors } from "../../lib/theme";

/**
 * Frosted-Glass-Hintergrund für die Tab-Bar (iOS-Feel).
 * Haarlinien-Trenner oben. Auf Web/Android sauberer Fallback ohne Blur.
 */
export function TabBarBackground() {
    if (Platform.OS === "ios") {
        return (
            <View style={StyleSheet.absoluteFill}>
                <BlurView
                    tint="light"
                    intensity={80}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.overlay} />
                <View style={styles.hairline} />
            </View>
        );
    }
    return (
        <View style={[StyleSheet.absoluteFill, styles.solid]}>
            <View style={styles.hairline} />
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.72)",
    },
    solid: {
        backgroundColor: colors.background,
    },
    hairline: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
    },
});
