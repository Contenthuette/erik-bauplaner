import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, fonts } from "../lib/theme";

interface PlaceholderScreenProps {
    title: string;
    icon?: keyof typeof Ionicons.glyphMap;
    hint?: string;
}

/**
 * Platzhalter-Screen mit iOS-Large-Title und dezentem "Kommt gleich"-Hinweis.
 * Wird für alle noch nicht implementierten Tabs verwendet.
 */
export function PlaceholderScreen({
    title,
    icon = "construct-outline",
    hint = "Kommt gleich — diese Funktion folgt in Kürze.",
}: PlaceholderScreenProps) {
    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>{title}</Text>
                <View style={styles.empty}>
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name={icon}
                            size={28}
                            color={colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.hint}>{hint}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    largeTitle: {
        ...typography.largeTitle,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        paddingBottom: 80,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    hint: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: "center",
        maxWidth: 260,
    },
});
