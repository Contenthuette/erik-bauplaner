// Status-Update-Composer: Typ-Auswahl, Text, optionale Fotos (Mehrfach).
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    Platform,
    Alert,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
// Bildauswahl für Foto-Uploads am Update (Mehrfachauswahl, komprimiert).
import * as Haptics from "expo-haptics";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "../ui/Button";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";
import { UpdateTyp, updateTypMeta } from "../../lib/format";

const TYPEN: UpdateTyp[] = ["fortschritt", "verzoegerung", "wetter", "info"];

interface UpdateComposerProps {
    visible: boolean;
    projectId: Id<"projects">;
    initialTyp?: UpdateTyp;
    initialText?: string;
    onClose: () => void;
}

function toneColor(tone: string): string {
    if (tone === "green") return colors.statusGreen;
    if (tone === "amber") return colors.statusAmber;
    if (tone === "red") return colors.statusRed;
    return colors.textPrimary;
}

export function UpdateComposer({
    visible,
    projectId,
    initialTyp = "fortschritt",
    initialText = "",
    onClose,
}: UpdateComposerProps) {
    const generateUploadUrl = useMutation(api.updates.generateUploadUrl);
    const postUpdate = useMutation(api.updates.postUpdate);

    const [typ, setTyp] = useState<UpdateTyp>(initialTyp);
    const [text, setText] = useState(initialText);
    const [fotos, setFotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [posting, setPosting] = useState(false);

    // Bei jedem Öffnen Anfangswerte setzen.
    React.useEffect(() => {
        if (visible) {
            setTyp(initialTyp);
            setText(initialText);
            setFotos([]);
        }
    }, [visible, initialTyp, initialText]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            allowsMultipleSelection: true,
            selectionLimit: 5,
        });
        if (result.canceled || !result.assets) return;
        const uris = result.assets.map((a) => a.uri);
        setFotos((prev) => [...prev, ...uris].slice(0, 5));
    };

    const removeFoto = (uri: string) => {
        setFotos((prev) => prev.filter((u) => u !== uri));
    };

    const uploadFotos = async (): Promise<Id<"_storage">[]> => {
        const ids: Id<"_storage">[] = [];
        for (const uri of fotos) {
            const uploadUrl = await generateUploadUrl({});
            const resp = await fetch(uri);
            const blob = await resp.blob();
            const res = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type || "image/jpeg" },
                body: blob,
            });
            const json = (await res.json()) as { storageId: Id<"_storage"> };
            ids.push(json.storageId);
        }
        return ids;
    };

    const submit = async () => {
        if (!text.trim()) {
            Alert.alert("Fehlt", "Bitte einen Text eingeben.");
            return;
        }
        setPosting(true);
        try {
            let fotoIds: Id<"_storage">[] = [];
            if (fotos.length > 0) {
                setUploading(true);
                fotoIds = await uploadFotos();
                setUploading(false);
            }
            await postUpdate({
                projectId,
                typ,
                text: text.trim(),
                fotoIds: fotoIds.length > 0 ? fotoIds : undefined,
            });
            if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                );
            }
            onClose();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Fehler";
            Alert.alert("Konnte nicht posten", msg);
        } finally {
            setUploading(false);
            setPosting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet}>
                    <View style={styles.handle} />
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        <Text style={styles.title}>Status-Update</Text>

                        {/* Typ-Auswahl */}
                        <View style={styles.typGrid}>
                            {TYPEN.map((t) => {
                                const meta = updateTypMeta[t];
                                const active = typ === t;
                                const tint = toneColor(meta.tone);
                                return (
                                    <Pressable
                                        key={t}
                                        style={[
                                            styles.typChip,
                                            active && {
                                                borderColor: tint,
                                                backgroundColor:
                                                    colors.surfaceMuted,
                                            },
                                        ]}
                                        onPress={() => setTyp(t)}
                                    >
                                        <Ionicons
                                            name={meta.icon as never}
                                            size={18}
                                            color={
                                                active
                                                    ? tint
                                                    : colors.textSecondary
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.typChipText,
                                                active && { color: tint },
                                            ]}
                                        >
                                            {meta.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <TextInput
                            value={text}
                            onChangeText={setText}
                            placeholder="Was gibt es Neues auf der Baustelle?"
                            placeholderTextColor={colors.textSecondary}
                            style={styles.textarea}
                            multiline
                        />

                        {/* Fotos */}
                        <View style={styles.fotoRow}>
                            {fotos.map((uri) => (
                                <View key={uri} style={styles.fotoThumb}>
                                    <Image
                                        source={{ uri }}
                                        style={styles.fotoImg}
                                        contentFit="cover"
                                    />
                                    <Pressable
                                        style={styles.fotoRemove}
                                        onPress={() => removeFoto(uri)}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={14}
                                            color={colors.textOnDark}
                                        />
                                    </Pressable>
                                </View>
                            ))}
                            {fotos.length < 5 ? (
                                <Pressable
                                    style={styles.fotoAdd}
                                    onPress={pickImage}
                                >
                                    <Ionicons
                                        name="camera-outline"
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                            ) : null}
                        </View>

                        <View style={styles.actions}>
                            <Button
                                title={
                                    uploading
                                        ? "Fotos werden geladen…"
                                        : "Update posten"
                                }
                                onPress={submit}
                                loading={posting}
                            />
                        </View>
                        {uploading ? (
                            <View style={styles.uploadHint}>
                                <ActivityIndicator
                                    size="small"
                                    color={colors.textSecondary}
                                />
                            </View>
                        ) : null}
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        paddingTop: spacing.md,
        maxHeight: "88%",
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: "center",
        marginBottom: spacing.md,
    },
    content: {
        gap: spacing.lg,
        paddingBottom: spacing.lg,
    },
    title: {
        ...typography.title,
    },
    typGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    typChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
    },
    typChipText: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
    },
    textarea: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        borderCurve: "continuous",
        padding: spacing.lg,
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.textPrimary,
        textAlignVertical: "top",
    },
    fotoRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    fotoThumb: {
        width: 72,
        height: 72,
        borderRadius: radius.input,
        borderCurve: "continuous",
        overflow: "hidden",
    },
    fotoImg: {
        width: "100%",
        height: "100%",
    },
    fotoRemove: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    fotoAdd: {
        width: 72,
        height: 72,
        borderRadius: radius.input,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    actions: {
        marginTop: spacing.sm,
    },
    uploadHint: {
        alignItems: "center",
    },
});
