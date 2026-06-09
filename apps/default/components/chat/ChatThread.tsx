import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Linking,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { colors, spacing, fonts } from "../../lib/theme";

interface ChatThreadProps {
    projectId: Id<"projects">;
}

interface PendingAnhang {
    uri: string;
    name: string;
    mime: string;
    istPdf: boolean;
}

function formatZeit(ms: number): string {
    return new Date(ms).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTag(ms: number): string {
    const d = new Date(ms);
    const heute = new Date();
    const gestern = new Date();
    gestern.setDate(heute.getDate() - 1);
    if (d.toDateString() === heute.toDateString()) return "Heute";
    if (d.toDateString() === gestern.toDateString()) return "Gestern";
    return d.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
    });
}

export function ChatThread({ projectId }: ChatThreadProps) {
    const messages = useQuery(api.messages.listMessages, { projectId });
    const sendMessage = useMutation(api.messages.sendMessage);
    const markRead = useMutation(api.messages.markThreadRead);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

    const [text, setText] = useState("");
    const [anhaenge, setAnhaenge] = useState<PendingAnhang[]>([]);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    // Eingehende Nachrichten beim Öffnen als gelesen markieren.
    useEffect(() => {
        if (messages && messages.length > 0) {
            markRead({ projectId }).catch(() => {});
        }
    }, [messages, projectId, markRead]);

    const scrollToEnd = useCallback(() => {
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, []);

    useEffect(() => {
        if (messages) scrollToEnd();
    }, [messages, scrollToEnd]);

    const pickFoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const a = result.assets[0];
        setAnhaenge((prev) => [
            ...prev,
            {
                uri: a.uri,
                name: a.fileName ?? "foto.jpg",
                mime: a.mimeType ?? "image/jpeg",
                istPdf: false,
            },
        ]);
    };

    const pickPdf = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: "application/pdf",
            copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const a = result.assets[0];
        setAnhaenge((prev) => [
            ...prev,
            {
                uri: a.uri,
                name: a.name,
                mime: "application/pdf",
                istPdf: true,
            },
        ]);
    };

    const chooseAnhang = () => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        if (Platform.OS === "web") {
            pickFoto();
            return;
        }
        Alert.alert("Anhang hinzufügen", undefined, [
            { text: "Foto", onPress: pickFoto },
            { text: "PDF-Dokument", onPress: pickPdf },
            { text: "Abbrechen", style: "cancel" },
        ]);
    };

    const removeAnhang = (uri: string) => {
        setAnhaenge((prev) => prev.filter((p) => p.uri !== uri));
    };

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed && anhaenge.length === 0) return;
        setSending(true);
        try {
            const ids: Id<"_storage">[] = [];
            for (const a of anhaenge) {
                const uploadUrl = await generateUploadUrl({});
                const resp = await fetch(a.uri);
                const blob = await resp.blob();
                const res = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": a.mime },
                    body: blob,
                });
                const json = await res.json();
                ids.push(json.storageId as Id<"_storage">);
            }
            await sendMessage({
                projectId,
                text: trimmed,
                anhaenge: ids.length > 0 ? ids : undefined,
            });
            setText("");
            setAnhaenge([]);
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scrollToEnd();
        } catch {
            Alert.alert("Fehler", "Nachricht konnte nicht gesendet werden.");
        } finally {
            setSending(false);
        }
    };

    const renderBubbles = () => {
        if (!messages) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.textPrimary} />
                </View>
            );
        }
        if (messages.length === 0) {
            return (
                <View style={styles.center}>
                    <View style={styles.emptyIcon}>
                        <Ionicons
                            name="chatbubbles-outline"
                            size={26}
                            color={colors.textSecondary}
                        />
                    </View>
                    <Text style={styles.emptyText}>
                        Noch keine Nachrichten. Schreib die erste Nachricht.
                    </Text>
                </View>
            );
        }
        let letzterTag = "";
        return messages.map((m) => {
            const tag = formatTag(m.erstelltAm);
            const zeigeTag = tag !== letzterTag;
            letzterTag = tag;
            const istLetzte = messages[messages.length - 1]._id === m._id;
            return (
                <View key={m._id}>
                    {zeigeTag ? (
                        <View style={styles.tagRow}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ) : null}
                    <View
                        style={[
                            styles.bubbleRow,
                            m.vonMir ? styles.rowRight : styles.rowLeft,
                        ]}
                    >
                        <View
                            style={[
                                styles.bubble,
                                m.vonMir ? styles.bubbleMir : styles.bubbleAndere,
                            ]}
                        >
                            {m.anhaenge.map((an, idx) =>
                                an.istPdf ? (
                                    <Pressable
                                        key={idx}
                                        style={styles.pdfChip}
                                        onPress={() => Linking.openURL(an.url)}
                                    >
                                        <Ionicons
                                            name="document-text"
                                            size={20}
                                            color={
                                                m.vonMir
                                                    ? colors.textOnDark
                                                    : colors.textPrimary
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.pdfText,
                                                m.vonMir && {
                                                    color: colors.textOnDark,
                                                },
                                            ]}
                                        >
                                            PDF öffnen
                                        </Text>
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        key={idx}
                                        onPress={() => Linking.openURL(an.url)}
                                    >
                                        <Image
                                            source={{ uri: an.url }}
                                            style={styles.bubbleImage}
                                            contentFit="cover"
                                        />
                                    </Pressable>
                                )
                            )}
                            {m.text ? (
                                <Text
                                    style={[
                                        styles.bubbleText,
                                        m.vonMir && { color: colors.textOnDark },
                                    ]}
                                >
                                    {m.text}
                                </Text>
                            ) : null}
                        </View>
                        <View
                            style={[
                                styles.metaRow,
                                m.vonMir ? styles.metaRight : styles.metaLeft,
                            ]}
                        >
                            <Text style={styles.metaText}>
                                {formatZeit(m.erstelltAm)}
                            </Text>
                            {m.vonMir && istLetzte && m.gelesenAm ? (
                                <Text style={styles.metaText}> · Gelesen</Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            );
        });
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <View style={styles.hinweis}>
                <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.textSecondary}
                />
                <Text style={styles.hinweisText}>
                    Antwort meist innerhalb von 24 Stunden
                </Text>
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="interactive"
            >
                {renderBubbles()}
            </ScrollView>

            {anhaenge.length > 0 ? (
                <ScrollView
                    horizontal
                    style={styles.anhangBar}
                    contentContainerStyle={styles.anhangBarContent}
                    showsHorizontalScrollIndicator={false}
                >
                    {anhaenge.map((a) => (
                        <View key={a.uri} style={styles.anhangPreview}>
                            {a.istPdf ? (
                                <View style={styles.anhangPdf}>
                                    <Ionicons
                                        name="document-text"
                                        size={22}
                                        color={colors.textPrimary}
                                    />
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: a.uri }}
                                    style={styles.anhangImage}
                                    contentFit="cover"
                                />
                            )}
                            <Pressable
                                style={styles.anhangRemove}
                                onPress={() => removeAnhang(a.uri)}
                                hitSlop={8}
                            >
                                <Ionicons
                                    name="close"
                                    size={14}
                                    color={colors.textOnDark}
                                />
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
            ) : null}

            <View style={styles.inputBar}>
                <Pressable
                    style={styles.attachBtn}
                    onPress={chooseAnhang}
                    hitSlop={8}
                >
                    <Ionicons name="add" size={26} color={colors.textPrimary} />
                </Pressable>
                <TextInput
                    style={styles.input}
                    placeholder="Nachricht schreiben …"
                    placeholderTextColor={colors.textSecondary}
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <Pressable
                    style={[
                        styles.sendBtn,
                        text.trim().length === 0 &&
                            anhaenge.length === 0 &&
                            styles.sendBtnDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={
                        sending ||
                        (text.trim().length === 0 && anhaenge.length === 0)
                    }
                >
                    {sending ? (
                        <ActivityIndicator size="small" color={colors.textOnDark} />
                    ) : (
                        <Ionicons
                            name="arrow-up"
                            size={22}
                            color={colors.textOnDark}
                        />
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    hinweis: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    hinweisText: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },
    scroll: { flex: 1 },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.xs,
        flexGrow: 1,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
        paddingTop: spacing.xxl * 2,
    },
    emptyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        maxWidth: 240,
    },
    tagRow: { alignItems: "center", marginVertical: spacing.md },
    tagText: {
        fontFamily: fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
    },
    bubbleRow: { marginBottom: spacing.sm, maxWidth: "82%" },
    rowRight: { alignSelf: "flex-end", alignItems: "flex-end" },
    rowLeft: { alignSelf: "flex-start", alignItems: "flex-start" },
    bubble: {
        borderRadius: 20,
        borderCurve: "continuous",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.xs,
    },
    bubbleMir: {
        backgroundColor: colors.textPrimary,
        borderBottomRightRadius: 6,
    },
    bubbleAndere: {
        backgroundColor: colors.surfaceMuted,
        borderBottomLeftRadius: 6,
    },
    bubbleText: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 21,
        color: colors.textPrimary,
    },
    bubbleImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        borderCurve: "continuous",
    },
    pdfChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 4,
    },
    pdfText: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    metaRow: { flexDirection: "row", marginTop: 3, paddingHorizontal: 4 },
    metaRight: { justifyContent: "flex-end" },
    metaLeft: { justifyContent: "flex-start" },
    metaText: {
        fontFamily: fonts.regular,
        fontSize: 11,
        color: colors.textSecondary,
    },
    anhangBar: {
        maxHeight: 84,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    anhangBarContent: {
        padding: spacing.sm,
        gap: spacing.sm,
    },
    anhangPreview: { width: 64, height: 64 },
    anhangImage: {
        width: 64,
        height: 64,
        borderRadius: 10,
        borderCurve: "continuous",
    },
    anhangPdf: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    anhangRemove: {
        position: "absolute",
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.textPrimary,
        alignItems: "center",
        justifyContent: "center",
    },
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    attachBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    input: {
        flex: 1,
        maxHeight: 120,
        minHeight: 38,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 19,
        borderCurve: "continuous",
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === "ios" ? 9 : 6,
        paddingBottom: Platform.OS === "ios" ? 9 : 6,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textPrimary,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.textPrimary,
        alignItems: "center",
        justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.35 },
});
