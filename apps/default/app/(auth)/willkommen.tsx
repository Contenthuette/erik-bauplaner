import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Wordmark } from "../../components/Wordmark";
import { LogoMark } from "../../components/LogoMark";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";

const BENEFITS = [
    "Kundenkommunikation leicht gemacht",
    "Polier spart Zeit und Nerven",
    "Keine Missverständnisse – Bauabläufe übersichtlich",
];

export default function Willkommen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <LogoMark size={72} />
                    <Wordmark size={48} />
                    <Text style={styles.tagline}>
                        Baufortschritt einfach im Blick.
                    </Text>
                </View>

                <View style={styles.benefits}>
                    {BENEFITS.map((b) => (
                        <View key={b} style={styles.benefitRow}>
                            <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color={colors.statusGreen}
                            />
                            <Text style={styles.benefitText}>{b}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.cards}>
                    <Pressable
                        style={styles.card}
                        onPress={() =>
                            router.push("/(auth)/kunde-code" as Href)
                        }
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name="person-outline"
                                size={24}
                                color={colors.textPrimary}
                            />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Für Kunden</Text>
                            <Text style={styles.cardSub}>
                                Mit Zugangscode zur Baustelle
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
                            router.push("/(auth)/betrieb" as Href)
                        }
                    >
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name="business-outline"
                                size={24}
                                color={colors.textPrimary}
                            />
                        </View>
                        <View style={styles.cardBody}>
                            <Text style={styles.cardTitle}>Für Betriebe</Text>
                            <Text style={styles.cardSub}>
                                Anmelden oder kostenlos testen
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
        paddingVertical: spacing.xxl,
        justifyContent: "center",
        gap: spacing.xxl,
    },
    header: {
        alignItems: "center",
        gap: spacing.md,
    },
    tagline: {
        ...typography.subhead,
        marginTop: spacing.md,
        textAlign: "center",
    },
    benefits: {
        gap: spacing.md,
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    benefitText: {
        ...typography.callout,
        flex: 1,
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
