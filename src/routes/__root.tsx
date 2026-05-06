import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";

// TODO: Replace with your own Google AdSense Publisher ID (e.g. "ca-pub-1234567890123456")
const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the void</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This path does not exist on the chart.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Numerology Sword — AI Numerology Reading" },
      {
        name: "description",
        content:
          "Get a sharp, honest, AI-powered numerology SWOT reading from your name and birthday. Life path, destiny, soul urge, karmic debts and your year ahead.",
      },
      { name: "author", content: "Numerology Sword" },
      { property: "og:title", content: "Numerology Sword — AI Numerology Reading" },
      {
        property: "og:description",
        content:
          "A direct, sword-sharp numerology reading powered by AI. Your numbers, your life themes, your year ahead.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Numerology Sword — AI Numerology Reading" },
      { name: "description", content: "Life Path Oracle provides personalized numerology readings using AI to reveal life path insights." },
      { property: "og:description", content: "Life Path Oracle provides personalized numerology readings using AI to reveal life path insights." },
      { name: "twitter:description", content: "Life Path Oracle provides personalized numerology readings using AI to reveal life path insights." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f3cb2399-68c1-42d6-be7f-59b6987f98d6/id-preview-b949dbc8--48668e97-423d-4dcc-bfd8-5fe08441aefd.lovable.app-1778064326541.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f3cb2399-68c1-42d6-be7f-59b6987f98d6/id-preview-b949dbc8--48668e97-423d-4dcc-bfd8-5fe08441aefd.lovable.app-1778064326541.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
        async: true,
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
