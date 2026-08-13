"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ApiError, login } from "@/lib/api";
import { roleHomePath, toSessionState } from "@/lib/auth";
import { useSession } from "@/lib/session";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextPath = searchParams.get("next");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await login(email.trim().toLowerCase(), password);
      const session = toSessionState(response, { email: email.trim().toLowerCase() });
      signIn(session);
      router.push(
        nextPath && session.role === "CUSTOMER"
          ? nextPath
          : roleHomePath(session.role),
      );
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? "Email or password is incorrect."
          : caught instanceof ApiError
            ? caught.message
            : "The service is unavailable right now.",
      );
      setPending(false);
    }
  }

  return (
    <form className="d-grid gap-3" onSubmit={handleSubmit} noValidate>
      <div>
        <label className="form-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="form-control"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="form-control"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      ) : null}

      <button className="btn btn-primary btn-lg" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-secondary small mb-0">
        The backend returns the role, and it decides where you land: customer,
        organizer, or gate.
      </p>

      <p className="mb-0">
        No account yet?{" "}
        <Link className="text-cream" href="/register">
          Create one
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AppShell backHref="/">
      <div className="container py-4" style={{ maxWidth: "32rem" }}>
        <p className="eyebrow mb-1">Account</p>
        <h1 className="display-5 text-cream mb-4">Sign in</h1>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </AppShell>
  );
}
