import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Check } from "lucide-react";
import { UpgradeButton } from "@/components/upgrade-button";
import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = {
  title: "Upgrade — DreamToon",
  description: "Unlimited comics, $3/mo.",
};

const FEATURES = [
  "Unlimited comics",
  "All four art styles",
  "Comics saved forever (free tier auto-deletes after 7 days)",
  "Remix any dream in a different style",
  "Priority lane during peak hours",
  "Watermark stays — it's how friends find us",
];

export default function UpgradePage() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[100dvh] w-full max-w-[var(--container-page)] flex-col px-6 md:px-10"
    >
      <header className="flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <span className="text-mute">themeknock</span>
          <span className="text-rule">/</span>
          <span className="mono font-bold text-ink">DreamToon</span>
        </Link>
        <Link
          href="/"
          className="mono text-[12px] uppercase tracking-[0.12em] text-accent-deep hover:underline"
        >
          ← home
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-12 py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="mono text-[11px] uppercase tracking-[0.16em] text-mute">
            DreamToon Pro
          </span>
          <h1
            className="font-display max-w-[18ch] text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink"
            style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
          >
            Unlimited{" "}
            <em
              className="font-display"
              style={{
                fontStyle: "italic",
                fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 30",
              }}
            >
              dreams
            </em>
            , drawn.
          </h1>
          <p className="mt-2 max-w-[44ch] text-ink-2 leading-relaxed">
            Three dollars a month. Cancel anytime. No interpretation, just
            unlimited art.
          </p>
        </div>

        <div className="w-full max-w-[480px] rounded-2xl border border-rule bg-paper p-8 text-left shadow-[0_18px_48px_-24px_rgba(0,0,0,0.18)]">
          <div className="mb-6 flex items-baseline justify-between">
            <span className="mono text-[11px] uppercase tracking-[0.12em] text-mute">
              monthly
            </span>
            <div>
              <span className="mono text-4xl font-bold text-ink">$3</span>
              <span className="mono ml-1 text-sm text-mute">/mo</span>
            </div>
          </div>
          <ul className="mb-6 space-y-3">
            {FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-sm text-ink-2"
              >
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--ok)]"
                  strokeWidth={2}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <UpgradeButton />
          <p className="mt-3 text-center text-[11px] text-mute">
            Need to sign in first? You can use the form below.
          </p>

          <div className="mt-6 border-t border-rule pt-6">
            <SignInForm />
          </div>
        </div>

        <p className="mono max-w-[42ch] text-center text-[11px] uppercase tracking-[0.12em] text-mute">
          <Sparkles className="mr-1 inline h-3 w-3" strokeWidth={1.75} />
          You can keep using the free tier forever — 3 comics a day.
        </p>
      </section>

      <footer className="border-t border-rule py-6 text-center">
        <p className="mono text-[11px] uppercase tracking-[0.12em] text-mute">
          DreamToon is an art tool · not psychology · not interpretation
        </p>
      </footer>
    </main>
  );
}
