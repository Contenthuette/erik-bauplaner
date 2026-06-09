import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, fonts, typography } from "../lib/theme";

interface FormHeaderProps {
    title: string;
    onClose?: () => void;
    rightLabel?: string;
    onRightPress?: () => void;
    rightDisabled?: boolean;
}

/**
 * Kopfzeile für modale Formular-Screens: links Schließen (X), Mitte Titel,
 * optional rechts eine Aktion (z.B. "Speichern").
 */
export function FormHeader({
    title,
    onClose,
    rightLabel,
    onRightPress,
    rightDisabled,
}: FormHeaderProps) {
    const router = useRouter();
    const close = onClose ?? (() => router.back());
    return (
        <View style={styles.header}>
            <Pressable onPress={close} hitSlop={10} style={styles.side}>
                <Ionicons name="close" size={26} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>
            <View style={styles.sideRight}>
                {rightLabel ? (
                    <Pressable
                        onPress={onRightPress}
                        disabled={rightDisabled}
                        hitSlop={10}
                    >
                        <Text
                            style={[
                                styles.rightLabel,
                                rightDisabled && styles.rightDisabled,
                            ]}
                        >
                            {rightLabel}
                        </Text>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.md,
    },
    side: {
        width: 60,
        alignItems: "flex-start",
    },
    sideRight: {
        width: 60,
        alignItems: "flex-end",
    },
    title: {
        ...typography.headline,
        flex: 1,
        textAlign: "center",
    },
    rightLabel: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.textPrimary,
    },
    rightDisabled: {
        color: colors.textSecondary,
        opacity: 0.5,
    },
});
