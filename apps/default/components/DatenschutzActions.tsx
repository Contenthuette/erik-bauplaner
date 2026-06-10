import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Alert,
    Platform,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConvex } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { api } from "@/convex/_generated/api";
import { Card } from "./ui/Card";
import { colors, spacing, fonts, typography } from "../lib/theme";

/**
 * DSGVO-Aktionen: Datenschutzerklärung, Impressum, Datenexport (Auskunft),
 * Konto-Löschung. Wird in Admin- und Kunden-Einstellungen eingebunden.
 */
export function DatenschutzActions() {
    const convex = useConvex();
    const { signOut } = useAuthActions();
    const router = useRouter();
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await convex.query(api.privacy.exportMyData, {});
            const json = JSON.stringify(data, null, 2);

            if (Platform.OS === "web") {
                await Clipboard.setStringAsync(json);
                Alert.alert(
                    "Daten exportiert",
                    "Ihre Daten wurden in die Zwischenablage kopiert."
                );
            } else {
                const file = new File(Paths.cache, "polier-datenexport.json");
                try {
                    file.create({ overwrite: true });
                } catch {
                    // existiert bereits — ignorieren
                }
                file.write(json);
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                    await Sharing.shareAsync(file.uri, {
                        mimeType: "application/json",
                        dialogTitle: "Meine Daten exportieren",
                    });
                } else {
                    await Clipboard.setStringAsync(json);
                    Alert.alert(
                        "Daten exportiert",
                        "Ihre Daten wurden in die Zwischenablage kopiert."
                    );
                }
            }
        } catch {
            Alert.alert(
                "Fehler",
                "Der Export konnte nicht erstellt werden. Bitte erneut versuchen."
            );
        } finally {
            setExporting(false);
        }
    };

    const performDelete = async () => {
        setDeleting(true);
        try {
            await convex.mutation(api.privacy.deleteMyAccount, {});
            await signOut();
            router.replace("/(auth)/login");
        } catch (e) {
            setDeleting(false);
            const msg =
                e instanceof Error
                    ? e.message
                    : "Das Konto konnte nicht gelöscht werden.";
            Alert.alert("Löschung nicht möglich", msg);
        }
    };

    const confirmDelete = () => {
        if (Platform.OS === "web") {
            // Alert mit Buttons funktioniert nicht zuverlässig im Web-Preview.
            performDelete();
            return;
        }
        Alert.alert(
            "Konto & Daten löschen",
            "Alle Ihre Daten werden unwiderruflich gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden.",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Endgültig löschen",
                    style: "destructive",
                    onPress: performDelete,
                },
            ]
        );
    };

    return (
        <View style={styles.wrap}>
            <Text style={styles.sectionLabel}>Datenschutz</Text>
            <Card style={styles.menuCard}>
                <Row
                    icon="shield-checkmark-outline"
                    label="Datenschutzerklärung"
                    onPress={() => router.push("/datenschutz" as Href)}
                />
                <Divider />
                <Row
                    icon="document-text-outline"
                    label="Impressum"
                    onPress={() => router.push("/impressum" as Href)}
                />
                <Divider />
                <Row
                    icon="download-outline"
                    label="Meine Daten exportieren"
                    onPress={handleExport}
                    right={
                        exporting ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.textSecondary}
                            />
                        ) : undefined
                    }
                />
            </Card>

            <Card style={[styles.menuCard, styles.dangerCard]}>
                <Row
                    icon="trash-outline"
                    label={deleting ? "Lösche …" : "Account & Daten löschen"}
                    danger
                    onPress={deleting ? undefined : confirmDelete}
                    right={
                        deleting ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.statusRed}
                            />
                        ) : undefined
                    }
                />
            </Card>

            <Text style={styles.hint}>
                Ihre Daten werden auf Servern innerhalb der EU verarbeitet und
                nicht an Dritte außerhalb notwendiger Dienstleister
                weitergegeben.
            </Text>
        </View>
    );
}

function Row({
    icon,
    label,
    onPress,
    danger = false,
    right,
}: {
    icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    danger?: boolean;
    right?: React.ReactNode;
}) {
    const color = danger ? colors.statusRed : colors.textPrimary;
    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <Ionicons name={icon} size={20} color={color} />
            <Text style={[styles.rowLabel, { color }]}>{label}</Text>
            {right ?? (
                onPress ? (
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                    />
                ) : null
            )}
        </Pressable>
    );
}

function Divider() {
    return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.sm },
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
    dangerCard: { marginTop: spacing.md },
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
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: spacing.lg + 20 + spacing.md,
    },
    hint: {
        ...typography.footnote,
        marginTop: spacing.md,
        marginHorizontal: 2,
        lineHeight: 18,
    },
});
