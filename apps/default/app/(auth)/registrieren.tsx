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
import { Wordmark } from "../../components/Wordmark";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors, spacing, typography } from "../../lib/theme";

export default function RegisterScreen() {
    const { signIn } = useAuthActions();
    const router = useRouter();
    const [firma, setFirma] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firma.trim() || !name.trim() || !email.trim() || !password) {
            Alert.alert("Fehlende Angaben", "Bitte alle Felder ausfüllen.");
            return;
        }
        if (password.length < 8) {
            Alert.alert(
                "Passwort zu kurz",
                "Das Passwort muss mindestens 8 Zeichen lang sein."
            );
            return;
        }
        setLoading(true);
        try {
            await signIn("password", {
                email: email.trim().toLowerCase(),
                password,
                name: name.trim(),
                rolle: "owner",
                pendingCompanyName: firma.trim(),
                flow: "signUp",
            });
            router.replace("/");
        } catch {
            Alert.alert(
                "Registrierung fehlgeschlagen",
                "Möglicherweise existiert bereits ein Konto mit dieser E-Mail."
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
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        hitSlop={12}
                    >
                        <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
                    </Pressable>

                    <View style={styles.header}>
                        <Wordmark size={36} />
                        <Text style={styles.title}>Betrieb registrieren</Text>
                        <Text style={styles.subtitle}>
                            Legen Sie Ihr Betriebskonto an. Kunden werden später von
                            Ihnen eingeladen.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Firmenname"
                            value={firma}
                            onChangeText={setFirma}
                            placeholder="Mustermann Bau GmbH"
                        />
                        <Input
                            label="Name des Inhabers"
                            value={name}
                            onChangeText={setName}
                            placeholder="Max Mustermann"
                        />
                        <Input
                            label="E-Mail"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="name@firma.de"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            textContentType="emailAddress"
                        />
                        <Input
                            label="Passwort"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Mindestens 8 Zeichen"
                            secureTextEntry
                            textContentType="newPassword"
                        />
                        <View style={styles.buttonWrap}>
                            <Button
                                title="Konto erstellen"
                                onPress={handleRegister}
                                loading={loading}
                            />
                        </View>
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
        marginTop: spacing.sm,
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
