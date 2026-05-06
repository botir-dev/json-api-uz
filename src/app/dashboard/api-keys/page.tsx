"use client";
import { useEffect, useState } from "react";
import { apiKeys, type ApiKey } from "@/lib/api";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("uz-UZ");
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2
            className="font-display text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    rateLimitPerMin: 100,
    expiresAt: "",
    permissions: "",
  });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setKeys(await apiKeys.list());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setCreating(true);
    try {
      const perms = form.permissions
        ? form.permissions
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : undefined;
      const res = await apiKeys.create(
        form.name,
        perms,
        form.expiresAt || undefined,
        form.rateLimitPerMin,
      );
      setNewKey(res.key);
      setShowCreate(false);
      setForm({
        name: "",
        rateLimitPerMin: 100,
        expiresAt: "",
        permissions: "",
      });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Xato");
    }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("API kalitni o'chirasizmi?")) return;
    try {
      await apiKeys.delete(id);
      setKeys((k) => k.filter((x) => x.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Xato");
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">API Kalitlari</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Ilovangiz uchun xavfsiz API kalitlarini yarating
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + Yangi kalit
        </button>
      </div>

      {newKey && (
        <div
          className="card p-5 mb-5 space-y-3 animate-slide-up"
          style={{
            borderColor: "rgba(16,185,129,0.3)",
            background: "rgba(16,185,129,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-500">
              ✓ Yangi API kalit yaratildi
            </p>
            <button
              onClick={() => setNewKey(null)}
              className="text-xl leading-none"
              style={{ color: "var(--text-muted)" }}
            >
              ×
            </button>
          </div>
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{
              background: "rgba(0,0,0,0.25)",
              border: "1px solid var(--border)",
            }}
          >
            <code
              className="font-mono text-xs flex-1 break-all"
              style={{ color: "var(--text-primary)" }}
            >
              {newKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="text-xs px-2 py-1 rounded shrink-0 transition-colors"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              Nusxa
            </button>
          </div>
          <p className="text-xs text-amber-500 flex items-center gap-1.5">
            <span>⚠</span> Bu kalit faqat bir marta ko'rsatiladi — hoziroq
            saqlang!
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="card p-14 flex flex-col items-center text-center space-y-4">
          <div className="text-5xl opacity-20">◆</div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              API kalitlar yo'q
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Ilovangizga kirish uchun kalit yarating
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Kalit yaratish
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => {
            const expired =
              key.expires_at && new Date(key.expires_at) < new Date();
            return (
              <div
                key={key.id}
                className="card p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {key.name}
                    </span>
                    {expired ? (
                      <span className="badge-red">Muddati o'tgan</span>
                    ) : (
                      <span className="badge-green">Faol</span>
                    )}
                  </div>
                  <div
                    className="flex flex-wrap gap-x-5 gap-y-1 text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <code className="font-mono">
                      {key.key_prefix}••••••••••••
                    </code>
                    <span>{key.rate_limit_per_min} req/min</span>
                    <span>{key.usage_count.toLocaleString()} ishlatilgan</span>
                    <span>Yaratilgan: {fmt(key.created_at)}</span>
                    {key.expires_at && (
                      <span>Tugaydi: {fmt(key.expires_at)}</span>
                    )}
                    {key.last_used_at && (
                      <span>Oxirgi: {fmt(key.last_used_at)}</span>
                    )}
                  </div>
                  {key.permissions?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {key.permissions.map((p) => (
                        <span key={p} className="badge-gray">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="btn-danger shrink-0"
                >
                  O'chirish
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Yangi API Kalit"
          onClose={() => {
            setShowCreate(false);
            setErr("");
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="label">Kalit nomi</label>
              <input
                type="text"
                placeholder="Mobil Ilova"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="input-dark"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label">Tezlik chegarasi (so'rov/min)</label>
              <input
                type="number"
                value={form.rateLimitPerMin}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    rateLimitPerMin: parseInt(e.target.value) || 100,
                  }))
                }
                className="input-dark"
                min={1}
                max={10000}
              />
            </div>
            <div className="space-y-1">
              <label className="label">Muddati (ixtiyoriy)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiresAt: e.target.value }))
                }
                className="input-dark text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="label">
                Ruxsatlar (vergul bilan, ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="read, write, delete"
                value={form.permissions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, permissions: e.target.value }))
                }
                className="input-dark"
              />
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={creating}
              >
                {creating ? "Yaratilmoqda..." : "Yaratish"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-ghost"
              >
                Bekor
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
