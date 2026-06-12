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
import { useRouter, Link } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { Wordmark } from "../../components/Wordmark";
import { LogoMark } from "../../components/LogoMark";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors, spacing, fonts, typography } from "../../lib/theme";

export default function LoginScreen() {
    const { signIn } = useAuthActions();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert("Fehlende Angaben", "Bitte E-Mail und Passwort eingeben.");
            return;
        }
        setLoading(true);
        try {
            await signIn("password", {
                email: email.trim().toLowerCase(),
                password,
                flow: "signIn",
            });
            router.replace("/");
        } catch {
            Alert.alert(
                "Anmeldung fehlgeschlagen",
                "E-Mail oder Passwort ist nicht korrekt."
            );
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
                    <View style={styles.header}>
                        <LogoMark size={72} />
                        <Wordmark size={44} />
                        <Text style={styles.subtitle}>
                            Baufortschritt einfach im Blick.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="E-Mail oder Benutzername"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="name@firma.de"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            textContentType="username"
                        />
                        <Input
                            label="Passwort"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            textContentType="password"
                        />
                        <View style={styles.buttonWrap}>
                            <Button
                                title="Anmelden"
                                onPress={handleLogin}
                                loading={loading}
                            />
                        </View>
                        <Link href="/(auth)/passwort-vergessen" asChild>
                            <Pressable style={styles.linkRow}>
                                <Text style={styles.link}>Passwort vergessen?</Text>
                            </Pressable>
                        </Link>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Sie betreiben einen Handwerksbetrieb?</Text>
                        <Link href="/(auth)/registrieren" asChild>
                            <Pressable style={styles.linkRow}>
                                <Text style={styles.linkStrong}>Betrieb registrieren</Text>
                            </Pressable>
                        </Link>
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
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: "center",
        paddingVertical: spacing.xxl,
    },
    header: {
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.xxl,
    },
    subtitle: {
        ...typography.subhead,
        marginTop: spacing.md,
        textAlign: "center",
    },
    form: {
        gap: spacing.lg,
    },
    buttonWrap: {
        marginTop: spacing.sm,
    },
    linkRow: {
        minHeight: 44,
        justifyContent: "center",
    },
    link: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textSecondary,
    },
    footer: {
        marginTop: spacing.xxl,
        alignItems: "center",
        gap: 2,
    },
    footerText: {
        ...typography.footnote,
    },
    linkStrong: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.textPrimary,
    },
});
