import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type ReadingFormData = {
  fullName: string;
  dob: string; // YYYY-MM-DD
  gender: "Male" | "Female" | "Other";
};

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(120, "Name is too long")
    .regex(/^[A-Za-z .'-]+$/, "Use English letters as on official documents"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .refine((v) => {
      const d = new Date(v);
      return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d <= new Date();
    }, "Pick a valid date"),
  gender: z.enum(["Male", "Female", "Other"]),
});

export function ReadingForm({
  onSubmit,
  onBack,
}: {
  onSubmit: (data: ReadingFormData) => void;
  onBack: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [errors, setErrors] = useState<Partial<Record<keyof ReadingFormData, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ fullName, dob, gender });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ReadingFormData, string>> = {};
      for (const issue of result.error.issues) {
        const k = issue.path[0] as keyof ReadingFormData;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border bg-card/70 p-8 shadow-mystic backdrop-blur">
        <h2 className="font-display text-3xl text-gold">Three questions.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The sword needs your truth to cut clean. Use your full English name as it appears
          on official documents.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name (English, official documents)</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Vedant Rupesh Pawar"
              autoComplete="name"
              maxLength={120}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
            />
            {errors.dob && <p className="text-xs text-destructive">{errors.dob}</p>}
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              value={gender}
              onValueChange={(v) => setGender(v as "Male" | "Female" | "Other")}
              className="flex gap-6"
            >
              {(["Male", "Female", "Other"] as const).map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <RadioGroupItem id={`g-${g}`} value={g} />
                  <Label htmlFor={`g-${g}`} className="cursor-pointer font-normal">
                    {g}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back
            </Button>
            <Button type="submit" className="flex-1 shadow-glow">
              Continue
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
