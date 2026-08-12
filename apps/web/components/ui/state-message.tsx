import type { HTMLAttributes, ReactNode } from "react";

export type StateMessageProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "neutral" | "error" | "success";
};

export function StateMessage({ children, className, tone = "neutral", ...props }: StateMessageProps) {
  const classes = ["state-message", `state-message--${tone}`, className].filter(Boolean).join(" ");
  return <div className={classes} {...props}>{children}</div>;
}
