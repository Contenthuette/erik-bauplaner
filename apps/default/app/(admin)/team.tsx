import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";

interface Credentials {
    name: string;
    login: string;
    tempPassword: string;
}

export default function Team() {
    const router = useRouter();
    const team = useQuery(api.company.listTeam);
    const company = useQuery(api.company.getMyCompany);
    const invite = useAction(api.company.inviteTeamMember);
    const removeMember = useMutation(api.company.removeTeamMember);

    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [credentials, setCredentials] = useState<Credentials | null>(null);

    const istOwner = company?.meineRolle === "owner";

    const handleInvite = async () => {
        if (!name.trim() || !email.trim()) {
            Alert.alert("Fehlende Angaben", "Bitte Name und E-Mail eingeben.");
            return;
        }
        setLoading(true);
        try {
            const res = await invite({ name: name.trim(), email: email.trim() });
            setCredentials({
                name: res.name,
                login: res.login,
                tempPassword: res.tempPassword,
            });
            setName("");
            setEmail("");
            setShowForm(false);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Einladung fehlgeschlagen.";
            Alert.alert("Fehler", msg);
        } finally {
            setLoading(false);
        }
    };

    const copyCredentials = async () => {
        if (!credentials) return;
        const text = `Zugang zur Polier-App\n\nName: ${credentials.name}\nLogin: ${credentials.login}\nPasswort: ${credentials.tempPassword}\n\nBitte nach dem ersten Login das Passwort ändern.`;
        await Clipboard.setStringAsync(text);
        if (Platform.OS !== "web") {
            Alert.alert("Kopiert", "Zugangsdaten in die Zwischenablage kopiert.");
        }
    };

    const confirmRemove = (userId: Id<"users">, memberName?: string) => {
        const doRemove = async () => {
            try {
                await removeMember({ userId });
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Entfernen fehlgeschlagen.";
                Alert.alert("Fehler", msg);
            }
        };
        if (Platform.OS === "web") {
            doRemove();
            return;
        }
        Alert.alert(
            "Mitarbeiter entfernen",
            `${memberName ?? "Dieser Mitarbeiter"} verliert den Zugang zur App.`,
            [
                { text: "Abbrechen", style: "cancel" },
                { text: "Entfernen", style: "destructive", onPress: doRemove },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Team & Mitarbeiter</Text>
                <View style={styles.backBtn} />
            </View>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Zugangsdaten nach Einladung */}
                    {credentials ? (
                        <Card style={styles.credCard}>
                            <View style={styles.credHead}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={colors.statusGreen}
                                />
                                <Text style={styles.credTitle}>
                                    Mitarbeiter angelegt
                                </Text>
                            </View>
                            <Text style={styles.credSub}>
                                Geben Sie {credentials.name} diese Zugangsdaten
                                weiter:
                            </Text>
                            <View style={styles.credBox}>
                                <CredRow label="Login" value={credentials.login} />
                                <View style={styles.credDivider} />
                                <CredRow
                                    label="Passwort"
                                    value={credentials.tempPassword}
                                />
                            </View>
                            <Button title="Zugangsdaten kopieren" onPress={copyCredentials} />
                            <Pressable
                                style={styles.dismiss}
                                onPress={() => setCredentials(null)}
                            >
                                <Text style={styles.dismissText}>Fertig</Text>
                            </Pressable>
                        </Card>
                    ) : null}

                    {/* Team-Liste */}
                    <Card style={styles.menuCard}>
                        {(team ?? []).map((m, idx) => (
                            <View key={m._id}>
                                {idx > 0 ? <View style={styles.divider} /> : null}
                                <View style={styles.memberRow}>
                                    <View style={styles.memberAvatar}>
                                        <Ionicons
                                            name="person-outline"
                                            size={18}
                                            color={colors.textSecondary}
                                        />
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>
                                            {m.name ?? m.email}
                                            {m.istIch ? " (Sie)" : ""}
                                        </Text>
                                        <Text style={styles.memberRole}>
                                            {m.rolle === "owner"
                                                ? "Inhaber"
                                                : "Mitarbeiter"}
                                        </Text>
                                    </View>
                                    {istOwner && m.rolle === "mitarbeiter" ? (
                                        <Pressable
                                            hitSlop={10}
                                            onPress={() =>
                                                confirmRemove(m._id, m.name)
                                            }
                                        >
                                            <Ionicons
                                                name="trash-outline"
                                                size={20}
                                                color={colors.statusRed}
                                            />
                                        </Pressable>
                                    ) : null}
                                </View>
                            </View>
                        ))}
                    </Card>

                    {/* Einladen */}
                    {istOwner ? (
                        showForm ? (
                            <Card style={styles.formCard}>
                                <Text style={styles.formTitle}>
                                    Mitarbeiter einladen
                                </Text>
                                <Input
                                    label="Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Anna Schmidt"
                                />
                                <Input
                                    label="E-Mail"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="anna@firma.de"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <Text style={styles.roleHint}>
                                    Mitarbeiter dürfen Projekte pflegen, aber
                                    keine Firmeneinstellungen ändern.
                                </Text>
                                <Button
                                    title="Einladen"
                                    onPress={handleInvite}
                                    loading={loading}
                                />
                                <Pressable
                                    style={styles.dismiss}
                                    onPress={() => setShowForm(false)}
                                >
                                    <Text style={styles.dismissText}>
                                        Abbrechen
                                    </Text>
                                </Pressable>
                            </Card>
                        ) : (
                            <Pressable
                                style={styles.addRow}
                                onPress={() => setShowForm(true)}
                            >
                                <Ionicons
                                    name="person-add-outline"
                                    size={20}
                                    color={colors.textPrimary}
                                />
                                <Text style={styles.addLabel}>
                                    Mitarbeiter einladen
                                </Text>
                            </Pressable>
                        )
                    ) : (
                        <Text style={styles.ownerHint}>
                            Nur der Inhaber kann Mitarbeiter einladen.
                        </Text>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function CredRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.credRow}>
            <Text style={styles.credLabel}>{label}</Text>
            <Text style={styles.credValue} selectable>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
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
    credCard: { gap: spacing.md, backgroundColor: colors.statusGreenBg, borderColor: "transparent" },
    credHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    credTitle: { ...typography.headline },
    credSub: { ...typography.subhead },
    credBox: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    credRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
    },
    credLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textSecondary },
    credValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textPrimary },
    credDivider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
    dismiss: { alignSelf: "center", minHeight: 44, justifyContent: "center" },
    dismissText: { fontFamily: fonts.medium, fontSize: 15, color: colors.textSecondary },
    menuCard: { padding: 0, overflow: "hidden" },
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 60,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    memberInfo: { flex: 1, gap: 2 },
    memberName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textPrimary },
    memberRole: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
    divider: { height: 1, backgroundColor: colors.border, marginLeft: spacing.lg + 40 + spacing.md },
    formCard: { gap: spacing.md },
    formTitle: { ...typography.headline },
    roleHint: { ...typography.footnote, lineHeight: 18 },
    addRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        minHeight: 56,
    },
    addLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.textPrimary },
    ownerHint: { ...typography.footnote, textAlign: "center", marginTop: spacing.sm },
});
