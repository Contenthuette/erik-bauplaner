import { Stack } from "expo-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../../lib/theme";
import { ConsentGate } from "../../components/ConsentGate";

function Splash() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.textPrimary} />
        </View>
    );
}

/**
 * Kunden-Bereich als Stack: Tab-Navigation in (tabs), Detail- und
 * Feed-Screens (Projekt, Benachrichtigungen, Einstellungen) darüber.
 */
export default function CustomerLayout() {
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
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: colors.background },
                        }}
                    >
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="projekt" />
                        <Stack.Screen name="chat" />
                        <Stack.Screen name="benachrichtigungen" />
                        <Stack.Screen
                            name="passwort-aendern"
                            options={{ presentation: "modal" }}
                        />
                        <Stack.Screen
                            name="benachrichtigungs-einstellungen"
                            options={{ presentation: "modal" }}
                        />
                        <Stack.Screen
                            name="profil-bearbeiten"
                            options={{ presentation: "modal" }}
                        />
                    </Stack>
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
