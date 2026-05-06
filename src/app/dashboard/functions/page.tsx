"use client";
import { useEffect, useState } from "react";
import { edgeFunctions, type EdgeFunction } from "@/lib/api";
import { useOnboarding } from "@/components/OnboardingTour";

const STARTER = `// Edge funksiya — req.body dan ma'lumot oling, return bilan javob yuboring

const { name } = req.body || {};
return {
  message: \`Salom, \${name || "Dunyo"}!\`,
  timestamp: new Date().toISOString(),
};`;

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
      <div className="modal max-w-2xl">
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

export default function FunctionsPage() {
  const { startModalTour } = useOnboarding();
  const [list, setList] = useState<EdgeFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EdgeFunction | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [invokePayload, setInvokePayload] = useState("{}");
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invoking, setInvoking] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sourceCode: STARTER,
    memoryMb: 128,
    timeoutMs: 5000,
  });
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setList(await edgeFunctions.list());
    } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setShowCreate(true);
    startModalTour("create-function");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setCreating(true);
    try {
      await edgeFunctions.create(form.name, form.slug, form.sourceCode, {
        memoryMb: form.memoryMb,
        timeoutMs: form.timeoutMs,
      });
      await load();
      setShowCreate(false);
      setForm({
        name: "",
        slug: "",
        sourceCode: STARTER,
        memoryMb: 128,
        timeoutMs: 5000,
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Xato");
    }
    setCreating(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Funksiyani o'chirasizmi?")) return;
    try {
      await edgeFunctions.delete(slug);
      setList((l) => l.filter((f) => f.slug !== slug));
      if (selected?.slug === slug) {
        setSelected(null);
        setInvokeResult(null);
      }
    } catch {}
  };

  const handleInvoke = async () => {
    if (!selected) return;
    setInvoking(true);
    setInvokeResult(null);
    try {
      let payload: unknown = {};
      try {
        payload = JSON.parse(invokePayload);
      } catch {
        payload = {};
      }
      const result = await edgeFunctions.invoke(selected.slug, payload);
      setInvokeResult(JSON.stringify(result, null, 2));
    } catch (e: unknown) {
      setInvokeResult(
        `Xato: ${e instanceof Error ? e.message : "Noma'lum xato"}`,
      );
    }
    setInvoking(false);
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Edge Funksiyalar</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Serverless JavaScript funksiyalarini yozing va chaqiring
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + Yangi funksiya
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card p-14 flex flex-col items-center text-center space-y-4">
          <div className="text-5xl opacity-20">◧</div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Funksiyalar yo'q
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Serverless funksiya yozing va API orqali chaqiring
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary">
            Funksiya yaratish
          </button>
        </div>
      ) : (
        <div className="flex gap-5 flex-col lg:flex-row">
          <div className="lg:w-56 space-y-1.5 shrink-0">
            {list.map((fn) => (
              <div
                key={fn.id}
                onClick={() => {
                  setSelected(fn);
                  setInvokeResult(null);
                }}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background:
                    selected?.id === fn.id
                      ? "rgba(128,128,128,0.15)"
                      : "var(--bg-surface)",
                  border: `1px solid ${selected?.id === fn.id ? "var(--text-faint)" : "var(--border)"}`,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {fn.name}
                  </p>
                  <p
                    className="text-xs font-mono"
                    style={{ color: "var(--text-faint)" }}
                  >
                    v{fn.version} · {fn.trigger_type}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(fn.slug);
                  }}
                  className="ml-2 shrink-0 text-xs transition-colors"
                  style={{ color: "var(--text-faint)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--text-faint)";
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {selected ? (
            <div className="flex-1 card overflow-hidden">
              <div
                className="px-5 py-4"
                style={{ borderBottom: "1px solid var(--border-2)" }}
              >
                <h2
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selected.name}
                </h2>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  /{selected.slug} · v{selected.version}
                </p>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="label">Payload (JSON)</label>
                  <textarea
                    value={invokePayload}
                    onChange={(e) => setInvokePayload(e.target.value)}
                    className="input-dark font-mono text-xs h-28 resize-none"
                    spellCheck={false}
                  />
                </div>
                <button
                  onClick={handleInvoke}
                  disabled={invoking}
                  className="btn-primary w-auto px-6"
                >
                  {invoking ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Chaqirilmoqda...
                    </span>
                  ) : (
                    "▶ Chaqirish"
                  )}
                </button>
                {invokeResult !== null && (
                  <div className="space-y-1.5">
                    <label className="label">Natija</label>
                    <pre
                      className="rounded-lg p-4 font-mono text-xs overflow-auto max-h-56"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--border)",
                        color: invokeResult.startsWith("Xato")
                          ? "#ef4444"
                          : "var(--text-secondary)",
                      }}
                    >
                      {invokeResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="flex-1 card flex items-center justify-center text-sm p-12"
              style={{ color: "var(--text-muted)" }}
            >
              Chap tarafdan funksiya tanlang
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Yangi Funksiya"
          onClose={() => {
            setShowCreate(false);
            setErr("");
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Nom</label>
                <input
                  type="text"
                  placeholder="Salomlash"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="input-dark"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="label">Slug (URL)</label>
                <input
                  type="text"
                  placeholder="salomlash"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  className="input-dark font-mono text-xs"
                  required
                  pattern="[a-z0-9][a-z0-9-]*"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Xotira (MB)</label>
                <input
                  type="number"
                  value={form.memoryMb}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      memoryMb: parseInt(e.target.value) || 128,
                    }))
                  }
                  className="input-dark"
                  min={64}
                  max={2048}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Timeout (ms)</label>
                <input
                  type="number"
                  value={form.timeoutMs}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      timeoutMs: parseInt(e.target.value) || 5000,
                    }))
                  }
                  className="input-dark"
                  min={100}
                  max={30000}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="label">Kod (JavaScript)</label>
              <textarea
                value={form.sourceCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sourceCode: e.target.value }))
                }
                className="input-dark font-mono text-xs h-52 resize-none"
                required
                spellCheck={false}
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
