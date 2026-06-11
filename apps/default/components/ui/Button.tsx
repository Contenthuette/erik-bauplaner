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
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, radius, fonts, layout } from "../../lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        if (isDisabled) return;
        scale.value = withTiming(0.97, { duration: 120, easing: Easing.out(Easing.quad) });
        opacity.value = withTiming(0.9, { duration: 120 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        opacity.value = withTiming(1, { duration: 160 });
    };

    const handlePress = () => {
        if (isDisabled) return;
        if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
    };

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isDisabled}
            style={[
                styles.base,
                isPrimary ? styles.primary : styles.secondary,
                isDisabled && styles.disabled,
                animatedStyle,
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
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: layout.buttonHeight,
        borderRadius: radius.button,
        borderCurve: "continuous",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    primary: {
        backgroundColor: colors.buttonPrimaryBg,
    },
    secondary: {
        backgroundColor: colors.buttonSecondaryBg,
        borderWidth: 1,
        borderColor: colors.border,
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
        textAlign: "center",
    },
    labelPrimary: {
        color: colors.buttonPrimaryText,
    },
    labelSecondary: {
        color: colors.buttonSecondaryText,
    },
});
