import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ActivityIndicator,
    Platform,
    useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import {
    GestureDetector,
    Gesture,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { colors, spacing, fonts } from "../lib/theme";

export interface ViewerAttachment {
    url: string;
    istPdf: boolean;
    name?: string;
}

interface ViewerContextValue {
    openAttachment: (att: ViewerAttachment) => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

export function useAttachmentViewer(): ViewerContextValue {
    const ctx = useContext(ViewerContext);
    if (!ctx) {
        throw new Error(
            "useAttachmentViewer muss innerhalb von AttachmentViewerProvider verwendet werden."
        );
    }
    return ctx;
}

// -----------------------------------------------------------------------------
// Bild-Lightbox mit Pinch-Zoom & Swipe-to-Close
// -----------------------------------------------------------------------------

function ImageLightbox({
    uri,
    onClose,
}: {
    uri: string;
    onClose: () => void;
}) {
    const { width, height } = useWindowDimensions();
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const savedX = useSharedValue(0);
    const savedY = useSharedValue(0);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.max(1, savedScale.value * e.scale);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedX.value = 0;
                savedY.value = 0;
            }
        });

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            if (scale.value > 1) {
                translateX.value = savedX.value + e.translationX;
                translateY.value = savedY.value + e.translationY;
            } else {
                translateY.value = e.translationY;
            }
        })
        .onEnd((e) => {
            if (scale.value > 1) {
                savedX.value = translateX.value;
                savedY.value = translateY.value;
            } else if (Math.abs(e.translationY) > 120) {
                runOnJS(onClose)();
            } else {
                translateY.value = withTiming(0);
            }
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedX.value = 0;
                savedY.value = 0;
            } else {
                scale.value = withTiming(2);
                savedScale.value = 2;
            }
        });

    const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

    const animStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageWrap, animStyle]}>
                <Image
                    source={{ uri }}
                    style={{ width, height: height * 0.8 }}
                    contentFit="contain"
                    transition={150}
                />
            </Animated.View>
        </GestureDetector>
    );
}

// -----------------------------------------------------------------------------
// PDF / Datei-Viewer
// -----------------------------------------------------------------------------

function FileViewer({ att }: { att: ViewerAttachment }) {
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    const handleShare = useCallback(async () => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        try {
            const dateiname = att.name ?? "dokument.pdf";
            const ziel = FileSystem.cacheDirectory + dateiname;
            const { uri } = await FileSystem.downloadAsync(att.url, ziel);
            const verfuegbar = await Sharing.isAvailableAsync();
            if (verfuegbar) {
                await Sharing.shareAsync(uri);
            }
        } catch {
            // still bleiben — Nutzer bleibt im Viewer
        }
    }, [att]);

    // Auf Web rendert die WebView nicht zuverlässig PDFs — Google-Viewer-Fallback.
    const quelle =
        Platform.OS === "android"
            ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(att.url)}`
            : att.url;

    return (
        <View style={styles.fileContainer}>
            {!failed ? (
                <WebView
                    source={{ uri: quelle }}
                    style={styles.webview}
                    originWhitelist={["*"]}
                    onLoadEnd={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        setFailed(true);
                    }}
                />
            ) : (
                <View style={styles.fallback}>
                    <View style={styles.fileIcon}>
                        <Ionicons
                            name="document-text"
                            size={34}
                            color={colors.textPrimary}
                        />
                    </View>
                    <Text style={styles.fileName} numberOfLines={2}>
                        {att.name ?? "Dokument"}
                    </Text>
                    <Text style={styles.fileType}>PDF-Dokument</Text>
                    <Text style={styles.fileHint}>
                        Diese Datei kann nicht direkt angezeigt werden.
                    </Text>
                    <Pressable style={styles.shareBtn} onPress={handleShare}>
                        <Ionicons
                            name="share-outline"
                            size={18}
                            color={colors.textOnDark}
                        />
                        <Text style={styles.shareText}>Teilen / Speichern</Text>
                    </Pressable>
                </View>
            )}
            {loading && !failed ? (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={colors.textPrimary} />
                </View>
            ) : null}
        </View>
    );
}

// -----------------------------------------------------------------------------
// Provider mit Modal
// -----------------------------------------------------------------------------

export function AttachmentViewerProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [att, setAtt] = useState<ViewerAttachment | null>(null);

    const openAttachment = useCallback((next: ViewerAttachment) => {
        setAtt(next);
    }, []);

    const close = useCallback(() => setAtt(null), []);

    const value = useMemo(() => ({ openAttachment }), [openAttachment]);

    const istPdf = att?.istPdf ?? false;

    const handleShareTop = useCallback(async () => {
        if (!att) return;
        if (Platform.OS !== "web") Haptics.selectionAsync();
        try {
            const dateiname = att.name ?? (istPdf ? "dokument.pdf" : "foto.jpg");
            const ziel = FileSystem.cacheDirectory + dateiname;
            const { uri } = await FileSystem.downloadAsync(att.url, ziel);
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
        } catch {
            // ignorieren
        }
    }, [att, istPdf]);

    return (
        <ViewerContext.Provider value={value}>
            {children}
            <Modal
                visible={att !== null}
                transparent
                animationType="fade"
                onRequestClose={close}
                statusBarTranslucent
            >
                <GestureHandlerRootView style={styles.flex}>
                    <View style={styles.backdrop}>
                        {/* Bild: Tippen auf Hintergrund schließt */}
                        {att && !istPdf ? (
                            <Pressable
                                style={styles.backdropPress}
                                onPress={close}
                            />
                        ) : null}

                        <View style={styles.topBar}>
                            {istPdf ? (
                                <Pressable
                                    style={styles.topBtn}
                                    onPress={handleShareTop}
                                    hitSlop={10}
                                >
                                    <Ionicons
                                        name="share-outline"
                                        size={22}
                                        color={colors.textOnDark}
                                    />
                                </Pressable>
                            ) : (
                                <View style={styles.topBtn} />
                            )}
                            <Pressable
                                style={styles.topBtn}
                                onPress={close}
                                hitSlop={10}
                            >
                                <Ionicons
                                    name="close"
                                    size={26}
                                    color={colors.textOnDark}
                                />
                            </Pressable>
                        </View>

                        {att && istPdf ? (
                            <FileViewer att={att} />
                        ) : att ? (
                            <ImageLightbox uri={att.url} onClose={close} />
                        ) : null}
                    </View>
                </GestureHandlerRootView>
            </Modal>
        </ViewerContext.Provider>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.94)",
        justifyContent: "center",
    },
    backdropPress: { ...StyleSheet.absoluteFillObject },
    topBar: {
        position: "absolute",
        top: Platform.OS === "ios" ? 56 : 24,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
    },
    topBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.16)",
        alignItems: "center",
        justifyContent: "center",
    },
    imageWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    fileContainer: {
        flex: 1,
        marginTop: Platform.OS === "ios" ? 110 : 80,
        marginBottom: 0,
        backgroundColor: colors.background,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        overflow: "hidden",
    },
    webview: { flex: 1, backgroundColor: colors.background },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
    },
    fallback: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
        gap: spacing.sm,
    },
    fileIcon: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    fileName: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.textPrimary,
        textAlign: "center",
    },
    fileType: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
    },
    fileHint: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: spacing.xs,
        maxWidth: 260,
    },
    shareBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.textPrimary,
        borderRadius: 12,
        borderCurve: "continuous",
    },
    shareText: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.textOnDark,
    },
});
