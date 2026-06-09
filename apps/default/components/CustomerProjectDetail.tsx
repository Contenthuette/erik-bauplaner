import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Pressable,
    Platform,
    useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { ProgressRing } from "./ui/ProgressRing";
import { colors, spacing, typography, fonts, radius, shadows } from "../lib/theme";
import {
    projectStatusMeta,
    updateTypMeta,
    formatZeitraum,
    formatDate,
    formatRelative,
    type ProjectStatus,
    type StageStatus,
    type UpdateTyp,
} from "../lib/format";

interface Props {
    projectId: Id<"projects">;
    /** Wenn true, wird oben Abstand für einen Header gelassen (Einzelprojekt-Ansicht). */
    embedded?: boolean;
}

/**
 * Projekt-Detail aus Kundensicht — rein lesend.
 * Aufbau: Hero, nächster Schritt, Hinweis-Banner, Update-Feed, Timeline, Schnell-Links.
 */
export function CustomerProjectDetail({ projectId, embedded }: Props) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const project = useQuery(api.projects.getProject, { projectId });
    const stages = useQuery(api.stages.listStages, { projectId });
    const updates = useQuery(api.updates.listUpdates, { projectId });
    const [refreshing, setRefreshing] = useState(false);
    const [expandedStage, setExpandedStage] = useState<string | null>(null);
    const now = Date.now();

    const onRefresh = useCallback(() => {
        // Convex-Queries sind reaktiv; kurzer Spinner als haptisches Feedback.
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 600);
    }, []);

    if (project === undefined || stages === undefined || updates === undefined) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Wird geladen …</Text>
            </View>
        );
    }

    if (project === null) {
        return (
            <View style={styles.loading}>
                <Text style={styles.loadingText}>Projekt nicht gefunden.</Text>
            </View>
        );
    }

    const statusMeta = projectStatusMeta[project.status as ProjectStatus];
    const sorted = [...stages].sort((a, b) => a.reihenfolge - b.reihenfolge);

    // Aktueller Schritt: explizit markiert, sonst erster "laeuft".
    const aktuellerStage =
        sorted.find((s) => s.istAktuell) ??
        sorted.find((s) => s.status === "laeuft");
    const aktuellTitel = aktuellerStage?.titel ?? "Vorbereitung";

    // Nächster Schritt: erster offener nach dem aktuellen.
    const naechsterStage = sorted.find(
        (s) => s.status === "offen" && s._id !== aktuellerStage?._id
    );

    // Hinweis-Banner: neuestes Update vom Typ Verzögerung/Wetter.
    const hinweis = updates.find(
        (u) => u.typ === "verzoegerung" || u.typ === "wetter"
    );

    const ringColor =
        project.status === "verzoegert"
            ? colors.statusRed
            : project.status === "abgeschlossen"
              ? colors.textPrimary
              : colors.statusGreen;

    const photoSize = Math.min(width - spacing.lg * 2 - 2, 520);

    return (
        <ScrollView
            contentContainerStyle={[
                styles.scroll,
                embedded && { paddingTop: spacing.sm },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.textSecondary}
                />
            }
        >
            {/* 1 — HERO */}
            <View style={styles.hero}>
                <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>{project.titel}</Text>
                    {project.adresse ? (
                        <View style={styles.addressRow}>
                            <Ionicons
                                name="location-outline"
                                size={15}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.address}>{project.adresse}</Text>
                        </View>
                    ) : null}
                </View>
            </View>

            <Card style={styles.standCard}>
                <View style={styles.standLeft}>
                    <Text style={styles.standLabel}>Aktueller Stand</Text>
                    <Text style={styles.standTitle}>{aktuellTitel}</Text>
                    <View style={styles.badgeWrap}>
                        <Badge label={statusMeta.label} tone={statusMeta.tone} />
                    </View>
                </View>
                <ProgressRing
                    percent={project.fortschrittProzent}
                    color={ringColor}
                />
            </Card>

            {/* 2 — NÄCHSTER SCHRITT */}
            {naechsterStage ? (
                <View style={styles.nextRow}>
                    <View style={styles.nextIcon}>
                        <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={colors.textSecondary}
                        />
                    </View>
                    <View style={styles.nextTextWrap}>
                        <Text style={styles.nextLabel}>Nächster Schritt</Text>
                        <Text style={styles.nextTitle}>
                            {naechsterStage.titel}
                            <Text style={styles.nextZeitraum}>
                                {"  ·  "}
                                {formatZeitraum(
                                    naechsterStage.startPlan,
                                    naechsterStage.endePlan
                                )}
                            </Text>
                        </Text>
                    </View>
                </View>
            ) : null}

            {/* 3 — HINWEIS-BANNER */}
            {hinweis ? (
                <View
                    style={[
                        styles.banner,
                        hinweis.typ === "verzoegerung"
                            ? styles.bannerRed
                            : styles.bannerAmber,
                    ]}
                >
                    <Ionicons
                        name={
                            hinweis.typ === "verzoegerung"
                                ? "alert-circle"
                                : "rainy"
                        }
                        size={20}
                        color={
                            hinweis.typ === "verzoegerung"
                                ? colors.statusRed
                                : colors.statusAmber
                        }
                    />
                    <Text style={styles.bannerText}>{hinweis.text}</Text>
                </View>
            ) : null}

            {/* 4 — AKTUELLES (Update-Feed) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aktuelles</Text>
                {updates.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="megaphone-outline"
                                size={24}
                                color={colors.textSecondary}
                            />
                        </View>
                        <Text style={styles.emptyText}>
                            Dein Betrieb hält dich hier auf dem Laufenden,
                            sobald es losgeht.
                        </Text>
                    </Card>
                ) : (
                    <View style={styles.feed}>
                        {updates.map((u) => {
                            const meta = updateTypMeta[u.typ as UpdateTyp];
                            return (
                                <Card key={u._id} style={styles.updateCard}>
                                    <View style={styles.updateHeader}>
                                        <View
                                            style={[
                                                styles.updateTypIcon,
                                                tagBg(meta.tone),
                                            ]}
                                        >
                                            <Ionicons
                                                name={
                                                    meta.icon as keyof typeof Ionicons.glyphMap
                                                }
                                                size={15}
                                                color={tagColor(meta.tone)}
                                            />
                                        </View>
                                        <Text style={styles.updateTyp}>
                                            {meta.label}
                                        </Text>
                                        <Text style={styles.updateTime}>
                                            {formatRelative(u.erstelltAm, now)}
                                        </Text>
                                    </View>
                                    <Text style={styles.updateText}>{u.text}</Text>
                                    {u.fotoUrls.length > 0 ? (
                                        <View style={styles.photoWrap}>
                                            {u.fotoUrls.map((url, i) => (
                                                <Image
                                                    key={i}
                                                    source={{ uri: url }}
                                                    style={{
                                                        width: "100%",
                                                        height: photoSize * 0.62,
                                                        borderRadius: radius.card,
                                                    }}
                                                    contentFit="cover"
                                                    transition={200}
                                                />
                                            ))}
                                        </View>
                                    ) : null}
                                    <Text style={styles.updateDate}>
                                        {formatDate(u.erstelltAm)}
                                    </Text>
                                </Card>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* 5 — ABLAUFPLAN (Timeline) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ablaufplan</Text>
                {sorted.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                            Der Ablaufplan wird gerade vorbereitet.
                        </Text>
                    </Card>
                ) : (
                    <View style={styles.timeline}>
                        {sorted.map((s, idx) => {
                            const isLast = idx === sorted.length - 1;
                            const isAktuell =
                                s._id === aktuellerStage?._id;
                            const expanded = expandedStage === s._id;
                            return (
                                <Pressable
                                    key={s._id}
                                    style={styles.timelineRow}
                                    onPress={() => {
                                        if (Platform.OS !== "web") {
                                            Haptics.selectionAsync();
                                        }
                                        setExpandedStage(
                                            expanded ? null : s._id
                                        );
                                    }}
                                >
                                    <View style={styles.timelineGutter}>
                                        <TimelineNode
                                            status={s.status as StageStatus}
                                            aktuell={isAktuell}
                                        />
                                        {!isLast ? (
                                            <View
                                                style={[
                                                    styles.timelineLine,
                                                    s.status === "erledigt" &&
                                                        styles.timelineLineDone,
                                                ]}
                                            />
                                        ) : null}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text
                                            style={[
                                                styles.stageTitle,
                                                isAktuell &&
                                                    styles.stageTitleAktuell,
                                                s.status === "erledigt" &&
                                                    styles.stageTitleDone,
                                            ]}
                                        >
                                            {s.titel}
                                        </Text>
                                        <Text style={styles.stageZeitraum}>
                                            {formatZeitraum(
                                                s.startPlan,
                                                s.endePlan
                                            )}
                                        </Text>
                                        {expanded && s.beschreibung ? (
                                            <Text style={styles.stageDesc}>
                                                {s.beschreibung}
                                            </Text>
                                        ) : null}
                                        {expanded && !s.beschreibung ? (
                                            <Text style={styles.stageDescMuted}>
                                                Keine weitere Beschreibung.
                                            </Text>
                                        ) : null}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* 6 — SCHNELL-LINKS */}
            <View style={styles.quickLinks}>
                <Pressable
                    style={styles.quickLink}
                    onPress={() =>
                        router.push("/(customer)/nachrichten" as Href)
                    }
                >
                    <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={22}
                        color={colors.textPrimary}
                    />
                    <Text style={styles.quickLinkText}>Nachricht schreiben</Text>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                    />
                </Pressable>
                <Pressable
                    style={styles.quickLink}
                    onPress={() =>
                        router.push("/(customer)/dokumente" as Href)
                    }
                >
                    <Ionicons
                        name="document-text-outline"
                        size={22}
                        color={colors.textPrimary}
                    />
                    <Text style={styles.quickLinkText}>
                        Dokumente & Rechnungen
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textSecondary}
                    />
                </Pressable>
            </View>
        </ScrollView>
    );
}

