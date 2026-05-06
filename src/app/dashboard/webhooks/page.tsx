"use client";
import { useEffect, useState } from "react";
import { webhooks, type Webhook } from "@/lib/api";
import { useOnboarding } from "@/components/OnboardingTour";

const EVENTS = [
  "collection.created",
  "collection.updated",
  "collection.deleted",
  "user.registered",
  "user.login",
  "api_key.created",
  "api_key.deleted",
];

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
            className="text-xl leading-none"
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

export default function WebhooksPage() {
  const { startModalTour } = useOnboarding();
  const [list, setList] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setList(await webhooks.list());
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setShowCreate(true);
    startModalTour("create-webhook");
  };

  const toggleEvent = (ev: string) =>
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev)
        ? f.events.filter((e) => e !== ev)
        : [...f.events, ev],
    }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!form.events.length) {
      setErr("Kamida 1 ta hodisa tanlang");
      return;
    }
    setCreating(true);
    try {
      const res = await webhooks.create(form.name, form.url, form.events);
      setSecret(res.secret);
      setShowCreate(false);
      setForm({ name: "", url: "", events: [] });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Xato");
    }
    setCreating(false);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await webhooks.toggle(id, !enabled);
      setList((l) =>
        l.map((w) => (w.id === id ? { ...w, enabled: !enabled } : w)),
      );
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Webhookni o'chirasizmi?")) return;
    try {
      await webhooks.delete(id);
      setList((l) => l.filter((w) => w.id !== id));
    } catch {}
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Webhooklar</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Hodisalarga asoslangan integratsiyalar
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Yangi webhook
        </button>
      </div>

      {secret && (
        <div
          className="card p-5 mb-5 space-y-3 animate-slide-up"
          style={{
            borderColor: "rgba(16,185,129,0.3)",
            background: "rgba(16,185,129,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-500">
              ✓ Webhook yaratildi — sirni saqlang!
            </p>
            <button
              onClick={() => setSecret(null)}
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
              {secret}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(secret)}
              className="text-xs px-2 py-1 rounded"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              Nusxa
            </button>
          </div>
          <p className="text-xs text-amber-500">
            ⚠ Bu sir qayta ko'rsatilmaydi
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card p-14 flex flex-col items-center text-center space-y-4">
          <div className="text-5xl opacity-20">◉</div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Hali webhook yo'q
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Tashqi integratsiyalar uchun webhook yarating
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary">
            Webhook yaratish
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((wh) => (
            <div key={wh.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {wh.name}
                    </span>
                    <span className={wh.enabled ? "badge-green" : "badge-gray"}>
                      {wh.enabled ? "Faol" : "O'chirilgan"}
                    </span>
                    {wh.failure_count > 0 && (
                      <span className="badge-red">{wh.failure_count} xato</span>
                    )}
                  </div>
                  <p
                    className="font-mono text-xs truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {wh.url}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {wh.events.map((ev) => (
                      <span key={ev} className="badge-gray mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                  {wh.last_triggered && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-faint)" }}
                    >
                      Oxirgi:{" "}
                      {new Date(wh.last_triggered).toLocaleString("uz-UZ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(wh.id, wh.enabled)}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    {wh.enabled ? "O'chirish" : "Yoqish"}
                  </button>
                  <button
                    onClick={() => handleDelete(wh.id)}
                    className="btn-danger"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Yangi Webhook"
          onClose={() => {
            setShowCreate(false);
            setErr("");
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="label">Nom</label>
              <input
                type="text"
                placeholder="Mening Webhookim"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="input-dark"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label">URL</label>
              <input
                type="url"
                placeholder="https://example.com/webhook"
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                className="input-dark font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label">Hodisalar</label>
              <div className="grid grid-cols-2 gap-1.5">
                {EVENTS.map((ev) => (
                  <label
                    key={ev}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs"
                    style={{
                      background: form.events.includes(ev)
                        ? "rgba(128,128,128,0.15)"
                        : "rgba(128,128,128,0.07)",
                      border: `1px solid ${form.events.includes(ev) ? "var(--text-faint)" : "var(--border)"}`,
                      color: form.events.includes(ev)
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.events.includes(ev)}
                      onChange={() => toggleEvent(ev)}
                      className="w-3 h-3 accent-zinc-500"
                    />
                    <span className="font-mono">{ev}</span>
                  </label>
                ))}
              </div>
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
