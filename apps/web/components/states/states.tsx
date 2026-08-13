import Link from "next/link";
import type { ReactNode } from "react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="d-flex align-items-center gap-3 py-4" role="status">
      <span className="spinner-border spinner-border-sm text-warning" aria-hidden="true" />
      <span className="eyebrow mb-0">{label}…</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-secondary-subtle border-2 p-4 text-center">
      <h2 className="h4 text-cream">{title}</h2>
      <p className="text-secondary mb-3">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="alert alert-danger" role="alert">
      <h2 className="h5">{title}</h2>
      <p className="mb-0">{description}</p>
      {onRetry ? (
        <button className="btn btn-outline-light btn-sm mt-3" type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function UnauthorizedState({
  title = "Sign in to continue",
  description = "This area requires an authenticated account with the correct role.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="border border-2 p-4 text-center" role="alert">
      <h2 className="h4 text-cream">{title}</h2>
      <p className="text-secondary">{description}</p>
      <div className="d-flex flex-wrap gap-2 justify-content-center">
        <Link className="btn btn-primary" href="/login">
          Sign in
        </Link>
        <Link className="btn btn-outline-light" href="/register">
          Create account
        </Link>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="placeholder-glow">
      <span className="placeholder col-12" style={{ height: "18rem" }} />
      <span className="placeholder col-8 mt-2" />
      <span className="placeholder col-5 mt-1" />
    </div>
  );
}
