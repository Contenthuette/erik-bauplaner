import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChatThread } from "../../../components/chat/ChatThread";
import { Id } from "@/convex/_generated/dataModel";
import { colors, spacing, typography } from "../../../lib/theme";

export default function KundenChat() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

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
                <Text style={styles.title}>Nachrichten</Text>
                <View style={styles.backBtn} />
            </View>
            <ChatThread projectId={id as Id<"projects">} />
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
    backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    title: { ...typography.headline },
});
