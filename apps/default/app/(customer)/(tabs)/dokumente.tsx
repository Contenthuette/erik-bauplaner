import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "../../../components/ui/Badge";
import { colors, spacing, typography, fonts, radius } from "../../../lib/theme";
import { formatEuro, formatDate } from "../../../lib/format";
import { useAttachmentViewer } from "../../../components/AttachmentViewer";

const statusMeta: Record<
    string,
    { label: string; tone: "green" | "amber" | "red" | "neutral" }
> = {
    offen: { label: "Offen", tone: "amber" },
    bezahlt: { label: "Bezahlt", tone: "green" },
    ueberfaellig: { label: "Überfällig", tone: "red" },
};

export default function Dokumente() {
    const { openAttachment } = useAttachmentViewer();
    const offene = useQuery(api.invoices.myOpenInvoices);
    const liste = useQuery(api.invoices.myAllInvoices);

    const ladend = offene === undefined || liste === undefined;

    const offenerBetrag = (offene ?? []).reduce(
        (sum, inv) => sum + inv.betrag,
        0
    );
    const hatUeberfaellig = (offene ?? []).some(
        (inv) => inv.status === "ueberfaellig"
    );

    async function handleDownload(url: string) {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        try {
            const ziel = FileSystem.cacheDirectory + "rechnung.pdf";
            const { uri } = await FileSystem.downloadAsync(url, ziel);
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
        } catch {
            // still bleiben
        }
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.largeTitle}>Dokumente</Text>

                {ladend ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.textPrimary} />
                    </View>
                ) : (
                    <>
                        {offenerBetrag > 0 ? (
                            <View
                                style={[
                                    styles.hinweis,
                                    hatUeberfaellig
                                        ? styles.hinweisRot
                                        : styles.hinweisAmber,
                                ]}
                            >
                                <Ionicons
                                    name={
                                        hatUeberfaellig
                                            ? "alert-circle"
                                            : "information-circle"
                                    }
                                    size={20}
                                    color={
                                        hatUeberfaellig
                                            ? colors.statusRed
                                            : colors.statusAmber
                                    }
                                />
                                <Text style={styles.hinweisText}>
                                    {hatUeberfaellig
                                        ? `Du hast überfällige Rechnungen über ${formatEuro(offenerBetrag)}.`
                                        : `Offener Betrag: ${formatEuro(offenerBetrag)}.`}
                                </Text>
                            </View>
                        ) : null}

                        {!liste || liste.length === 0 ? (
                            <View style={styles.center}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons
                                        name="document-text-outline"
                                        size={26}
                                        color={colors.textSecondary}
                                    />
                                </View>
                                <Text style={styles.emptyText}>
                                    Hier erscheinen deine Rechnungen, sobald dein
                                    Betrieb welche bereitstellt.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.list}>
                                {liste.map((inv) => {
                                    const meta =
                                        statusMeta[inv.status] ??
                                        statusMeta.offen;
                                    return (
                                        <View
                                            key={inv._id}
                                            style={styles.card}
                                        >
                                            <View style={styles.cardTop}>
                                                <Text style={styles.betrag}>
                                                    {formatEuro(inv.betrag)}
                                                </Text>
                                                <Badge
                                                    label={meta.label}
                                                    tone={meta.tone}
                                                />
                                            </View>
                                            <View style={styles.metaRow}>
                                                <Ionicons
                                                    name="calendar-outline"
                                                    size={14}
                                                    color={
                                                        colors.textSecondary
                                                    }
                                                />
                                                <Text style={styles.metaText}>
                                                    Fällig:{" "}
                                                    {formatDate(inv.faelligAm)}
                                                </Text>
                                            </View>
                                            {inv.notiz ? (
                                                <Text style={styles.notiz}>
                                                    {inv.notiz}
                                                </Text>
                                            ) : null}
                                            {inv.pdfUrl ? (
                                                <View style={styles.aktionen}>
                                                    <Pressable
                                                        style={styles.aktBtn}
                                                        onPress={() =>
                                                            openAttachment({
                                                                url: inv.pdfUrl!,
                                                                istPdf: true,
                                                                name: "rechnung.pdf",
                                                            })
                                                        }
                                                    >
                                                        <Ionicons
                                                            name="eye-outline"
                                                            size={18}
                                                            color={
                                                                colors.textPrimary
                                                            }
                                                        />
                                                        <Text
                                                            style={
                                                                styles.aktText
                                                            }
                                                        >
                                                            Ansehen
                                                        </Text>
                                                    </Pressable>
                                                    <Pressable
                                                        style={styles.aktBtn}
                                                        onPress={() =>
                                                            handleDownload(
                                                                inv.pdfUrl!
                                                            )
                                                        }
                                                    >
                                                        <Ionicons
                                                            name="download-outline"
                                                            size={18}
                                                            color={
                                                                colors.textPrimary
                                                            }
                                                        />
                                                        <Text
                                                            style={
                                                                styles.aktText
                                                            }
                                                        >
                                                            Herunterladen
                                                        </Text>
                                                    </Pressable>
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
    },
    largeTitle: { ...typography.largeTitle, marginBottom: spacing.lg },
    center: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingTop: spacing.xxl * 2,
    },
    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 21,
        color: colors.textSecondary,
        textAlign: "center",
        maxWidth: 280,
    },
    hinweis: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.card,
        borderCurve: "continuous",
        marginBottom: spacing.lg,
    },
    hinweisAmber: { backgroundColor: colors.statusAmberBg },
    hinweisRot: { backgroundColor: colors.statusRedBg },
    hinweisText: {
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
    list: { gap: spacing.md },
    card: {
        padding: spacing.lg,
        borderRadius: radius.card,
        borderCurve: "continuous",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    betrag: {
        fontFamily: fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    metaText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
    },
    notiz: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 19,
    },
    aktionen: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    aktBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.button,
        borderCurve: "continuous",
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
    },
    aktText: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
});
