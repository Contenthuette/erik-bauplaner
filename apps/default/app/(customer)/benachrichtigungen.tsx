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
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";
import { formatRelative } from "../../lib/format";

const typIcon: Record<string, keyof typeof Ionicons.glyphMap> = {
    status_update: "trending-up-outline",
    schritt_erledigt: "checkmark-circle-outline",
    neue_nachricht: "chatbubble-ellipses-outline",
    neue_rechnung: "document-text-outline",
};

export default function Benachrichtigungen() {
    const router = useRouter();
    const items = useQuery(api.notifications.listMyNotifications);
    const markRead = useMutation(api.notifications.markRead);
    const markAllRead = useMutation(api.notifications.markAllRead);
    const now = Date.now();

    const handleTap = async (
        id: Id<"notifications">,
        typ: string,
        bezugId?: string
    ) => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        await markRead({ notificationId: id });
        // Navigation je nach Typ.
        if (
            (typ === "status_update" || typ === "schritt_erledigt") &&
            bezugId
        ) {
            router.push(`/(customer)/projekt/${bezugId}` as Href);
        } else if (typ === "neue_nachricht") {
            router.push("/(customer)/nachrichten" as Href);
        } else if (typ === "neue_rechnung") {
            router.push("/(customer)/dokumente" as Href);
        }
    };

    const hatUngelesene = (items ?? []).some((n) => !n.gelesen);

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
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
                {hatUngelesene ? (
                    <Pressable hitSlop={10} onPress={() => markAllRead({})}>
                        <Text style={styles.markAll}>Alle gelesen</Text>
                    </Pressable>
                ) : null}
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>Benachrichtigungen</Text>

                {items === undefined ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.textPrimary} />
                    </View>
                ) : items.length === 0 ? (
                    <View style={styles.center}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="notifications-outline"
                                size={26}
                                color={colors.textSecondary}
                            />
                        </View>
                        <Text style={styles.emptyText}>
                            Keine Benachrichtigungen. Du wirst hier informiert,
                            sobald sich etwas tut.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {items.map((n) => (
                            <Pressable
                                key={n._id}
                                style={({ pressed }) => [
                                    styles.item,
                                    !n.gelesen && styles.itemUnread,
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() =>
                                    handleTap(n._id, n.typ, n.bezugId)
                                }
                            >
                                <View
                                    style={[
                                        styles.itemIcon,
                                        !n.gelesen && styles.itemIconUnread,
                                    ]}
                                >
                                    <Ionicons
                                        name={
                                            typIcon[n.typ] ??
                                            "information-circle-outline"
                                        }
                                        size={18}
                                        color={
                                            n.gelesen
                                                ? colors.textSecondary
                                                : colors.textPrimary
                                        }
                                    />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text style={styles.itemTitle}>
                                        {n.titel}
                                    </Text>
                                    <Text
                                        style={styles.itemText}
                                        numberOfLines={2}
                                    >
                                        {n.text}
                                    </Text>
                                    <Text style={styles.itemTime}>
                                        {formatRelative(n.erstelltAm, now)}
                                    </Text>
                                </View>
                                {!n.gelesen ? (
                                    <View style={styles.dot} />
                                ) : null}
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.sm,
        paddingRight: spacing.lg,
        paddingVertical: spacing.xs,
    },
    backBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    markAll: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textSecondary,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    largeTitle: {
        ...typography.largeTitle,
        fontSize: 28,
        marginBottom: spacing.lg,
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.lg,
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
        alignItems: "flex-start",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        borderCurve: "continuous",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemUnread: {
        backgroundColor: colors.surfaceMuted,
    },
    itemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    itemIconUnread: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemContent: { flex: 1, gap: 2 },
    itemTitle: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    itemText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        lineHeight: 19,
        color: colors.textSecondary,
    },
    itemTime: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.statusRed,
        marginTop: 6,
    },
});
