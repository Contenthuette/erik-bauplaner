import React, { useMemo, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { api } from "@/convex/_generated/api";
import { Card } from "../../../components/ui/Card";
import { DonutChart, DonutSegment } from "../../../components/charts/DonutChart";
import { HorizontalBars } from "../../../components/charts/HorizontalBars";
import { ColumnChart } from "../../../components/charts/ColumnChart";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { colors, spacing, typography, fonts, radius } from "../../../lib/theme";
import { formatEuro } from "../../../lib/format";
import { HeaderTitle } from "../../../components/HeaderTitle";

const statusFarbe: Record<string, string> = {
    geplant: "#9AA0A6",
    laeuft: colors.statusGreen,
    pausiert: colors.statusAmber,
    verzoegert: colors.statusRed,
    abgeschlossen: "#0A0A0A",
};

export default function Dashboard() {
    const router = useRouter();
    const [now, setNow] = useState(() => Date.now());
    const data = useQuery(api.dashboard.getDashboard, { now });

    const onRefresh = useCallback(() => setNow(Date.now()), []);

    const donutSegments: DonutSegment[] = useMemo(() => {
        if (!data) return [];
        return data.statusVerteilung.map((s) => ({
            label: s.label,
            value: s.anzahl,
            color: statusFarbe[s.status] ?? colors.textSecondary,
        }));
    }, [data]);

    const gesamtProjekte = useMemo(
        () => donutSegments.reduce((s, d) => s + d.value, 0),
        [donutSegments]
    );

    if (data === undefined) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.loading}>
                    <Text style={styles.loadingText}>Lade Auswertungen …</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { kpis, nachOrt, umsatzProMonat, zeitplan, brennpunkte } = data;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                        tintColor={colors.textSecondary}
                    />
                }
            >
                <HeaderTitle title="Dashboard" style={styles.largeTitle} />

                {/* KPI-Cards */}
                <View style={styles.kpiGrid}>
                    <KpiCard
                        icon="hammer-outline"
                        label="Aktive Bauvorhaben"
                        value={String(kpis.aktiveProjekte)}
                        onPress={() =>
                            router.push("/(admin)/projekte" as Href)
                        }
                    />
                    <KpiCard
                        icon="alert-circle-outline"
                        label="Im Verzug"
                        value={String(kpis.imVerzug)}
                        tone={kpis.imVerzug > 0 ? "red" : "neutral"}
                        onPress={() =>
                            router.push(
                                "/(admin)/projekte?filter=verzoegert" as Href
                            )
                        }
                    />
                    <KpiCard
                        icon="cash-outline"
                        label="Offene Rechnungen"
                        value={formatEuro(kpis.offeneRechnungenSumme)}
                        small
                    />
                    <KpiCard
                        icon="chatbubbles-outline"
                        label="Ungelesene Nachrichten"
                        value={String(kpis.ungeleseneNachrichten)}
                        tone={kpis.ungeleseneNachrichten > 0 ? "amber" : "neutral"}
                        onPress={() =>
                            router.push("/(admin)/nachrichten" as Href)
                        }
                    />
                </View>

                {gesamtProjekte === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons
                            name="bar-chart-outline"
                            size={32}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.emptyTitle}>
                            Noch keine Auswertungen
                        </Text>
                        <Text style={styles.emptyText}>
                            Sobald Sie Projekte anlegen, erscheinen hier
                            Diagramme und Kennzahlen.
                        </Text>
                    </Card>
                ) : (
                    <>
                        {/* Brennpunkte */}
                        {brennpunkte.length > 0 ? (
                            <Card style={styles.brennpunkteCard}>
                                <View style={styles.sectionHeadRow}>
                                    <Ionicons
                                        name="flame-outline"
                                        size={18}
                                        color={colors.statusRed}
                                    />
                                    <Text style={styles.sectionTitle}>
                                        Brennpunkte
                                    </Text>
                                </View>
                                {brennpunkte.map((b) => (
                                    <Pressable
                                        key={b.projectId}
                                        style={styles.brennRow}
                                        onPress={() =>
                                            router.push(
                                                `/(admin)/projekt/${b.projectId}` as Href
                                            )
                                        }
                                    >
                                        <Text
                                            style={styles.brennTitel}
                                            numberOfLines={1}
                                        >
                                            {b.titel}
                                        </Text>
                                        <Text style={styles.brennVerzug}>
                                            {b.verzugTage} Tage im Verzug
                                        </Text>
                                    </Pressable>
                                ))}
                            </Card>
                        ) : null}

                        {/* Donut: Projekte nach Status */}
                        <Card style={styles.chartCard}>
                            <Text style={styles.sectionTitle}>
                                Projekte nach Status
                            </Text>
                            <View style={styles.donutRow}>
                                <DonutChart
                                    segments={donutSegments}
                                    centerLabel={String(gesamtProjekte)}
                                    centerSub="Projekte"
                                />
                                <View style={styles.legend}>
                                    {donutSegments.map((s) => (
                                        <View key={s.label} style={styles.legendRow}>
                                            <View
                                                style={[
                                                    styles.legendDot,
                                                    { backgroundColor: s.color },
                                                ]}
                                            />
                                            <Text style={styles.legendLabel}>
                                                {s.label}
                                            </Text>
                                            <Text style={styles.legendValue}>
                                                {s.value}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </Card>

                        {/* Balken: Projekte nach Ort */}
                        {nachOrt.length > 0 ? (
                            <Card style={styles.chartCard}>
                                <Text style={styles.sectionTitle}>
                                    Aktive Baustellen nach Ort
                                </Text>
                                <HorizontalBars
                                    data={nachOrt.map((o) => ({
                                        label: o.ort,
                                        value: o.anzahl,
                                    }))}
                                />
                            </Card>
                        ) : null}

                        {/* Umsatz-Prognose */}
                        <Card style={styles.chartCard}>
                            <Text style={styles.sectionTitle}>
                                Umsatz-Prognose
                            </Text>
                            <Text style={styles.sectionSub}>
                                Auftragswerte nach geplantem Abschluss
                            </Text>
                            <ColumnChart
                                data={umsatzProMonat.map((m) => ({
                                    label: m.monat,
                                    value: m.summe,
                                    valueLabel:
                                        m.summe > 0
                                            ? `${Math.round(m.summe / 1000)}k`
                                            : "",
                                }))}
                            />
                        </Card>

                        {/* Zeitplan-Übersicht */}
                        {zeitplan.length > 0 ? (
                            <Card style={styles.chartCard}>
                                <Text style={styles.sectionTitle}>
                                    Zeitplan-Übersicht
                                </Text>
                                <View style={styles.zeitplanList}>
                                    {zeitplan.map((z) => (
                                        <Pressable
                                            key={z.projectId}
                                            style={styles.zeitRow}
                                            onPress={() =>
                                                router.push(
                                                    `/(admin)/projekt/${z.projectId}` as Href
                                                )
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.ampel,
                                                    {
                                                        backgroundColor:
                                                            z.ampel === "green"
                                                                ? colors.statusGreen
                                                                : z.ampel ===
                                                                  "amber"
                                                                ? colors.statusAmber
                                                                : colors.statusRed,
                                                    },
                                                ]}
                                            />
                                            <View style={styles.zeitInfo}>
                                                <Text
                                                    style={styles.zeitTitel}
                                                    numberOfLines={1}
                                                >
                                                    {z.titel}
                                                </Text>
                                                <View style={styles.zeitBarWrap}>
                                                    <ProgressBar
                                                        percent={
                                                            z.fortschrittProzent
                                                        }
                                                        showLabel={false}
                                                        tone={
                                                            z.ampel === "red"
                                                                ? colors.statusRed
                                                                : z.ampel ===
                                                                  "amber"
                                                                ? colors.statusAmber
                                                                : colors.statusGreen
                                                        }
                                                    />
                                                </View>
                                                <Text style={styles.zeitMeta}>
                                                    {z.verzugTage > 0
                                                        ? `${z.verzugTage} Tage im Verzug`
                                                        : "im Plan"}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    ))}
                                </View>
                            </Card>
                        ) : null}
                    </>
                )}

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function KpiCard({
    icon,
    label,
    value,
    tone = "neutral",
    small = false,
    onPress,
}: {
    icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
    label: string;
    value: string;
    tone?: "neutral" | "red" | "amber";
    small?: boolean;
    onPress?: () => void;
}) {
    const valueColor =
        tone === "red"
            ? colors.statusRed
            : tone === "amber"
            ? colors.statusAmber
            : colors.textPrimary;
    return (
        <Pressable
            style={({ pressed }) => [
                styles.kpiCard,
                pressed && onPress ? { opacity: 0.7 } : null,
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            <Ionicons name={icon} size={20} color={colors.textSecondary} />
            <Text
                style={[
                    styles.kpiValue,
                    small && styles.kpiValueSmall,
                    { color: valueColor },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
            >
                {value}
            </Text>
            <Text style={styles.kpiLabel}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
    },
    largeTitle: {
        ...typography.largeTitle,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    loading: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: { ...typography.subhead },
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
    },
    kpiCard: {
        width: `${(100 - 4) / 2}%`,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: 6,
        minHeight: 104,
    },
    kpiValue: {
        fontFamily: fonts.bold,
        fontSize: 26,
        color: colors.textPrimary,
        fontVariant: ["tabular-nums"],
    },
    kpiValueSmall: { fontSize: 20 },
    kpiLabel: {
        fontFamily: fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptyCard: {
        marginTop: spacing.xl,
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        ...typography.headline,
        marginTop: spacing.sm,
    },
    emptyText: {
        ...typography.subhead,
        textAlign: "center",
        paddingHorizontal: spacing.lg,
    },
    chartCard: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    brennpunkteCard: {
        marginTop: spacing.lg,
        gap: spacing.sm,
        backgroundColor: colors.statusRedBg,
        borderColor: "transparent",
    },
    sectionHeadRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    sectionTitle: {
        ...typography.headline,
    },
    sectionSub: {
        ...typography.footnote,
        marginTop: -spacing.sm + 2,
    },
    brennRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
        gap: spacing.md,
    },
    brennTitel: {
        flex: 1,
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    brennVerzug: {
        fontFamily: fonts.semibold,
        fontSize: 13,
        color: colors.statusRed,
    },
    donutRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.lg,
    },
    legend: {
        flex: 1,
        gap: spacing.sm,
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendLabel: {
        flex: 1,
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
    legendValue: {
        fontFamily: fonts.semibold,
        fontSize: 14,
        color: colors.textSecondary,
        fontVariant: ["tabular-nums"],
    },
    zeitplanList: { gap: spacing.md },
    zeitRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
    },
    ampel: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    zeitInfo: { flex: 1, gap: 4 },
    zeitTitel: {
        fontFamily: fonts.semibold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    zeitBarWrap: {},
    zeitMeta: {
        fontFamily: fonts.regular,
        fontSize: 12,
        color: colors.textSecondary,
    },
});
