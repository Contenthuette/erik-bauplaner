import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Pressable,
    Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useAction } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { FormHeader } from "../../components/FormHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";

const APP_LINK = "https://polier.app/download";

interface Credentials {
    name: string;
    login: string;
    tempPassword: string;
}

function buildInvite(c: Credentials): string {
    return (
        `Hallo ${c.name}, wir halten dich ab jetzt über die Polier-App über ` +
        `deine Baustelle auf dem Laufenden. Lade die App hier herunter: ` +
        `${APP_LINK}. Deine Zugangsdaten: Benutzer ${c.login}, Passwort ` +
        `${c.tempPassword}.`
    );
}

export default function KundeAnlegen() {
    const router = useRouter();
    const createCustomer = useAction(api.customers.createCustomer);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [telefon, setTelefon] = useState("");
    const [adresse, setAdresse] = useState("");
    const [benutzername, setBenutzername] = useState("");
    const [loading, setLoading] = useState(false);
    const [creds, setCreds] = useState<Credentials | null>(null);

    const canSave = name.trim().length > 0 && (email.trim() || benutzername.trim());

    const handleSave = async () => {
        if (!canSave) {
            Alert.alert(
                "Fehlende Angaben",
                "Bitte Name und E-Mail (oder Benutzername) angeben."
            );
            return;
        }
        setLoading(true);
        try {
            const result = await createCustomer({
                name: name.trim(),
                email: email.trim(),
                telefon: telefon.trim() || undefined,
                adresse: adresse.trim() || undefined,
                benutzername: benutzername.trim() || undefined,
            });
            if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            }
            setCreds({
                name: result.name,
                login: result.login,
                tempPassword: result.tempPassword,
            });
        } catch (e) {
            const msg =
                e instanceof Error ? e.message : "Bitte erneut versuchen.";
            Alert.alert("Konnte Kunde nicht anlegen", msg);
        } finally {
            setLoading(false);
        }
    };

    const copyInvite = async () => {
        if (!creds) return;
        await Clipboard.setStringAsync(buildInvite(creds));
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        Alert.alert("Kopiert", "Der Einladungstext liegt in der Zwischenablage.");
    };

    const sendEmail = async () => {
        if (!creds) return;
        try {
            await Share.share({ message: buildInvite(creds) });
        } catch {
            // Nutzer hat abgebrochen — nichts zu tun.
        }
    };

    // ===================== Bestätigungs-Ansicht =====================
    if (creds) {
        return (
            <SafeAreaView style={styles.safe}>
                <FormHeader
                    title="Kunde angelegt"
                    onClose={() => router.back()}
                />
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.successIcon}>
                        <Ionicons
                            name="checkmark-circle"
                            size={56}
                            color={colors.statusGreen}
                        />
                    </View>
                    <Text style={styles.successTitle}>
                        {creds.name} wurde eingeladen
                    </Text>
                    <Text style={styles.successHint}>
                        Gib diese Zugangsdaten an deinen Kunden weiter. Das
                        Passwort wird nur einmal angezeigt.
                    </Text>

                    <View style={styles.credBox}>
                        <View style={styles.credRow}>
                            <Text style={styles.credLabel}>Benutzer</Text>
                            <Text selectable style={styles.credValue}>
                                {creds.login}
                            </Text>
                        </View>
                        <View style={styles.credDivider} />
                        <View style={styles.credRow}>
                            <Text style={styles.credLabel}>Passwort</Text>
                            <Text selectable style={styles.credValue}>
                                {creds.tempPassword}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.inviteBox}>
                        <Text style={styles.inviteLabel}>Einladungstext</Text>
                        <Text style={styles.inviteText}>{buildInvite(creds)}</Text>
                    </View>

                    <View style={styles.actions}>
                        <Button title="Kopieren" onPress={copyInvite} />
                        <Button
                            title="Per E-Mail senden"
                            variant="secondary"
                            onPress={sendEmail}
                        />
                    </View>

                    <Pressable
                        style={styles.doneLink}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.doneLinkText}>Fertig</Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ===================== Formular-Ansicht =====================
    return (
        <SafeAreaView style={styles.safe}>
            <FormHeader
                title="Neuer Kunde"
                onClose={() => router.back()}
                rightLabel="Speichern"
                onRightPress={handleSave}
                rightDisabled={!canSave || loading}
            />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Input
                        label="Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Max Mustermann"
                    />
                    <Input
                        label="E-Mail"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="kunde@example.de"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                    />
                    <Input
                        label="Telefon"
                        value={telefon}
                        onChangeText={setTelefon}
                        placeholder="0151 23456789"
                        keyboardType="phone-pad"
                    />
                    <Input
                        label="Adresse"
                        value={adresse}
                        onChangeText={setAdresse}
                        placeholder="Müllerstraße 12, 80331 München"
                    />
                    <Input
                        label="Benutzername (optional)"
                        value={benutzername}
                        onChangeText={setBenutzername}
                        placeholder="Falls leer, wird die E-Mail genutzt"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <View style={styles.note}>
                        <Ionicons
                            name="information-circle-outline"
                            size={16}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.noteText}>
                            Es wird automatisch ein Zugang mit temporärem
                            Passwort erstellt. Die Zugangsdaten siehst du im
                            nächsten Schritt.
                        </Text>
                    </View>

                    <View style={styles.saveWrap}>
                        <Button
                            title="Kunde anlegen"
                            onPress={handleSave}
                            loading={loading}
                            disabled={!canSave}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    scroll: {
        padding: spacing.lg,
        gap: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    note: {
        flexDirection: "row",
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.md,
    },
    noteText: {
        ...typography.footnote,
        flex: 1,
    },
    saveWrap: {
        marginTop: spacing.sm,
    },
    // Bestätigung
    successIcon: {
        alignItems: "center",
        marginTop: spacing.lg,
    },
    successTitle: {
        ...typography.title,
        textAlign: "center",
    },
    successHint: {
        ...typography.subhead,
        textAlign: "center",
        maxWidth: 300,
        alignSelf: "center",
    },
    credBox: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.card,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
    },
    credRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
        gap: spacing.lg,
    },
    credLabel: {
        ...typography.subhead,
    },
    credValue: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.textPrimary,
    },
    credDivider: {
        height: 1,
        backgroundColor: colors.border,
    },
    inviteBox: {
        gap: spacing.sm,
    },
    inviteLabel: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    inviteText: {
        ...typography.callout,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.lg,
        lineHeight: 22,
    },
    actions: {
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    doneLink: {
        alignItems: "center",
        paddingVertical: spacing.lg,
    },
    doneLinkText: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textSecondary,
    },
});
