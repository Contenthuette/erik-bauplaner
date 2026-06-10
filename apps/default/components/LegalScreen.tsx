import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing, typography, fonts } from "../lib/theme";

interface LegalScreenProps {
    title: string;
    body: string;
}

/**
 * Wiederverwendbare Rechtstext-Seite (Datenschutz / Impressum).
 */
export function LegalScreen({ title, body }: LegalScreenProps) {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    style={styles.backBtn}
                >
                    <Ionicons
                        name="chevron-back"
                        size={26}
                        color={colors.textPrimary}
                    />
                </Pressable>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={styles.backBtn} />
            </View>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.body}>{body}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 44, height: 44, justifyContent: "center" },
    headerTitle: { ...typography.headline },
    scroll: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    body: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 24,
        color: colors.textPrimary,
    },
});
