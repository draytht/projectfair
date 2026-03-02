"use client";

import { Suspense, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Component as EtherealShadow } from "@/components/ui/etheral-shadow";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email") ?? "";

  const supabase = createClient();

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "PROFESSOR">("STUDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill email from invite link
  useEffect(() => {
    if (prefillEmail) setEmail(prefillEmail);
  }, [prefillEmail]);

  async function handleSignup() {
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: data.user?.id, email, name, role }),
    });

    if (!res.ok) {
      setError("Failed to create user profile.");
      setLoading(false);
      return;
    }

    // If there's a pending invite, accept it now
    if (inviteToken) {
      const inviteRes = await fetch(`/api/invite/${inviteToken}`, { method: "POST" });
      if (inviteRes.ok) {
        const { projectId } = await inviteRes.json();
        router.push(`/dashboard/projects/${projectId}`);
        return;
      }
      // If invite accept fails (e.g. wrong email), just go to dashboard
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
          {inviteToken ? "Create your account to join" : "Create your account"}
        </h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4">
          <input
            className="nc-input"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="nc-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!!prefillEmail}
            style={prefillEmail ? { opacity: 0.7 } : {}}
          />
          <input
            className="nc-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex gap-2">
            {(["STUDENT", "PROFESSOR"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  background: role === r ? "var(--th-accent)" : "transparent",
                  color: role === r ? "var(--th-accent-fg)" : "var(--th-text-2)",
                  border: `1px solid ${role === r ? "var(--th-accent)" : "var(--th-border)"}`,
                }}
                className="flex-1 py-2 rounded-md text-sm font-medium transition hover:opacity-80 cursor-pointer capitalize"
              >
                {r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <button type="submit" disabled={loading} className="nc-btn-primary">
            {loading ? "Creating account..." : inviteToken ? "Sign Up & Accept Invite" : "Sign Up"}
          </button>
        </form>

        <p style={{ color: "var(--th-text-2)" }} className="text-sm text-center">
          Already have an account?{" "}
          <Link
            href={inviteToken ? `/login?invite=${inviteToken}` : "/login"}
            style={{ color: "var(--th-accent)" }}
            className="hover:opacity-70 transition"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
