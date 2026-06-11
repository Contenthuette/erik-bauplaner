import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Platform,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { HeaderTitle } from "../../../components/HeaderTitle";
import { colors, spacing, typography, fonts, radius, shadows } from "../../../lib/theme";
import {
    projectStatusMeta,
    ProjectStatus,
    formatDate,
} from "../../../lib/format";

type FilterKey = "alle" | "laeuft" | "verzug" | "abgeschlossen";

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "alle", label: "Alle" },
    { key: "laeuft", label: "Läuft" },
    { key: "verzug", label: "Im Verzug" },
    { key: "abgeschlossen", label: "Abgeschlossen" },
];

interface ProjectItem {
    _id: Id<"projects">;
    titel: string;
    typ?: string;
    adresse?: string;
    status: ProjectStatus;
    startPlan?: number;
    endePlan?: number;
    auftragswert?: number;
    fortschrittProzent: number;
    kundeName?: string;
    erstelltAm: number;
}

function matchesFilter(status: ProjectStatus, filter: FilterKey): boolean {
    if (filter === "alle") return true;
    if (filter === "laeuft") return status === "laeuft";
    if (filter === "verzug") return status === "verzoegert";
    if (filter === "abgeschlossen") return status === "abgeschlossen";
    return true;
}

function toneColor(tone: string): string {
    if (tone === "green") return colors.statusGreen;
    if (tone === "amber") return colors.statusAmber;
    if (tone === "red") return colors.statusRed;
    return colors.textPrimary;
}

