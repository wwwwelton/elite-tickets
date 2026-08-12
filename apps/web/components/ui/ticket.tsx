import type { HTMLAttributes, ReactNode } from "react";

import { Perforation } from "@/components/ui/perforation";

export type TicketProps = HTMLAttributes<HTMLElement> & {
  detailsLabel?: string;
  emphasized?: boolean;
  header: ReactNode;
  details: ReactNode;
  footer?: ReactNode;
};

export function Ticket({
  className,
  details,
  detailsLabel = "Detalhes",
  emphasized,
  footer,
  header,
  ...props
}: TicketProps) {
  const classes = ["ticket", emphasized ? "ticket--emphasized" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <article className={classes} data-emphasized={emphasized ? "true" : undefined} {...props}>
      <header className="ticket__section ticket__header">{header}</header>
      <Perforation />
      <section className="ticket__section ticket__details code-data" aria-label={detailsLabel}>
        {details}
      </section>
      {footer === undefined ? null : (
        <>
          <Perforation />
          <footer className="ticket__section ticket__footer">{footer}</footer>
        </>
      )}
    </article>
  );
}
