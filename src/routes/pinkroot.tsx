import { createFileRoute } from "@tanstack/react-router";
import { PinkrootApp } from "@/components/pinkroot/pinkroot-app";
import { StudioChrome } from "@/components/studio-nav";

export const Route = createFileRoute("/pinkroot")({
  component: PinkrootPage,
  head: () => ({
    meta: [
      { title: "PINKROOT · Amienigma AI" },
      {
        name: "description",
        content: "PINKROOT provider console inside Amienigma AI.",
      },
    ],
  }),
});

function PinkrootPage() {
  return (
    <StudioChrome>
      <PinkrootApp />
    </StudioChrome>
  );
}
