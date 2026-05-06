"use client";
import { useEffect, useState } from "react";
import { analytics, type AnalyticsOverview, type RequestLog } from "@/lib/api";

type Period = "1h" | "24h" | "7d" | "30d";

const METHOD_COLOR: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#f97316",
  DELETE: "#ef4444",
};

function statusBadge(code: number): string {
  if (code < 300) return "badge-green";
  if (code < 400) return "badge-blue";
  if (code < 500) return "badge-yellow";
  return "badge-red";
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("24h");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [reqs, setReqs] = useState<RequestLog[]>([]);
  const [reqMeta, setReqMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [ovLoading, setOvLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(true);

  const loadOverview = async (p: Period) => {
    setOvLoading(true);
    try {
      setOverview(await analytics.overview(p));
    } catch {}
    setOvLoading(false);
  };

  const loadReqs = async (pg = 1) => {
    setReqLoading(true);
    try {
      const res = await analytics.requests(pg, 50);
      setReqs(res.data);
      setReqMeta({
        total: res.meta.total,
        page: res.meta.page,
        totalPages: res.meta.totalPages,
      });
    } catch {}
    setReqLoading(false);
  };

  useEffect(() => {
    loadOverview(period);
  }, [period]);
  useEffect(() => {
    loadReqs(1);
  }, []);

  const timeline = overview?.timeline || [];
  const maxReq = Math.max(...timeline.map((t) => parseInt(t.requests) || 0), 1);

  return (
    <div className="p-6 lg:p-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Analitika</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            So'rovlar statistikasi va monitoring
          </p>
        </div>
        {/* Period selector */}
        <div
          className="flex gap-1 rounded-lg p-1"
          style={{
            background: "rgba(128,128,128,0.10)",
            border: "1px solid var(--border)",
          }}
        >
          {(["1h", "24h", "7d", "30d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                background: period === p ? "var(--accent)" : "transparent",
                color: period === p ? "var(--accent-fg)" : "var(--text-muted)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {ovLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        overview && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  label: "Jami so'rovlar",
                  value: overview.stats.total_requests,
                  color: "var(--text-primary)",
                },
                {
                  label: "Muvaffaqiyatli",
                  value: overview.stats.successful,
                  color: "#10b981",
                },
                {
                  label: "Mijoz xatolari",
                  value: overview.stats.client_errors,
                  color: "#f59e0b",
                },
                {
                  label: "Server xatolari",
                  value: overview.stats.server_errors,
                  color: "#ef4444",
                },
                {
                  label: "O'rtacha vaqt",
                  value: `${overview.stats.avg_duration_ms}ms`,
                  color: "#3b82f6",
                },
                {
                  label: "Maksimal vaqt",
                  value: `${overview.stats.max_duration_ms}ms`,
                  color: "#a855f7",
                },
              ].map((s) => (
                <div key={s.label} className="card p-5 space-y-2">
                  <p className="label">{s.label}</p>
                  <p
                    className="text-2xl font-bold font-display"
                    style={{ color: s.color }}
                  >
                    {typeof s.value === "number"
                      ? s.value.toLocaleString()
                      : s.value}
                  </p>
                </div>
              ))}
            </div>

            {timeline.length > 0 && (
              <div className="card p-5 space-y-4">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  So'rovlar vaqt bo'yicha
                </h2>
                <div className="flex items-end gap-px h-24 w-full">
                  {timeline.map((t, i) => {
                    const h = Math.max(
                      2,
                      ((parseInt(t.requests) || 0) / maxReq) * 100,
                    );
                    return (
                      <div
                        key={i}
                        className="flex-1 group relative flex flex-col justify-end"
                        title={`${t.hour}\n${t.requests} so'rov\n${t.avg_ms}ms`}
                      >
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${h}%`,
                            background: "rgba(128,128,128,0.25)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background =
                              "#10b981";
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
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {timeline.length} soatlik ma'lumot · jami{" "}
                  {timeline
                    .reduce((s, t) => s + (parseInt(t.requests) || 0), 0)
                    .toLocaleString()}{" "}
                  so'rov
                </p>
              </div>
            )}

            {overview.errors.length > 0 && (
              <div className="card p-5 space-y-3">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Xato turlari
                </h2>
                <div className="space-y-2">
                  {overview.errors.map((err) => {
                    const cnt = parseInt(err.count as unknown as string) || 0;
                    const total =
                      overview.stats.client_errors +
                        overview.stats.server_errors || 1;
                    return (
                      <div
                        key={err.status_code}
                        className="flex items-center gap-4"
                      >
                        <span className={statusBadge(err.status_code)}>
                          {err.status_code}
                        </span>
                        <div
                          className="flex-1 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "rgba(128,128,128,0.12)" }}
                        >
                          <div
                            className="h-full bg-red-500/50 rounded-full transition-all"
                            style={{ width: `${(cnt / total) * 100}%` }}
                          />
                        </div>
                        <span
                          className="font-mono text-sm w-10 text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {cnt}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* Request logs */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-2)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            So'rovlar tarixi ·{" "}
            <span style={{ color: "var(--text-muted)" }}>
              {reqMeta.total.toLocaleString()}
            </span>
          </h2>
        </div>

        {reqLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : reqs.length === 0 ? (
          <div
            className="p-10 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            So'rovlar yo'q
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-2)" }}>
                  {["Metod", "Yo'l", "Status", "Vaqt", "IP", "Sana"].map(
                    (h) => (
                      <th key={h} className="table-header">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {reqs.map((r) => (
                  <tr key={r.id} className="table-row-hover">
                    <td className="table-cell">
                      <span
                        className="font-mono text-xs font-bold"
                        style={{
                          color: METHOD_COLOR[r.method] ?? "var(--text-muted)",
                        }}
                      >
                        {r.method}
                      </span>
                    </td>
                    <td
                      className="table-cell font-mono text-xs max-w-[220px] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.path}
                    </td>
                    <td className="table-cell">
                      <span className={statusBadge(r.status_code)}>
                        {r.status_code}
                      </span>
                    </td>
                    <td
                      className="table-cell font-mono text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.duration_ms}ms
                    </td>
                    <td
                      className="table-cell font-mono text-xs"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {r.ip_address}
                    </td>
                    <td
                      className="table-cell text-xs whitespace-nowrap"
                      style={{ color: "var(--text-faint)" }}
                    >
                      {new Date(r.created_at).toLocaleString("uz-UZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reqMeta.totalPages > 1 && (
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border-2)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              {reqMeta.page}/{reqMeta.totalPages} · {reqMeta.total} jami
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadReqs(reqMeta.page - 1)}
                disabled={reqMeta.page === 1}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30"
              >
                ← Oldingi
              </button>
              <button
                onClick={() => loadReqs(reqMeta.page + 1)}
                disabled={reqMeta.page === reqMeta.totalPages}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30"
              >
                Keyingi →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
