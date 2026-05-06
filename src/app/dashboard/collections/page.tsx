"use client";
import { useEffect, useState, useCallback } from "react";
import { collections, type Collection, type Field, ApiError } from "@/lib/api";
import { useOnboarding } from "@/components/OnboardingTour";

const FIELD_TYPES = [
  "string",
  "number",
  "boolean",
  "date",
  "datetime",
  "json",
  "array",
  "relation",
  "file",
];
const emptyField = (): Field => ({
  name: "",
  type: "string",
  required: false,
  unique: false,
});

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

export default function CollectionsPage() {
  const { startModalTour } = useOnboarding();
  const [schemas, setSchemas] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [recMeta, setRecMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [cName, setCName] = useState("");
  const [cDisplay, setCDisplay] = useState("");
  const [fields, setFields] = useState<Field[]>([emptyField()]);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [newRecord, setNewRecord] = useState<Record<string, string>>({});
  const [addingRec, setAddingRec] = useState(false);

  const fetchSchemas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collections.listSchemas();
      setSchemas(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, []);

  const fetchRecords = useCallback(async (col: Collection, page = 1) => {
    setRecLoading(true);
    try {
      const res = await collections.list(col.name, { page, limit: 20 });
      setRecords(res.data);
      setRecMeta({
        total: res.meta.total,
        page: res.meta.page,
        totalPages: res.meta.totalPages,
      });
    } catch {
      setRecords([]);
    }
    setRecLoading(false);
  }, []);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const selectCol = (col: Collection) => {
    setSelected(col);
    setNewRecord({});
    fetchRecords(col, 1);
  };

  const openCreate = () => {
    setShowCreate(true);
    startModalTour("create-collection");
  };

  const deleteSchema = async (name: string) => {
    if (
      !confirm(
        `"${name}" kolleksiyasini o'chirasizmi? Barcha ma'lumotlar o'chadi!`,
      )
    )
      return;
    try {
      await collections.deleteSchema(name);
      setSchemas((s) => s.filter((c) => c.name !== name));
      if (selected?.name === name) setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xato");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr("");
    if (!cName.trim() || !cDisplay.trim()) {
      setCreateErr("Ikkala nom ham kiritilishi shart");
      return;
    }
    setCreating(true);
    try {
      await collections.createSchema(
        cName.trim(),
        cDisplay.trim(),
        fields.filter((f) => f.name.trim()),
      );
      await fetchSchemas();
      setShowCreate(false);
      setCName("");
      setCDisplay("");
      setFields([emptyField()]);
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : "Xato");
    }
    setCreating(false);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setAddingRec(true);
    try {
      const payload: Record<string, unknown> = {};
      const sf = selected.schema_def?.fields || [];
      for (const [k, v] of Object.entries(newRecord)) {
        const fd = sf.find((f) => f.name === k);
        if (fd?.type === "number") payload[k] = parseFloat(v) || 0;
        else if (fd?.type === "boolean") payload[k] = v === "true";
        else if (fd?.type === "json" || fd?.type === "array") {
          try {
            payload[k] = JSON.parse(v);
          } catch {
            payload[k] = v;
          }
        } else payload[k] = v;
      }
      await collections.create(selected.name, payload);
      setShowAddRecord(false);
      setNewRecord({});
      fetchRecords(selected, 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xato");
    }
    setAddingRec(false);
  };

  const deleteRecord = async (id: string) => {
    if (!selected || !confirm("Yozuvni o'chirasizmi?")) return;
    try {
      await collections.delete(selected.name, id);
      fetchRecords(selected, recMeta.page);
    } catch {}
  };

  const schemaFields = selected?.schema_def?.fields || [];

  if (loading)
    return (
      <div className="p-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Kolleksiyalar</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Ma'lumotlar bazasi jadvallarini boshqaring
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <span>+</span> Yangi kolleksiya
        </button>
      </div>

      {schemas.length === 0 ? (
        <div className="card p-14 flex flex-col items-center text-center space-y-4">
          <div className="text-5xl opacity-20">⬡</div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              Hali kolleksiya yo'q
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Birinchi jadvalingizni yarating
            </p>
          </div>
          <button onClick={openCreate} className="btn-primary">
            Kolleksiya yaratish
          </button>
        </div>
      ) : (
        <div className="flex gap-5 flex-col lg:flex-row">
          <div className="lg:w-56 space-y-1.5 shrink-0">
            {schemas.map((col) => (
              <div
                key={col.id}
                onClick={() => selectCol(col)}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background:
                    selected?.id === col.id
                      ? "rgba(128,128,128,0.15)"
                      : "var(--bg-surface)",
                  border: `1px solid ${selected?.id === col.id ? "var(--text-faint)" : "var(--border)"}`,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {col.display_name}
                  </p>
                  <p
                    className="text-xs font-mono truncate"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {col.name}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSchema(col.name);
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
                className="px-5 py-4 flex items-center justify-between gap-3"
                style={{ borderBottom: "1px solid var(--border-2)" }}
              >
                <div>
                  <h2
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {selected.display_name}
                  </h2>
                  <p
                    className="text-xs font-mono mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {recMeta.total} yozuv · {schemaFields.length} maydon
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {schemaFields.slice(0, 4).map((f) => (
                      <span key={f.name} className="badge-gray font-mono">
                        {f.name}
                      </span>
                    ))}
                    {schemaFields.length > 4 && (
                      <span className="badge-gray">
                        +{schemaFields.length - 4}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setNewRecord({});
                      setShowAddRecord(true);
                    }}
                    className="btn-primary py-2 px-3 text-xs"
                  >
                    + Yozuv
                  </button>
                </div>
              </div>

              {recLoading ? (
                <div className="p-6 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton h-10 rounded-lg" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="p-14 text-center">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Yozuvlar yo'q
                  </p>
                  <button
                    onClick={() => setShowAddRecord(true)}
                    className="mt-3 text-xs transition-colors"
                    style={{ color: "var(--text-faint)" }}
                  >
                    + Birinchi yozuvni qo'shing
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-2)" }}>
                        {Object.keys(records[0]).map((k) => (
                          <th key={k} className="table-header">
                            {k}
                          </th>
                        ))}
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, ri) => (
                        <tr
                          key={String(rec.id ?? ri)}
                          className="table-row-hover"
                        >
                          {Object.values(rec).map((val, ci) => (
                            <td
                              key={ci}
                              className="table-cell font-mono text-xs max-w-[180px] truncate"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {val === null || val === undefined ? (
                                <span style={{ color: "var(--text-faint)" }}>
                                  null
                                </span>
                              ) : typeof val === "object" ? (
                                <span style={{ color: "var(--text-muted)" }}>
                                  {JSON.stringify(val).slice(0, 40)}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          ))}
                          <td className="table-cell">
                            <button
                              onClick={() => deleteRecord(String(rec.id))}
                              className="transition-colors"
                              style={{ color: "var(--text-faint)" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.color =
                                  "#ef4444";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.color =
                                  "var(--text-faint)";
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {recMeta.totalPages > 1 && (
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid var(--border-2)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {recMeta.page}/{recMeta.totalPages} · {recMeta.total} jami
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchRecords(selected, recMeta.page - 1)}
                      disabled={recMeta.page === 1}
                      className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30"
                    >
                      ← Oldingi
                    </button>
                    <button
                      onClick={() => fetchRecords(selected, recMeta.page + 1)}
                      disabled={recMeta.page === recMeta.totalPages}
                      className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30"
                    >
                      Keyingi →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex-1 card flex items-center justify-center text-sm p-12"
              style={{ color: "var(--text-muted)" }}
            >
              Chap tarafdan kolleksiya tanlang
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <Modal
          title="Yangi Kolleksiya"
          onClose={() => {
            setShowCreate(false);
            setCreateErr("");
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Kod nomi</label>
                <input
                  type="text"
                  placeholder="products"
                  value={cName}
                  onChange={(e) =>
                    setCName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                  }
                  className="input-dark font-mono text-xs"
                  required
                  pattern="[a-zA-Z][a-zA-Z0-9_]*"
                />
              </div>
              <div className="space-y-1">
                <label className="label">Ko'rsatma nomi</label>
                <input
                  type="text"
                  placeholder="Mahsulotlar"
                  value={cDisplay}
                  onChange={(e) => setCDisplay(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label">Maydonlar</label>
                <button
                  type="button"
                  onClick={() => setFields((f) => [...f, emptyField()])}
                  className="text-xs transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  + Qo'shish
                </button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {fields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="maydon_nomi"
                      value={f.name}
                      onChange={(e) =>
                        setFields((fs) =>
                          fs.map((fi, idx) =>
                            idx === i ? { ...fi, name: e.target.value } : fi,
                          ),
                        )
                      }
                      className="input-dark font-mono text-xs flex-1 py-2"
                    />
                    <select
                      value={f.type}
                      onChange={(e) =>
                        setFields((fs) =>
                          fs.map((fi, idx) =>
                            idx === i
                              ? { ...fi, type: e.target.value as Field["type"] }
                              : fi,
                          ),
                        )
                      }
                      className="input-dark text-xs w-28 py-2 shrink-0"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <label
                      className="flex items-center gap-1 text-xs whitespace-nowrap shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <input
                        type="checkbox"
                        checked={!!f.required}
                        onChange={(e) =>
                          setFields((fs) =>
                            fs.map((fi, idx) =>
                              idx === i
                                ? { ...fi, required: e.target.checked }
                                : fi,
                            ),
                          )
                        }
                        className="w-3 h-3 accent-zinc-500"
                      />
                      Shart
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFields((fs) => fs.filter((_, idx) => idx !== i))
                      }
                      className="transition-colors shrink-0"
                      style={{ color: "var(--text-faint)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color =
                          "#ef4444";
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
            </div>
            {createErr && <p className="text-sm text-red-500">{createErr}</p>}
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

      {showAddRecord && selected && (
        <Modal
          title={`Yangi yozuv — ${selected.display_name}`}
          onClose={() => setShowAddRecord(false)}
        >
          <form onSubmit={handleAddRecord} className="space-y-3">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {schemaFields.map((f) => (
                <div key={f.name} className="space-y-1">
                  <label className="label">
                    {f.name}{" "}
                    <span
                      className="normal-case font-normal"
                      style={{ color: "var(--text-faint)" }}
                    >
                      ({f.type})
                    </span>
                    {f.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {f.type === "boolean" ? (
                    <select
                      value={newRecord[f.name] ?? "false"}
                      onChange={(e) =>
                        setNewRecord((r) => ({
                          ...r,
                          [f.name]: e.target.value,
                        }))
                      }
                      className="input-dark text-xs py-2"
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  ) : (
                    <input
                      type={
                        f.type === "number"
                          ? "number"
                          : f.type === "date"
                            ? "date"
                            : f.type === "datetime"
                              ? "datetime-local"
                              : "text"
                      }
                      placeholder={
                        f.type === "json"
                          ? '{"key":"value"}'
                          : f.type === "array"
                            ? '["a","b"]'
                            : f.name
                      }
                      value={newRecord[f.name] ?? ""}
                      onChange={(e) =>
                        setNewRecord((r) => ({
                          ...r,
                          [f.name]: e.target.value,
                        }))
                      }
                      className="input-dark text-xs py-2 font-mono"
                      required={f.required}
                    />
                  )}
                </div>
              ))}
              {schemaFields.length === 0 && (
                <p
                  className="text-sm text-center py-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Bu kolleksiyada maydonlar yo'q
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={addingRec}
              >
                {addingRec ? "Saqlanmoqda..." : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddRecord(false)}
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
