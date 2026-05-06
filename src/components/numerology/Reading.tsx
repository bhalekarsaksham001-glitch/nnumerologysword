import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Reading({
  markdown,
  onNew,
}: {
  markdown: string;
  onNew: () => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Reading copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-gold">Your Reading</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy}>
            Copy
          </Button>
          <Button onClick={onNew} className="shadow-glow">
            New Reading
          </Button>
        </div>
      </div>

      <article
        className="rounded-2xl border bg-card/70 p-6 shadow-mystic backdrop-blur sm:p-10
          [&_h1]:font-display [&_h1]:text-3xl [&_h1]:text-gold [&_h1]:mt-2 [&_h1]:mb-4
          [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-gold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2
          [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2
          [&_p]:leading-7 [&_p]:my-3 [&_p]:text-foreground/90
          [&_ul]:my-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1
          [&_ol]:my-3 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1
          [&_li]:text-foreground/90
          [&_strong]:text-gold
          [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
          [&_hr]:my-6 [&_hr]:border-border
          [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
          [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse
          [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:text-left [&_th]:text-gold
          [&_td]:border [&_td]:border-border [&_td]:p-2"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </article>

      <div className="mt-8 text-center">
        <Button onClick={onNew} variant="outline">
          Forge another reading
        </Button>
      </div>
    </section>
  );
}
