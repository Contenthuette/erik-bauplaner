import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { colors, fonts } from "../../../lib/theme";
import { TabBarBackground } from "../../../components/ui/TabBarBackground";

export default function AdminTabsLayout() {
    const unread = useQuery(api.messages.inboxUnreadCount);
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.textPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarBackground: () => <TabBarBackground />,
                tabBarStyle: {
                    backgroundColor:
                        Platform.OS === "ios" ? "transparent" : colors.background,
                    borderTopColor: colors.border,
                    borderTopWidth: 0,
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
                    tabBarBadge:
                        unread && unread > 0
                            ? unread > 9
                                ? "9+"
                                : unread
                            : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: colors.statusRed,
                        color: colors.textOnDark,
                        fontFamily: fonts.bold,
                        fontSize: 10,
                    },
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
    );
}
