import { cn } from "@/lib/utils";

function inline(text: string) {
  const parts: Array<{ t: "text" | "code" | "bold"; v: string }> = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ t: "text", v: text.slice(last, m.index) });
    const token = m[0];
    if (token.startsWith("`")) parts.push({ t: "code", v: token.slice(1, -1) });
    else parts.push({ t: "bold", v: token.slice(2, -2) });
    last = m.index + token.length;
  }
  if (last < text.length) parts.push({ t: "text", v: text.slice(last) });
  return parts.map((p, i) => {
    if (p.t === "code") {
      return (
        <code key={i} className="rounded-xs bg-bg-subtle px-1 py-0.5 font-mono text-sm">
          {p.v}
        </code>
      );
    }
    if (p.t === "bold") return <strong key={i}>{p.v}</strong>;
    return <span key={i}>{p.v}</span>;
  });
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className={cn("space-y-3 text-pretty leading-normal", className)}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>
              ))}
            </ol>
          );
        }
        if (block.startsWith("```")) {
          const code = block.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-md bg-bg-subtle p-3 font-mono text-sm leading-snug"
            >
              <code>{code}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {lines.map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
