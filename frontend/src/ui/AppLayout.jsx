import {
  Activity,
  BarChart3,
  Lock,
  MailWarning,
  Settings,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

const items = [
  ["Dashboard", "/dashboard", Activity],
  ["Threat Feed", "/threats", Siren],
  ["Quarantine", "/quarantine", Lock],
  ["Analytics", "/analytics", BarChart3],
  ["Policies", "/policies", ShieldCheck],
  ["Settings", "/settings", Settings],
];

export function AppLayout() {
  const { accessToken, user, logout } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen bg-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-[#0b1519] p-4 lg:block">
        <div className="flex items-center gap-3 px-2 py-3">
          <MailWarning className="h-7 w-7 text-cyan" />
          <div>
            <h1 className="text-lg font-semibold">SentinelMail AI</h1>
            <p className="text-xs text-slate-400">Personal Gmail Defense</p>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {items.map(([label, href, Icon]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? "bg-cyan/15 text-cyan" : "text-slate-300 hover:bg-white/5"}`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-ink/95 px-5">
          <div>
            <p className="text-sm text-slate-400">Security operations</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <button
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm text-slate-200"
            onClick={logout}
          >
            Sign out
          </button>
        </header>
        <section className="p-5">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
