import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors, spacing, typography, fonts } from "../../lib/theme";

/**
 * Passwort ändern — zweistufig per OTP-Code an die eigene E-Mail.
 * 1. Code anfordern (flow: "reset").
 * 2. Code + neues Passwort (flow: "reset-verification").
 */
export default function PasswortAendern() {
    const { signIn } = useAuthActions();
    const me = useQuery(api.users.getCurrentUser);
    const router = useRouter();
    const [step, setStep] = useState<"start" | "code">("start");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const email = me?.email ?? "";

    const requestCode = async () => {
        if (!email) {
            Alert.alert(
                "Keine E-Mail",
                "Für dein Konto ist keine E-Mail hinterlegt."
            );
            return;
        }
        setLoading(true);
        try {
            await signIn("password", { email, flow: "reset" });
            setStep("code");
        } catch {
            Alert.alert(
                "Fehler",
                "Der Code konnte nicht gesendet werden. Bitte später erneut versuchen."
            );
        } finally {
            setLoading(false);
        }
    };

    const submit = async () => {
        if (!code.trim() || !password) {
            Alert.alert(
                "Fehlende Angaben",
                "Bitte Code und neues Passwort eingeben."
            );
            return;
        }
        if (password.length < 8) {
            Alert.alert("Passwort zu kurz", "Mindestens 8 Zeichen erforderlich.");
            return;
        }
        setLoading(true);
        try {
            await signIn("password", {
                email,
                code: code.trim(),
                newPassword: password,
                flow: "reset-verification",
            });
            Alert.alert("Erledigt", "Dein Passwort wurde geändert.");
            router.back();
        } catch {
            Alert.alert("Fehler", "Code ungültig oder abgelaufen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>Passwort ändern</Text>
                <Pressable hitSlop={12} onPress={() => router.back()}>
                    <Ionicons name="close" size={26} color={colors.textPrimary} />
                </Pressable>
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
                    {step === "start" ? (
                        <View style={styles.form}>
                            <Text style={styles.subtitle}>
                                Wir senden einen Bestätigungscode an{"\n"}
                                <Text style={styles.email}>{email}</Text>.
                            </Text>
                            <Button
                                title="Code senden"
                                onPress={requestCode}
                                loading={loading}
                            />
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <Input
                                label="Code aus der E-Mail"
                                value={code}
                                onChangeText={setCode}
                                placeholder="8-stelliger Code"
                                keyboardType="number-pad"
                            />
                            <Input
                                label="Neues Passwort"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Mindestens 8 Zeichen"
                                secureTextEntry
                            />
                            <Button
                                title="Passwort speichern"
                                onPress={submit}
                                loading={loading}
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
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
        paddingTop: spacing.lg,
    },
    form: { gap: spacing.lg },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 23,
    },
    email: {
        fontFamily: fonts.semibold,
        color: colors.textPrimary,
    },
});
