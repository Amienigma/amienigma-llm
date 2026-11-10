import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTextAttachment, resolveTranslateText } from "./attachments.ts";
import { normalizeTranslateInput, runTranslate, type CompleteFn } from "./translate.server.ts";

const base = {
  senderStyle: "NOT_SURE" as const,
  receiverStyle: "NOT_SURE" as const,
  channel: "TEXT_MESSAGE" as const,
  locale: "US" as const,
  safetyAcknowledged: false,
};

test("normalizes pasted text and attachment contents", () => {
  assert.deepEqual(
    normalizeTranslateInput({ ...base, rawInput: "ab" }),
    {
      rawInput: "ab",
      senderStyle: "NOT_SURE",
      receiverStyle: "NOT_SURE",
      channel: "TEXT_MESSAGE",
      locale: "US",
      safetyAcknowledged: false,
      provider: undefined,
      attachment: null,
    },
  );
  const fromFile = normalizeTranslateInput({
    ...base,
    rawInput: "  ",
    attachment: { filename: "draft.txt", content: "You never text me back." },
  });
  assert.equal("error" in fromFile, false);
  if (!("error" in fromFile)) {
    assert.equal(fromFile.rawInput, "You never text me back.");
    assert.equal(fromFile.attachment?.filename, "draft.txt");
  }
  assert.equal("error" in normalizeTranslateInput({ ...base, rawInput: "x" }), true);
  assert.equal("error" in normalizeTranslateInput({ ...base, rawInput: "ok", senderStyle: "NOPE" as never }), true);
});

test("rejects unsupported or oversized attachments", () => {
  assert.deepEqual(parseTextAttachment({ filename: "notes.pdf", content: "hi" }), {
    error: "Upload a .txt, .md, .json, or .csv file. PDF and Word files are not supported yet.",
  });
  assert.equal(parseTextAttachment({ filename: "../secret.txt", content: "hi" }) && "error" in parseTextAttachment({ filename: "../secret.txt", content: "hi" })!, true);
  assert.equal(
    parseTextAttachment({ filename: "ok.md", content: "x".repeat(12_001) }) &&
      "error" in parseTextAttachment({ filename: "ok.md", content: "x".repeat(12_001) })!,
    true,
  );
  assert.deepEqual(parseTextAttachment({ filename: "ok.csv", content: "a,b\n1,2" }), {
    filename: "ok.csv",
    content: "a,b\n1,2",
  });
  assert.equal(resolveTranslateText(" pasted ", { filename: "a.txt", content: "file" }), "pasted");
  assert.equal(resolveTranslateText("  ", { filename: "a.txt", content: "file" }), "file");
});

test("returns a structured translation when both model calls succeed", async () => {
  const complete: CompleteFn = async (system) => {
    if (system.includes("relational safety evaluator")) {
      return {
        text: '{"risk_category":"STANDARD_RELATIONAL_TENSION","flags_detected":["NONE"]}',
      };
    }
    return {
      text: '{"refused":false,"deconstruction":{"sender_core_need":"to be considered"},"draft_suggestions":{"possible_way_to_say_it":"When I do not hear back, I feel unimportant.","alternative_short":"I miss hearing from you."},"communication_notes":{"clarity_and_honesty":"Names the feeling."},"sender_reflection":"You asked to be seen."}',
    };
  };
  const result = await runTranslate(
    { ...base, rawInput: "You never text me back and it makes me feel like I don't matter." },
    { complete, skipRateLimit: true },
  );
  assert.equal(result.kind, "ok");
  if (result.kind === "ok") {
    assert.equal(result.translation.draftSuggestions.possibleWayToSayIt.includes("hear back"), true);
  }
});

test("surfaces a clear error when no model is configured", async () => {
  const complete: CompleteFn = async () => ({ fail: 503 });
  const result = await runTranslate({ ...base, rawInput: "Please reply when you can." }, {
    complete,
    skipRateLimit: true,
  });
  assert.deepEqual(result, { kind: "error", message: "Suggestions are temporarily unavailable." });
});
