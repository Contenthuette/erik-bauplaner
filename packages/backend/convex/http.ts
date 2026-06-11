import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// Stripe-Webhook: empfängt Abo-Events und synchronisiert den Status.
http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const signature = request.headers.get("stripe-signature");
        if (!signature) {
            return new Response("Missing signature", { status: 400 });
        }
        const payload = await request.text();
        const result = await ctx.runAction(internal.stripe.handleWebhook, {
            signature,
            payload,
        });
        return new Response(null, { status: result.success ? 200 : 400 });
    }),
});

// Stripe-Return: leitet nach Checkout zurück in die App (Deep-Link).
http.route({
    path: "/stripe/return",
    method: "GET",
    handler: httpAction(async (_ctx, request) => {
        const url = new URL(request.url);
        const to = url.searchParams.get("to") ?? "polier://";
        // Kleine HTML-Seite, die zum Deep-Link weiterleitet (zuverlässiger als
        // ein 302 auf ein custom scheme in In-App-Browsern).
        const safe = to.replace(/"/g, "&quot;");
        const html = `<!doctype html><html><head><meta charset="utf-8">` +
            `<meta http-equiv="refresh" content="0;url=${safe}">` +
            `<script>window.location.replace("${safe}");</script></head>` +
            `<body>Weiterleitung…</body></html>`;
        return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }),
});

export default http;
