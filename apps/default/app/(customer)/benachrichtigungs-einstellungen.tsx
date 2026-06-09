import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "../../components/ui/Card";
import { colors, spacing, typography, fonts } from "../../lib/theme";

interface Prefs {
    statusUpdate: boolean;
    schrittErledigt: boolean;
    neueNachricht: boolean;
    neueRechnung: boolean;
}

const rows: { key: keyof Prefs; label: string; desc: string }[] = [
    {
        key: "statusUpdate",
        label: "Status-Updates",
        desc: "Neue Meldungen zu deinem Bauvorhaben",
    },
    {
        key: "schrittErledigt",
        label: "Schritt erledigt",
        desc: "Wenn ein Arbeitsschritt abgeschlossen wird",
    },
    {
        key: "neueNachricht",
        label: "Neue Nachricht",
        desc: "Nachrichten von deinem Betrieb",
    },
    {
        key: "neueRechnung",
        label: "Neue Rechnung",
        desc: "Wenn eine Rechnung bereitsteht",
    },
];

export default function BenachrichtigungsEinstellungen() {
    const router = useRouter();
    const serverPrefs = useQuery(api.users.getNotificationPrefs);
    const update = useMutation(api.users.updateNotificationPrefs);
    const [prefs, setPrefs] = useState<Prefs | null>(null);

    useEffect(() => {
        if (serverPrefs && prefs === null) {
            setPrefs(serverPrefs);
        }
    }, [serverPrefs, prefs]);

    const toggle = async (key: keyof Prefs) => {
        if (!prefs) return;
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        await update({ prefs: next });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>Benachrichtigungen</Text>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="close" size={26} color={colors.textPrimary} />
                </Pressable>
            </View>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.intro}>
                    Lege fest, worüber wir dich informieren.
                </Text>
                <Card style={styles.card}>
                    {rows.map((r, idx) => (
                        <View key={r.key}>
                            {idx > 0 ? <View style={styles.divider} /> : null}
                            <View style={styles.row}>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowLabel}>
                                        {r.label}
                                    </Text>
                                    <Text style={styles.rowDesc}>{r.desc}</Text>
                                </View>
                                <Switch
                                    value={prefs ? prefs[r.key] : true}
                                    onValueChange={() => toggle(r.key)}
                                    disabled={!prefs}
                                />
                            </View>
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: { ...typography.headline },
    scroll: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    intro: {
        ...typography.subhead,
        marginBottom: spacing.lg,
    },
    card: { padding: 0, overflow: "hidden" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
    },
    rowText: { flex: 1, gap: 2 },
    rowLabel: {
        fontFamily: fonts.medium,
        fontSize: 16,
        color: colors.textPrimary,
    },
    rowDesc: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: spacing.lg,
    },
});
