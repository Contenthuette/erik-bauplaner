import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography, fonts } from "../../lib/theme";

export default function Einstellungen() {
    const { signOut } = useAuthActions();
    const me = useQuery(api.users.getCurrentUser);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.replace("/(auth)/login");
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>Einstellungen</Text>

                <Card style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Ionicons name="business-outline" size={24} color={colors.textSecondary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{me?.companyName ?? "Betrieb"}</Text>
                        <Text style={styles.meta}>{me?.name}</Text>
                        <Text style={styles.meta}>{me?.email}</Text>
                    </View>
                </Card>

                <View style={styles.hintBox}>
                    <Text style={styles.hint}>
                        Weitere Einstellungen folgen in Kürze.
                    </Text>
                </View>

                <View style={styles.logoutWrap}>
                    <Button title="Abmelden" variant="secondary" onPress={handleLogout} />
                </View>
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
    },
    largeTitle: {
        ...typography.largeTitle,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    profileInfo: {
        flex: 1,
        gap: 2,
    },
    name: {
        ...typography.headline,
    },
    meta: {
        ...typography.footnote,
    },
    hintBox: {
        marginTop: spacing.xl,
        alignItems: "center",
    },
    hint: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
    },
    logoutWrap: {
        marginTop: spacing.xxl,
    },
});
