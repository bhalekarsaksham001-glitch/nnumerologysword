import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildReadingMarkdown } from "@/lib/numerology";

const Input = z.object({
  fullName: z.string().trim().min(2).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"),
  gender: z.enum(["Male", "Female", "Other"]),
});

export const generateReading = createServerFn({ method: "POST" })
  .inputValidator((input) => Input.parse(input))
  .handler(async ({ data }) => {
    try {
      const markdown = buildReadingMarkdown(data);
      return { ok: true as const, markdown };
    } catch (e) {
      console.error("generateReading failed", e);
      return { ok: false as const, error: "Could not compute your reading. Please check your inputs." };
    }
  });
