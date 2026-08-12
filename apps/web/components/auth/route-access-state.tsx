import Link from "next/link";

import { StateMessage } from "@/components/ui";

type RouteAccessStateProps = {
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
};

export function RouteAccessState({ title, message, actionHref, actionLabel }: RouteAccessStateProps) {
  return (
    <StateMessage tone="error" className="ticket ticket--state route-access-state" role="alert" aria-atomic="true">
      <div className="ticket__details-stack">
        <p className="label-caps">{title}</p>
        <h2 className="headline-md">{message}</h2>
      </div>
      <div className="ticket__actions">
        <Link className="button button--ghost" href={actionHref}>
          {actionLabel}
        </Link>
      </div>
    </StateMessage>
  );
}
