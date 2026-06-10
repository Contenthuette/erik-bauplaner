import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { Linking } from "react-native";
import { api } from "@/convex/_generated/api";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { DatenschutzActions } from "../../../components/DatenschutzActions";
import { colors, spacing, typography, fonts } from "../../../lib/theme";

export default function Profil() {
    const { signOut } = useAuthActions();
    const me = useQuery(api.users.getCurrentUser);
    const betrieb = useQuery(api.customer.getMyCompanyContact);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.replace("/(auth)/login");
    };

    const call = (tel: string) => {
        Linking.openURL(`tel:${tel.replace(/\s/g, "")}`);
    };
    const mail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>Profil</Text>

                {/* Eigene Kontaktdaten */}
                <Card style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Ionicons
                            name="person-outline"
                            size={24}
                            color={colors.textSecondary}
                        />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{me?.name ?? "Kunde"}</Text>
                        {me?.email ? (
                            <Text style={styles.meta}>{me.email}</Text>
                        ) : null}
                        {me?.telefon ? (
                            <Text style={styles.meta}>{me.telefon}</Text>
                        ) : null}
                        {me?.adresse ? (
                            <Text style={styles.meta}>{me.adresse}</Text>
                        ) : null}
                    </View>
                    <Pressable
                        hitSlop={10}
                        onPress={() =>
                            router.push(
                                "/(customer)/profil-bearbeiten" as Href
                            )
                        }
                    >
                        <Ionicons
                            name="create-outline"
                            size={22}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                </Card>

                {/* Aktionen */}
                <Text style={styles.sectionLabel}>Konto</Text>
                <Card style={styles.menuCard}>
                    <MenuRow
                        icon="key-outline"
                        label="Passwort ändern"
                        onPress={() =>
                            router.push("/(customer)/passwort-aendern" as Href)
                        }
                    />
                    <View style={styles.divider} />
                    <MenuRow
                        icon="notifications-outline"
                        label="Benachrichtigungen"
                        onPress={() =>
                            router.push(
                                "/(customer)/benachrichtigungs-einstellungen" as Href
                            )
                        }
                    />
                </Card>

                {/* Betrieb-Kontakt — bewusst weiter unten */}
                {betrieb ? (
                    <>
                        <Text style={styles.sectionLabel}>Dein Betrieb</Text>
                        <Card style={styles.menuCard}>
                            <View style={styles.betriebHeader}>
                                <View style={styles.betriebIcon}>
                                    <Ionicons
                                        name="business-outline"
                                        size={20}
                                        color={colors.textPrimary}
                                    />
                                </View>
                                <Text style={styles.betriebName}>
                                    {betrieb.name}
                                </Text>
                            </View>
                            {betrieb.kontaktTelefon ? (
                                <>
                                    <View style={styles.divider} />
                                    <MenuRow
                                        icon="call-outline"
                                        label={betrieb.kontaktTelefon}
                                        onPress={() =>
                                            call(betrieb.kontaktTelefon!)
                                        }
                                    />
                                </>
                            ) : null}
                            {betrieb.kontaktEmail ? (
                                <>
                                    <View style={styles.divider} />
                                    <MenuRow
                                        icon="mail-outline"
                                        label={betrieb.kontaktEmail}
                                        onPress={() =>
                                            mail(betrieb.kontaktEmail!)
                                        }
                                    />
                                </>
                            ) : null}
                        </Card>
                    </>
                ) : null}

                {/* DSGVO */}
                <DatenschutzActions />

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

function MenuRow({
    icon,
    label,
    onPress,
}: {
    icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.menuRow,
                pressed && { opacity: 0.6 },
            ]}
            onPress={onPress}
        >
            <Ionicons name={icon} size={20} color={colors.textPrimary} />
            <Text style={styles.menuLabel}>{label}</Text>
            <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
            />
        </Pressable>
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
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        minHeight: 56,
    },
    menuLabel: {
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 16,
        color: colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: spacing.lg + 20 + spacing.md,
    },
    betriebHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    betriebIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    betriebName: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.textPrimary,
    },
    logoutWrap: { marginTop: spacing.xxl },
});
