import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function UpgradeSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--container-page)] flex-col items-center justify-center gap-8 px-6 text-center md:px-10">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full text-paper [background-image:var(--dream-gradient)]">
        <Sparkles className="h-10 w-10" strokeWidth={1.75} />
      </div>
      <h1 className="mono text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em] text-ink">
        You&apos;re in.
      </h1>
      <p className="max-w-[44ch] text-ink-2 leading-relaxed">
        Pro is active. Unlimited dreams. All four styles. Comics saved forever.
      </p>
      <Link
        href="/"
        className="mono inline-flex h-11 items-center rounded bg-accent px-6 text-sm font-medium text-paper hover:bg-accent-2"
      >
        Record a dream →
      </Link>
    </main>
  );
}
