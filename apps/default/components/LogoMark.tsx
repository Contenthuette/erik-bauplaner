import React from "react";
import { Image } from "expo-image";

const polierLogo = require("../../../assets/images/polier-icon.png");

interface LogoMarkProps {
    size?: number;
}

/**
 * Polier-Bildmarke (Logo-Icon). Wird zentriert auf Auth-Seiten genutzt.
 */
export function LogoMark({ size = 64 }: LogoMarkProps) {
    return (
        <Image
            source={polierLogo}
            style={{ width: size, height: size }}
            contentFit="contain"
        />
    );
}
