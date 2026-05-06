"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { tenants, analytics, type AnalyticsOverview } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user, tenantSlug } = useAuth();
  const [stats, setStats] = useState<{
    users: number;
    collections: number;
    requests30d: number;
  } | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantSlug) return;
    Promise.all([
      tenants.stats(tenantSlug).catch(() => null),
      analytics.overview("30d").catch(() => null),
    ]).then(([s, o]) => {
      setStats(s);
      setOverview(o);
      setLoading(false);
    });
  }, [tenantSlug]);

  const successRate = overview?.stats.total_requests
    ? Math.round(
        (overview.stats.successful / overview.stats.total_requests) * 100,
      )
    : null;

  const statCards = [
    { label: "Foydalanuvchilar", value: stats?.users, suffix: "", href: null },
    {
      label: "Kolleksiyalar",
      value: stats?.collections,
      suffix: "",
      href: "/dashboard/collections",
    },
    {
      label: "So'rovlar (30d)",
      value: overview?.stats.total_requests,
      suffix: "",
      href: "/dashboard/analytics",
    },
    {
      label: "Muvaffaqiyat",
      value: successRate,
      suffix: "%",
      href: "/dashboard/analytics",
      accent:
        successRate != null
          ? successRate > 90
            ? "#10b981"
            : "#f59e0b"
          : undefined,
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/collections",
      label: "Kolleksiya yaratish",
      desc: "Ma'lumotlar jadvali",
      icon: "⬡",
    },
    {
      href: "/dashboard/api-keys",
      label: "API kalit yaratish",
      desc: "Xavfsiz kirish kaliti",
      icon: "◆",
    },
    {
      href: "/dashboard/webhooks",
      label: "Webhook qo'shish",
      desc: "Hodisalarga obuna",
      icon: "◉",
    },
    {
      href: "/dashboard/functions",
      label: "Funksiya yozish",
      desc: "Serverless kod",
      icon: "◧",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">
          {user?.full_name
            ? `Salom, ${user.full_name.split(" ")[0]} 👋`
            : "Bosh sahifa"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Tenant:{" "}
          <code
            className="font-mono text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(128,128,128,0.12)",
              color: "var(--text-secondary)",
            }}
          >
            {tenantSlug}
          </code>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="card p-5 space-y-3">
            <p className="label">{c.label}</p>
            <p
              className="text-3xl font-bold font-display"
              style={{ color: c.accent ?? "var(--text-primary)" }}
            >
              {loading ? (
                <span className="skeleton inline-block w-14 h-8 rounded" />
              ) : c.value != null ? (
                `${Number(c.value).toLocaleString()}${c.suffix}`
              ) : (
                "—"
              )}
            </p>
            {c.href && (
              <Link
                href={c.href}
                className="text-xs transition-colors hover:underline"
                style={{ color: "var(--text-faint)" }}
              >
                Batafsil →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* API endpoint */}
      <div className="card p-5 space-y-3">
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          API Manzili
        </h2>
        <div
          className="flex items-center gap-3 rounded-lg px-4 py-3 font-mono text-xs"
          style={{
            background: "rgba(0,0,0,0.25)",
            border: "1px solid var(--border)",
          }}
        >
          <span className="shrink-0" style={{ color: "var(--text-faint)" }}>
            BASE URL
          </span>
          <span
            className="flex-1 truncate"
            style={{ color: "var(--text-secondary)" }}
          >
            https://api-backend-x89g.onrender.com/
            <span style={{ color: "var(--text-primary)" }}>{tenantSlug}</span>
            /...
          </span>
          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `https://api-backend-x89g.onrender.com/${tenantSlug}`,
              )
            }
            className="shrink-0 text-xs px-2 py-1 rounded transition-colors"
            style={{
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Nusxa
          </button>
        </div>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Autentifikatsiya:{" "}
          <code style={{ color: "var(--text-secondary)" }}>
            Authorization: Bearer {"<token>"}
          </code>
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <p className="label mb-3">Tezkor harakatlar</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="card-hover p-4 space-y-3 group block"
            >
              <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                {a.icon}
              </span>
              <div>
                <p
                  className="text-sm font-medium transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {a.label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-faint)" }}
                >
                  {a.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Timeline chart */}
      {overview && overview.timeline.length > 0 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              So'rovlar (oxirgi 30 kun)
            </h2>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-500">
                {overview.stats.successful.toLocaleString()} muvaffaqiyatli
              </span>
              <span className="text-red-500">
                {(
                  overview.stats.client_errors + overview.stats.server_errors
                ).toLocaleString()}{" "}
                xato
              </span>
            </div>
          </div>
          <TimelineChart timeline={overview.timeline} />
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            O'rtacha javob vaqti:{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {overview.stats.avg_duration_ms}ms
            </span>
            {" · "}Maksimal:{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {overview.stats.max_duration_ms}ms
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

function TimelineChart({
  timeline,
}: {
  timeline: { hour: string; requests: string; avg_ms: string }[];
}) {
  const maxVal = Math.max(...timeline.map((t) => parseInt(t.requests) || 0), 1);
  return (
    <div className="flex items-end gap-px h-20">
      {timeline.map((t, i) => {
        const h = Math.max(2, ((parseInt(t.requests) || 0) / maxVal) * 100);
        return (
          <div
            key={i}
            className="flex-1 group relative flex flex-col justify-end"
            title={`${t.hour}: ${t.requests} so'rov, ${t.avg_ms}ms`}
          >
            <div
              className="w-full rounded-sm transition-all"
              style={{
                height: `${h}%`,
                background: "rgba(128,128,128,0.25)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(128,128,128,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(128,128,128,0.25)";
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
