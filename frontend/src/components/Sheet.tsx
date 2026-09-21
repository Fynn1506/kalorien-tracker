import type { ReactNode } from "react";
import { useEffect } from "react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-lg rounded-t-3xl pb-safe max-h-[88vh] overflow-y-auto animate-[slideUp_0.25s_cubic-bezier(0.32,0.72,0,1)]"
        style={{ background: "var(--color-surface)" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 pt-3 pb-2 flex justify-center" style={{ background: "var(--color-surface)" }}>
          <div className="w-10 h-1.5 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>
        {title && <h2 className="px-5 pb-3 text-lg font-semibold">{title}</h2>}
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
