import { createFileRoute } from "@tanstack/react-router";
import { isProviderId } from "@/lib/llm/providers.server";
import { runTranslate, type TranslateRequest } from "@/lib/translate/translate.server";

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ kind: "error", message: "Invalid request." }, { status: 400 });
        }

        const record = body && typeof body === "object" ? (body as TranslateRequest) : null;
        if (!record) {
          return Response.json({ kind: "error", message: "Invalid request." }, { status: 400 });
        }
        if (record.provider !== undefined && !isProviderId(record.provider)) {
          return Response.json(
            { kind: "error", message: "Unknown language-model provider." },
            { status: 400 },
          );
        }

        const result = await runTranslate(record);
        const status = result.kind === "error" && result.message.includes("unavailable") ? 503 : 200;
        return Response.json(result, {
          status: result.kind === "error" && result.message.startsWith("Please check") ? 400 : status,
          headers: { "Cache-Control": "no-store" },
        });
      },
    },
  },
});
