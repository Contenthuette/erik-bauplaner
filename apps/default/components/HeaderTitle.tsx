import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { typography, spacing } from "../lib/theme";

// Feste Maße, damit das Logo auf allen Seiten exakt identisch sitzt
const LOGO_SIZE = 40;

function PolierLogo({ size = LOGO_SIZE }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="160 108 246 296">
            <Path
                fill="#0A0A0A"
                fillRule="evenodd"
                d="M 168 116 H 300 A 98 98 0 0 1 300 312 H 224 V 396 H 168 Z M 224 172 V 256 H 300 A 42 42 0 0 0 300 172 Z"
            />
        </Svg>
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
