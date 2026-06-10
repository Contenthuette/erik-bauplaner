import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card } from "../../components/ui/Card";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";

export default function Vorlagen() {
    const router = useRouter();
    const templates = useQuery(api.templates.listTemplates);
    const seed = useMutation(api.templates.seedDachdeckerTemplates);
    const remove = useMutation(api.templates.deleteTemplate);
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const res = await seed({});
            if (res.erstellt === 0 && Platform.OS !== "web") {
                Alert.alert("Hinweis", "Beispiel-Vorlagen sind bereits vorhanden.");
            }
        } catch {
            Alert.alert("Fehler", "Vorlagen konnten nicht angelegt werden.");
        } finally {
            setSeeding(false);
        }
    };

    const confirmDelete = (id: Id<"templates">, name: string) => {
        const doDelete = async () => {
            try {
                await remove({ templateId: id });
            } catch {
                Alert.alert("Fehler", "Vorlage konnte nicht gelöscht werden.");
            }
        };
        if (Platform.OS === "web") {
            doDelete();
            return;
        }
        Alert.alert("Vorlage löschen", `„${name}“ wirklich löschen?`, [
            { text: "Abbrechen", style: "cancel" },
            { text: "Löschen", style: "destructive", onPress: doDelete },
        ]);
    };

    const list = templates ?? [];

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Vorlagen</Text>
                <View style={styles.backBtn} />
            </View>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.intro}>
                    Ablaufpläne als Vorlage, um neue Projekte schneller
                    anzulegen.
                </Text>

                {list.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons
                            name="copy-outline"
                            size={28}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.emptyTitle}>Keine Vorlagen</Text>
                        <Text style={styles.emptyText}>
                            Legen Sie Beispiel-Vorlagen an oder speichern Sie
                            einen Projektplan als Vorlage.
                        </Text>
                    </Card>
                ) : (
                    <Card style={styles.menuCard}>
                        {list.map((t, idx) => (
                            <View key={t._id}>
                                {idx > 0 ? <View style={styles.divider} /> : null}
                                <View style={styles.row}>
                                    <View style={styles.rowIcon}>
                                        <Ionicons
                                            name="list-outline"
                                            size={18}
                                            color={colors.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.rowInfo}>
                                        <Text style={styles.rowTitle}>{t.name}</Text>
                                        <Text style={styles.rowSub}>
                                            {t.anzahlSchritte} Schritte
                                        </Text>
                                    </View>
                                    <Pressable
                                        hitSlop={10}
                                        onPress={() => confirmDelete(t._id, t.name)}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={20}
                                            color={colors.statusRed}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </Card>
                )}

                <Pressable
                    style={[styles.seedBtn, seeding && { opacity: 0.5 }]}
                    onPress={handleSeed}
                    disabled={seeding}
                >
                    <Ionicons
                        name="sparkles-outline"
                        size={18}
                        color={colors.textPrimary}
                    />
                    <Text style={styles.seedText}>
                        Beispiel-Vorlagen anlegen
                    </Text>
                </Pressable>
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: { width: 44, height: 44, justifyContent: "center" },
    headerTitle: { ...typography.headline },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    intro: { ...typography.subhead },
    emptyCard: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xxl },
    emptyTitle: { ...typography.headline, marginTop: spacing.sm },
    emptyText: { ...typography.subhead, textAlign: "center", paddingHorizontal: spacing.lg },
    menuCard: { padding: 0, overflow: "hidden" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 60,
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    rowInfo: { flex: 1, gap: 2 },
    rowTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
    rowSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 40 + spacing.md },
    seedBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.button,
        borderCurve: "continuous",
        paddingVertical: spacing.lg,
        minHeight: 52,
    },
    seedText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
});
