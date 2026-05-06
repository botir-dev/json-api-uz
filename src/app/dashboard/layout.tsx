"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard", label: "Bosh sahifa", icon: "⬚" },
  { href: "/dashboard/collections", label: "Kolleksiyalar", icon: "⬡" },
  { href: "/dashboard/api-keys", label: "API Kalitlari", icon: "◆" },
  { href: "/dashboard/webhooks", label: "Webhooklar", icon: "◉" },
  { href: "/dashboard/functions", label: "Funksiyalar", icon: "◧" },
  { href: "/dashboard/notifications", label: "Bildirishnomalar", icon: "◎" },
  { href: "/dashboard/analytics", label: "Analitika", icon: "▦" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, tenantSlug, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: "var(--text-faint)",
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initial = (user.full_name || user.email).charAt(0).toUpperCase();

  return (
    <div
      className="flex"
      style={{ minHeight: "100vh", background: "var(--bg-base)" }}
    >
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── fixed, tam balandlik, scroll yo'q ── */}
      <aside
        className={`
          fixed top-0 left-0 z-30 flex flex-col
          lg:sticky lg:top-0 lg:self-start
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
        style={{
          width: 224,
          height: "100vh",
          background: "var(--bg-surface-2)",
          borderRight: "1px solid var(--border-2)",
        }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 shrink-0"
          style={{ borderBottom: "1px solid var(--border-2)" }}
        >
          <Link
            href="/dashboard"
            className="font-display text-lg font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            json-api
          </Link>
          {tenantSlug && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span
                className="text-xs font-mono truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {tenantSlug}
              </span>
            </div>
          )}
        </div>

        {/* Nav — scrollable agar kerak bo'lsa */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 font-medium"
                style={{
                  background: active ? "rgba(128,128,128,0.15)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(128,128,128,0.08)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--text-muted)";
                  }
                }}
              >
                <span className="text-base w-4 text-center leading-none shrink-0">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme toggle + user */}
        <div
          className="shrink-0 px-4 py-4"
          style={{ borderTop: "1px solid var(--border-2)" }}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium mb-4 transition-all duration-150"
            style={{
              color: "var(--text-muted)",
              background: "rgba(128,128,128,0.07)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="text-sm">{theme === "light" ? "☀️" : "🌙"}</span>
            <span style={{ color: "var(--text-secondary)" }}>
              {theme === "light" ? "Light mode" : "Dark mode"}
            </span>
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold"
              style={{
                background:
                  theme === "light"
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(255,255,255,0.08)",
                color: "var(--text-muted)",
              }}
            >
              {theme === "light" ? "ON" : "OFF"}
            </span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user.full_name || user.email.split("@")[0]}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left text-xs transition-colors py-1"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-faint)";
            }}
          >
            Chiqish →
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ minHeight: "100vh" }}
      >
        {/* Mobile topbar */}
        <header
          className="lg:hidden flex items-center gap-4 px-4 py-4 shrink-0"
          style={{
            background: "var(--bg-surface-2)",
            borderBottom: "1px solid var(--border-2)",
          }}
        >
          <button
            onClick={() => setOpen(true)}
            className="transition-colors"
            aria-label="Menyu"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span
            className="font-display font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            json-api
          </span>
          <button
            onClick={toggleTheme}
            className="ml-auto text-lg transition-colors"
          >
            {theme === "light" ? "☀️" : "🌙"}
          </button>
        </header>

        {/* Page scroll — faqat shu qism scroll qiladi */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
