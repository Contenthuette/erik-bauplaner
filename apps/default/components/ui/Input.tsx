import React from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
} from "react-native";
import { colors, radius, fonts, spacing, layout } from "../../lib/theme";

interface InputProps extends TextInputProps {
    label?: string;
}

export function Input({ label, style, ...rest }: InputProps) {
    return (
        <View style={styles.wrapper}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TextInput
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, style]}
                {...rest}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.xs,
    },
    label: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    input: {
        minHeight: layout.minTouchTarget,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        borderCurve: "continuous",
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
    },
});
