import { env, featureFlags } from "./env";

export interface AiResult {
  ok: boolean;
  text: string;
  provider: "claude" | "gemini" | "none";
  disabledReason?: string;
}

const CLAUDE_MODEL = "claude-sonnet-4-6";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * AI Prototype Assistant + Planning Engine + Documentation Generator all call
 * through this single abstraction. If no provider key is configured, it
 * returns a clearly-labeled fallback instead of throwing, so the rest of the
 * app keeps working.
 */
export async function generateAiText(prompt: string, system?: string): Promise<AiResult> {
  if (!featureFlags.aiEnabled) {
    return {
      ok: false,
      provider: "none",
      text: "",
      disabledReason:
        "AI features are disabled because no CLAUDE_API_KEY or GEMINI_API_KEY is configured. Add one to your .env file to enable the AI assistant.",
    };
  }

  if (env.CLAUDE_API_KEY) {
    try {
      const res = await fetch(CLAUDE_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 1500,
          system,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
      const data = await res.json();
      const text = (data.content ?? [])
        .map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : ""))
        .filter(Boolean)
        .join("\n");
      return { ok: true, provider: "claude", text };
    } catch (err) {
      // fall through to gemini if available
      if (!env.GEMINI_API_KEY) {
        return {
          ok: false,
          provider: "none",
          text: "",
          disabledReason: `The AI assistant is temporarily unavailable (${
            err instanceof Error ? err.message : "unknown error"
          }).`,
        };
      }
    }
  }

  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }] }],
        }),
      });
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      const text =
        data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("\n") ??
        "";
      return { ok: true, provider: "gemini", text };
    } catch (err) {
      return {
        ok: false,
        provider: "none",
        text: "",
        disabledReason: `The AI assistant is temporarily unavailable (${
          err instanceof Error ? err.message : "unknown error"
        }).`,
      };
    }
  }

  return {
    ok: false,
    provider: "none",
    text: "",
    disabledReason: "No AI provider is configured.",
  };
}
