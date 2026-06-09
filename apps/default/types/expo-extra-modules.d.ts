// Ambient-Fallback für neu installierte Expo-Module.
// Die Pakete sind installiert und werden zur Laufzeit von Metro aufgelöst;
// der TypeScript-Watcher hält gelegentlich einen veralteten Negativ-Cache.
// Diese Deklarationen sichern die von uns genutzte API typsicher ab, ohne die
// Laufzeit zu verändern.

declare module "expo-document-picker" {
    export interface DocumentPickerAsset {
        uri: string;
        name: string;
        size?: number;
        mimeType?: string;
    }
    export interface DocumentPickerResult {
        canceled: boolean;
        assets: DocumentPickerAsset[] | null;
    }
    export interface DocumentPickerOptions {
        type?: string | string[];
        copyToCacheDirectory?: boolean;
        multiple?: boolean;
    }
    export function getDocumentAsync(
        options?: DocumentPickerOptions
    ): Promise<DocumentPickerResult>;
}

declare module "expo-device" {
    export const isDevice: boolean;
    export const deviceName: string | null;
    export const modelName: string | null;
}

declare module "expo-notifications" {
    export type PermissionStatus = "granted" | "denied" | "undetermined";
    export interface PermissionResponse {
        status: PermissionStatus;
        granted: boolean;
        canAskAgain: boolean;
    }
    export interface ExpoPushToken {
        type: string;
        data: string;
    }
    export interface NotificationBehavior {
        shouldShowBanner?: boolean;
        shouldShowList?: boolean;
        shouldPlaySound?: boolean;
        shouldSetBadge?: boolean;
        shouldShowAlert?: boolean;
    }
    export function setNotificationHandler(handler: {
        handleNotification: () => Promise<NotificationBehavior>;
    }): void;
    export function getPermissionsAsync(): Promise<PermissionResponse>;
    export function requestPermissionsAsync(): Promise<PermissionResponse>;
    export function getExpoPushTokenAsync(options?: {
        projectId?: string;
    }): Promise<ExpoPushToken>;
}
