"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { workerUrl } from "@/lib/api";

function Verifier() {
  const params = useSearchParams();
  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      window.location.href = "/";
      return;
    }
    window.location.href = workerUrl(
      `/api/auth/verify?token=${encodeURIComponent(token)}`,
    );
  }, [params]);

  return (
    <p className="font-display animate-pulse text-lg italic text-mute">
      Signing you in…
    </p>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6">
      <Suspense
        fallback={
          <p className="font-display animate-pulse text-lg italic text-mute">
            Signing you in…
          </p>
        }
      >
        <Verifier />
      </Suspense>
    </main>
  );
}
