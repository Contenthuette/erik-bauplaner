import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, fonts, spacing, layout } from "../../lib/theme";
import { formatDate } from "../../lib/format";
import { Button } from "./Button";

interface DateFieldProps {
    label?: string;
    value: number | undefined;
    onChange: (ms: number | undefined) => void;
    placeholder?: string;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
    "Januar",
    "Februar",
    "M\u00e4rz",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
];

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/**
 * Datumsfeld mit eigenem Kalender (funktioniert auf iOS, Android und Web).
 */
export function DateField({
    label,
    value,
    onChange,
    placeholder = "Datum w\u00e4hlen",
}: DateFieldProps) {
    const [open, setOpen] = useState(false);
    const initial = value ? new Date(value) : new Date();
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    const [selected, setSelected] = useState<Date | undefined>(
        value ? startOfDay(new Date(value)) : undefined
    );

    const today = useMemo(() => startOfDay(new Date()), []);

    const openPicker = () => {
        const base = value ? new Date(value) : new Date();
        setViewYear(base.getFullYear());
        setViewMonth(base.getMonth());
        setSelected(value ? startOfDay(new Date(value)) : undefined);
        setOpen(true);
    };

    // Kalenderzellen aufbauen (Montag als Wochenstart).
    const cells = useMemo(() => {
        const firstOfMonth = new Date(viewYear, viewMonth, 1);
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        // JS: 0=So..6=Sa -> in Mo-basierten Index umrechnen.
        const jsWeekday = firstOfMonth.getDay();
        const leading = (jsWeekday + 6) % 7;
        const result: Array<Date | null> = [];
        for (let i = 0; i < leading; i++) result.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            result.push(new Date(viewYear, viewMonth, d));
        }
        while (result.length % 7 !== 0) result.push(null);
        return result;
    }, [viewYear, viewMonth]);

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const confirm = () => {
        if (selected) onChange(selected.getTime());
        setOpen(false);
    };

    return (
        <View style={styles.wrapper}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <Pressable style={styles.field} onPress={openPicker}>
                <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.textSecondary}
                />
                <Text
                    style={[
                        styles.value,
                        value === undefined && styles.placeholder,
                    ]}
                >
                    {value !== undefined ? formatDate(value) : placeholder}
                </Text>
                {value !== undefined ? (
                    <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={colors.textSecondary}
                        />
                    </Pressable>
                ) : null}
            </Pressable>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setOpen(false)}
                >
                    <Pressable style={styles.modalCard}>
                        {/* Kopf: Monatsnavigation */}
                        <View style={styles.calHeader}>
                            <Pressable
                                onPress={goPrevMonth}
                                hitSlop={8}
                                style={styles.navBtn}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={22}
                                    color={colors.textPrimary}
                                />
                            </Pressable>
                            <Text style={styles.calTitle}>
                                {MONTHS[viewMonth]} {viewYear}
                            </Text>
                            <Pressable
                                onPress={goNextMonth}
                                hitSlop={8}
                                style={styles.navBtn}
                            >
                                <Ionicons
                                    name="chevron-forward"
                                    size={22}
                                    color={colors.textPrimary}
                                />
                            </Pressable>
                        </View>

                        {/* Wochentage */}
                        <View style={styles.weekRow}>
                            {WEEKDAYS.map((w) => (
                                <View key={w} style={styles.weekCell}>
                                    <Text style={styles.weekLabel}>{w}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Tage */}
                        <View style={styles.grid}>
                            {cells.map((cell, idx) => {
                                if (!cell) {
                                    return (
                                        <View
                                            key={`empty-${idx}`}
                                            style={styles.dayCell}
                                        />
                                    );
                                }
                                const isSelected =
                                    selected && isSameDay(cell, selected);
                                const isToday = isSameDay(cell, today);
                                return (
                                    <Pressable
                                        key={cell.getTime()}
                                        style={styles.dayCell}
                                        onPress={() => setSelected(cell)}
                                    >
                                        <View
                                            style={[
                                                styles.dayInner,
                                                isSelected &&
                                                    styles.dayInnerSelected,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    isToday &&
                                                        !isSelected &&
                                                        styles.dayTextToday,
                                                    isSelected &&
                                                        styles.dayTextSelected,
                                                ]}
                                            >
                                                {cell.getDate()}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        <View style={styles.modalActions}>
                            <Button
                                title="Fertig"
                                onPress={confirm}
                                disabled={!selected}
                            />
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { gap: spacing.xs },
    label: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    field: {
        minHeight: layout.minTouchTarget,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        borderCurve: "continuous",
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        backgroundColor: colors.surface,
    },
    value: {
        flex: 1,
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.textPrimary,
    },
    placeholder: {
        color: colors.textSecondary,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        paddingHorizontal: spacing.xl,
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderCurve: "continuous",
        padding: spacing.lg,
        gap: spacing.md,
    },
    calHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    navBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    calTitle: {
        fontFamily: fonts.semibold,
        fontSize: 17,
        color: colors.textPrimary,
    },
    weekRow: {
        flexDirection: "row",
    },
    weekCell: {
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.xs,
    },
    weekLabel: {
        fontFamily: fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
    },
    dayInner: {
        width: "100%",
        height: "100%",
        maxWidth: 40,
        maxHeight: 40,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    dayInnerSelected: {
        backgroundColor: colors.textPrimary,
    },
    dayText: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.textPrimary,
    },
    dayTextToday: {
        fontFamily: fonts.semibold,
        color: colors.statusGreen,
    },
    dayTextSelected: {
        color: colors.surface,
        fontFamily: fonts.semibold,
    },
    modalActions: {
        marginTop: spacing.sm,
    },
});
