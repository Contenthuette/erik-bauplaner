import React, { useState, useEffect } from "react";
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
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography } from "../../lib/theme";

export default function Firmenprofil() {
    const router = useRouter();
    const company = useQuery(api.company.getMyCompany);
    const update = useMutation(api.company.updateCompany);
    const generateUploadUrl = useMutation(api.company.generateLogoUploadUrl);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [telefon, setTelefon] = useState("");
    const [adresse, setAdresse] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
    const [logoId, setLogoId] = useState<Id<"_storage"> | undefined>(undefined);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    const istOwner = company?.meineRolle === "owner";

    useEffect(() => {
        if (company && !hydrated) {
            setName(company.name);
            setEmail(company.kontaktEmail ?? "");
            setTelefon(company.kontaktTelefon ?? "");
            setAdresse(company.adresse ?? "");
            setLogoUrl(company.logoUrl);
            setHydrated(true);
        }
    }, [company, hydrated]);

    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (result.canceled || !result.assets || !result.assets[0]) return;
        setUploading(true);
        try {
            const asset = result.assets[0];
            const uploadUrl = await generateUploadUrl({});
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const uploadRes = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });
            const { storageId } = await uploadRes.json();
            setLogoId(storageId as Id<"_storage">);
            setLogoUrl(asset.uri);
        } catch {
            Alert.alert("Fehler", "Logo konnte nicht hochgeladen werden.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Fehlende Angabe", "Bitte einen Firmennamen eingeben.");
            return;
        }
        setSaving(true);
        try {
            await update({
                name: name.trim(),
                kontaktEmail: email.trim(),
                kontaktTelefon: telefon.trim(),
                adresse: adresse.trim(),
                logoId,
            });
            router.back();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Speichern fehlgeschlagen.";
            Alert.alert("Fehler", msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Firmenprofil</Text>
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
                    {!istOwner ? (
                        <View style={styles.hintBox}>
                            <Ionicons
                                name="information-circle-outline"
                                size={18}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.hintText}>
                                Nur der Inhaber kann das Firmenprofil ändern.
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.logoSection}>
                        <Pressable
                            onPress={istOwner ? pickLogo : undefined}
                            style={styles.logoWrap}
                            disabled={!istOwner || uploading}
                        >
                            {logoUrl ? (
                                <Image
                                    source={{ uri: logoUrl }}
                                    style={styles.logo}
                                    contentFit="cover"
                                />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Ionicons
                                        name="business-outline"
                                        size={28}
                                        color={colors.textSecondary}
                                    />
                                </View>
                            )}
                            {istOwner ? (
                                <View style={styles.logoBadge}>
                                    <Ionicons
                                        name={uploading ? "hourglass-outline" : "camera"}
                                        size={14}
                                        color={colors.textOnDark}
                                    />
                                </View>
                            ) : null}
                        </Pressable>
                        <Text style={styles.logoHint}>
                            Logo erscheint beim Kunden
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Firmenname"
                            value={name}
                            onChangeText={setName}
                            editable={istOwner}
                            placeholder="Mustermann Bau GmbH"
                        />
                        <Input
                            label="Kontakt-E-Mail"
                            value={email}
                            onChangeText={setEmail}
                            editable={istOwner}
                            placeholder="info@firma.de"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Input
                            label="Telefon"
                            value={telefon}
                            onChangeText={setTelefon}
                            editable={istOwner}
                            placeholder="030 1234567"
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Adresse"
                            value={adresse}
                            onChangeText={setAdresse}
                            editable={istOwner}
                            placeholder="Musterstr. 1, 10115 Berlin"
                        />
                        {istOwner ? (
                            <View style={styles.saveWrap}>
                                <Button
                                    title="Speichern"
                                    onPress={handleSave}
                                    loading={saving}
                                />
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    hintBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    hintText: { ...typography.footnote, flex: 1 },
    logoSection: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
    logoWrap: { width: 88, height: 88 },
    logo: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: colors.border },
    logoPlaceholder: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    logoBadge: {
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.buttonPrimaryBg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.background,
    },
    logoHint: { ...typography.footnote },
    form: { gap: spacing.lg },
    saveWrap: { marginTop: spacing.sm },
});
