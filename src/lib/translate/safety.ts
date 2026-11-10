export const TENDENCIES = [
  "ANXIOUS_PATTERNS",
  "AVOIDANT_PATTERNS",
  "FEARFUL_AVOIDANT_PATTERNS",
  "SECURE_PATTERNS",
  "NOT_SURE",
] as const;

export type Tendency = (typeof TENDENCIES)[number];

export const CHANNELS = ["TEXT_MESSAGE", "IN_PERSON", "PHONE_CALL", "EMAIL"] as const;

export type Channel = (typeof CHANNELS)[number];

export const LOCALES = ["US", "GB", "CA", "AU", "INTL"] as const;

export type Locale = (typeof LOCALES)[number];

export const RISKS = [
  "STANDARD_RELATIONAL_TENSION",
  "COERCIVE_CONTROL_RECEIVER_THREAT",
  "SENDER_IS_THE_THREAT",
  "SELF_HARM",
  "THIRD_PARTY_DANGER",
  "CHECK_UNAVAILABLE",
] as const;

export type RiskCategory = (typeof RISKS)[number];

export const FLAGS = [
  "INTIMIDATION",
  "PHYSICAL_THREAT",
  "COERCIVE_CONTROL",
  "STALKING",
  "SELF_HARM_IDEATION",
  "HARASSMENT",
  "THIRD_PARTY",
  "CLASSIFICATION_ERROR",
  "NONE",
] as const;

export type Flag = (typeof FLAGS)[number];

export type CrisisResource = {
  name: string;
  contactInfo: string;
  link: string;
};

export type TranslateInput = {
  rawInput: string;
  senderStyle: Tendency;
  receiverStyle: Tendency;
  channel: Channel;
  locale: Locale;
  safetyAcknowledged: boolean;
};

export type Translation = {
  deconstruction: {
    senderCoreNeed: string;
    possibleReceiverSensitivity: string;
  };
  draftSuggestions: {
    possibleWayToSayIt: string;
    alternativeShort: string;
  };
  communicationNotes: {
    clarityAndHonesty: string;
    howItEasesDefensiveness: string;
  };
  senderReflection: string;
};

export type TranslateResult =
  | {
      kind: "ok";
      riskCategory: RiskCategory;
      translation: Translation;
      crisisResources: CrisisResource[];
    }
  | {
      kind: "intercept";
      riskCategory: RiskCategory;
      hardBlock: boolean;
      guidance: string;
      crisisResources: CrisisResource[];
    }
  | { kind: "retry"; guidance: string }
  | { kind: "error"; message: string };

const GLOBAL: CrisisResource = {
  name: "Find A Helpline (international directory)",
  contactInfo: "Free, confidential support lines by country",
  link: "https://findahelpline.com/",
};

const RESOURCES: Record<Exclude<Locale, "INTL">, CrisisResource[]> = {
  US: [
    {
      name: "National Domestic Violence Hotline",
      contactInfo: "1-800-799-7233, or text START to 88788",
      link: "https://www.thehotline.org/",
    },
    {
      name: "988 Suicide & Crisis Lifeline",
      contactInfo: "Call or text 988",
      link: "https://988lifeline.org/",
    },
  ],
  GB: [
    {
      name: "National Domestic Abuse Helpline",
      contactInfo: "0808 2000 247",
      link: "https://www.nationaldahelpline.org.uk/",
    },
    {
      name: "Samaritans",
      contactInfo: "116 123",
      link: "https://www.samaritans.org/",
    },
  ],
  CA: [
    {
      name: "ShelterSafe",
      contactInfo: "Find a shelter near you",
      link: "https://www.sheltersafe.ca/",
    },
    {
      name: "9-8-8 Suicide Crisis Helpline",
      contactInfo: "Call or text 988",
      link: "https://988.ca/",
    },
  ],
  AU: [
    {
      name: "1800RESPECT",
      contactInfo: "1800 737 732",
      link: "https://www.1800respect.org.au/",
    },
    {
      name: "Lifeline Australia",
      contactInfo: "13 11 14",
      link: "https://www.lifeline.org.au/",
    },
  ],
};

export const COPY = {
  retry: "We couldn't complete our safety check just now. Please try again in a moment.",
  hard: "This tool can't reword messages that contain threats, intimidation or harassment. If you're feeling overwhelmed or angry, it can help to pause before sending anything.",
  soft: {
    SELF_HARM:
      "It sounds like you, or someone close to you, may be going through something very painful. You don't have to handle it alone. A confidential support line can help right now.",
    COERCIVE_CONTROL_RECEIVER_THREAT:
      "What you describe may involve fear of how someone will react or a lot of control over you. Rewording a message may not make that situation safer. A trained advocate can help you think through options, and the resources below are confidential.",
    THIRD_PARTY_DANGER:
      "It sounds like someone may be in a difficult or unsafe situation. A message draft usually isn't the right tool for that. These services can advise you on how to support them.",
  },
} as const;

