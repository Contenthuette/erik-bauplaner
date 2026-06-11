import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Image } from "expo-image";
import { api } from "@/convex/_generated/api";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { DatenschutzActions } from "../../../components/DatenschutzActions";
import { HeaderTitle } from "../../../components/HeaderTitle";
import { colors, spacing, typography, fonts } from "../../../lib/theme";

export default function Einstellungen() {
    const { signOut } = useAuthActions();
    const company = useQuery(api.company.getMyCompany);
    const me = useQuery(api.users.getCurrentUser);
    const router = useRouter();

    const istOwner = company?.meineRolle === "owner";

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
                <HeaderTitle title="Einstellungen" style={styles.largeTitle} />

                {/* Firmenprofil-Karte */}
                <Card style={styles.profileCard}>
                    {company?.logoUrl ? (
                        <Image
                            source={{ uri: company.logoUrl }}
                            style={styles.logo}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Ionicons
                                name="business-outline"
                                size={24}
                                color={colors.textSecondary}
                            />
                        </View>
                    )}
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>
                            {company?.name ?? "Betrieb"}
                        </Text>
                        <Text style={styles.meta}>{me?.name}</Text>
                        <Text style={styles.meta}>{me?.email}</Text>
                    </View>
                </Card>

                {/* Betrieb */}
                <Text style={styles.sectionLabel}>Betrieb</Text>
                <Card style={styles.menuCard}>
                    <Row
                        icon="business-outline"
                        label="Firmenprofil"
                        sub={istOwner ? undefined : "Nur Inhaber"}
                        onPress={() =>
                            router.push("/(admin)/firmenprofil" as Href)
                        }
                    />
                    <Divider />
                    <Row
                        icon="people-outline"
                        label="Team & Mitarbeiter"
                        onPress={() => router.push("/(admin)/team" as Href)}
                    />
                    <Divider />
                    <Row
                        icon="copy-outline"
                        label="Vorlagen verwalten"
                        onPress={() => router.push("/(admin)/vorlagen" as Href)}
                    />
                    <Divider />
                    <Row
                        icon="notifications-outline"
                        label="Benachrichtigungen"
                        onPress={() =>
                            router.push(
                                "/(admin)/benachrichtigungs-einstellungen" as Href
                            )
                        }
                    />
                </Card>

                {/* DSGVO */}
                <DatenschutzActions />

                {/* Abmelden */}
                <View style={styles.logoutWrap}>
                    <Button
                        title="Abmelden"
                        variant="secondary"
                        onPress={handleLogout}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Row({
    icon,
    label,
    sub,
    onPress,
}: {
    icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
    label: string;
    sub?: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
            onPress={onPress}
        >
            <Ionicons name={icon} size={20} color={colors.textPrimary} />
            <Text style={styles.rowLabel}>{label}</Text>
            {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
            <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
            />
        </Pressable>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
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
    logo: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        borderColor: colors.border,
    },
    profileInfo: { flex: 1, gap: 2 },
    name: { ...typography.headline },
    meta: { ...typography.footnote },
    sectionLabel: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
        marginLeft: 2,
    },
    menuCard: { padding: 0, overflow: "hidden" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        minHeight: 56,
    },
    rowLabel: {
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 16,
        color: colors.textPrimary,
    },
    rowSub: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: spacing.lg + 20 + spacing.md,
    },
    logoutWrap: { marginTop: spacing.xxl },
});
