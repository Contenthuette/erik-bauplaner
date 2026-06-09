import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Id } from "@/convex/_generated/dataModel";
import { CustomerProjectDetail } from "../../../components/CustomerProjectDetail";
import { colors, spacing } from "../../../lib/theme";

export default function KundeProjektDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

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
            </View>
            <CustomerProjectDetail projectId={id as Id<"projects">} embedded />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    backBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
});
