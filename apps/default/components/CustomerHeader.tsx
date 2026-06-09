import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { api } from "@/convex/_generated/api";
import { colors, spacing, typography, fonts } from "../lib/theme";

interface Props {
    title: string;
}

/**
 * Kopfzeile mit Large-Title und Glocken-Icon (mit Ungelesen-Badge).
 */
export function CustomerHeader({ title }: Props) {
    const router = useRouter();
    const unread = useQuery(api.notifications.unreadCount);
    const count = unread ?? 0;

    return (
        <View style={styles.row}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
                style={styles.bell}
                hitSlop={10}
                onPress={() =>
                    router.push("/(customer)/benachrichtigungen" as Href)
                }
            >
                <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={colors.textPrimary}
                />
                {count > 0 ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {count > 9 ? "9+" : count}
                        </Text>
                    </View>
                ) : null}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.largeTitle,
        flex: 1,
    },
    bell: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: 4,
        right: 4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.statusRed,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: colors.background,
    },
    badgeText: {
        fontFamily: fonts.bold,
        fontSize: 10,
        color: colors.textOnDark,
    },
});
