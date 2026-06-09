import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "../_generated/dataModel";
import { ResendOTPPasswordReset } from "./ResendOTPPasswordReset";

/**
 * Custom Password Provider für Polier.
 *
 * Beim Signup werden zusätzliche Felder übergeben:
 * - rolle:   immer "owner" (nur Betriebe dürfen sich selbst registrieren)
 * - pendingCompanyName: Firmenname, aus dem in afterUserCreatedOrUpdated
 *   die Company erzeugt wird.
 * - name:    Name des Inhabers
 *
 * Passwort-Reset läuft über einen OTP-Code per E-Mail (Resend).
 */
export const PolierPassword = Password<DataModel>({
    profile(params) {
        return {
            email: params.email as string,
            name: (params.name as string) ?? undefined,
            rolle: (params.rolle as "owner" | "mitarbeiter" | "kunde") ?? "owner",
            pendingCompanyName:
                (params.pendingCompanyName as string) ?? undefined,
        };
    },
    reset: ResendOTPPasswordReset,
});