function TimelineNode({
    status,
    aktuell,
}: {
    status: StageStatus;
    aktuell: boolean;
}) {
    if (status === "erledigt") {
        return (
            <View style={[styles.node, styles.nodeDone]}>
                <Ionicons name="checkmark" size={14} color={colors.textOnDark} />
            </View>
        );
    }
    if (aktuell || status === "laeuft") {
        return (
            <View style={[styles.node, styles.nodeAktuell]}>
                <View style={styles.nodeAktuellDot} />
            </View>
        );
    }
    return <View style={[styles.node, styles.nodeOffen]} />;
}

function tagBg(tone: string) {
    if (tone === "green") return { backgroundColor: colors.statusGreenBg };
    if (tone === "amber") return { backgroundColor: colors.statusAmberBg };
    if (tone === "red") return { backgroundColor: colors.statusRedBg };
    return { backgroundColor: colors.surfaceMuted };
}

function tagColor(tone: string) {
    if (tone === "green") return colors.statusGreen;
    if (tone === "amber") return colors.statusAmber;
    if (tone === "red") return colors.statusRed;
    return colors.textSecondary;
}

const styles = StyleSheet.create({
    scroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl * 2,
    },
    loading: {
        paddingVertical: spacing.xxl,
        alignItems: "center",
    },
    loadingText: {
        ...typography.subhead,
    },
    hero: {
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    heroText: { gap: spacing.xs },
    heroTitle: {
        ...typography.largeTitle,
        fontSize: 30,
        lineHeight: 36,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    address: {
        ...typography.subhead,
    },
    standCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.lg,
        marginBottom: spacing.lg,
    },
    standLeft: { flex: 1, gap: 6 },
    standLabel: {
        fontFamily: fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    standTitle: {
        fontFamily: fonts.bold,
        fontSize: 22,
        lineHeight: 27,
        color: colors.textPrimary,
    },
    badgeWrap: { marginTop: 2 },
    nextRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.card,
        borderCurve: "continuous",
        marginBottom: spacing.lg,
    },
    nextIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    nextTextWrap: { flex: 1 },
    nextLabel: {
        fontFamily: fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    nextTitle: {
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.textPrimary,
        marginTop: 1,
    },
    nextZeitraum: {
        fontFamily: fonts.regular,
        color: colors.textSecondary,
        fontSize: 15,
    },
    banner: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.card,
        borderCurve: "continuous",
        marginBottom: spacing.lg,
    },
    bannerAmber: {
        backgroundColor: colors.statusAmberBg,
    },
    bannerRed: {
        backgroundColor: colors.statusRedBg,
    },
    bannerText: {
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 15,
        lineHeight: 20,
        color: colors.textPrimary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.title,
        fontSize: 20,
        marginBottom: spacing.md,
    },
    emptyCard: {
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.xl,
    },
    emptyIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.surfaceMuted,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 21,
        color: colors.textSecondary,
        textAlign: "center",
        maxWidth: 280,
    },
    feed: { gap: spacing.md },
    updateCard: { gap: spacing.sm },
    updateHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    updateTypIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    updateTyp: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    updateTime: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
    },
    updateText: {
        fontFamily: fonts.regular,
        fontSize: 16,
        lineHeight: 22,
        color: colors.textPrimary,
    },
    photoWrap: { gap: spacing.sm, marginTop: spacing.xs },
    updateDate: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    timeline: {
        paddingTop: spacing.xs,
    },
    timelineRow: {
        flexDirection: "row",
        gap: spacing.md,
    },
    timelineGutter: {
        width: 28,
        alignItems: "center",
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        marginVertical: 2,
        minHeight: 18,
    },
    timelineLineDone: {
        backgroundColor: colors.textPrimary,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: spacing.lg,
    },
    node: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    nodeDone: {
        backgroundColor: colors.textPrimary,
    },
    nodeAktuell: {
        backgroundColor: colors.statusGreen,
    },
    nodeAktuellDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textOnDark,
    },
    nodeOffen: {
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
    },
    stageTitle: {
        fontFamily: fonts.medium,
        fontSize: 16,
        color: colors.textPrimary,
        marginTop: 1,
    },
    stageTitleAktuell: {
        fontFamily: fonts.bold,
    },
    stageTitleDone: {
        color: colors.textSecondary,
    },
    stageZeitraum: {
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    stageDesc: {
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 21,
        color: colors.textPrimary,
        marginTop: spacing.sm,
    },
    stageDescMuted: {
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        fontStyle: "italic",
    },
    quickLinks: {
        gap: spacing.sm,
        marginTop: spacing.xs,
    },
    quickLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.card,
    },
    quickLinkText: {
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: 16,
        color: colors.textPrimary,
    },
});
