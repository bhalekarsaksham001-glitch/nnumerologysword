import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// TODO: Replace with your own Google AdSense Publisher ID and Ad Slot ID
const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
const ADSENSE_SLOT = "XXXXXXXXXX";

const WAIT_SECONDS = 60;

export function AdGate({
  ready,
  onReveal,
  loadingError,
}: {
  ready: boolean;
  onReveal: () => void;
  loadingError: string | null;
}) {
  const [seconds, setSeconds] = useState(WAIT_SECONDS);
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      // @ts-expect-error adsbygoogle global
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense not loaded yet — placeholder will show */
    }
  }, []);

  const pct = ((WAIT_SECONDS - seconds) / WAIT_SECONDS) * 100;
  const canReveal = seconds === 0 && ready && !loadingError;

  return (
    <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
      <h2 className="font-display text-2xl text-gold">Sharpening your blade…</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        Your reading is being forged. A short message from our sponsor while you wait.
      </p>

      {/* Countdown ring */}
      <div className="relative mt-8 flex h-32 w-32 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="44" stroke="oklch(0.30 0.06 290)" strokeWidth="6" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="oklch(0.82 0.15 85)"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-display text-3xl text-gold">{seconds}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            seconds
          </div>
        </div>
      </div>

      {/* AdSense slot */}
      <div className="mt-8 w-full">
        <div className="mb-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Sponsored
        </div>
        <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border bg-card/40 p-2">
          <ins
            ref={adRef as React.Ref<HTMLModElement>}
            className="adsbygoogle"
            style={{ display: "block", width: "100%", minHeight: 250 }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>

      <div className="mt-8 w-full">
        {loadingError ? (
          <p className="text-center text-sm text-destructive">{loadingError}</p>
        ) : !ready && seconds === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Finalising your reading…
          </p>
        ) : null}

        <Button
          className="mt-4 h-14 w-full text-base font-semibold shadow-glow"
          disabled={!canReveal}
          onClick={onReveal}
        >
          {canReveal
            ? "🗡️ Reveal My Reading"
            : seconds > 0
              ? `Wait ${seconds}s`
              : "Almost ready…"}
        </Button>
      </div>
    </section>
  );
}
