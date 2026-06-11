import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Wordmark } from "../../components/Wordmark";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";

export default function BetriebAuswahl() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    hitSlop={12}
                >
                    <Ionicons
                        name="chevron-back"
                        size={26}
                        color={colors.textPrimary}
                    />
                </Pressable>

                <View style={styles.header}>
                    <Wordmark size={36} />
                    <Text style={styles.title}>Für Betriebe</Text>
                    <Text style={styles.subtitle}>
                        Melde dich an oder starte deine kostenlose Testphase.
                    </Text>
                </View>

                <View style={styles.cards}>
                    <Pressable
                        style={styles.card}
                        onPress={() => router.push("/(auth)/login" as Href)}
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name="log-in-outline"
                                size={24}
                                color={colors.textPrimary}
                            />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Anmelden</Text>
                            <Text style={styles.cardSub}>
                                Du hast bereits ein Betriebskonto
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.textTertiary}
                        />
                    </Pressable>

                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            router.push("/(auth)/registrieren" as Href)
                        }
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name="sparkles-outline"
                                size={24}
                                color={colors.textPrimary}
                            />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>
                                Kostenlos testen
                            </Text>
                            <Text style={styles.cardSub}>
                                7 Tage gratis, danach 49 € / Monat
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={colors.textTertiary}
                        />
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        gap: spacing.xl,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: "center",
        marginLeft: -8,
    },
    header: {
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    title: {
        ...typography.title,
        marginTop: spacing.sm,
    },
    subtitle: {
        ...typography.subhead,
    },
    cards: {
        gap: spacing.md,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.lg,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: radius.card,
        borderCurve: "continuous",
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    cardBody: {
        flex: 1,
        gap: 2,
    },
    cardTitle: {
        fontFamily: fonts.semibold,
        fontSize: 18,
        color: colors.textPrimary,
    },
    cardSub: {
        ...typography.footnote,
    },
});
