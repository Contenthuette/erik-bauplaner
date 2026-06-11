import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors, typography, spacing, radius, fonts } from "../lib/theme";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    message: string | null;
}

// Oberste Fehlergrenze: fängt JS-Fehler beim Start/Rendern ab und zeigt eine
// verständliche Meldung statt eines harten Absturzes.
export class RootErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, message: null };
    }

    static getDerivedStateFromError(error: unknown): State {
        const message =
            error instanceof Error ? error.message : "Unbekannter Fehler";
        return { hasError: true, message };
    }

    componentDidCatch(error: unknown) {
        // Sichtbar in den Logs für die Diagnose.
        console.error("RootErrorBoundary hat einen Fehler abgefangen:", error);
    }

    handleRetry = () => {
        this.setState({ hasError: false, message: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.title}>
                            Etwas ist schiefgelaufen.
                        </Text>
                        <Text style={styles.body}>
                            Die App konnte nicht vollständig geladen werden.
                            Bitte schließe die App und öffne sie erneut. Falls
                            das Problem bestehen bleibt, prüfe deine
                            Internetverbindung.
                        </Text>
                        {this.state.message ? (
                            <Text style={styles.detail}>
                                {this.state.message}
                            </Text>
                        ) : null}
                        <Pressable
                            style={styles.button}
                            onPress={this.handleRetry}
                        >
                            <Text style={styles.buttonText}>
                                Erneut versuchen
                            </Text>
                        </Pressable>
                    </View>
                </View>
            );
        }
        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        gap: spacing.md,
    },
    title: {
        ...typography.title,
    },
    body: {
        ...typography.body,
        color: colors.textSecondary,
    },
    detail: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textTertiary,
    },
    button: {
        marginTop: spacing.md,
        height: 52,
        borderRadius: radius.button,
        borderCurve: "continuous",
        backgroundColor: colors.buttonPrimaryBg,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.buttonPrimaryText,
    },
});
