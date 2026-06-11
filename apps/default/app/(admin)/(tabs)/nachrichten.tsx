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
import { colors, spacing, typography, fonts, radius } from "../../../lib/theme";
import { formatRelative } from "../../../lib/format";

export default function AdminNachrichten() {
    const router = useRouter();
    const inbox = useQuery(api.messages.listInbox);
    const now = Date.now();

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>Nachrichten</Text>

                {inbox === undefined ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.textPrimary} />
                    </View>
                ) : inbox.length === 0 ? (
                    <View style={styles.center}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="chatbubbles-outline"
                                size={26}
                                color={colors.textSecondary}
                            />
                        </View>
                        <Text style={styles.emptyText}>
                            Noch keine Kunden-Threads. Sobald ein Kunde
                            schreibt, erscheint er hier.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {inbox.map((t) => (
                            <Pressable
                                key={t.projectId}
                                style={({ pressed }) => [
                                    styles.item,
                                    t.ungelesen > 0 && styles.itemUnread,
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() =>
                                    router.push(
                                        `/(admin)/chat/${t.projectId}` as Href
                                    )
                                }
                            >
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(t.kundeName ?? "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.itemContent}>
                                    <View style={styles.itemTopRow}>
                                        <Text
                                            style={styles.itemName}
                                            numberOfLines={1}
                                        >
                                            {t.kundeName ?? "Kunde"}
                                        </Text>
                                        {t.letzteAktivitaet ? (
                                            <Text style={styles.itemTime}>
                                                {formatRelative(
                                                    t.letzteAktivitaet,
                                                    now
                                                )}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Text
                                        style={styles.itemProjekt}
                                        numberOfLines={1}
                                    >
                                        {t.projektTitel}
                                    </Text>
                                    <View style={styles.itemBottomRow}>
                                        <Text
                                            style={[
                                                styles.itemPreview,
                                                t.ungelesen > 0 &&
                                                    styles.itemPreviewUnread,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {t.letzteNachricht ??
                                                "Noch keine Nachricht"}
                                        </Text>
                                        {t.ungelesen > 0 ? (
                                            <View style={styles.badge}>
                                                <Text style={styles.badgeText}>
                                                    {t.ungelesen > 9
                                                        ? "9+"
                                                        : t.ungelesen}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
    },
    largeTitle: { ...typography.largeTitle, marginTop: spacing.sm, marginBottom: spacing.lg },
    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingTop: spacing.xxl * 2,
    },
    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 21,
        color: colors.textSecondary,
        textAlign: "center",
        maxWidth: 280,
    },
    list: { gap: spacing.sm },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        borderCurve: "continuous",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemUnread: { backgroundColor: colors.surfaceMuted },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.textPrimary,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: fonts.bold,
        fontSize: 18,
        color: colors.textOnDark,
    },
    itemContent: { flex: 1, gap: 1 },
    itemTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
    },
    itemName: {
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    itemTime: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },
    itemProjekt: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
    itemBottomRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
        marginTop: 2,
    },
    itemPreview: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
    },
    itemPreviewUnread: {
        fontFamily: fonts.medium,
        color: colors.textPrimary,
    },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.statusRed,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    badgeText: {
        fontFamily: fonts.bold,
        fontSize: 11,
        color: colors.textOnDark,
    },
});