export function resourcesFor(locale: Locale): CrisisResource[] {
  if (locale === "INTL") return [GLOBAL];
  return [...RESOURCES[locale], GLOBAL];
}

export type Gate = "translate" | "intercept" | "retry";

export function gate(category: RiskCategory, acknowledged: boolean): Gate {
  if (category === "CHECK_UNAVAILABLE") return "retry";
  if (category === "SENDER_IS_THE_THREAT") return "intercept";
  if (category !== "STANDARD_RELATIONAL_TENSION" && !acknowledged) return "intercept";
  return "translate";
}

export function interceptFor(category: RiskCategory, locale: Locale): TranslateResult {
  if (category === "CHECK_UNAVAILABLE") {
    return { kind: "retry", guidance: COPY.retry };
  }
  if (category === "SENDER_IS_THE_THREAT") {
    return {
      kind: "intercept",
      riskCategory: category,
      hardBlock: true,
      guidance: COPY.hard,
      crisisResources: [],
    };
  }
  const guidance = COPY.soft[category as keyof typeof COPY.soft];
  if (!guidance) {
    return {
      kind: "intercept",
      riskCategory: "SENDER_IS_THE_THREAT",
      hardBlock: true,
      guidance: COPY.hard,
      crisisResources: [],
    };
  }
  return {
    kind: "intercept",
    riskCategory: category,
    hardBlock: false,
    guidance,
    crisisResources: resourcesFor(locale),
  };
}

export function wrapUntrusted(text: string, token: string): { tag: string; wrapped: string } {
  const cleaned = text.replace(/<\s*\/?\s*user_input[^>]*>/gi, "");
  const tag = `user_input_${token}`;
  return { tag, wrapped: `<${tag}>\n${cleaned}\n</${tag}>` };
}

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(trimmed);
  const body = fenced?.[1] ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return body;
  return body.slice(start, end + 1);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown, max = 900): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function cleanSensitivity(value: string): string {
  const stripped = value.replace(/^(?:they\s+)?may be sensitive to\s+/i, "").trim();
  if (!stripped) return "";
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function isRisk(value: string): value is RiskCategory {
  return (RISKS as readonly string[]).includes(value);
}

function isFlag(value: string): value is Flag {
  return (FLAGS as readonly string[]).includes(value);
}

export function parseAssessment(raw: string): { riskCategory: RiskCategory; flags: Flag[] } | null {
  try {
    const data = asRecord(JSON.parse(extractJson(raw)));
    if (!data) return null;
    const category = str(data.risk_category ?? data.riskCategory, 80).toUpperCase();
    if (!isRisk(category)) return null;
    const rawFlags = Array.isArray(data.flags_detected)
      ? data.flags_detected
      : Array.isArray(data.flagsDetected)
        ? data.flagsDetected
        : [];
    const flags: Flag[] = [];
    for (const item of rawFlags) {
      const flag = str(item, 40).toUpperCase();
      if (isFlag(flag) && flag !== "CLASSIFICATION_ERROR") flags.push(flag);
    }
    return { riskCategory: category, flags: flags.length ? flags : ["NONE"] };
  } catch {
    return null;
  }
}

const SELF_HARM_BACKSTOP =
  /\b(suicid\w*|kill myself|killing myself|end my life|want to die|wanna die|self[-\s]?harm|hurt myself)\b/i;

export function selfHarmBackstop(text: string): boolean {
  return SELF_HARM_BACKSTOP.test(text);
}

export function parseTranslation(raw: string): Translation | "refused" | null {
  try {
    const data = asRecord(JSON.parse(extractJson(raw)));
    if (!data) return null;
    if (data.refused === true || data.refused === "true") return "refused";
    const deconstruction = asRecord(data.deconstruction) ?? {};
    const drafts = asRecord(data.draft_suggestions ?? data.draftSuggestions) ?? {};
    const notes = asRecord(data.communication_notes ?? data.communicationNotes) ?? {};
    const possible = str(
      drafts.possible_way_to_say_it ?? drafts.possibleWayToSayIt,
      1500,
    );
    if (!possible) return null;
    return {
      deconstruction: {
        senderCoreNeed: str(deconstruction.sender_core_need ?? deconstruction.senderCoreNeed),
        possibleReceiverSensitivity: cleanSensitivity(
          str(
            deconstruction.possible_receiver_sensitivity ??
              deconstruction.possibleReceiverSensitivity,
          ),
        ),
      },
      draftSuggestions: {
        possibleWayToSayIt: possible,
        alternativeShort: str(drafts.alternative_short ?? drafts.alternativeShort, 500),
      },
      communicationNotes: {
        clarityAndHonesty: str(notes.clarity_and_honesty ?? notes.clarityAndHonesty),
        howItEasesDefensiveness: str(
          notes.how_it_eases_defensiveness ?? notes.howItEasesDefensiveness,
        ),
      },
      senderReflection: str(data.sender_reflection ?? data.senderReflection),
    };
  } catch {
    return null;
  }
}
