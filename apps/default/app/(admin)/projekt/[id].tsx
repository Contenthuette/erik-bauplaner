import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Platform,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Href } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { StageEditor } from "../../../components/admin/StageEditor";
import { UpdateComposer } from "../../../components/admin/UpdateComposer";
import {
    colors,
    spacing,
    typography,
    fonts,
    radius,
    shadows,
} from "../../../lib/theme";
import {
    projectStatusMeta,
    updateTypMeta,
    formatDate,
    formatEuro,
    UpdateTyp,
} from "../../../lib/format";

function toneColor(tone: string): string {
    if (tone === "green") return colors.statusGreen;
    if (tone === "amber") return colors.statusAmber;
    if (tone === "red") return colors.statusRed;
    return colors.textPrimary;
}

function SectionTitle({
    title,
    action,
}: {
    title: string;
    action?: React.ReactNode;
}) {
    return (
        <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {action}
        </View>
    );
}

export default function ProjektDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const projectId = id as Id<"projects">;
    const router = useRouter();

    const project = useQuery(api.projects.getProject, { projectId });
    const stages = useQuery(api.stages.listStages, { projectId });
    const updates = useQuery(api.updates.listUpdates, { projectId });
    const saveAsTemplate = useMutation(api.templates.saveProjectAsTemplate);

    const [composer, setComposer] = useState<{
        typ: UpdateTyp;
        text: string;
    } | null>(null);

    if (project === undefined) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.textPrimary} />
                </View>
            </SafeAreaView>
        );
    }
    if (project === null) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.topBar}>
                    <Pressable onPress={() => router.back()} hitSlop={10}>
                        <Ionicons
                            name="chevron-back"
                            size={26}
                            color={colors.textPrimary}
                        />
                    </Pressable>
                </View>
                <View style={styles.center}>
                    <Text style={styles.notFound}>Projekt nicht gefunden.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const meta = projectStatusMeta[project.status];

    const openQuickUpdate = (typ: UpdateTyp, text: string) => {
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setComposer({ typ, text });
    };

    const handleSaveTemplate = () => {
        const doSave = async (name: string) => {
            try {
                await saveAsTemplate({ projectId, name: name.trim() });
                Alert.alert("Gespeichert", "Vorlage wurde erstellt.");
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Fehler";
                Alert.alert("Fehler", msg);
            }
        };
        if (Platform.OS === "web") {
            doSave(project.titel);
            return;
        }
        Alert.prompt?.(
            "Als Vorlage speichern",
            "Name der Vorlage",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Speichern",
                    onPress: (name?: string) => name && doSave(name),
                },
            ],
            "plain-text",
            project.titel
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.topBar}>
                <Pressable onPress={() => router.back()} hitSlop={10}>
                    <Ionicons
                        name="chevron-back"
                        size={26}
                        color={colors.textPrimary}
                    />
                </Pressable>
                <Pressable
                    onPress={() =>
                        router.push(
                            `/(admin)/projekt/bearbeiten?id=${projectId}` as Href
                        )
                    }
                    hitSlop={10}
                >
                    <Text style={styles.editLabel}>Bearbeiten</Text>
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{project.titel}</Text>
                    <View style={styles.headerMeta}>
                        {project.kundeName ? (
                            <View style={styles.metaItem}>
                                <Ionicons
                                    name="person-outline"
                                    size={15}
                                    color={colors.textSecondary}
                                />
                                <Text style={styles.metaText}>
                                    {project.kundeName}
                                </Text>
                            </View>
                        ) : null}
                        <Badge label={meta.label} tone={meta.tone} />
                    </View>
                    {project.adresse ? (
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="location-outline"
                                size={15}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.metaText}>{project.adresse}</Text>
                        </View>
                    ) : null}
                    <View style={styles.progressWrap}>
                        <ProgressBar
                            percent={project.fortschrittProzent}
                            tone={toneColor(meta.tone)}
                        />
                    </View>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Start</Text>
                            <Text style={styles.statValue}>
                                {formatDate(project.startPlan)}
                            </Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Ende</Text>
                            <Text style={styles.statValue}>
                                {formatDate(project.endePlan)}
                            </Text>
                        </View>
                        <View style={styles.stat}>
                            <Text style={styles.statLabel}>Wert</Text>
                            <Text style={styles.statValue}>
                                {formatEuro(project.auftragswert)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Schnellaktionen */}
                <View style={styles.quickRow}>
                    <Pressable
                        style={[styles.quickBtn, styles.quickDelay]}
                        onPress={() =>
                            openQuickUpdate(
                                "verzoegerung",
                                "Es kommt zu einer Verzögerung im Ablauf. "
                            )
                        }
                    >
                        <Ionicons
                            name="alert-circle-outline"
                            size={22}
                            color={colors.statusRed}
                        />
                        <Text style={styles.quickText}>Verzögerung melden</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.quickBtn, styles.quickWeather]}
                        onPress={() =>
                            openQuickUpdate(
                                "wetter",
                                "Heute kein Einsatz aufgrund der Wetterlage. "
                            )
                        }
                    >
                        <Ionicons
                            name="rainy-outline"
                            size={22}
                            color={colors.statusAmber}
                        />
                        <Text style={styles.quickText}>
                            Heute kein Einsatz (Wetter)
                        </Text>
                    </Pressable>
                </View>

                {/* Ablaufplan */}
                <View style={styles.section}>
                    <SectionTitle
                        title="Ablaufplan"
                        action={
                            stages && stages.length > 0 ? (
                                <Pressable onPress={handleSaveTemplate} hitSlop={8}>
                                    <Text style={styles.sectionAction}>
                                        Als Vorlage
                                    </Text>
                                </Pressable>
                            ) : undefined
                        }
                    />
                    {stages === undefined ? (
                        <ActivityIndicator color={colors.textSecondary} />
                    ) : (
                        <StageEditor projectId={projectId} stages={stages} />
                    )}
                </View>

                {/* Updates */}
                <View style={styles.section}>
                    <SectionTitle
                        title="Status-Updates"
                        action={
                            <Pressable
                                onPress={() =>
                                    openQuickUpdate("fortschritt", "")
                                }
                                hitSlop={8}
                            >
                                <Text style={styles.sectionAction}>+ Posten</Text>
                            </Pressable>
                        }
                    />
                    {updates === undefined ? (
                        <ActivityIndicator color={colors.textSecondary} />
                    ) : updates.length === 0 ? (
                        <Text style={styles.emptyUpdates}>
                            Noch keine Updates gepostet.
                        </Text>
                    ) : (
                        <View style={styles.updateList}>
                            {updates.map((u, i) => {
                                const um = updateTypMeta[u.typ];
                                return (
                                    <Animated.View
                                        key={u._id}
                                        entering={FadeInUp.delay(
                                            i * 30
                                        ).springify()}
                                        style={styles.updateCard}
                                    >
                                        <View style={styles.updateHead}>
                                            <View
                                                style={[
                                                    styles.updateIcon,
                                                    {
                                                        backgroundColor:
                                                            colors.surfaceMuted,
                                                    },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={um.icon as never}
                                                    size={16}
                                                    color={toneColor(um.tone)}
                                                />
                                            </View>
                                            <Text style={styles.updateTyp}>
                                                {um.label}
                                            </Text>
                                            <Text style={styles.updateDate}>
                                                {formatDate(u.erstelltAm)}
                                            </Text>
                                        </View>
                                        <Text style={styles.updateText}>
                                            {u.text}
                                        </Text>
                                        {u.fotoUrls.length > 0 ? (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={
                                                    false
                                                }
                                                contentContainerStyle={
                                                    styles.updateFotos
                                                }
                                            >
                                                {u.fotoUrls.map((url) => (
                                                    <Image
                                                        key={url}
                                                        source={{ uri: url }}
                                                        style={styles.updateFoto}
                                                        contentFit="cover"
                                                    />
                                                ))}
                                            </ScrollView>
                                        ) : null}
                                    </Animated.View>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {composer ? (
                <UpdateComposer
                    visible={composer !== null}
                    projectId={projectId}
                    initialTyp={composer.typ}
                    initialText={composer.text}
                    onClose={() => setComposer(null)}
                />
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    notFound: {
        ...typography.body,
        color: colors.textSecondary,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    editLabel: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.textPrimary,
    },
    scroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.xl,
    },
    header: {
        gap: spacing.sm,
    },
    title: {
        ...typography.largeTitle,
        fontSize: 28,
        lineHeight: 34,
    },
    headerMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexShrink: 1,
    },
    metaText: {
        ...typography.subhead,
        flexShrink: 1,
    },
    progressWrap: {
        marginTop: spacing.sm,
    },
    statRow: {
        flexDirection: "row",
        gap: spacing.md,
        marginTop: spacing.md,
    },
    stat: {
        flex: 1,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.md,
        gap: 2,
    },
    statLabel: {
        ...typography.footnote,
    },
    statValue: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    quickRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    quickBtn: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        borderRadius: radius.card,
        borderCurve: "continuous",
        borderWidth: 1,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
        minHeight: 88,
    },
    quickDelay: {
        borderColor: colors.statusRedBg,
        backgroundColor: colors.statusRedBg,
    },
    quickWeather: {
        borderColor: colors.statusAmberBg,
        backgroundColor: colors.statusAmberBg,
    },
    quickText: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.textPrimary,
        textAlign: "center",
    },
    section: {
        gap: spacing.md,
    },
    sectionHead: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        ...typography.title,
        fontSize: 20,
    },
    sectionAction: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    emptyUpdates: {
        ...typography.subhead,
        paddingVertical: spacing.md,
    },
    updateList: {
        gap: spacing.md,
    },
    updateCard: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.lg,
        gap: spacing.sm,
        ...shadows.card,
    },
    updateHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    updateIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    updateTyp: {
        ...typography.callout,
        fontFamily: fonts.semibold,
        flex: 1,
    },
    updateDate: {
        ...typography.footnote,
    },
    updateText: {
        ...typography.body,
        lineHeight: 22,
    },
    updateFotos: {
        gap: spacing.sm,
        paddingTop: spacing.xs,
    },
    updateFoto: {
        width: 120,
        height: 120,
        borderRadius: radius.input,
        borderCurve: "continuous",
    },
});
