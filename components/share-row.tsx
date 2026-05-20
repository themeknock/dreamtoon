"use client";

import { useEffect, useState } from "react";
import { Download, Link as LinkIcon, Sparkles, Check, Share2 } from "lucide-react";
import Link from "next/link";
import { workerUrl } from "@/lib/api";
import { shareUrl } from "@/lib/base";
import { Button } from "@/components/ui/button";

export function ShareRow({ comicId }: { comicId: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const publicUrl = shareUrl(`/c?id=${comicId}`);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  const fireShareTracker = () => {
    fetch(workerUrl(`/api/comic/${comicId}/share`), {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  };

  const onShare = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({
          title: "A dream, drawn — DreamToon",
          text: "I made this on DreamToon — describe a dream, get a 4-panel comic.",
          url: publicUrl,
        });
        fireShareTracker();
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      fireShareTracker();
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={onShare} variant="default" size="lg" className="min-w-[220px]">
        {canNativeShare ? (
          <Share2 className="h-4 w-4" strokeWidth={1.75} />
        ) : copied ? (
          <Check className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <LinkIcon className="h-4 w-4" strokeWidth={1.75} />
        )}
        {canNativeShare
          ? "Share comic"
          : copied
            ? "Link copied — paste anywhere"
            : "Copy share link"}
      </Button>

      <div className="flex items-center gap-4 text-sm">
        <a
          href={workerUrl(`/api/comic/${comicId}/image`)}
          download={`dreamtoon-${comicId}.png`}
          className="mono inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.12em] text-mute hover:text-ink"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          Download
        </a>
        <span className="text-rule">·</span>
        <Link
          href="/"
          className="mono inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.12em] text-link hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
          Make another
        </Link>
      </div>
    </div>
  );
}
