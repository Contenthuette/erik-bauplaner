import React from "react";
import {
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    View,
    Platform,
    PressableProps,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radius, fonts, layout } from "../../lib/theme";

interface ButtonProps extends Omit<PressableProps, "style"> {
    title: string;
    onPress?: () => void;
    variant?: "primary" | "secondary";
    loading?: boolean;
    disabled?: boolean;
}

export function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    ...rest
}: ButtonProps) {
    const isPrimary = variant === "primary";
    const isDisabled = disabled || loading;

    const handlePress = () => {
        if (isDisabled) return;
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                isPrimary ? styles.primary : styles.secondary,
                pressed && !isDisabled && styles.pressed,
                isDisabled && styles.disabled,
            ]}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator
                    color={isPrimary ? colors.buttonPrimaryText : colors.buttonSecondaryText}
                />
            ) : (
                <View style={styles.content}>
                    <Text
                        style={[
                            styles.label,
                            isPrimary ? styles.labelPrimary : styles.labelSecondary,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: layout.minTouchTarget,
        borderRadius: radius.button,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    primary: {
        backgroundColor: colors.buttonPrimaryBg,
    },
    secondary: {
        backgroundColor: colors.buttonSecondaryBg,
        borderWidth: 1,
        borderColor: colors.buttonSecondaryBorder,
    },
    pressed: {
        opacity: 0.8,
    },
    disabled: {
        opacity: 0.4,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    label: {
        fontFamily: fonts.semibold,
        fontSize: 17,
    },
    labelPrimary: {
        color: colors.buttonPrimaryText,
    },
    labelSecondary: {
        color: colors.buttonSecondaryText,
    },
});
