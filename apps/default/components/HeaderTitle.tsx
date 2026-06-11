import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Image } from "expo-image";
import { typography, spacing } from "../lib/theme";

const logoSource = require("../../assets/images/polier-logo.png");

// Feste Maße, damit das Logo auf allen Seiten exakt identisch sitzt
const LOGO_SIZE = 40;

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
            <Image
                source={logoSource}
                style={styles.logo}
                contentFit="contain"
                transition={0}
            />
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
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
    title: {
        ...typography.largeTitle,
        flexShrink: 1,
    },
});
