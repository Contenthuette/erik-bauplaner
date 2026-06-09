import Resend from "@auth/core/providers/resend";

function generateOTP(length: number): string {
    const digits = "0123456789";
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let result = "";
    for (let i = 0; i < length; i++) {
        result += digits[bytes[i] % 10];
    }
    return result;
}

/**
 * Passwort-Reset per 8-stelligem OTP-Code via Resend (HTTP-API, kein SDK).
 */
export const ResendOTPPasswordReset = Resend({
    id: "resend-otp-password-reset",
    apiKey: process.env.AUTH_RESEND_KEY,
    async generateVerificationToken() {
        return generateOTP(8);
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
        if (!provider.apiKey) {
            throw new Error(
                "AUTH_RESEND_KEY ist nicht gesetzt — Passwort-Reset nicht verfügbar."
            );
        }
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${provider.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Polier <onboarding@resend.dev>",
                to: [email],
                subject: "Polier — Passwort zurücksetzen",
                text: `Dein Code zum Zurücksetzen des Passworts lautet: ${token}\n\nDieser Code ist 15 Minuten gültig.`,
            }),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error("E-Mail konnte nicht gesendet werden: " + body);
        }
    },
});
