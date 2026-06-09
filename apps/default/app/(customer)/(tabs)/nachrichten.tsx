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
import { ChatThread } from "../../../components/chat/ChatThread";
import { colors, spacing, typography, fonts, radius } from "../../../lib/theme";

export default function KundenNachrichten() {
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

    // Genau ein Projekt: direkt den Chat zeigen.
    if (projekte.length === 1) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.headerSingle}>
                    <Text style={styles.headerTitle}>Nachrichten</Text>
                    <Text style={styles.headerSub} numberOfLines={1}>
                        {projekte[0].titel}
                    </Text>
                </View>
                <ChatThread projectId={projekte[0]._id} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>Nachrichten</Text>
                {projekte.length === 0 ? (
                    <View style={styles.center}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="chatbubbles-outline"
                                size={26}
                                color={colors.textSecondary}
                            />
                        </View>
                        <Text style={styles.emptyText}>
                            Sobald ein Bauvorhaben für dich angelegt ist, kannst
                            du hier mit deinem Betrieb schreiben.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {projekte.map((p) => (
                            <Pressable
                                key={p._id}
                                style={({ pressed }) => [
                                    styles.item,
                                    pressed && { opacity: 0.7 },
                                ]}
                                onPress={() =>
                                    router.push(
                                        `/(customer)/chat/${p._id}` as Href
                                    )
                                }
                            >
                                <View style={styles.itemIcon}>
                                    <Ionicons
                                        name="chatbubble-ellipses-outline"
                                        size={20}
                                        color={colors.textPrimary}
                                    />
                                </View>
                                <View style={styles.itemContent}>
                                    <Text
                                        style={styles.itemTitle}
                                        numberOfLines={1}
                                    >
                                        {p.titel}
                                    </Text>
                                    {p.adresse ? (
                                        <Text
                                            style={styles.itemSub}
                                            numberOfLines={1}
                                        >
                                            {p.adresse}
                                        </Text>
                                    ) : null}
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={colors.textSecondary}
                                />
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
    headerSingle: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: { ...typography.title },
    headerSub: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
    },
    largeTitle: { ...typography.largeTitle, marginBottom: spacing.lg },
    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingTop: spacing.xxl * 2,
        flex: 1,
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
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    itemContent: { flex: 1, gap: 2 },
    itemTitle: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    itemSub: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
});
