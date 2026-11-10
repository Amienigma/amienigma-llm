import { createFileRoute } from "@tanstack/react-router";
import { StudioChrome } from "@/components/studio-nav";
import { Translator } from "@/components/translator/translator";

export const Route = createFileRoute("/translator")({
  component: TranslatorPage,
  head: () => ({
    meta: [
      { title: "Attachment Translator · Amienigma AI" },
      {
        name: "description",
        content: "Reword a hard message with the Amienigma attachment translator.",
      },
    ],
  }),
});

function TranslatorPage() {
  return (
    <StudioChrome>
      <Translator />
    </StudioChrome>
  );
}
