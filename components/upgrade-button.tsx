"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workerUrl } from "@/lib/api";

export function UpgradeButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(workerUrl("/api/stripe/checkout"), {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        setError("Sign in below first, then come back to upgrade.");
        return;
      }
      if (!res.ok) {
        setError("Couldn't start checkout. Try again?");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Button
        variant="dream"
        size="lg"
        className="w-full"
        onClick={onClick}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
        ) : null}
        {busy ? "Opening checkout…" : "Upgrade to Pro — $3/mo"}
      </Button>
      {error && (
        <p className="mt-2 text-center text-sm text-[color:var(--bad)]">
          {error}
        </p>
      )}
    </div>
  );
}
