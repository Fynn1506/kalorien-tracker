import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { ProfileProvider, useProfile } from "./hooks/useProfile";
import { Dashboard } from "./pages/Dashboard";
import { Onboarding } from "./pages/Onboarding";

// Code-split the heavier, less-frequently-opened screens (Stats pulls in
// recharts) so the initial load on a phone connection stays small.
const Diary = lazy(() => import("./pages/Diary").then((m) => ({ default: m.Diary })));
const AddFood = lazy(() => import("./pages/AddFood").then((m) => ({ default: m.AddFood })));
const Stats = lazy(() => import("./pages/Stats").then((m) => ({ default: m.Stats })));
const Profile = lazy(() => import("./pages/Profile").then((m) => ({ default: m.Profile })));

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="w-8 h-8 rounded-full border-[3px] animate-spin"
        style={{ borderColor: "var(--color-surface-alt)", borderTopColor: "var(--color-accent)" }}
      />
    </div>
  );
}

function AppShell() {
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100dvh" }}>
      <div className="max-w-lg mx-auto pb-24">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/add" element={<AddFood />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <ProfileProvider>
      <AppShell />
    </ProfileProvider>
  );
}

export default App;
