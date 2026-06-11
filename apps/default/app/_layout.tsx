import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter";
import { colors } from "../lib/theme";
import { convexUrl } from "../lib/config";
import { usePushRegistration } from "../hooks/use-push-registration";
import { OfflineBanner } from "../components/OfflineBanner";
import { RootErrorBoundary } from "../components/RootErrorBoundary";
import { AttachmentViewerProvider } from "../components/AttachmentViewer";

const convex = new ConvexReactClient(convexUrl, {
    unsavedChangesWarning: false,
});

const secureStorage = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

const isNative = Platform.OS === "ios" || Platform.OS === "android";

// Registriert den Push-Token, sobald der User eingeloggt ist (innerhalb Provider).
function PushRegistrar() {
    usePushRegistration();
    return null;
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
    });

    if (!fontsLoaded) {
        return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    }

    return (
        <RootErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <ConvexAuthProvider
                        client={convex}
                        storage={isNative ? secureStorage : undefined}
                    >
                        <StatusBar style="dark" />
                        <PushRegistrar />
                        <AttachmentViewerProvider>
                            <Stack
                                screenOptions={{
                                    headerShown: false,
                                    contentStyle: { backgroundColor: colors.background },
                                }}
                            />
                        </AttachmentViewerProvider>
                        <OfflineBanner />
                    </ConvexAuthProvider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </RootErrorBoundary>
    );
}
