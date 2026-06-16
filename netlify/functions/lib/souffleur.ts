import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

function client(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Server missing CLAUDE_API_KEY");
  return new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
}

export interface SouffleurRequest {
  lang: "fr" | "en";
  season: string;
  dateLabel: string;
  tone: string;
  existing: string[];
}

export interface GreetingCard {
  text: string;
  note: string;
}
export interface QuoteSuggestion {
  text: string;
  author: string;
  windowLabel: string;
}
export interface SouffleurResult {
  greetings: GreetingCard[];
  quotes: QuoteSuggestion[];
}

const VOICE = `You are le Souffleur of Le Galet — a calm, ambient display propped up in a family's kitchen. Your job is to whisper a few words that make an idle screen feel quietly alive: a short seasonal greeting and a handful of resonant quotes. You have the sensibility of a gentle, well-read host — warm, unhurried, never saccharine, never corporate, allergic to motivational-poster cliché and to anything that sounds like an ad. You write the way a thoughtful grandparent might leave a note on the fridge: plain, true, a little beautiful. When you write in French you write idiomatic Québécois-flavoured French, never translated-from-English; when in English, the same.`;

const TOOL: Anthropic.Tool = {
  name: "deliver_souffle",
  description:
    "Deliver a small set of validated greeting cards and resonant quote suggestions for the ambient family display.",
  input_schema: {
    type: "object",
    required: ["greetings", "quotes"],
    properties: {
      greetings: {
        type: "array",
        minItems: 2,
        maxItems: 4,
        description:
          "Short, warm seasonal/daily greeting cards to drift on the display. One or two calm sentences each — a quiet hello to the household that fits the season and the day. No emoji, no exclamation-mark spam.",
        items: {
          type: "object",
          required: ["text", "note"],
          properties: {
            text: {
              type: "string",
              description: "The greeting itself, as it will appear on screen. 1–2 short sentences.",
            },
            note: {
              type: "string",
              description: "A brief one-line reason it fits this season/day (for the curator, not shown on the display).",
            },
          },
        },
      },
      quotes: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        description:
          "Resonant quotes that suit the season, the day, and the household's tone. Prefer real, correctly-attributed quotes; if you offer an anonymous saying or proverb, set author to an empty string or 'Proverbe'. Never invent a false attribution to a named person.",
        items: {
          type: "object",
          required: ["text", "author", "windowLabel"],
          properties: {
            text: { type: "string", description: "The quote text. Keep it short enough to read at a glance." },
            author: {
              type: "string",
              description: "Attribution. Empty string for anonymous; use 'Proverbe' / 'Proverb' for proverbs. Do not fabricate attributions.",
            },
            windowLabel: {
              type: "string",
              description:
                "A short human label for when this fits best, e.g. 'matins d'hiver', 'le soir', 'toute la saison'. In the display language.",
            },
          },
        },
      },
    },
  },
};

export async function souffle(req: SouffleurRequest): Promise<SouffleurResult> {
  const lang = req.lang === "en" ? "en" : "fr";
  const langName = lang === "fr" ? "French (Québécois-flavoured)" : "English";

  const existingBlock = req.existing.length
    ? `\n\nThe household already has these on the display — do NOT repeat or lightly reword them:\n${req.existing.map((e) => `- ${e}`).join("\n")}`
    : "";

  const toneBlock = req.tone.trim()
    ? `\n\nThe household describes itself like this: "${req.tone.trim()}". Let it gently steer the warmth and references, without ever quoting it back.`
    : "";

  const prompt = `Write in ${langName}.

Season: ${req.season}.
Today: ${req.dateLabel}.

Offer the household a small souffle for their calm kitchen display: a few seasonal greeting cards and a few resonant quotes, suited to the season and the day.${toneBlock}${existingBlock}

Keep everything short, calm, and readable at a glance from across a kitchen. Then call deliver_souffle.`;

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 1600,
    system: VOICE,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "deliver_souffle" },
    messages: [{ role: "user", content: prompt }],
  });

  const block = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "deliver_souffle",
  );
  if (!block) throw new Error("The souffleur returned nothing usable.");

  const out = block.input as SouffleurResult;
  // Defensive trims / clamps so a stray field never breaks the display.
  return {
    greetings: (out.greetings ?? [])
      .filter((g) => g?.text?.trim())
      .slice(0, 4)
      .map((g) => ({ text: g.text.trim(), note: (g.note ?? "").trim() })),
    quotes: (out.quotes ?? [])
      .filter((q) => q?.text?.trim())
      .slice(0, 5)
      .map((q) => ({
        text: q.text.trim(),
        author: (q.author ?? "").trim(),
        windowLabel: (q.windowLabel ?? "").trim(),
      })),
  };
}
