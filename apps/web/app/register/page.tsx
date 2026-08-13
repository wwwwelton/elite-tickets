"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { ApiError, register } from "@/lib/api";
import { roleHomePath, toSessionState, type SessionRole } from "@/lib/auth";
import { useSession } from "@/lib/session";

const roles: Array<{ value: SessionRole; label: string; hint: string }> = [
  { value: "CUSTOMER", label: "Cliente", hint: "Comprar e gerenciar ingressos" },
  { value: "ORGANIZER", label: "Organizador", hint: "Publicar e gerenciar eventos" },
  { value: "GATE", label: "Portaria", hint: "Validar ingressos na entrada" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SessionRole>("CUSTOMER");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function validate() {
    const errors: Record<string, string> = {};
    if (!displayName.trim()) {
      errors.displayName = "Informe o nome que deve aparecer nos seus ingressos.";
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      errors.email = "Informe um e-mail válido.";
    }
    if (password.length < 8) {
      errors.password = "Use pelo menos 8 caracteres.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validate()) {
      return;
    }

    setPending(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await register({
        email: normalizedEmail,
        password,
        display_name: displayName.trim(),
        role,
      });
      const session = toSessionState(response, {
        email: normalizedEmail,
        displayName: displayName.trim(),
      });
      signIn(session);
      router.push(roleHomePath(session.role));
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 409
          ? "Esse e-mail já está cadastrado. Entre com sua conta."
          : caught instanceof ApiError
            ? caught.message
            : "O serviço está indisponível no momento.",
      );
      setPending(false);
    }
  }

  return (
    <AppShell backHref="/login">
      <div className="container py-4" style={{ maxWidth: "34rem" }}>
        <p className="eyebrow mb-1">Conta</p>
        <h1 className="display-5 text-cream mb-4">Criar conta</h1>

        <form className="d-grid gap-3" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="form-label" htmlFor="register-name">
              Nome exibido
            </label>
            <input
              id="register-name"
              className="form-control"
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.displayName)}
              aria-describedby={fieldErrors.displayName ? "register-name-error" : undefined}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            {fieldErrors.displayName ? (
              <p className="text-danger small mb-0 mt-1" id="register-name-error">
                {fieldErrors.displayName}
              </p>
            ) : null}
          </div>

          <div>
            <label className="form-label" htmlFor="register-email">
              E-mail
            </label>
            <input
              id="register-email"
              className="form-control"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {fieldErrors.email ? (
              <p className="text-danger small mb-0 mt-1" id="register-email-error">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label className="form-label" htmlFor="register-password">
              Senha
            </label>
            <input
              id="register-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {fieldErrors.password ? (
              <p className="text-danger small mb-0 mt-1" id="register-password-error">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="text-secondary small mb-0 mt-1">Mínimo de 8 caracteres.</p>
            )}
          </div>

          <fieldset className="d-grid gap-2">
            <legend className="form-label mb-0">Tipo de conta</legend>
            {roles.map((option) => (
              <label
                className={`card p-3 d-flex flex-row gap-3 align-items-center ${
                  role === option.value ? "border-warning" : ""
                }`}
                key={option.value}
              >
                <input
                  className="form-check-input mt-0"
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                />
                <span>
                  <span className="d-block text-cream">{option.label}</span>
                  <span className="d-block text-secondary small">{option.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {error ? (
            <div className="alert alert-danger mb-0" role="alert">
              {error}
            </div>
          ) : null}

          <button className="btn btn-primary btn-lg" type="submit" disabled={pending}>
            {pending ? "Criando conta…" : "Criar conta"}
          </button>

          <p className="mb-0">
            Já possui cadastro?{" "}
            <Link className="text-cream" href="/login">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </AppShell>
  );
}
