"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { tenants, analytics, type AnalyticsOverview } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user, tenantSlug } = useAuth();
  const [stats, setStats]     = useState<{ users: number; collections: number; requests30d: number } | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading]  = useState(true);

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
    ? Math.round((overview.stats.successful / overview.stats.total_requests) * 100)
    : null;

  const statCards = [
    { label: "Foydalanuvchilar", value: stats?.users,        suffix: "", href: null,                       color: "text-white" },
    { label: "Kolleksiyalar",    value: stats?.collections,  suffix: "", href: "/dashboard/collections",   color: "text-white" },
    { label: "So'rovlar (30d)", value: overview?.stats.total_requests, suffix: "", href: "/dashboard/analytics", color: "text-white" },
    { label: "Muvaffaqiyat",    value: successRate,           suffix: "%",href: "/dashboard/analytics",    color: successRate && successRate > 90 ? "text-emerald-400" : "text-yellow-400" },
  ];

  const quickActions = [
    { href: "/dashboard/collections",   label: "Kolleksiya yaratish",  desc: "Ma'lumotlar jadvali",      icon: "⬡" },
    { href: "/dashboard/api-keys",      label: "API kalit yaratish",   desc: "Xavfsiz kirish kaliti",    icon: "◆" },
    { href: "/dashboard/webhooks",      label: "Webhook qo'shish",     desc: "Hodisalarga obuna",         icon: "◉" },
    { href: "/dashboard/functions",     label: "Funksiya yozish",      desc: "Serverless kod",            icon: "◧" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">
          {user?.full_name ? `Salom, ${user.full_name.split(" ")[0]} 👋` : "Bosh sahifa"}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Tenant: <code className="font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded">{tenantSlug}</code>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="card p-5 space-y-3">
            <p className="label">{c.label}</p>
            <p className={`text-3xl font-bold font-display ${c.color}`}>
              {loading ? (
                <span className="skeleton inline-block w-14 h-8 rounded" />
              ) : c.value !== null && c.value !== undefined ? (
                `${Number(c.value).toLocaleString()}${c.suffix}`
              ) : "—"}
            </p>
            {c.href && (
              <Link href={c.href} className="text-zinc-600 text-xs hover:text-zinc-300 transition-colors">
                Batafsil →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* API endpoint */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white">API Manzili</h2>
        <div className="flex items-center gap-3 bg-black/50 border border-white/5 rounded-lg px-4 py-3 font-mono text-xs">
          <span className="text-zinc-500 shrink-0">BASE URL</span>
          <span className="text-zinc-300 flex-1 truncate">
            https://api-backend-x89g.onrender.com/<span className="text-white">{tenantSlug}</span>/...
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(`https://api-backend-x89g.onrender.com/${tenantSlug}`)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
          >
            Nusxa
          </button>
        </div>
        <p className="text-zinc-600 text-xs">
          Autentifikatsiya: <code className="text-zinc-400">Authorization: Bearer {"<token>"}</code>
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="label mb-3">Tezkor harakatlar</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(a => (
            <Link key={a.href} href={a.href} className="card-hover p-4 space-y-3 group block">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">{a.label}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Timeline chart */}
      {overview && overview.timeline.length > 0 && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">So'rovlar (oxirgi 30 kun)</h2>
            <div className="flex gap-4 text-xs">
              <span className="text-emerald-400">{overview.stats.successful.toLocaleString()} muvaffaqiyatli</span>
              <span className="text-red-400">{(overview.stats.client_errors + overview.stats.server_errors).toLocaleString()} xato</span>
            </div>
          </div>
          <TimelineChart timeline={overview.timeline} />
          <p className="text-zinc-600 text-xs">
            O'rtacha javob vaqti: <span className="text-zinc-400">{overview.stats.avg_duration_ms}ms</span>
            {" · "}Maksimal: <span className="text-zinc-400">{overview.stats.max_duration_ms}ms</span>
          </p>
        </div>
      )}
    </div>
  );
}

function TimelineChart({ timeline }: { timeline: { hour: string; requests: string; avg_ms: string }[] }) {
  const maxVal = Math.max(...timeline.map(t => parseInt(t.requests) || 0), 1);
  return (
    <div className="flex items-end gap-px h-20">
      {timeline.map((t, i) => {
        const h = Math.max(2, ((parseInt(t.requests) || 0) / maxVal) * 100);
        return (
          <div key={i} className="flex-1 group relative flex flex-col justify-end"
            title={`${t.hour}: ${t.requests} so'rov, ${t.avg_ms}ms`}>
            <div
              className="w-full bg-white/20 rounded-sm transition-all group-hover:bg-white/50"
              style={{ height: `${h}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
