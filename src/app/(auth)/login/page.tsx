"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // If there's a pending invite, try to accept it
    if (inviteToken) {
      const inviteRes = await fetch(`/api/invite/${inviteToken}`, { method: "POST" });
      if (inviteRes.ok) {
        const { projectId } = await inviteRes.json();
        router.push(`/dashboard/projects/${projectId}`);
        return;
      }
      // Accept failed (e.g. wrong email) — redirect to invite page to show error
      router.push(`/invite/${inviteToken}`);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div
      style={{ color: "var(--th-text)" }}
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      {/* Full-page ethereal background */}
      <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, background: "var(--th-bg)", pointerEvents: "none" }}>
        <EtherealShadow
          color="var(--th-accent)"
          animation={{ scale: 45, speed: 95 }}
          noise={{ opacity: 0.4, scale: 1.0 }}
          sizing="fill"
          style={{ opacity: 0.18 }}
        />
      </div>
      <Link href="/" className="nc-brand mb-10">
        <span className="nc-brand-dot" />
        <span className="nc-brand-text">
          No<span style={{ color: "var(--th-accent)" }}>Carry</span>
        </span>
      </Link>

      <div
        style={{ background: "var(--th-card)", border: "1px solid var(--th-border)" }}
        className="w-full max-w-sm rounded-xl p-8 space-y-4"
      >
        <h1 style={{ color: "var(--th-text)" }} className="text-lg font-semibold mb-2">
          {inviteToken ? "Log in to accept your invite" : "Welcome back"}
        </h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <input
            className="nc-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="nc-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading} className="nc-btn-primary">
            {loading ? "Logging in..." : inviteToken ? "Log In & Accept Invite" : "Log In"}
          </button>
        </form>

        <p style={{ color: "var(--th-text-2)" }} className="text-sm text-center">
          No account?{" "}
          <Link
            href={inviteToken ? `/signup?invite=${inviteToken}` : "/signup"}
            style={{ color: "var(--th-accent)" }}
            className="hover:opacity-70 transition"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
