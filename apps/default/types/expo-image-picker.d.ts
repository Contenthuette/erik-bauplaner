// Ambient-Fallback für expo-image-picker.
// Das Paket ist installiert und wird zur Laufzeit von Metro aufgelöst; der
// TypeScript-Watcher im Dev-Tree hält gelegentlich einen veralteten
// Negativ-Cache für dieses Paket. Diese Deklaration sichert die von uns
// genutzte API typsicher ab, ohne die Laufzeit zu verändern.
declare module "expo-image-picker" {
    export interface ImagePickerAsset {
        uri: string;
        width: number;
        height: number;
        type?: "image" | "video" | "livePhoto" | "pairedVideo";
        fileName?: string | null;
        fileSize?: number;
        mimeType?: string;
    }

    export interface ImagePickerResult {
        canceled: boolean;
        assets: ImagePickerAsset[] | null;
    }

    export interface ImagePickerOptions {
        mediaTypes?: Array<"images" | "videos" | "livePhotos"> | string;
        quality?: number;
        allowsMultipleSelection?: boolean;
        selectionLimit?: number;
        allowsEditing?: boolean;
        aspect?: [number, number];
        base64?: boolean;
        exif?: boolean;
    }

    export function launchImageLibraryAsync(
        options?: ImagePickerOptions
    ): Promise<ImagePickerResult>;

    export function launchCameraAsync(
        options?: ImagePickerOptions
    ): Promise<ImagePickerResult>;

    export function requestMediaLibraryPermissionsAsync(): Promise<{
        granted: boolean;
        status: string;
        canAskAgain: boolean;
    }>;

    export function requestCameraPermissionsAsync(): Promise<{
        granted: boolean;
        status: string;
        canAskAgain: boolean;
    }>;
}
