"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard",                 label: "Bosh sahifa",     icon: "⬚" },
  { href: "/dashboard/collections",     label: "Kolleksiyalar",   icon: "⬡" },
  { href: "/dashboard/api-keys",        label: "API Kalitlari",   icon: "◆" },
  { href: "/dashboard/webhooks",        label: "Webhooklar",      icon: "◉" },
  { href: "/dashboard/functions",       label: "Funksiyalar",     icon: "◧" },
  { href: "/dashboard/notifications",   label: "Bildirishnomalar",icon: "◎" },
  { href: "/dashboard/analytics",       label: "Analitika",       icon: "▦" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, tenantSlug, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/20 animate-pulse"
              style={{ animationDelay: `${i*150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initial = (user.full_name || user.email).charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-56 bg-[#0d0d0d] border-r border-[#1c1c1c] z-30
        flex flex-col transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#1c1c1c]">
          <Link href="/dashboard" className="font-display text-lg font-bold text-white tracking-tight">
            json-api
          </Link>
          {tenantSlug && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-zinc-500 text-xs font-mono truncate">{tenantSlug}</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <span className="text-base w-4 text-center leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[#1c1c1c]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user.full_name || user.email.split("@")[0]}
              </p>
              <p className="text-zinc-600 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full text-left text-zinc-600 text-xs hover:text-zinc-300 transition-colors py-1">
            Chiqish →
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-4 border-b border-[#1c1c1c] bg-[#0d0d0d]">
          <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-white transition-colors" aria-label="Menyu">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-display font-bold text-white">json-api</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
