import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Push-Handler: Banner auch im Vordergrund anzeigen.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Registriert den Expo-Push-Token des Geräts beim Backend, sobald der User
 * eingeloggt ist. Nur nativ (iOS/Android), nicht im Web.
 */
export function usePushRegistration() {
    const { isAuthenticated } = useConvexAuth();
    const recordPushToken = useMutation(api.users.recordPushToken);
    const registered = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || registered.current) return;
        if (Platform.OS === "web" || !Device.isDevice) return;

        let cancelled = false;
        const register = async () => {
            try {
                const { status: existing } =
                    await Notifications.getPermissionsAsync();
                let finalStatus = existing;
                if (existing !== "granted") {
                    const { status } =
                        await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== "granted") return;

                const projectId =
                    Constants.expoConfig?.extra?.eas?.projectId ??
                    Constants.easConfig?.projectId;
                const tokenData = await Notifications.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined
                );
                if (cancelled) return;
                await recordPushToken({ pushToken: tokenData.data });
                registered.current = true;
            } catch {
                // Push ist optional — Fehler still ignorieren.
            }
        };
        register();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, recordPushToken]);
}
