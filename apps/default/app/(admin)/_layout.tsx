import { Stack } from "expo-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../lib/theme";
import { ConsentGate } from "../../components/ConsentGate";
import { AboGate } from "../../components/AboGate";

function Splash() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.textPrimary} />
        </View>
    );
}

/**
 * Admin-Bereich als Stack: Die Tab-Navigation liegt in (tabs), Detail- und
 * Formular-Screens (Projekt, Kunde anlegen, Projekt anlegen) schieben sich
 * darüber.
 */
export default function AdminLayout() {
    return (
        <>
            <AuthLoading>
                <Splash />
            </AuthLoading>
            <Unauthenticated>
                <Redirect href="/(auth)/login" />
            </Unauthenticated>
            <Authenticated>
                <ConsentGate>
                    <AboGate>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: colors.background },
                        }}
                    >
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="projekt" />
                        <Stack.Screen name="chat" />
                        <Stack.Screen name="abo" />
                        <Stack.Screen name="firmenprofil" />
                        <Stack.Screen name="team" />
                        <Stack.Screen name="vorlagen" />
                        <Stack.Screen name="benachrichtigungs-einstellungen" />
                        <Stack.Screen
                            name="kunde-anlegen"
                            options={{ presentation: "modal" }}
                        />
                        <Stack.Screen
                            name="projekt-anlegen"
                            options={{ presentation: "modal" }}
                        />
                    </Stack>
                    </AboGate>
                </ConsentGate>
            </Authenticated>
        </>
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
