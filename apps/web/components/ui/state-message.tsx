import type { HTMLAttributes, ReactNode } from "react";

export type StateMessageProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "neutral" | "error" | "success";
};

export function StateMessage({ children, className, tone = "neutral", ...props }: StateMessageProps) {
  const classes = ["state-message", `state-message--${tone}`, className].filter(Boolean).join(" ");
  const role = props.role ?? (tone === "error" ? "alert" : "status");
  return <div className={classes} role={role} {...props}>{children}</div>;
}
