import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { typography, spacing } from "../lib/theme";

// Feste Maße, damit das Logo auf allen Seiten exakt identisch sitzt
const LOGO_SIZE = 40;

const polierLogo = require("../../../assets/images/polier-icon.png");

function PolierLogo({ size = LOGO_SIZE }: { size?: number }) {
    return (
        <Image
            source={polierLogo}
            style={{ width: size, height: size }}
            contentFit="contain"
        />
    );
}

interface HeaderTitleProps {
    title: string;
    /** Optionaler Style für Außenabstände (marginTop/marginBottom je Seite) */
    style?: StyleProp<ViewStyle>;
}

/**
 * Wiederverwendbarer Seiten-Header: Polier-Logo links, Titel daneben.
 * Logo und Titel sind vertikal mittig zueinander ausgerichtet und
 * sitzen auf jeder Seite an exakt derselben festen Position.
 */
export function HeaderTitle({ title, style }: HeaderTitleProps) {
    return (
        <View style={[styles.container, style]}>
            <PolierLogo size={LOGO_SIZE} />
            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    title: {
        ...typography.largeTitle,
        flexShrink: 1,
    },
});
