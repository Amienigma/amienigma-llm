import { createFileRoute } from "@tanstack/react-router";
import { ratioHint } from "@/lib/chat/image-intent";

export const Route = createFileRoute("/api/imagine")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "Image generation is not available." }, { status: 503 });
        }

        let body: { prompt?: string; ratio?: string };
        try {
          body = (await request.json()) as { prompt?: string; ratio?: string };
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const prompt = (body.prompt ?? "").trim().slice(0, 1500);
        if (prompt.length < 3) {
          return Response.json({ error: "Describe the image you want." }, { status: 400 });
        }

        const fullPrompt = `${prompt}. ${ratioHint(body.ratio ?? "1:1")} No watermarks, no text overlays.`;

        const res = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "grok-imagine-image",
            prompt: fullPrompt,
            n: 1,
            resolution: "1k",
            response_format: "url",
          }),
          signal: request.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const msg =
            res.status === 429
              ? "Image generation is busy. Try again shortly."
              : errText.slice(0, 220) || `Could not create the image (${res.status}).`;
          return Response.json({ error: msg }, { status: 502 });
        }

        const json = (await res.json()) as { data?: { url?: string }[] };
        const url = json.data?.[0]?.url;
        if (!url) {
          return Response.json({ error: "No image came back. Try a different prompt." }, { status: 502 });
        }
        return Response.json({ url });
      },
    },
  },
});
