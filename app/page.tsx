import Link from "next/link";
import { Recorder } from "@/components/recorder";
import { ExampleChips } from "@/components/example-chips";
import { SampleComics } from "@/components/sample-comics";

export default function Home() {
  return (
    <>
      <main
        id="main"
        className="relative mx-auto flex w-full max-w-[var(--container-page)] flex-col px-6 md:px-10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-mute">themeknock</span>
            <span className="text-rule">/</span>
            <span className="mono font-bold text-ink">DreamToon</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/upgrade"
              className="mono inline-flex items-center rounded-full border border-rule px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-ink-2 hover:border-stamp hover:text-ink"
            >
              Pro
            </Link>
          </nav>
        </header>

        <section className="flex flex-col items-center justify-center gap-9 pb-12 pt-8 text-center md:pt-16">
          <div className="flex flex-col items-center gap-4">
            <h1
              className="font-display max-w-[16ch] text-[clamp(2.6rem,6.2vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-ink"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 0" }}
            >
              Talk. Get a{" "}
              <em
                className="font-display not-italic"
                style={{
                  fontStyle: "italic",
                  fontVariationSettings: "'opsz' 144, 'SOFT' 100, 'WONK' 30",
                }}
              >
                comic
              </em>
              .
            </h1>
            <p className="max-w-[40ch] text-[15px] leading-relaxed text-ink-2">
              Tap the mic. Talk for fifteen seconds about a dream. We&apos;ll draw it.
              No interpretation — just the picture.
            </p>
          </div>

          <Recorder />

          <ExampleChips />

          <p className="mono text-[11px] uppercase tracking-[0.14em] text-mute">
            3 free dreams a day
          </p>
        </section>
      </main>

      <SampleComics />

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-[var(--container-page)] flex-col items-center gap-3 px-6 py-8 text-center md:flex-row md:justify-between md:px-10 md:text-left">
          <p className="mono text-[10px] uppercase tracking-[0.16em] text-mute">
            DreamToon is an art tool · not psychology · not interpretation
          </p>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/gallery"
              className="mono text-[10px] uppercase tracking-[0.16em] text-mute hover:text-ink"
            >
              Gallery
            </Link>
            <Link
              href="/upgrade"
              className="mono text-[10px] uppercase tracking-[0.16em] text-mute hover:text-ink"
            >
              Pro
            </Link>
            <a
              href="https://github.com/themeknock/dreamtoon"
              target="_blank"
              rel="noreferrer noopener"
              className="mono text-[10px] uppercase tracking-[0.16em] text-mute hover:text-ink"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
