import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { colors, fonts, spacing } from "../lib/theme";

/**
 * Dezenter Hinweis, wenn keine Verbindung besteht. Zuletzt geladene Daten
 * bleiben sichtbar (Convex hält sie im Speicher); dieser Banner erklärt nur,
 * dass evtl. nicht alles aktuell ist.
 */
export function OfflineBanner() {
    const insets = useSafeAreaInsets();
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const verbunden =
                state.isConnected !== false &&
                state.isInternetReachable !== false;
            setOffline(!verbunden);
        });
        return () => unsubscribe();
    }, []);

    if (!offline) return null;

    return (
        <Animated.View
            entering={Platform.OS === "web" ? undefined : FadeInDown.duration(200)}
            exiting={Platform.OS === "web" ? undefined : FadeOutUp.duration(200)}
            style={[styles.wrap, { paddingTop: insets.top + 6 }]}
            pointerEvents="none"
        >
            <View style={styles.pill}>
                <Ionicons
                    name="cloud-offline-outline"
                    size={14}
                    color={colors.textOnDark}
                />
                <Text style={styles.text}>
                    Offline – zuletzt geladene Daten
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 1000,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.textPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: 999,
    },
    text: {
        fontFamily: fonts.medium,
        fontSize: 12,
        color: colors.textOnDark,
    },
});
