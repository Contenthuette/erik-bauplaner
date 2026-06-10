import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/Button";
import { Wordmark } from "./Wordmark";
import { DATENSCHUTZ_TEXT } from "../lib/legal";
import { colors, spacing, typography, fonts } from "../lib/theme";

/**
 * DSGVO-Einwilligungs-Gate. Bevor ein eingeloggter User die App nutzt, muss er
 * der Datenschutzerklärung zustimmen. Solange das nicht geschehen ist, wird
 * dieser Schirm angezeigt; danach werden die Kinder gerendert.
 */
export function ConsentGate({ children }: { children: React.ReactNode }) {
    const status = useQuery(api.privacy.getConsentStatus);
    const accept = useMutation(api.privacy.acceptDatenschutz);
    const [checked, setChecked] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showText, setShowText] = useState(false);

    // Lade-/Unbekannt-Zustand: nichts blockieren (kurzer Moment).
    if (status === undefined) {
        return <>{children}</>;
    }
    if (status.akzeptiert) {
        return <>{children}</>;
    }

    const handleAccept = async () => {
        if (!checked) {
            Alert.alert(
                "Zustimmung erforderlich",
                "Bitte bestätigen Sie die Datenschutzerklärung, um fortzufahren."
            );
            return;
        }
        setSaving(true);
        try {
            await accept({});
        } catch {
            setSaving(false);
            Alert.alert("Fehler", "Bitte erneut versuchen.");
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
                            name="shield-checkmark-outline"
                            size={28}
                            color={colors.textPrimary}
                        />
                    </View>
                    <Text style={styles.title}>Datenschutz</Text>
                    <Text style={styles.subtitle}>
                        Ihre Daten werden ausschließlich zur Abwicklung Ihres
                        Bauvorhabens verwendet und auf Servern innerhalb der EU
                        verarbeitet. Es findet kein Tracking durch Dritte statt.
                    </Text>
                </View>

                <View style={styles.bullets}>
                    <Bullet text="Nur notwendige Daten werden erhoben (Datensparsamkeit)." />
                    <Bullet text="Keine Weitergabe an Dritte außerhalb notwendiger Dienstleister." />
                    <Bullet text="Jederzeitiges Recht auf Auskunft und Löschung." />
                </View>

                <Pressable
                    style={styles.checkRow}
                    onPress={() => setChecked((v) => !v)}
                >
                    <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                        {checked ? (
                            <Ionicons
                                name="checkmark"
                                size={16}
                                color={colors.textOnDark}
                            />
                        ) : null}
                    </View>
                    <Text style={styles.checkLabel}>
                        Ich habe die{" "}
                        <Text
                            style={styles.link}
                            onPress={() => setShowText((v) => !v)}
                        >
                            Datenschutzerklärung
                        </Text>{" "}
                        gelesen und stimme ihr zu.
                    </Text>
                </Pressable>

                {showText ? (
                    <View style={styles.textBox}>
                        <Text style={styles.legalText}>{DATENSCHUTZ_TEXT}</Text>
                    </View>
                ) : null}

                <View style={styles.actions}>
                    <Button
                        title="Zustimmen & fortfahren"
                        onPress={handleAccept}
                        loading={saving}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Bullet({ text }: { text: string }) {
    return (
        <View style={styles.bulletRow}>
            <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.statusGreen}
            />
            <Text style={styles.bulletText}>{text}</Text>
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
    title: { ...typography.title },
    subtitle: { ...typography.subhead, textAlign: "center", lineHeight: 21 },
    bullets: { gap: spacing.md, marginBottom: spacing.xl },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
    bulletText: { ...typography.callout, flex: 1, lineHeight: 21 },
    checkRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
    },
    checkboxOn: {
        backgroundColor: colors.buttonPrimaryBg,
        borderColor: colors.buttonPrimaryBg,
    },
    checkLabel: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 21,
        color: colors.textPrimary,
    },
    link: { fontFamily: fonts.semibold, color: colors.textPrimary, textDecorationLine: "underline" },
    textBox: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        maxHeight: 280,
    },
    legalText: {
        fontFamily: fonts.regular,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    actions: { marginTop: spacing.sm },
});
