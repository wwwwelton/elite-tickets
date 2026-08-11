import type { HTMLAttributes, ReactNode } from "react";

import { Perforation } from "@/components/ui/perforation";

export type TicketProps = HTMLAttributes<HTMLElement> & {
  emphasized?: boolean;
  header: ReactNode;
  details: ReactNode;
  footer?: ReactNode;
};

export function Ticket({ className, details, emphasized, footer, header, ...props }: TicketProps) {
  const classes = ["ticket", emphasized ? "ticket--emphasized" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <article className={classes} {...props}>
      <div className="ticket__section">{header}</div>
      <Perforation />
      <div className="ticket__section code-data">{details}</div>
      {footer === undefined ? null : (
        <>
          <Perforation />
          <div className="ticket__section">{footer}</div>
        </>
      )}
    </article>
  );
}
