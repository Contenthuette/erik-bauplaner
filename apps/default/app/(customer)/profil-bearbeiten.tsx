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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { colors, spacing, typography } from "../../lib/theme";

export default function ProfilBearbeiten() {
    const me = useQuery(api.users.getCurrentUser);
    const update = useMutation(api.users.updateMyProfile);
    const router = useRouter();
    const [name, setName] = useState("");
    const [telefon, setTelefon] = useState("");
    const [adresse, setAdresse] = useState("");
    const [loading, setLoading] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (me && !hydrated) {
            setName(me.name ?? "");
            setTelefon(me.telefon ?? "");
            setAdresse(me.adresse ?? "");
            setHydrated(true);
        }
    }, [me, hydrated]);

    const save = async () => {
        if (!name.trim()) {
            Alert.alert("Name fehlt", "Bitte gib deinen Namen ein.");
            return;
        }
        setLoading(true);
        try {
            await update({
                name: name.trim(),
                telefon: telefon.trim() || undefined,
                adresse: adresse.trim() || undefined,
            });
            router.back();
        } catch {
            Alert.alert("Fehler", "Speichern fehlgeschlagen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.headerBar}>
                <Text style={styles.headerTitle}>Profil bearbeiten</Text>
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
                    <View style={styles.form}>
                        <Input
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Vor- und Nachname"
                        />
                        <Input
                            label="Telefon"
                            value={telefon}
                            onChangeText={setTelefon}
                            placeholder="Telefonnummer"
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Adresse"
                            value={adresse}
                            onChangeText={setAdresse}
                            placeholder="Straße, PLZ Ort"
                        />
                        <Button
                            title="Speichern"
                            onPress={save}
                            loading={loading}
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
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: { ...typography.headline },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    form: { gap: spacing.lg },
});
