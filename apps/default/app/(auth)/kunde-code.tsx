import React, { useState, useEffect } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { Wordmark } from "../../components/Wordmark";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors, spacing, typography } from "../../lib/theme";

export default function KundeCode() {
    const { signIn } = useAuthActions();
    const router = useRouter();
    const params = useLocalSearchParams<{ code?: string }>();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    // Einladungslink kann den Code vorbefüllen (?code=ABC123).
    useEffect(() => {
        if (params.code && typeof params.code === "string") {
            setCode(params.code.toUpperCase());
        }
    }, [params.code]);

    const handleSubmit = async () => {
        const clean = code.trim().toUpperCase().replace(/\s|-/g, "");
        if (!clean) {
            Alert.alert(
                "Code fehlt",
                "Bitte gib den Zugangscode ein, den du von deinem Betrieb erhalten hast."
            );
            return;
        }
        setLoading(true);
        try {
            await signIn("accesscode", { code: clean });
            router.replace("/");
        } catch {
            Alert.alert(
                "Code ungültig",
                "Dieser Zugangscode ist nicht gültig oder wurde deaktiviert. Bitte prüfe die Eingabe oder frage deinen Betrieb."
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
                        <Ionicons
                            name="chevron-back"
                            size={26}
                            color={colors.textPrimary}
                        />
                    </Pressable>

                    <View style={styles.header}>
                        <Wordmark size={36} />
                        <Text style={styles.title}>Zugangscode eingeben</Text>
                        <Text style={styles.subtitle}>
                            Gib den Code ein, den du von deinem Handwerksbetrieb
                            bekommen hast. Damit siehst du den Fortschritt deiner
                            Baustelle.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Zugangscode"
                            value={code}
                            onChangeText={(t) => setCode(t.toUpperCase())}
                            placeholder="z. B. AB7K9QXM"
                            autoCapitalize="characters"
                            autoCorrect={false}
                            autoComplete="off"
                        />
                        <View style={styles.buttonWrap}>
                            <Button
                                title="Baustelle öffnen"
                                onPress={handleSubmit}
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
        gap: spacing.xl,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: "center",
        marginLeft: -8,
    },
    header: {
        gap: spacing.md,
        marginTop: spacing.sm,
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
