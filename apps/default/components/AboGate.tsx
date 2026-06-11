import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors } from "../lib/theme";
import { AboAbschliessen } from "./AboAbschliessen";

/**
 * Abo-Gate. Prüft den Stripe-Abo-Status des Betriebs:
 * - Kunden: immer freigeschaltet (kein Abo nötig).
 * - Betrieb mit Trial/aktiv: voller Zugriff.
 * - Betrieb ohne gültiges Abo: „Abo abschließen“-Screen.
 *
 * Die Query ist reaktiv: Sobald der Stripe-Webhook den Status auf "trialing"
 * setzt, schaltet das Gate automatisch frei.
 */
export function AboGate({ children }: { children: React.ReactNode }) {
    const sub = useQuery(api.subscriptions.getMySubscription);

    // Ladezustand: kurz nichts blockieren.
    if (sub === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.textPrimary} />
            </View>
        );
    }

    if (sub.freigeschaltet) {
        return <>{children}</>;
    }

    return (
        <AboAbschliessen
            plan={sub.plan}
            status={sub.status}
            kannVerwalten={sub.kannVerwalten}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
});
