import { createFileRoute } from "@tanstack/react-router";
import { completeWithProvider, parseConsoleRequest } from "@/lib/llm/providers.server";

const SYSTEM = `You are Amienigma AI responding through the PINKROOT request console.
Be concise and specific. Do not claim to be another product. Never reveal API keys or environment values.`;

export const Route = createFileRoute("/api/console")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const parsed = parseConsoleRequest(body);
        if (!parsed) {
          return Response.json(
            {
              error:
                "Send a configured provider (optional), a safe model id (optional), and 1–20 nonempty user/assistant messages (up to 12,000 characters each).",
            },
            { status: 400 },
          );
        }

        const started = Date.now();
        const result = await completeWithProvider({
          provider: parsed.provider,
          model: parsed.model,
          messages: [{ role: "system", content: SYSTEM }, ...parsed.messages],
          signal: request.signal,
        });
        if (!result.ok) {
          return Response.json({ error: result.error }, { status: result.status });
        }
        return Response.json(
          {
            content: result.text,
            provider: result.provider,
            model: result.model,
            latencyMs: Date.now() - started,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
