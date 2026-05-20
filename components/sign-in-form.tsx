"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workerUrl } from "@/lib/api";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(workerUrl("/api/auth/request"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError("Couldn't send link. Check the email and try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-rule bg-[color:var(--soft)] p-3 text-sm text-ink">
        <Check
          className="h-4 w-4 text-[color:var(--ok)]"
          strokeWidth={2}
        />
        <span>
          Link sent. Tap it in your inbox — expires in 10 minutes.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="mono text-[11px] uppercase tracking-[0.12em] text-mute">
        Sign in with email — magic link
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
            strokeWidth={1.75}
          />
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-rule bg-paper py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-mute focus:border-accent"
          />
        </div>
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? "Sending…" : "Send link"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-[color:var(--bad)]">{error}</p>
      )}
    </form>
  );
}
