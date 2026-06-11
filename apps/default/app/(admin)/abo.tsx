import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking2 from "expo-linking";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { colors, spacing, typography, fonts } from "../../lib/theme";

const KUENDIGUNG_EMAIL = "info@contenthuette.de";

function euro(cent: number): string {
    return (cent / 100).toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDatum(ms?: number): string {
    if (!ms) return "—";
    return new Date(ms).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

const STATUS_LABEL: Record<string, { text: string; bg: string; fg: string }> = {
    trialing: { text: "Testphase", bg: colors.statusGreenBg, fg: colors.statusGreen },
    active: { text: "Aktiv", bg: colors.statusGreenBg, fg: colors.statusGreen },
    past_due: { text: "Zahlung offen", bg: colors.statusRedBg, fg: colors.statusRed },
    canceled: { text: "Gekündigt", bg: colors.statusRedBg, fg: colors.statusRed },
    incomplete: { text: "Unvollständig", bg: colors.statusAmberBg, fg: colors.statusAmber },
    none: { text: "Kein Abo", bg: colors.statusAmberBg, fg: colors.statusAmber },
};

export default function AboVerwaltung() {
    const sub = useQuery(api.subscriptions.getMySubscription);
    const createCheckout = useAction(api.stripe.createCheckoutSession);
    const cancel = useAction(api.stripe.cancelSubscription);
    const resume = useAction(api.stripe.resumeSubscription);
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const handleCheckout = async () => {
        setBusy(true);
        try {
            const returnUrl = Linking2.createURL("/");
            const { url } = await createCheckout({ returnUrl });
            if (Platform.OS === "web") {
                window.location.href = url;
            } else {
                await WebBrowser.openBrowserAsync(url);
            }
        } catch (e) {
            Alert.alert(
                "Fehler",
                e instanceof Error ? e.message : "Bitte erneut versuchen."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            "Abo kündigen",
            "Das Abo läuft bis zum Ende der aktuellen Abrechnungsperiode weiter und wird danach nicht erneuert. Fortfahren?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Kündigen",
                    style: "destructive",
                    onPress: async () => {
                        setBusy(true);
                        try {
                            await cancel({});
                        } catch (e) {
                            Alert.alert(
                                "Fehler",
                                e instanceof Error ? e.message : "Bitte erneut versuchen."
                            );
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    const handleResume = async () => {
        setBusy(true);
        try {
            await resume({});
        } catch (e) {
            Alert.alert(
                "Fehler",
                e instanceof Error ? e.message : "Bitte erneut versuchen."
            );
        } finally {
            setBusy(false);
        }
    };

    const status = sub?.status ?? "none";
    const label = STATUS_LABEL[status] ?? STATUS_LABEL.none;
    const hatAbo = status === "trialing" || status === "active";
    const periodLabel = status === "trialing" ? "Testphase endet am" : "Nächste Abbuchung am";

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Abo",
                    headerBackTitle: "Zurück",
                }}
            />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {sub === undefined ? null : !sub.kannVerwalten ? (
                    <Card>
                        <Text style={styles.bodyText}>
                            Das Abo wird vom Inhaber des Betriebs verwaltet.
                        </Text>
                    </Card>
                ) : (
                    <>
                        {/* Status-Karte */}
                        <Card style={styles.statusCard}>
                            <View style={styles.statusRow}>
                                <Text style={styles.planName}>
                                    Polier für Betriebe
                                </Text>
                                <View
                                    style={[
                                        styles.badge,
                                        { backgroundColor: label.bg },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.badgeText,
                                            { color: label.fg },
                                        ]}
                                    >
                                        {label.text}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.price}>
                                {euro(sub.plan.nettoCent)} €
                                <Text style={styles.priceUnit}>
                                    {" "}netto / Monat
                                </Text>
                            </Text>
                            <Text style={styles.priceSub}>
                                zzgl. {sub.plan.mwstProzent}% MwSt. — brutto{" "}
                                {euro(sub.plan.bruttoCent)} €
                            </Text>

                            {hatAbo ? (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>
                                            {periodLabel}
                                        </Text>
                                        <Text style={styles.infoValue}>
                                            {formatDatum(sub.currentPeriodEnd)}
                                        </Text>
                                    </View>
                                    {sub.cancelAtPeriodEnd ? (
                                        <View style={styles.cancelNote}>
                                            <Ionicons
                                                name="information-circle"
                                                size={16}
                                                color={colors.statusAmber}
                                            />
                                            <Text style={styles.cancelNoteText}>
                                                Zur Kündigung vorgemerkt — endet am{" "}
                                                {formatDatum(sub.currentPeriodEnd)}.
                                            </Text>
                                        </View>
                                    ) : null}
                                </>
                            ) : null}
                        </Card>

                        {/* Aktionen */}
                        {!hatAbo ? (
                            <Button
                                title="Abo abschließen"
                                onPress={handleCheckout}
                                loading={busy}
                            />
                        ) : sub.cancelAtPeriodEnd ? (
                            <Button
                                title="Kündigung zurücknehmen"
                                onPress={handleResume}
                                loading={busy}
                            />
                        ) : (
                            <Button
                                title="Abo kündigen"
                                variant="secondary"
                                onPress={handleCancel}
                                loading={busy}
                            />
                        )}

                        {/* Kündigungshinweis */}
                        <Card style={styles.hintCard}>
                            <Text style={styles.hintTitle}>Kündigung</Text>
                            <Text style={styles.bodyText}>
                                Das Abo ist monatlich kündbar. Kündigung jederzeit
                                zum Monatsende per E-Mail an{" "}
                                <Text
                                    style={styles.link}
                                    onPress={() =>
                                        Linking2.openURL(
                                            `mailto:${KUENDIGUNG_EMAIL}`
                                        )
                                    }
                                >
                                    {KUENDIGUNG_EMAIL}
                                </Text>
                                .
                            </Text>
                            <Text style={styles.bodySmall}>
                                Bei nicht fristgerechter Kündigung läuft der Einzug
                                normal weiter.
                            </Text>
                        </Card>
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
        paddingTop: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.lg,
    },
    statusCard: { gap: 4 },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.sm,
    },
    planName: { ...typography.headline },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
    price: {
        fontFamily: fonts.bold,
        fontSize: 28,
        color: colors.textPrimary,
        letterSpacing: -0.5,
        marginTop: spacing.sm,
    },
    priceUnit: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
    priceSub: { ...typography.footnote, marginTop: 2 },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    infoLabel: { ...typography.subhead },
    infoValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.textPrimary },
    cancelNote: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginTop: spacing.md,
        backgroundColor: colors.statusAmberBg,
        borderRadius: 10,
        padding: spacing.md,
    },
    cancelNoteText: { ...typography.footnote, color: colors.textPrimary, flex: 1 },
    hintCard: { gap: spacing.sm },
    hintTitle: { ...typography.headline, fontSize: 16 },
    bodyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 22,
        color: colors.textPrimary,
    },
    link: {
        fontFamily: fonts.semibold,
        color: colors.textPrimary,
        textDecorationLine: "underline",
    },
    bodySmall: { ...typography.footnote, marginTop: spacing.sm },
});
