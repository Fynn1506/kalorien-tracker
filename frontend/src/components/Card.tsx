import type { HTMLAttributes } from "react";

export function Card({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl shadow-sm ${className}`}
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      {...rest}
    >
      {children}
    </div>
  );
}
