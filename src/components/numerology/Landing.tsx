import { Button } from "@/components/ui/button";
import { SwordMark } from "./SwordMark";

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="absolute inset-0 -z-10 opacity-30 blur-3xl">
        <div className="mx-auto h-72 w-72 rounded-full bg-accent" />
      </div>

      <SwordMark className="mb-8 h-40 w-auto drop-shadow-[0_0_30px_oklch(0.82_0.15_85_/_0.5)]" />

      <h1 className="font-display text-5xl font-bold leading-tight text-gold sm:text-6xl">
        Numerology Sword
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
        A sharp, honest, AI-powered reading of your life — drawn from your name and your
        birthday. No flattery. No fluff. Just your numbers, cut clean.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={onStart}
          className="h-14 px-10 text-base font-semibold tracking-wide shadow-glow"
        >
          Get Your Reading
        </Button>
        <p className="text-xs text-muted-foreground">
          Free · One 60-second sponsor message before each reading
        </p>
      </div>

      <div className="mt-16 grid w-full gap-6 sm:grid-cols-3">
        {[
          { t: "Life Path", d: "Your core direction and lifelong themes." },
          { t: "Karmic Debts", d: "The hidden lessons your soul came to clear." },
          { t: "Year Ahead", d: "What this year and the next will demand of you." },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-xl border bg-card/60 p-6 text-left shadow-mystic backdrop-blur"
          >
            <h3 className="font-display text-lg text-gold">{c.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
