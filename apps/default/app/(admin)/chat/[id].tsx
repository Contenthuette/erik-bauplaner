import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatThread } from "../../../components/chat/ChatThread";
import { Id } from "@/convex/_generated/dataModel";
import { colors, spacing, typography, fonts } from "../../../lib/theme";

export default function AdminChat() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const projectId = id as Id<"projects">;
    const projekt = useQuery(api.projects.getProject, { projectId });

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
                <View style={styles.headerCenter}>
                    <Text style={styles.title} numberOfLines={1}>
                        {projekt?.kundeName ?? "Kunde"}
                    </Text>
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {projekt?.titel ?? ""}
                    </Text>
                </View>
                <View style={styles.backBtn} />
            </View>
            <ChatThread projectId={projectId} />
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
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    headerCenter: { flex: 1, alignItems: "center" },
    title: { ...typography.headline },
    subtitle: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
});
