import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    Platform,
    Alert,
    ActivityIndicator,
    Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { DateField } from "../ui/DateField";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";
import { formatEuro, formatDate } from "../../lib/format";

const statusMeta: Record<
    string,
    { label: string; tone: "green" | "amber" | "red" | "neutral" }
> = {
    offen: { label: "Offen", tone: "amber" },
    bezahlt: { label: "Bezahlt", tone: "green" },
    ueberfaellig: { label: "Überfällig", tone: "red" },
};

interface Props {
    projectId: Id<"projects">;
}

export function InvoiceSection({ projectId }: Props) {
    const invoices = useQuery(api.invoices.listInvoices, { projectId });
    const generateUploadUrl = useMutation(api.invoices.generateUploadUrl);
    const createInvoice = useMutation(api.invoices.createInvoice);
    const markPaid = useMutation(api.invoices.markPaid);
    const deleteInvoice = useMutation(api.invoices.deleteInvoice);

    const [modalOpen, setModalOpen] = useState(false);
    const [betrag, setBetrag] = useState("");
    const [ausgestellt, setAusgestellt] = useState<number | undefined>(
        Date.now()
    );
    const [faellig, setFaellig] = useState<number | undefined>(undefined);
    const [notiz, setNotiz] = useState("");
    const [pdf, setPdf] = useState<{ uri: string; name: string } | null>(null);
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setBetrag("");
        setAusgestellt(Date.now());
        setFaellig(undefined);
        setNotiz("");
        setPdf(null);
    };

    const pickPdf = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
            copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]) return;
        setPdf({ uri: result.assets[0].uri, name: result.assets[0].name });
    };

    const handleSave = async () => {
        const betragNum = parseFloat(betrag.replace(",", "."));
        if (isNaN(betragNum) || betragNum <= 0) {
            Alert.alert("Fehler", "Bitte einen gültigen Betrag eingeben.");
            return;
        }
        if (!ausgestellt) {
            Alert.alert("Fehler", "Bitte ein Ausstellungsdatum wählen.");
            return;
        }
        setSaving(true);
        try {
            let pdfId: Id<"_storage"> | undefined;
            if (pdf) {
                const uploadUrl = await generateUploadUrl({});
                const resp = await fetch(pdf.uri);
                const blob = await resp.blob();
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/pdf" },
                    body: blob,
                });
                const json = await res.json();
                pdfId = json.storageId as Id<"_storage">;
            }
            await createInvoice({
                projectId,
                betrag: betragNum,
                ausgestelltAm: ausgestellt,
                faelligAm: faellig,
                pdfId,
                notiz: notiz.trim() || undefined,
            });
            if (Platform.OS !== "web")
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            setModalOpen(false);
            resetForm();
        } catch {
            Alert.alert("Fehler", "Rechnung konnte nicht angelegt werden.");
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPaid = (invoiceId: Id<"invoices">) => {
        const run = async () => {
            try {
                await markPaid({ invoiceId });
            } catch {
                Alert.alert("Fehler", "Aktion fehlgeschlagen.");
            }
        };
        if (Platform.OS === "web") {
            run();
            return;
        }
        Alert.alert("Als bezahlt markieren?", undefined, [
            { text: "Abbrechen", style: "cancel" },
            { text: "Bezahlt", onPress: run },
        ]);
    };

    const handleDelete = (invoiceId: Id<"invoices">) => {
        const run = async () => {
            try {
                await deleteInvoice({ invoiceId });
            } catch {
                Alert.alert("Fehler", "Löschen fehlgeschlagen.");
            }
        };
        if (Platform.OS === "web") {
            run();
            return;
        }
        Alert.alert("Rechnung löschen?", "Das kann nicht rückgängig gemacht werden.", [
            { text: "Abbrechen", style: "cancel" },
            { text: "Löschen", style: "destructive", onPress: run },
        ]);
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.head}>
                <Text style={styles.sectionTitle}>Rechnungen</Text>
                <Pressable
                    onPress={() => setModalOpen(true)}
                    hitSlop={8}
                >
                    <Text style={styles.action}>+ Hochladen</Text>
                </Pressable>
            </View>

            {invoices === undefined ? (
                <ActivityIndicator color={colors.textSecondary} />
            ) : invoices.length === 0 ? (
                <Text style={styles.empty}>Noch keine Rechnungen.</Text>
            ) : (
                <View style={styles.list}>
                    {invoices.map((inv) => {
                        const meta = statusMeta[inv.status] ?? statusMeta.offen;
                        return (
                            <View key={inv._id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.betrag}>
                                        {formatEuro(inv.betrag)}
                                    </Text>
                                    <Badge label={meta.label} tone={meta.tone} />
                                </View>
                                <Text style={styles.faellig}>
                                    Fällig: {formatDate(inv.faelligAm)}
                                    {inv.status === "bezahlt" && inv.bezahltAm
                                        ? `  ·  Bezahlt: ${formatDate(inv.bezahltAm)}`
                                        : ""}
                                </Text>
                                {inv.notiz ? (
                                    <Text style={styles.notiz}>{inv.notiz}</Text>
                                ) : null}
                                <View style={styles.cardActions}>
                                    {inv.pdfUrl ? (
                                        <Pressable
                                            style={styles.miniBtn}
                                            onPress={() =>
                                                Linking.openURL(inv.pdfUrl!)
                                            }
                                        >
                                            <Ionicons
                                                name="document-text-outline"
                                                size={16}
                                                color={colors.textPrimary}
                                            />
                                            <Text style={styles.miniText}>
                                                PDF
                                            </Text>
                                        </Pressable>
                                    ) : null}
                                    {inv.status !== "bezahlt" ? (
                                        <Pressable
                                            style={styles.miniBtn}
                                            onPress={() =>
                                                handleMarkPaid(inv._id)
                                            }
                                        >
                                            <Ionicons
                                                name="checkmark-circle-outline"
                                                size={16}
                                                color={colors.statusGreen}
                                            />
                                            <Text style={styles.miniText}>
                                                Bezahlt
                                            </Text>
                                        </Pressable>
                                    ) : null}
                                    <Pressable
                                        style={styles.miniBtn}
                                        onPress={() => handleDelete(inv._id)}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={16}
                                            color={colors.statusRed}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            <Modal
                visible={modalOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalOpen(false)}
            >
                <View style={styles.modalSafe}>
                    <View style={styles.modalHead}>
                        <Text style={styles.modalTitle}>Rechnung hochladen</Text>
                        <Pressable
                            hitSlop={12}
                            onPress={() => setModalOpen(false)}
                        >
                            <Ionicons
                                name="close"
                                size={26}
                                color={colors.textPrimary}
                            />
                        </Pressable>
                    </View>
                    <ScrollView
                        contentContainerStyle={styles.modalScroll}
                        showsVerticalScrollIndicator={false}
                    >
                        <Pressable style={styles.pdfPick} onPress={pickPdf}>
                            <Ionicons
                                name={
                                    pdf
                                        ? "document-text"
                                        : "cloud-upload-outline"
                                }
                                size={24}
                                color={colors.textPrimary}
                            />
                            <Text style={styles.pdfPickText} numberOfLines={1}>
                                {pdf ? pdf.name : "PDF auswählen (optional)"}
                            </Text>
                        </Pressable>

                        <Input
                            label="Betrag (€)"
                            value={betrag}
                            onChangeText={setBetrag}
                            keyboardType="decimal-pad"
                            placeholder="z.B. 2450"
                        />
                        <DateField
                            label="Ausstellungsdatum"
                            value={ausgestellt}
                            onChange={setAusgestellt}
                        />
                        <DateField
                            label="Fällig am (Zahlungsziel)"
                            value={faellig}
                            onChange={setFaellig}
                            placeholder="Datum wählen"
                        />
                        <Input
                            label="Notiz (optional)"
                            value={notiz}
                            onChangeText={setNotiz}
                            placeholder="z.B. Abschlagsrechnung 1"
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <Button
                                title="Rechnung anlegen"
                                onPress={handleSave}
                                loading={saving}
                            />
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.md },
    head: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: { ...typography.title, fontSize: 20 },
    action: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    empty: { ...typography.subhead, paddingVertical: spacing.md },
    list: { gap: spacing.md },
    card: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.lg,
        gap: spacing.sm,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    betrag: { fontFamily: fonts.bold, fontSize: 20, color: colors.textPrimary },
    faellig: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
    notiz: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textPrimary,
    },
    cardActions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    miniBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        borderRadius: radius.button,
        borderCurve: "continuous",
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
    },
    miniText: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.textPrimary,
    },
    modalSafe: { flex: 1, backgroundColor: colors.background },
    modalHead: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: { ...typography.headline },
    modalScroll: {
        padding: spacing.lg,
        gap: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    pdfPick: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        borderCurve: "continuous",
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed",
    },
    pdfPickText: {
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    modalActions: { marginTop: spacing.md },
});
