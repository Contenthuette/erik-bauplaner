import React, { useState } from "react";
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

export function Input({ label, style, onFocus, onBlur, ...rest }: InputProps) {
    const [focused, setFocused] = useState(false);
    return (
        <View style={styles.wrapper}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TextInput
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, focused && styles.inputFocused, style]}
                onFocus={(e) => {
                    setFocused(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    onBlur?.(e);
                }}
                {...rest}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: spacing.sm,
    },
    label: {
        fontFamily: fonts.medium,
        fontSize: 15,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    input: {
        minHeight: layout.minTouchTarget + 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        borderCurve: "continuous",
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        fontFamily: fonts.regular,
        fontSize: 17,
        color: colors.textPrimary,
        backgroundColor: colors.surfaceMuted,
    },
    inputFocused: {
        borderColor: colors.textPrimary,
        backgroundColor: colors.surface,
    },
});
