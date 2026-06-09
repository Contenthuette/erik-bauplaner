import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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

/**
 * Datumsfeld mit nativem Picker. Auf Web wird ein einfaches <input type=date>
 * über DateTimePicker nicht unterstützt — dort nutzen wir den Picker inline.
 */
export function DateField({
    label,
    value,
    onChange,
    placeholder = "Datum wählen",
}: DateFieldProps) {
    const [open, setOpen] = useState(false);
    const [temp, setTemp] = useState<Date>(value ? new Date(value) : new Date());

    const showPicker = () => {
        setTemp(value ? new Date(value) : new Date());
        setOpen(true);
    };

    return (
        <View style={styles.wrapper}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <Pressable style={styles.field} onPress={showPicker}>
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

            {open && Platform.OS === "android" ? (
                <DateTimePicker
                    value={temp}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setOpen(false);
                        if (event.type === "set" && date) {
                            onChange(date.getTime());
                        }
                    }}
                />
            ) : null}

            {Platform.OS !== "android" ? (
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
                            <DateTimePicker
                                value={temp}
                                mode="date"
                                display={
                                    Platform.OS === "ios" ? "inline" : "default"
                                }
                                onChange={(_e, date) => {
                                    if (date) setTemp(date);
                                }}
                                themeVariant="light"
                            />
                            <View style={styles.modalActions}>
                                <Button
                                    title="Fertig"
                                    onPress={() => {
                                        onChange(temp.getTime());
                                        setOpen(false);
                                    }}
                                />
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            ) : null}
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
    modalActions: {
        marginTop: spacing.sm,
    },
});
