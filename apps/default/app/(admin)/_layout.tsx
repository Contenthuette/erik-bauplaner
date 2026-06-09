import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors, fonts } from "../../lib/theme";

function Splash() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.textPrimary} />
        </View>
    );
}

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
                <Tabs
                    screenOptions={{
                        headerShown: false,
                        tabBarActiveTintColor: colors.textPrimary,
                        tabBarInactiveTintColor: colors.textSecondary,
                        tabBarStyle: {
                            backgroundColor: colors.background,
                            borderTopColor: colors.border,
                        },
                        tabBarLabelStyle: {
                            fontFamily: fonts.medium,
                            fontSize: 11,
                        },
                    }}
                >
                    <Tabs.Screen
                        name="dashboard"
                        options={{
                            title: "Dashboard",
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="grid-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="projekte"
                        options={{
                            title: "Projekte",
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="hammer-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="nachrichten"
                        options={{
                            title: "Nachrichten",
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="chatbubbles-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Tabs.Screen
                        name="einstellungen"
                        options={{
                            title: "Einstellungen",
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="settings-outline" size={size} color={color} />
                            ),
                        }}
                    />
                </Tabs>
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
