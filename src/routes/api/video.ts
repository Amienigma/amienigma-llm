import { createFileRoute } from "@tanstack/react-router";

const DURATIONS = new Set([6, 10]);
const RATIOS = new Set(["16:9", "9:16", "1:1"]);

export const Route = createFileRoute("/api/video")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "Video generation is not available." }, { status: 503 });
        }

        let body: {
          prompt?: string;
          duration?: number;
          ratio?: string;
          imageUrl?: string;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const prompt = (body.prompt ?? "").trim().slice(0, 1500);
        if (prompt.length < 3) {
          return Response.json({ error: "Describe the video you want." }, { status: 400 });
        }

        const duration = DURATIONS.has(body.duration ?? 6) ? (body.duration ?? 6) : 6;
        const aspect_ratio = RATIOS.has(body.ratio ?? "16:9") ? (body.ratio ?? "16:9") : "16:9";
        const imageUrl =
          typeof body.imageUrl === "string" && /^https?:\/\//i.test(body.imageUrl)
            ? body.imageUrl
            : undefined;

        const payload: Record<string, unknown> = {
          model: "grok-imagine-video-1.5",
          prompt,
          duration,
          aspect_ratio,
          resolution: "720p",
        };
        if (imageUrl) payload.image = { url: imageUrl };

        const res = await fetch("https://api.x.ai/v1/videos/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: request.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const msg =
            res.status === 429
              ? "Video generation is busy. Try again shortly."
              : errText.slice(0, 220) || `Could not start the video (${res.status}).`;
          return Response.json({ error: msg }, { status: 502 });
        }

        const json = (await res.json()) as { request_id?: string; requestId?: string; id?: string };
        const requestId = json.request_id ?? json.requestId ?? json.id;
        if (!requestId) {
          return Response.json({ error: "No request id came back. Try again." }, { status: 502 });
        }
        return Response.json({ requestId });
      },

      GET: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "Video generation is not available." }, { status: 503 });
        }

        const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
        if (!id || !/^[\w.-]{8,80}$/.test(id)) {
          return Response.json({ error: "Missing video request." }, { status: 400 });
        }

        const res = await fetch(`https://api.x.ai/v1/videos/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: request.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          return Response.json(
            { error: errText.slice(0, 220) || `Could not check the video (${res.status}).` },
            { status: 502 },
          );
        }

        const json = (await res.json()) as {
          status?: string;
          progress?: number;
          error?: string;
          video?: { url?: string };
          video_url?: string;
        };

        const url = json.video?.url ?? json.video_url;
        const status = (json.status ?? "pending").toLowerCase();

        if ((status === "done" || status === "succeeded") && url) {
          return Response.json({ status: "done", url, progress: 100 });
        }
        if (status === "failed" || status === "expired") {
          return Response.json(
            { status, error: json.error ?? "Video generation failed." },
            { status: 502 },
          );
        }

        return Response.json({
          status: status || "pending",
          progress: json.progress ?? 0,
        });
      },
    },
  },
});
