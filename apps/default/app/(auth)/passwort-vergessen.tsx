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
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors, spacing, typography } from "../../lib/theme";

/**
 * Passwort vergessen — zweistufig:
 * 1. E-Mail eingeben -> OTP-Code wird per E-Mail gesendet (flow: "reset").
 * 2. Code + neues Passwort eingeben (flow: "reset-verification").
 */
export default function PasswortVergessenScreen() {
    const { signIn } = useAuthActions();
    const router = useRouter();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const requestCode = async () => {
        if (!email.trim()) {
            Alert.alert("Fehlende Angabe", "Bitte E-Mail eingeben.");
            return;
        }
        setLoading(true);
        try {
            await signIn("password", {
                email: email.trim().toLowerCase(),
                flow: "reset",
            });
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

    const submitReset = async () => {
        if (!code.trim() || !password) {
            Alert.alert("Fehlende Angaben", "Bitte Code und neues Passwort eingeben.");
            return;
        }
        if (password.length < 8) {
            Alert.alert("Passwort zu kurz", "Mindestens 8 Zeichen erforderlich.");
            return;
        }
        setLoading(true);
        try {
            await signIn("password", {
                email: email.trim().toLowerCase(),
                code: code.trim(),
                newPassword: password,
                flow: "reset-verification",
            });
            router.replace("/");
        } catch {
            Alert.alert("Fehler", "Code ungültig oder abgelaufen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        hitSlop={12}
                    >
                        <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
                    </Pressable>

                    <View style={styles.header}>
                        <Text style={styles.title}>Passwort zurücksetzen</Text>
                        <Text style={styles.subtitle}>
                            {step === "email"
                                ? "Wir senden Ihnen einen Code per E-Mail."
                                : "Geben Sie den Code aus der E-Mail und ein neues Passwort ein."}
                        </Text>
                    </View>

                    {step === "email" ? (
                        <View style={styles.form}>
                            <Input
                                label="E-Mail"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="name@firma.de"
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                            />
                            <View style={styles.buttonWrap}>
                                <Button
                                    title="Code senden"
                                    onPress={requestCode}
                                    loading={loading}
                                />
                            </View>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <Input
                                label="Code"
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
                            <View style={styles.buttonWrap}>
                                <Button
                                    title="Passwort speichern"
                                    onPress={submitReset}
                                    loading={loading}
                                />
                            </View>
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
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: "center",
        marginLeft: -8,
    },
    header: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    title: {
        ...typography.title,
    },
    subtitle: {
        ...typography.subhead,
    },
    form: {
        gap: spacing.lg,
    },
    buttonWrap: {
        marginTop: spacing.sm,
    },
});
