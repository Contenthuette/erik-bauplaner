import { components } from "./_generated/api";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { Id } from "./_generated/dataModel";

// Instanz der Expo-Push-Komponente, getypt auf unsere users-Tabelle.
export const pushNotifications = new PushNotifications<Id<"users">>(
    components.pushNotifications
);
