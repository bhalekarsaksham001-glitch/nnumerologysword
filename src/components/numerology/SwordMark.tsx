export function SwordMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="bladeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.95 0.02 90)" />
          <stop offset="50%" stopColor="oklch(0.82 0.15 85)" />
          <stop offset="100%" stopColor="oklch(0.55 0.18 295)" />
        </linearGradient>
      </defs>
      {/* Blade */}
      <polygon
        points="32,4 40,140 32,150 24,140"
        fill="url(#bladeGrad)"
        stroke="oklch(0.82 0.15 85)"
        strokeWidth="0.5"
      />
      <line x1="32" y1="10" x2="32" y2="140" stroke="oklch(0.18 0.03 280)" strokeWidth="0.5" opacity="0.5" />
      {/* Guard */}
      <rect x="6" y="148" width="52" height="6" rx="2" fill="oklch(0.82 0.15 85)" />
      {/* Grip */}
      <rect x="28" y="156" width="8" height="32" fill="oklch(0.30 0.06 290)" />
      <line x1="28" y1="162" x2="36" y2="162" stroke="oklch(0.82 0.15 85)" strokeWidth="0.5" />
      <line x1="28" y1="170" x2="36" y2="170" stroke="oklch(0.82 0.15 85)" strokeWidth="0.5" />
      <line x1="28" y1="178" x2="36" y2="178" stroke="oklch(0.82 0.15 85)" strokeWidth="0.5" />
      {/* Pommel */}
      <circle cx="32" cy="192" r="6" fill="oklch(0.82 0.15 85)" />
    </svg>
  );
}
