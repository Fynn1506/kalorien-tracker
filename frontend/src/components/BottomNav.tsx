import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Heute", icon: HomeIcon },
  { to: "/diary", label: "Tagebuch", icon: BookIcon },
  { to: "/add", label: "Hinzufügen", icon: PlusIcon },
  { to: "/stats", label: "Statistik", icon: ChartIcon },
  { to: "/profile", label: "Profil", icon: UserIcon },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 pb-safe border-t z-40"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? "" : ""
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
            })}
          >
            {({ isActive }) =>
              to === "/add" ? (
                <span
                  className="flex items-center justify-center w-11 h-11 rounded-full -mt-4 shadow-lg"
                  style={{ background: "var(--color-accent)" }}
                >
                  <Icon active className="w-6 h-6 text-white" />
                </span>
              ) : (
                <>
                  <Icon active={isActive} className="w-6 h-6" />
                  <span>{label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

type IconProps = { className?: string; active?: boolean };

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 11.5 12 4l8 7.5M6 9.5V20h12V9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M5 17.5h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 19.5V13m6.5 6.5V7m6.5 12.5v-9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
