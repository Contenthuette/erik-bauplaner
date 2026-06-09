import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Pressable,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FormHeader } from "../../components/FormHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { DateField } from "../../components/ui/DateField";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";

export default function ProjektAnlegen() {
    const router = useRouter();
    const kunden = useQuery(api.customers.listCustomers);
    const templates = useQuery(api.templates.listTemplates);
    const createProject = useMutation(api.projects.createProject);

    const [customerId, setCustomerId] = useState<Id<"users"> | undefined>(
        undefined
    );
    const [titel, setTitel] = useState("");
    const [typ, setTyp] = useState("");
    const [adresse, setAdresse] = useState("");
    const [adresseTouched, setAdresseTouched] = useState(false);
    const [startPlan, setStartPlan] = useState<number | undefined>(undefined);
    const [endePlan, setEndePlan] = useState<number | undefined>(undefined);
    const [auftragswert, setAuftragswert] = useState("");
    const [templateId, setTemplateId] = useState<Id<"templates"> | undefined>(
        undefined
    );
    const [kundePickerOpen, setKundePickerOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const selectedKunde = useMemo(
        () => kunden?.find((k) => k._id === customerId),
        [kunden, customerId]
    );

    const pickKunde = (id: Id<"users">) => {
        setCustomerId(id);
        setKundePickerOpen(false);
        // Adresse aus Kundenadresse vorbefüllen, falls noch nicht editiert.
        const k = kunden?.find((c) => c._id === id);
        if (k?.adresse && !adresseTouched) {
            setAdresse(k.adresse);
        }
    };

    const canSave = titel.trim().length > 0;

    const handleSave = async () => {
        if (!canSave) {
            Alert.alert("Fehlende Angaben", "Bitte einen Projekttitel angeben.");
            return;
        }
        const wert = auftragswert.replace(/[^0-9]/g, "");
        setLoading(true);
        try {
            const projectId = await createProject({
                customerId,
                titel: titel.trim(),
                typ: typ.trim() || undefined,
                adresse: adresse.trim() || undefined,
                startPlan,
                endePlan,
                auftragswert: wert ? parseInt(wert, 10) : undefined,
                templateId,
            });
            router.back();
            router.push(`/(admin)/projekt/${projectId}` as Href);
        } catch (e) {
            const msg =
                e instanceof Error ? e.message : "Bitte erneut versuchen.";
            Alert.alert("Konnte Projekt nicht anlegen", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <FormHeader
                title="Neues Projekt"
                onClose={() => router.back()}
                rightLabel="Anlegen"
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
                    {/* Kunde */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Kunde</Text>
                        <Pressable
                            style={styles.select}
                            onPress={() => setKundePickerOpen(true)}
                        >
                            <Ionicons
                                name="person-outline"
                                size={18}
                                color={colors.textSecondary}
                            />
                            <Text
                                style={[
                                    styles.selectValue,
                                    !selectedKunde && styles.selectPlaceholder,
                                ]}
                            >
                                {selectedKunde?.name ?? "Kunde wählen (optional)"}
                            </Text>
                            <Ionicons
                                name="chevron-down"
                                size={18}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                        <Pressable
                            style={styles.inlineLink}
                            onPress={() => router.push("/(admin)/kunde-anlegen")}
                        >
                            <Ionicons
                                name="add"
                                size={16}
                                color={colors.textPrimary}
                            />
                            <Text style={styles.inlineLinkText}>
                                Neuen Kunden anlegen
                            </Text>
                        </Pressable>
                    </View>

                    <Input
                        label="Projekttitel"
                        value={titel}
                        onChangeText={setTitel}
                        placeholder="Steildach Neueindeckung Müllerstraße 12"
                    />
                    <Input
                        label="Projekttyp"
                        value={typ}
                        onChangeText={setTyp}
                        placeholder="z.B. Steildach, Flachdach, Sanierung"
                    />
                    <Input
                        label="Adresse"
                        value={adresse}
                        onChangeText={(t) => {
                            setAdresse(t);
                            setAdresseTouched(true);
                        }}
                        placeholder="Baustellenadresse"
                    />

                    <View style={styles.dateRow}>
                        <View style={styles.dateCol}>
                            <DateField
                                label="Geplanter Start"
                                value={startPlan}
                                onChange={setStartPlan}
                            />
                        </View>
                        <View style={styles.dateCol}>
                            <DateField
                                label="Geplantes Ende"
                                value={endePlan}
                                onChange={setEndePlan}
                            />
                        </View>
                    </View>

                    <Input
                        label="Auftragswert (€)"
                        value={auftragswert}
                        onChangeText={setAuftragswert}
                        placeholder="z.B. 24500"
                        keyboardType="number-pad"
                    />

                    {/* Vorlage */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Ablaufplan</Text>
                        <Pressable
                            style={[
                                styles.templateOption,
                                templateId === undefined &&
                                    styles.templateOptionActive,
                            ]}
                            onPress={() => setTemplateId(undefined)}
                        >
                            <Ionicons
                                name={
                                    templateId === undefined
                                        ? "radio-button-on"
                                        : "radio-button-off"
                                }
                                size={20}
                                color={
                                    templateId === undefined
                                        ? colors.textPrimary
                                        : colors.textSecondary
                                }
                            />
                            <View style={styles.templateTextWrap}>
                                <Text style={styles.templateTitle}>
                                    Leer starten
                                </Text>
                                <Text style={styles.templateHint}>
                                    Schritte später selbst hinzufügen
                                </Text>
                            </View>
                        </Pressable>

                        {(templates ?? []).map((t) => {
                            const active = templateId === t._id;
                            return (
                                <Pressable
                                    key={t._id}
                                    style={[
                                        styles.templateOption,
                                        active && styles.templateOptionActive,
                                    ]}
                                    onPress={() => setTemplateId(t._id)}
                                >
                                    <Ionicons
                                        name={
                                            active
                                                ? "radio-button-on"
                                                : "radio-button-off"
                                        }
                                        size={20}
                                        color={
                                            active
                                                ? colors.textPrimary
                                                : colors.textSecondary
                                        }
                                    />
                                    <View style={styles.templateTextWrap}>
                                        <Text style={styles.templateTitle}>
                                            {t.name}
                                        </Text>
                                        <Text style={styles.templateHint}>
                                            {t.anzahlSchritte} Schritte
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.saveWrap}>
                        <Button
                            title="Projekt anlegen"
                            onPress={handleSave}
                            loading={loading}
                            disabled={!canSave}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Kunden-Picker */}
            <Modal
                visible={kundePickerOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setKundePickerOpen(false)}
            >
                <Pressable
                    style={styles.pickerBackdrop}
                    onPress={() => setKundePickerOpen(false)}
                >
                    <Pressable style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerTitle}>Kunde wählen</Text>
                        <ScrollView style={styles.pickerList}>
                            {(kunden ?? []).length === 0 ? (
                                <Text style={styles.pickerEmpty}>
                                    Noch keine Kunden. Lege zuerst einen Kunden an.
                                </Text>
                            ) : (
                                (kunden ?? []).map((k) => (
                                    <Pressable
                                        key={k._id}
                                        style={styles.pickerItem}
                                        onPress={() => pickKunde(k._id)}
                                    >
                                        <View>
                                            <Text style={styles.pickerItemName}>
                                                {k.name}
                                            </Text>
                                            {k.adresse ? (
                                                <Text
                                                    style={styles.pickerItemMeta}
                                                >
                                                    {k.adresse}
                                                </Text>
                                            ) : null}
                                        </View>
                                        {customerId === k._id ? (
                                            <Ionicons
                                                name="checkmark"
                                                size={20}
                                                color={colors.textPrimary}
                                            />
                                        ) : null}
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
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
    fieldGroup: {
        gap: spacing.sm,
    },
    label: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    select: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        borderCurve: "continuous",
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        backgroundColor: colors.surface,
    },
    selectValue: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.textPrimary,
    },
    selectPlaceholder: {
        color: colors.textSecondary,
    },
    inlineLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: spacing.xs,
        marginLeft: 2,
    },
    inlineLinkText: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
    dateRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    dateCol: {
        flex: 1,
    },
    templateOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.lg,
    },
    templateOptionActive: {
        borderColor: colors.textPrimary,
        backgroundColor: colors.surfaceMuted,
    },
    templateTextWrap: {
        flex: 1,
    },
    templateTitle: {
        ...typography.callout,
        fontFamily: fonts.medium,
    },
    templateHint: {
        ...typography.footnote,
    },
    saveWrap: {
        marginTop: spacing.sm,
    },
    pickerBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "flex-end",
    },
    pickerSheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
        maxHeight: "70%",
    },
    pickerHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: "center",
        marginBottom: spacing.md,
    },
    pickerTitle: {
        ...typography.headline,
        marginBottom: spacing.md,
    },
    pickerList: {
        flexGrow: 0,
    },
    pickerEmpty: {
        ...typography.subhead,
        textAlign: "center",
        paddingVertical: spacing.xl,
    },
    pickerItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        minHeight: 56,
    },
    pickerItemName: {
        ...typography.body,
    },
    pickerItemMeta: {
        ...typography.footnote,
    },
});
