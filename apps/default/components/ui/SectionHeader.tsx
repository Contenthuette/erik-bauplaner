import React from "react";
import { View, Text, StyleSheet, ViewProps } from "react-native";
import { typography, spacing } from "../../lib/theme";

interface SectionHeaderProps extends ViewProps {
    /** Kleines graues Eyebrow-Label über der Headline (contenthütte-Signatur). */
    eyebrow?: string;
    /** Große, fett gesetzte Headline. Endet konventionell mit einem Punkt. */
    title: string;
}

/**
 * Signature-Look: kleines, gedämpftes Eyebrow-Label über einer großen,
 * fetten Headline. Zentral wiederverwendbar für Sektionsüberschriften.
 */
export function SectionHeader({ eyebrow, title, style, ...rest }: SectionHeaderProps) {
    return (
        <View style={[styles.wrapper, style]} {...rest}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
            <Text style={styles.title}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.xs,
    },
    eyebrow: {
        ...typography.eyebrow,
    },
    title: {
        ...typography.title,
    },
});
