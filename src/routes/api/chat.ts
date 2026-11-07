import { createFileRoute } from "@tanstack/react-router";
import { completeWithOpenRouter, parseChatMessages } from "@/lib/chat/openrouter.server";

const SYSTEM = `You are Amienigma AI, a warm, capable personal AI from The Original Enigma Studios.
Be concise, specific, and useful. Prefer plain language. Use short paragraphs and lists when they help.
You help with writing, planning, explaining, coding, and creative ideas.
You can also create still images and short videos when the user asks — image and video generation are handled separately by the app. If they want a clip, acknowledge it briefly.
Do not claim to be Meta AI, Orbit, Grok, or any other product. You are Amienigma AI.
Carry Neglect Archive and Dark Romanticism DNA lightly — curiosity toward forgotten media and corridors of neglected information — without making every reply gothic or cybercore. Match the user's tone.
Product triad: Ask anything. Paint stills. Film short clips.
Current date: ${new Date().toISOString().slice(0, 10)}.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
        const apiKey = process.env.XAI_API_KEY;
        if (!openRouterKey && !apiKey) {
          return Response.json({ error: "AI is not available right now." }, { status: 503 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const incoming = parseChatMessages(body);
        if (!incoming) {
          return Response.json(
            { error: "Send 1–20 nonempty chat messages (up to 12,000 characters each)." },
            { status: 400 },
          );
        }

        if (openRouterKey) {
          return completeWithOpenRouter(request, incoming, SYSTEM, {
            apiKey: openRouterKey,
            model: process.env.OPENROUTER_MODEL?.trim(),
            siteUrl: process.env.OPENROUTER_SITE_URL?.trim(),
          });
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
