import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Landing } from "@/components/numerology/Landing";
import { ReadingForm, type ReadingFormData } from "@/components/numerology/ReadingForm";
import { AdGate } from "@/components/numerology/AdGate";
import { Reading } from "@/components/numerology/Reading";
import { generateReading } from "@/functions/numerology.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

type Step = "landing" | "form" | "gate" | "reading";

function Index() {
  const [step, setStep] = useState<Step>("landing");
  const [markdown, setMarkdown] = useState<string>("");
  const [aiReady, setAiReady] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (data: ReadingFormData) => {
    setStep("gate");
    setAiReady(false);
    setAiError(null);
    setMarkdown("");

    try {
      const res = await generateReading({ data });
      if (res.ok) {
        setMarkdown(res.markdown);
        setAiReady(true);
      } else {
        setAiError(res.error);
      }
    } catch (e) {
      console.error(e);
      setAiError("The connection to the oracle was lost. Please try again.");
    }
  }, []);

  const handleNew = useCallback(() => {
    setStep("form");
    setMarkdown("");
    setAiReady(false);
    setAiError(null);
  }, []);

  return (
    <main className="bg-mystic">
      {step === "landing" && <Landing onStart={() => setStep("form")} />}
      {step === "form" && (
        <ReadingForm onSubmit={handleSubmit} onBack={() => setStep("landing")} />
      )}
      {step === "gate" && (
        <AdGate
          ready={aiReady}
          loadingError={aiError}
          onReveal={() => setStep("reading")}
        />
      )}
      {step === "reading" && <Reading markdown={markdown} onNew={handleNew} />}
      <Toaster richColors theme="dark" />
    </main>
  );
}
