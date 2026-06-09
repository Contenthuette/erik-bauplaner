import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FormHeader } from "../../../components/FormHeader";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { DateField } from "../../../components/ui/DateField";
import { colors, spacing, fonts, radius } from "../../../lib/theme";
import { projectStatusMeta, ProjectStatus } from "../../../lib/format";

const STATUS_OPTIONS: ProjectStatus[] = [
    "geplant",
    "laeuft",
    "pausiert",
    "verzoegert",
    "abgeschlossen",
];

export default function ProjektBearbeiten() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const projectId = id as Id<"projects">;
    const router = useRouter();

    const project = useQuery(api.projects.getProject, { projectId });
    const updateProject = useMutation(api.projects.updateProject);

    const [titel, setTitel] = useState("");
    const [typ, setTyp] = useState("");
    const [adresse, setAdresse] = useState("");
    const [status, setStatus] = useState<ProjectStatus>("geplant");
    const [startPlan, setStartPlan] = useState<number | undefined>(undefined);
    const [endePlan, setEndePlan] = useState<number | undefined>(undefined);
    const [auftragswert, setAuftragswert] = useState("");
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (project && !ready) {
            setTitel(project.titel);
            setTyp(project.typ ?? "");
            setAdresse(project.adresse ?? "");
            setStatus(project.status);
            setStartPlan(project.startPlan);
            setEndePlan(project.endePlan);
            setAuftragswert(
                project.auftragswert ? String(project.auftragswert) : ""
            );
            setReady(true);
        }
    }, [project, ready]);

    const handleSave = async () => {
        if (!titel.trim()) {
            Alert.alert("Fehlt", "Bitte einen Titel angeben.");
            return;
        }
        const wert = auftragswert.replace(/[^0-9]/g, "");
        setLoading(true);
        try {
            await updateProject({
                projectId,
                titel: titel.trim(),
                typ: typ.trim(),
                adresse: adresse.trim(),
                status,
                startPlan,
                endePlan,
                auftragswert: wert ? parseInt(wert, 10) : undefined,
            });
            router.back();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Fehler";
            Alert.alert("Konnte nicht speichern", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <FormHeader
                title="Projekt bearbeiten"
                onClose={() => router.back()}
                rightLabel="Speichern"
                onRightPress={handleSave}
                rightDisabled={loading || !titel.trim()}
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
                        label="Projekttitel"
                        value={titel}
                        onChangeText={setTitel}
                        placeholder="Projekttitel"
                    />
                    <Input
                        label="Projekttyp"
                        value={typ}
                        onChangeText={setTyp}
                        placeholder="z.B. Steildach"
                    />
                    <Input
                        label="Adresse"
                        value={adresse}
                        onChangeText={setAdresse}
                        placeholder="Baustellenadresse"
                    />

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusGrid}>
                            {STATUS_OPTIONS.map((s) => {
                                const m = projectStatusMeta[s];
                                const active = status === s;
                                return (
                                    <Pressable
                                        key={s}
                                        style={[
                                            styles.statusChip,
                                            active && styles.statusChipActive,
                                        ]}
                                        onPress={() => setStatus(s)}
                                    >
                                        <Text
                                            style={[
                                                styles.statusChipText,
                                                active &&
                                                    styles.statusChipTextActive,
                                            ]}
                                        >
                                            {m.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

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

                    <View style={styles.saveWrap}>
                        <Button
                            title="Speichern"
                            onPress={handleSave}
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
    scroll: {
        padding: spacing.lg,
        gap: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    fieldGroup: { gap: spacing.sm },
    label: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    statusGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    statusChip: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.lg,
        paddingVertical: 8,
    },
    statusChipActive: {
        backgroundColor: colors.buttonPrimaryBg,
        borderColor: colors.buttonPrimaryBg,
    },
    statusChipText: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
    },
    statusChipTextActive: {
        color: colors.textOnDark,
    },
    dateRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    dateCol: { flex: 1 },
    saveWrap: { marginTop: spacing.sm },
});
