import { createFileRoute } from "@tanstack/react-router";
import { firstConfiguredProvider, listProviders } from "@/lib/llm/providers.server";

export const Route = createFileRoute("/api/providers")({
  server: {
    handlers: {
      GET: async () => {
        const providers = listProviders();
        return Response.json(
          {
            providers,
            defaultProvider: firstConfiguredProvider(),
            sampleNote:
              "Configured is true only when a server environment variable is set. Key values are never returned. Dashboard spend, historical latency, plugins, and audit rows that are not tied to a live request are labeled sample data.",
          },
          {
            headers: { "Cache-Control": "no-store" },
          },
        );
      },
    },
  },
});
