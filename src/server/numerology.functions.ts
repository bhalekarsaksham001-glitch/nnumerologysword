import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  fullName: z.string().trim().min(2).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"),
  gender: z.enum(["Male", "Female", "Other"]),
});

function buildPrompt(data: { fullName: string; dob: string; gender: string }) {
  // Format DOB as DD Month YYYY
  const [y, m, d] = data.dob.split("-").map(Number);
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const niceDob = `${d} ${monthNames[m - 1]} ${y}`;
  const currentYear = new Date().getUTCFullYear();

  return `Act as a world-class numerologist. You are direct, clear and honest like a sword, but also kind and practical.

The user has already provided the three required pieces of information. DO NOT ask any questions. Begin the full analysis directly.

USER INFORMATION:
- Full name (English, as on official documents): ${data.fullName}
- Full date of birth: ${niceDob}
- Gender: ${data.gender}
- Current year for Personal Year calculation: ${currentYear}

Now perform a full numerology "SWOT Analysis" of this person's life. Return the entire response as rich Markdown with emojis, headings (use # / ## / ###), bullet lists and bold. Follow this exact structure and depth:

🔢 Your Complete Numerology SWOT Analysis
${data.fullName} | ${niceDob} | ${data.gender}

📊 SECTION 1 — YOUR CORE NUMBERS
For each of these, show the calculation briefly, give a short title (e.g. "Life Path 7 — The Seeker"), and call out karmic-debt numbers (13, 14, 16, 19) when present:
- Life Path Number
- Destiny / Expression Number
- Soul Urge / Heart's Desire Number
- Personality Number
- Birthday Number
- Maturity Number (Life Path + Destiny)

🗡️ SECTION 2 — DEEP DIVE INTO WHO YOU ARE
- Core essence (personality + inner world, the contradictions)
- Main life purpose and repeating life themes
- Top strengths and superpowers (5–7 specific points)
- Main weaknesses and self-sabotage patterns (3–5 points)
- Love, friendship, family
- Ideal partner & risky relationship dynamics
- Money, career and success potential — what suits, what doesn't
- Mental and emotional patterns under stress, failure, conflict

⚠️ SECTION 3 — YOUR KARMIC DEBTS
For every karmic-debt number present (13/14/16/19): the lesson, how it shows up in this life, the trap, the breakthrough.

📅 SECTION 4 — YOUR TIME ENERGY
- Calculate the Personal Year for ${currentYear} (show the calculation). Title it.
- Theme of this year, opportunities, warnings, what to focus on, what to avoid.
- Briefly describe the energy of the coming year (${currentYear + 1}) so the reader can prepare.

🗺️ SECTION 5 — YOUR PRACTICAL ACTION PLAN
- 3 powerful life rules tailored to their numbers
- A simple weekly reset ritual
- A short ✅ DO and ❌ DON'T bulleted list

🔚 Closing word — personal, sword-honest, never rude or discouraging.

STYLE RULES:
- Be VERY specific to this exact name, date and gender. Do not be generic.
- Address the reader by their first name throughout.
- Use headings, bullet points, emojis and bold so it's easy to scan.
- Be honest like a sword, never cruel.
- Do not include any preamble like "Sure" or "Here is your reading" — start directly with the title.`;
}

export const generateReading = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "AI is not configured. LOVABLE_API_KEY missing." };
    }

    const prompt = buildPrompt(data);

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "system",
              content:
                "You are a world-class numerologist. Honest like a sword, kind and practical. Always return rich, well-structured Markdown.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return { ok: false as const, error: "The oracle is overwhelmed. Please try again in a minute." };
        }
        if (res.status === 402) {
          return { ok: false as const, error: "AI credits exhausted. Please add credits to continue." };
        }
        const txt = await res.text();
        console.error("AI gateway error", res.status, txt);
        return { ok: false as const, error: `AI error (${res.status}). Please try again.` };
      }

      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      if (!content) {
        return { ok: false as const, error: "The oracle returned silence. Please try again." };
      }
      return { ok: true as const, markdown: content };
    } catch (e) {
      console.error("generateReading failed", e);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
  });
