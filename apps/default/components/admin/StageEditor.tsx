import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    Modal,
    ScrollView,
    Alert,
} from "react-native";
import DraggableFlatList, {
    RenderItemParams,
    ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { DateField } from "../ui/DateField";
import { colors, spacing, typography, fonts, radius } from "../../lib/theme";
import {
    StageStatus,
    stageStatusMeta,
    formatDateShort,
} from "../../lib/format";

export interface Stage {
    _id: Id<"stages">;
    projectId: Id<"projects">;
    reihenfolge: number;
    titel: string;
    beschreibung?: string;
    status: StageStatus;
    startPlan?: number;
    endePlan?: number;
    istAktuell: boolean;
}

const STATUS_CYCLE: StageStatus[] = ["offen", "laeuft", "erledigt"];

function StatusDot({ status }: { status: StageStatus }) {
    const meta = stageStatusMeta[status];
    if (status === "erledigt") {
        return (
            <Ionicons
                name="checkmark-circle"
                size={26}
                color={colors.statusGreen}
            />
        );
    }
    if (status === "laeuft") {
        return (
            <View style={[styles.statusRing, { borderColor: meta.color }]}>
                <View
                    style={[styles.statusInner, { backgroundColor: meta.color }]}
                />
            </View>
        );
    }
    return <View style={styles.statusEmpty} />;
}

interface StageEditorProps {
    projectId: Id<"projects">;
    stages: Stage[];
}

export function StageEditor({ projectId, stages }: StageEditorProps) {
    const setStatus = useMutation(api.stages.setStageStatus);
    const setCurrent = useMutation(api.stages.setCurrentStage);
    const reorder = useMutation(api.stages.reorderStages);
    const addStage = useMutation(api.stages.addStage);
    const updateStage = useMutation(api.stages.updateStage);
    const deleteStage = useMutation(api.stages.deleteStage);

    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<Stage | null>(null);
    const [titel, setTitel] = useState("");
    const [beschreibung, setBeschreibung] = useState("");
    const [startPlan, setStartPlan] = useState<number | undefined>(undefined);
    const [endePlan, setEndePlan] = useState<number | undefined>(undefined);
    const [saving, setSaving] = useState(false);

    const openAdd = () => {
        setEditing(null);
        setTitel("");
        setBeschreibung("");
        setStartPlan(undefined);
        setEndePlan(undefined);
        setEditorOpen(true);
    };

    const openEdit = (stage: Stage) => {
        setEditing(stage);
        setTitel(stage.titel);
        setBeschreibung(stage.beschreibung ?? "");
        setStartPlan(stage.startPlan);
        setEndePlan(stage.endePlan);
        setEditorOpen(true);
    };

    const saveStage = async () => {
        if (!titel.trim()) {
            Alert.alert("Fehlt", "Bitte einen Titel angeben.");
            return;
        }
        setSaving(true);
        try {
            if (editing) {
                await updateStage({
                    stageId: editing._id,
                    titel: titel.trim(),
                    beschreibung: beschreibung.trim(),
                    startPlan,
                    endePlan,
                });
            } else {
                await addStage({
                    projectId,
                    titel: titel.trim(),
                    beschreibung: beschreibung.trim() || undefined,
                    startPlan,
                    endePlan,
                });
            }
            setEditorOpen(false);
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Fehler";
            Alert.alert("Konnte nicht speichern", msg);
        } finally {
            setSaving(false);
        }
    };

    const cycleStatus = async (stage: Stage) => {
        const idx = STATUS_CYCLE.indexOf(stage.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        await setStatus({ stageId: stage._id, status: next });
    };

    const confirmDelete = (stage: Stage) => {
        const doDelete = () => deleteStage({ stageId: stage._id });
        if (Platform.OS === "web") {
            doDelete();
            return;
        }
        Alert.alert("Schritt löschen", `"${stage.titel}" wirklich löschen?`, [
            { text: "Abbrechen", style: "cancel" },
            { text: "Löschen", style: "destructive", onPress: doDelete },
        ]);
    };

    const onDragEnd = useCallback(
        async ({ data }: { data: Stage[] }) => {
            if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await reorder({
                projectId,
                stageIds: data.map((s) => s._id),
            });
        },
        [projectId, reorder]
    );

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Stage>) => {
        const meta = stageStatusMeta[item.status];
        return (
            <ScaleDecorator>
                <View
                    style={[
                        styles.stageRow,
                        item.istAktuell && styles.stageRowCurrent,
                        isActive && styles.stageRowActive,
                    ]}
                >
                    <Pressable onPress={() => cycleStatus(item)} hitSlop={6}>
                        <StatusDot status={item.status} />
                    </Pressable>

                    <Pressable
                        style={styles.stageBody}
                        onPress={() => openEdit(item)}
                    >
                        <View style={styles.stageTitleRow}>
                            <Text
                                style={[
                                    styles.stageTitle,
                                    item.status === "erledigt" &&
                                        styles.stageTitleDone,
                                ]}
                                numberOfLines={1}
                            >
                                {item.titel}
                            </Text>
                            {item.istAktuell ? (
                                <View style={styles.currentTag}>
                                    <Text style={styles.currentTagText}>
                                        Aktuell
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        {item.beschreibung ? (
                            <Text style={styles.stageDesc} numberOfLines={1}>
                                {item.beschreibung}
                            </Text>
                        ) : null}
                        <View style={styles.stageMetaRow}>
                            <Text style={[styles.stageStatus, { color: meta.color }]}>
                                {meta.label}
                            </Text>
                            {item.startPlan || item.endePlan ? (
                                <Text style={styles.stageDates}>
                                    {formatDateShort(item.startPlan)}
                                    {" – "}
                                    {formatDateShort(item.endePlan)}
                                </Text>
                            ) : null}
                        </View>
                    </Pressable>

                    <View style={styles.stageActions}>
                        {!item.istAktuell ? (
                            <Pressable
                                onPress={() =>
                                    setCurrent({ stageId: item._id })
                                }
                                hitSlop={6}
                                style={styles.iconBtn}
                            >
                                <Ionicons
                                    name="star-outline"
                                    size={18}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        ) : (
                            <View style={styles.iconBtn}>
                                <Ionicons
                                    name="star"
                                    size={18}
                                    color={colors.statusAmber}
                                />
                            </View>
                        )}
                        <Pressable
                            onLongPress={drag}
                            delayLongPress={120}
                            hitSlop={6}
                            style={styles.iconBtn}
                        >
                            <Ionicons
                                name="reorder-three"
                                size={22}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                    </View>
                </View>
            </ScaleDecorator>
        );
    };

    return (
        <View style={styles.container}>
            {stages.length === 0 ? (
                <View style={styles.emptyStages}>
                    <Text style={styles.emptyText}>
                        Noch keine Schritte. Füge den ersten hinzu.
                    </Text>
                </View>
            ) : (
                <DraggableFlatList
                    data={stages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    onDragEnd={onDragEnd}
                    scrollEnabled={false}
                    activationDistance={12}
                    containerStyle={styles.list}
                />
            )}

            <Pressable style={styles.addBtn} onPress={openAdd}>
                <Ionicons name="add" size={20} color={colors.textPrimary} />
                <Text style={styles.addBtnText}>Schritt hinzufügen</Text>
            </Pressable>

            {/* Editor-Sheet */}
            <Modal
                visible={editorOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setEditorOpen(false)}
            >
                <Pressable
                    style={styles.sheetBackdrop}
                    onPress={() => setEditorOpen(false)}
                >
                    <Pressable style={styles.sheet}>
                        <View style={styles.sheetHandle} />
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.sheetContent}
                        >
                            <Text style={styles.sheetTitle}>
                                {editing ? "Schritt bearbeiten" : "Neuer Schritt"}
                            </Text>
                            <Input
                                label="Titel"
                                value={titel}
                                onChangeText={setTitel}
                                placeholder="z.B. Gerüst aufbauen"
                            />
                            <Input
                                label="Beschreibung"
                                value={beschreibung}
                                onChangeText={setBeschreibung}
                                placeholder="Optionale Details"
                                multiline
                                style={styles.multiline}
                            />
                            <View style={styles.dateRow}>
                                <View style={styles.dateCol}>
                                    <DateField
                                        label="Von"
                                        value={startPlan}
                                        onChange={setStartPlan}
                                    />
                                </View>
                                <View style={styles.dateCol}>
                                    <DateField
                                        label="Bis"
                                        value={endePlan}
                                        onChange={setEndePlan}
                                    />
                                </View>
                            </View>
                            <View style={styles.sheetActions}>
                                <Button
                                    title={editing ? "Speichern" : "Hinzufügen"}
                                    onPress={saveStage}
                                    loading={saving}
                                />
                                {editing ? (
                                    <Pressable
                                        style={styles.deleteLink}
                                        onPress={() => {
                                            setEditorOpen(false);
                                            confirmDelete(editing);
                                        }}
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={16}
                                            color={colors.statusRed}
                                        />
                                        <Text style={styles.deleteLinkText}>
                                            Schritt löschen
                                        </Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.md,
    },
    list: {
        gap: spacing.sm,
    },
    emptyStages: {
        paddingVertical: spacing.lg,
        alignItems: "center",
    },
    emptyText: {
        ...typography.subhead,
    },
    stageRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    stageRowCurrent: {
        borderColor: colors.statusAmber,
        backgroundColor: colors.statusAmberBg,
    },
    stageRowActive: {
        boxShadow: "0px 6px 16px rgba(10,10,10,0.16)",
    },
    stageBody: {
        flex: 1,
        gap: 2,
    },
    stageTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    stageTitle: {
        ...typography.callout,
        fontFamily: fonts.medium,
        flexShrink: 1,
    },
    stageTitleDone: {
        color: colors.textSecondary,
        textDecorationLine: "line-through",
    },
    stageDesc: {
        ...typography.footnote,
    },
    stageMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        marginTop: 2,
    },
    stageStatus: {
        fontFamily: fonts.medium,
        fontSize: 12,
    },
    stageDates: {
        ...typography.footnote,
        fontVariant: ["tabular-nums"],
    },
    stageActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    currentTag: {
        backgroundColor: colors.statusAmber,
        borderRadius: radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    currentTagText: {
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: colors.textOnDark,
    },
    statusRing: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    statusInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusEmpty: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
    },
    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed",
        borderRadius: radius.card,
        borderCurve: "continuous",
        paddingVertical: spacing.md,
        minHeight: 48,
    },
    addBtnText: {
        ...typography.callout,
        fontFamily: fonts.medium,
    },
    sheetBackdrop: {
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
        maxHeight: "86%",
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        alignSelf: "center",
        marginBottom: spacing.md,
    },
    sheetContent: {
        gap: spacing.lg,
        paddingBottom: spacing.lg,
    },
    sheetTitle: {
        ...typography.title,
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: "top",
        paddingTop: 12,
    },
    dateRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    dateCol: { flex: 1 },
    sheetActions: {
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    deleteLink: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: spacing.sm,
    },
    deleteLinkText: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.statusRed,
    },
});
