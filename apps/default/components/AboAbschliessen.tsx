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
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking2 from "expo-linking";
import { useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/Button";
import { Wordmark } from "./Wordmark";
import { colors, spacing, typography, fonts } from "../lib/theme";

function euro(cent: number): string {
    return (cent / 100)
        .toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PlanInfo {
    nettoCent: number;
    mwstProzent: number;
    bruttoCent: number;
    waehrung: string;
    trialTage: number;
}

/**
 * „Abo abschließen“-Screen. Wird gezeigt, wenn der Betrieb keinen Zugriff hat
 * (kein Abo, abgelaufen, gekündigt, nicht bezahlt). Startet Stripe Checkout.
 */
export function AboAbschliessen({
    plan,
    status,
    kannVerwalten,
}: {
    plan: PlanInfo;
    status?: string;
    kannVerwalten: boolean;
}) {
    const createCheckout = useAction(api.stripe.createCheckoutSession);
    const { signOut } = useAuthActions();
    const [loading, setLoading] = useState(false);

    const istGesperrt =
        status === "past_due" || status === "canceled";

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const returnUrl = Linking2.createURL("/");
            const { url } = await createCheckout({ returnUrl });
            if (Platform.OS === "web") {
                window.location.href = url;
            } else {
                await WebBrowser.openBrowserAsync(url);
            }
        } catch (e) {
            const msg =
                e instanceof Error ? e.message : "Bitte erneut versuchen.";
            Alert.alert("Fehler", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Wordmark size={36} />
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="card-outline"
                            size={28}
                            color={colors.textPrimary}
                        />
                    </View>
                    <Text style={styles.title}>
                        {istGesperrt ? "Abo erforderlich" : "7 Tage kostenlos testen"}
                    </Text>
                    <Text style={styles.subtitle}>
                        {istGesperrt
                            ? "Ihr Zugang ist derzeit gesperrt. Schließen Sie das Abo ab, um Polier weiter zu nutzen."
                            : "Voller Zugriff auf Polier. Jederzeit zum Monatsende kündbar."}
                    </Text>
                </View>

                {/* Preis-Karte */}
                <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Polier für Betriebe</Text>
                        <View style={styles.trialBadge}>
                            <Text style={styles.trialBadgeText}>
                                {plan.trialTage} Tage gratis
                            </Text>
                        </View>
                    </View>
                    <View style={styles.priceMain}>
                        <Text style={styles.priceBig}>
                            {euro(plan.nettoCent)} €
                        </Text>
                        <Text style={styles.priceUnit}>netto / Monat</Text>
                    </View>
                    <Text style={styles.priceSub}>
                        zzgl. {plan.mwstProzent}% MwSt. — brutto{" "}
                        {euro(plan.bruttoCent)} € / Monat
                    </Text>

                    <View style={styles.divider} />

                    <Feature text={`${plan.trialTage} Tage kostenlos testen`} />
                    <Feature text="Karte wird zu Beginn hinterlegt" />
                    <Feature text="Erste Abbuchung erst nach der Testphase" />
                    <Feature text="Monatlich kündbar" />
                </View>

                {kannVerwalten ? (
                    <View style={styles.actions}>
                        <Button
                            title={
                                istGesperrt
                                    ? "Abo abschließen"
                                    : "Kostenlos testen — Karte hinterlegen"
                            }
                            onPress={handleCheckout}
                            loading={loading}
                        />
                        <Text style={styles.fineprint}>
                            Sichere Zahlung über Stripe. Es werden keine
                            Kartendaten in der App gespeichert.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.actions}>
                        <View style={styles.hintBox}>
                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.hintText}>
                                Bitte wenden Sie sich an den Inhaber Ihres
                                Betriebs, um das Abo zu aktivieren.
                            </Text>
                        </View>
                    </View>
                )}

                <Text style={styles.logout} onPress={() => signOut()}>
                    Abmelden
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function Feature({ text }: { text: string }) {
    return (
        <View style={styles.featureRow}>
            <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.statusGreen}
            />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xl,
        justifyContent: "center",
    },
    header: { alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginTop: spacing.md,
    },
    title: { ...typography.title, textAlign: "center" },
    subtitle: {
        ...typography.subhead,
        textAlign: "center",
        lineHeight: 21,
        paddingHorizontal: spacing.md,
    },
    priceCard: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 18,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.xl,
        marginBottom: spacing.xl,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    priceLabel: { ...typography.headline },
    trialBadge: {
        backgroundColor: colors.statusGreenBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    trialBadgeText: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.statusGreen,
    },
    priceMain: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
    },
    priceBig: {
        fontFamily: fonts.bold,
        fontSize: 40,
        color: colors.textPrimary,
        letterSpacing: -1,
    },
    priceUnit: {
        ...typography.subhead,
        marginBottom: 8,
    },
    priceSub: {
        ...typography.footnote,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    featureText: { ...typography.callout },
    actions: { gap: spacing.md },
    fineprint: {
        ...typography.footnote,
        textAlign: "center",
        paddingHorizontal: spacing.md,
    },
    hintBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
    },
    hintText: { ...typography.callout, flex: 1, lineHeight: 21 },
    logout: {
        ...typography.subhead,
        textAlign: "center",
        marginTop: spacing.xxl,
        textDecorationLine: "underline",
    },
});
