import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { internal } from "../_generated/api";
import { DataModel, Id } from "../_generated/dataModel";

/**
 * Passwortloser Kundenzugang per Zugangscode.
 *
 * Der Betrieb erzeugt pro Kunde einen Code (Tabelle accessCodes). Der Kunde
 * meldet sich damit an — ohne Passwort. Es wird KEIN zweites Auth-System
 * gebaut: Dieser Provider nutzt dieselbe Convex-Auth-Session-Infrastruktur
 * wie der Passwort-Login und gibt lediglich die userId des Kunden zurück.
 *
 * Aufruf vom Client:
 *   signIn("accesscode", { code: "ABC123" })
 */
export const AccessCode = ConvexCredentials<DataModel>({
    id: "accesscode",
    authorize: async (
        credentials,
        ctx
    ): Promise<{ userId: Id<"users"> } | null> => {
        const raw = (credentials.code as string | undefined) ?? "";
        const code = raw.trim().toUpperCase().replace(/\s|-/g, "");
        if (!code) {
            throw new Error("Kein Zugangscode angegeben.");
        }

        const customerId: Id<"users"> | null = await ctx.runMutation(
            internal.accessCodes._redeemCode,
            { code }
        );
        if (!customerId) {
            throw new Error("Ungültiger oder deaktivierter Zugangscode.");
        }

        return { userId: customerId };
    },
});
