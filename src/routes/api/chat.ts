import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are Amienigma AI, a warm, capable personal AI assistant.
Be concise, specific, and useful. Prefer plain language. Use short paragraphs and lists when they help.
You can help with writing, planning, explaining, coding, and creative ideas.
You can also create still images and short videos when the user asks — image and video generation are handled separately by the app. If they want a clip, acknowledge it briefly.
Do not claim to be Meta AI or Orbit. You are Amienigma AI.
Current date: ${new Date().toISOString().slice(0, 10)}.`;

type Incoming = {
  role: "user" | "assistant";
  content: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI is not available right now." }, { status: 503 });
        }

        let body: { messages?: Incoming[] };
        try {
          body = (await request.json()) as { messages?: Incoming[] };
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const incoming = (body.messages ?? []).slice(-20).filter(
          (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
        );
        if (incoming.length === 0) {
          return Response.json({ error: "Say something first." }, { status: 400 });
        }

        const res = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-4.5",
            stream: true,
            max_tokens: 1800,
            temperature: 0.7,
            messages: [{ role: "system", content: SYSTEM }, ...incoming],
          }),
          signal: request.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          const msg =
            res.status === 429
              ? "Amienigma is busy. Try again in a moment."
              : errText.slice(0, 200) || `Could not reach Amienigma (${res.status}).`;
          return Response.json({ error: msg }, { status: 502 });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = res.body!.getReader();
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const token = json.choices?.[0]?.delta?.content;
                    if (token) controller.enqueue(encoder.encode(token));
                  } catch {
                    /* ignore partial JSON */
                  }
                }
              }
            } catch (err) {
              if ((err as { name?: string }).name !== "AbortError") {
                controller.error(err);
                return;
              }
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
