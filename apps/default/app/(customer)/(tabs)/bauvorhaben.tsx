import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { CustomerHeader } from "../../../components/CustomerHeader";
import { CustomerProjectDetail } from "../../../components/CustomerProjectDetail";
import { colors, spacing, typography, fonts } from "../../../lib/theme";
import {
    projectStatusMeta,
    formatZeitraum,
    type ProjectStatus,
} from "../../../lib/format";

export default function Bauvorhaben() {
    const router = useRouter();
    const projekte = useQuery(api.customer.listMyProjects);

    if (projekte === undefined) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.textPrimary} />
                </View>
            </SafeAreaView>
        );
    }

    if (projekte.length === 0) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <CustomerHeader title="Mein Bauvorhaben" />
                <View style={styles.center}>
                    <View style={styles.emptyIcon}>
                        <Ionicons
                            name="home-outline"
                            size={28}
                            color={colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.emptyText}>
                        Sobald dein Betrieb dein Bauvorhaben anlegt,
                        erscheint es hier.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (projekte.length === 1) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <CustomerHeader title="Mein Bauvorhaben" />
                <CustomerProjectDetail projectId={projekte[0]._id} embedded />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <CustomerHeader title="Meine Bauvorhaben" />
            <ScrollView
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {projekte.map((p) => {
                    const meta = projectStatusMeta[p.status as ProjectStatus];
                    return (
                        <Pressable
                            key={p._id}
                            onPress={() =>
                                router.push(
                                    `/(customer)/projekt/${p._id}` as Href
                                )
                            }
                        >
                            <Card style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardTitle}>
                                        {p.titel}
                                    </Text>
                                    <Badge label={meta.label} tone={meta.tone} />
                                </View>
                                {p.adresse ? (
                                    <View style={styles.addressRow}>
                                        <Ionicons
                                            name="location-outline"
                                            size={14}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={styles.address}>
                                            {p.adresse}
                                        </Text>
                                    </View>
                                ) : null}
                                <View style={styles.progressWrap}>
                                    <ProgressBar
                                        percent={p.fortschrittProzent}
                                    />
                                </View>
                                {p.naechsterSchrittTitel ? (
                                    <View style={styles.nextRow}>
                                        <Ionicons
                                            name="flag-outline"
                                            size={14}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={styles.nextText}>
                                            {p.naechsterSchrittTitel}
                                            <Text style={styles.nextDate}>
                                                {"  ·  "}
                                                {formatZeitraum(
                                                    p.naechsterSchrittStart,
                                                    p.naechsterSchrittEnde
                                                )}
                                            </Text>
                                        </Text>
                                    </View>
                                ) : null}
                            </Card>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: 80,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 22,
        color: colors.textSecondary,
        textAlign: "center",
        maxWidth: 280,
    },
    list: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.md,
    },
    card: { gap: spacing.sm },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    cardTitle: {
        ...typography.headline,
        fontSize: 18,
        flex: 1,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    address: {
        ...typography.subhead,
    },
    progressWrap: {
        marginTop: spacing.xs,
    },
    nextRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: spacing.xs,
    },
    nextText: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    nextDate: {
        fontFamily: fonts.regular,
        color: colors.textSecondary,
    },
});