function ProjectCard({
    project,
    index,
    onPress,
}: {
    project: ProjectItem;
    index: number;
    onPress: () => void;
}) {
    const meta = projectStatusMeta[project.status];
    return (
        <Animated.View entering={FadeInUp.delay(index * 40).springify()}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {project.titel}
                    </Text>
                    <Badge label={meta.label} tone={meta.tone} />
                </View>

                {(project.kundeName || project.adresse) && (
                    <View style={styles.metaRow}>
                        {project.kundeName ? (
                            <View style={styles.metaItem}>
                                <Ionicons
                                    name="person-outline"
                                    size={14}
                                    color={colors.textSecondary}
                                />
                                <Text style={styles.metaText} numberOfLines={1}>
                                    {project.kundeName}
                                </Text>
                            </View>
                        ) : null}
                        {project.adresse ? (
                            <View style={styles.metaItem}>
                                <Ionicons
                                    name="location-outline"
                                    size={14}
                                    color={colors.textSecondary}
                                />
                                <Text style={styles.metaText} numberOfLines={1}>
                                    {project.adresse}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}

                <View style={styles.progressWrap}>
                    <ProgressBar
                        percent={project.fortschrittProzent}
                        tone={toneColor(meta.tone)}
                    />
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.metaItem}>
                        <Ionicons
                            name="flag-outline"
                            size={14}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.footerText}>
                            Fertig bis {formatDate(project.endePlan)}
                        </Text>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default function ProjekteScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ filter?: string }>();
    const projects = useQuery(api.projects.listProjects);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterKey>("alle");
    const [fabOpen, setFabOpen] = useState(false);

    React.useEffect(() => {
        if (params.filter === "verzoegert") setFilter("verzug");
        else if (params.filter === "laeuft") setFilter("laeuft");
        else if (params.filter === "abgeschlossen") setFilter("abgeschlossen");
    }, [params.filter]);

    const filtered = useMemo(() => {
        if (!projects) return [];
        const q = search.trim().toLowerCase();
        return projects.filter((p) => {
            if (!matchesFilter(p.status, filter)) return false;
            if (!q) return true;
            return (
                p.titel.toLowerCase().includes(q) ||
                (p.kundeName ?? "").toLowerCase().includes(q) ||
                (p.adresse ?? "").toLowerCase().includes(q)
            );
        });
    }, [projects, search, filter]);

    const openFab = () => {
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        setFabOpen((v) => !v);
    };

    const goCreate = (route: "kunde-anlegen" | "projekt-anlegen") => {
        setFabOpen(false);
        router.push(`/(admin)/${route}` as Href);
    };

    const loading = projects === undefined;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                    <ProjectCard
                        project={item}
                        index={index}
                        onPress={() => router.push(`/(admin)/projekt/${item._id}` as Href)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        <HeaderTitle title="Projekte" style={styles.largeTitle} />

                        <View style={styles.searchBox}>
                            <Ionicons
                                name="search"
                                size={18}
                                color={colors.textSecondary}
                            />
                            <TextInput
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Kunde, Projekt oder Ort suchen"
                                placeholderTextColor={colors.textSecondary}
                                style={styles.searchInput}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="search"
                            />
                            {search.length > 0 ? (
                                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                                    <Ionicons
                                        name="close-circle"
                                        size={18}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                            ) : null}
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.pills}
                        >
                            {FILTERS.map((f) => {
                                const active = filter === f.key;
                                return (
                                    <Pressable
                                        key={f.key}
                                        onPress={() => setFilter(f.key)}
                                        style={[
                                            styles.pill,
                                            active && styles.pillActive,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.pillText,
                                                active && styles.pillTextActive,
                                            ]}
                                        >
                                            {f.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    loading ? null : (
                        <View style={styles.empty}>
                            <View style={styles.emptyIcon}>
                                <Ionicons
                                    name="hammer-outline"
                                    size={28}
                                    color={colors.textSecondary}
                                />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {search || filter !== "alle"
                                    ? "Keine Treffer"
                                    : "Noch keine Projekte"}
                            </Text>
                            <Text style={styles.emptyHint}>
                                {search || filter !== "alle"
                                    ? "Passe Suche oder Filter an."
                                    : "Lege dein erstes Projekt über das Plus an."}
                            </Text>
                        </View>
                    )
                }
            />

            {/* Floating Action Button + Auswahl */}
            {fabOpen ? (
                <Pressable
                    style={styles.backdrop}
                    onPress={() => setFabOpen(false)}
                />
            ) : null}
            <View style={styles.fabWrap} pointerEvents="box-none">
                {fabOpen ? (
                    <Animated.View
                        entering={FadeIn.duration(120)}
                        style={styles.fabMenu}
                    >
                        <Pressable
                            style={styles.fabItem}
                            onPress={() => goCreate("kunde-anlegen")}
                        >
                            <Ionicons
                                name="person-add-outline"
                                size={18}
                                color={colors.textPrimary}
                            />
                            <Text style={styles.fabItemText}>Neuer Kunde</Text>
                        </Pressable>
                        <View style={styles.fabDivider} />
                        <Pressable
                            style={styles.fabItem}
                            onPress={() => goCreate("projekt-anlegen")}
                        >
                            <Ionicons
                                name="add-circle-outline"
                                size={18}
                                color={colors.textPrimary}
                            />
                            <Text style={styles.fabItemText}>Neues Projekt</Text>
                        </Pressable>
                    </Animated.View>
                ) : null}
                <Pressable style={styles.fab} onPress={openFab}>
                    <Ionicons
                        name={fabOpen ? "close" : "add"}
                        size={28}
                        color={colors.textOnDark}
                    />
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: 120,
        gap: spacing.md,
    },
    largeTitle: {
        ...typography.largeTitle,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        borderCurve: "continuous",
        paddingHorizontal: spacing.md,
        height: 44,
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    pills: {
        gap: spacing.sm,
        paddingBottom: spacing.md,
        paddingRight: spacing.lg,
    },
    pill: {
        paddingHorizontal: spacing.lg,
        height: 36,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    pillActive: {
        backgroundColor: colors.buttonPrimaryBg,
        borderColor: colors.buttonPrimaryBg,
    },
    pillText: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
    },
    pillTextActive: {
        color: colors.textOnDark,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.md,
        ...shadows.card,
    },
    cardPressed: {
        opacity: 0.7,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: spacing.md,
    },
    cardTitle: {
        ...typography.headline,
        flex: 1,
    },
    metaRow: {
        gap: 6,
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
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerText: {
        ...typography.footnote,
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingTop: 80,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.sm,
    },
    emptyTitle: {
        ...typography.headline,
    },
    emptyHint: {
        ...typography.subhead,
        textAlign: "center",
        maxWidth: 260,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.04)",
    },
    fabWrap: {
        position: "absolute",
        right: spacing.lg,
        bottom: spacing.xl,
        alignItems: "flex-end",
        gap: spacing.md,
    },
    fabMenu: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.xs,
        minWidth: 200,
        ...shadows.card,
    },
    fabItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 48,
    },
    fabItemText: {
        ...typography.callout,
        fontFamily: fonts.medium,
    },
    fabDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.buttonPrimaryBg,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0px 4px 12px rgba(10, 10, 10, 0.24)",
    },
});
