"use client";
import { useEffect, useState } from "react";
import { notifications, type NotifLog, type NotifTemplate } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  sent: "badge-green", delivered: "badge-green",
  pending: "badge-yellow", failed: "badge-red",
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [logs, setLogs]       = useState<NotifLog[]>([]);
  const [templates, setTemplates] = useState<NotifTemplate[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [toast, setToast]     = useState("");

  const [sendForm, setSendForm] = useState({ to: "", channel: "email", template: "", subject: "", body: "" });
  const [tmplForm, setTmplForm] = useState({ name: "", channel: "email", subject: "", bodyHtml: "", bodyText: "" });
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");

  const loadLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await notifications.logs(p, 20);
      setLogs(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  const loadTemplates = async () => {
    try { setTemplates(await notifications.listTemplates()); } catch {}
  };

  useEffect(() => { loadLogs(1); loadTemplates(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendErr("");
    setSending(true);
    try {
      const toList = sendForm.to.split(",").map(s => s.trim()).filter(Boolean);
      await notifications.send({
        to: toList,
        channel: sendForm.channel,
        template: sendForm.template || undefined,
        subject: sendForm.subject || undefined,
        body: sendForm.body || undefined,
      });
      setToast("Bildirishnoma yuborildi!");
      setTimeout(() => setToast(""), 3000);
      setShowSend(false);
      setSendForm({ to: "", channel: "email", template: "", subject: "", body: "" });
      loadLogs(1);
    } catch (e: unknown) { setSendErr(e instanceof Error ? e.message : "Xato"); }
    setSending(false);
  };

  const handleTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notifications.createTemplate(tmplForm);
      setShowTemplate(false);
      setTmplForm({ name: "", channel: "email", subject: "", bodyHtml: "", bodyText: "" });
      loadTemplates();
      setToast("Shablon yaratildi!");
      setTimeout(() => setToast(""), 3000);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Xato"); }
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Bildirishnomalar</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Email, SMS va push bildirishnomalarini boshqaring</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplate(true)} className="btn-ghost">Shablon</button>
          <button onClick={() => setShowSend(true)} className="btn-primary">Yuborish</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="card p-4 mb-5 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm animate-slide-up">
          ✓ {toast}
        </div>
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <div className="card p-5 mb-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Shablonlar ({templates.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {templates.map(t => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 space-y-0.5">
                <p className="text-white text-xs font-medium">{t.name}</p>
                <p className="text-zinc-500 text-xs">{t.channel} · v{t.version}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-semibold text-white">
            Yuborish tarixi · <span className="text-zinc-500">{total}</span>
          </h2>
        </div>

        {loading ? (
          <div className="p-6 space-y-2">{[1,2,3].map(i=><div key={i} className="skeleton h-10 rounded-lg"/>)}</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-zinc-600 text-sm">Hali bildirishnomalar yo'q</p>
            <button onClick={() => setShowSend(true)} className="text-zinc-400 text-xs hover:text-white transition-colors">
              Birinchi bildirishnomani yuboring →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1c1c1c]">
                  {["Kanal","Qabul qiluvchi","Holat","Vaqt"].map(h=>(
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-[#141414] hover:bg-white/5 transition-colors">
                    <td className="table-cell"><span className="badge-gray">{log.channel}</span></td>
                    <td className="table-cell font-mono text-xs text-zinc-400 max-w-[200px] truncate">{log.recipient}</td>
                    <td className="table-cell">
                      <span className={STATUS_BADGE[log.status] || "badge-gray"}>{log.status}</span>
                    </td>
                    <td className="table-cell text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("uz-UZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#1c1c1c] flex items-center justify-between">
            <span className="text-zinc-600 text-xs">{page}/{totalPages} · {total} jami</span>
            <div className="flex gap-2">
              <button onClick={() => loadLogs(page-1)} disabled={page===1}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30">← Oldingi</button>
              <button onClick={() => loadLogs(page+1)} disabled={page===totalPages}
                className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30">Keyingi →</button>
            </div>
          </div>
        )}
      </div>

      {/* Send modal */}
      {showSend && (
        <Modal title="Bildirishnoma yuborish" onClose={() => { setShowSend(false); setSendErr(""); }}>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-1">
              <label className="label">Qabul qiluvchilar (vergul bilan)</label>
              <input type="text" placeholder="user@example.com, user2@example.com" value={sendForm.to}
                onChange={e => setSendForm(f=>({...f,to:e.target.value}))} className="input-dark" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Kanal</label>
                <select value={sendForm.channel}
                  onChange={e => setSendForm(f=>({...f,channel:e.target.value}))} className="input-dark">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
              </div>
              {templates.length > 0 && (
                <div className="space-y-1">
                  <label className="label">Shablon (ixtiyoriy)</label>
                  <select value={sendForm.template}
                    onChange={e => setSendForm(f=>({...f,template:e.target.value}))} className="input-dark text-xs">
                    <option value="">— Shablonsiz —</option>
                    {templates.map(t=><option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="label">Mavzu</label>
              <input type="text" placeholder="Bildirishnoma mavzusi" value={sendForm.subject}
                onChange={e => setSendForm(f=>({...f,subject:e.target.value}))} className="input-dark" />
            </div>
            <div className="space-y-1">
              <label className="label">Xabar matni</label>
              <textarea placeholder="Xabar matni..." value={sendForm.body}
                onChange={e => setSendForm(f=>({...f,body:e.target.value}))}
                className="input-dark h-24 resize-none" />
            </div>
            {sendErr && <p className="text-red-400 text-sm">{sendErr}</p>}
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1" disabled={sending}>
                {sending ? "Yuborilmoqda..." : "Yuborish"}
              </button>
              <button type="button" onClick={() => setShowSend(false)} className="btn-ghost">Bekor</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Template modal */}
      {showTemplate && (
        <Modal title="Shablon yaratish" onClose={() => setShowTemplate(false)}>
          <form onSubmit={handleTemplate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Nom</label>
                <input type="text" placeholder="xush-kelibsiz" value={tmplForm.name}
                  onChange={e => setTmplForm(f=>({...f,name:e.target.value}))}
                  className="input-dark font-mono text-xs" required />
              </div>
              <div className="space-y-1">
                <label className="label">Kanal</label>
                <select value={tmplForm.channel}
                  onChange={e => setTmplForm(f=>({...f,channel:e.target.value}))} className="input-dark">
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="label">Mavzu</label>
              <input type="text" placeholder="Xush kelibsiz, {{name}}!" value={tmplForm.subject}
                onChange={e => setTmplForm(f=>({...f,subject:e.target.value}))} className="input-dark" />
            </div>
            <div className="space-y-1">
              <label className="label">HTML matni</label>
              <textarea placeholder="<p>Salom {{name}}, xush kelibsiz!</p>" value={tmplForm.bodyHtml}
                onChange={e => setTmplForm(f=>({...f,bodyHtml:e.target.value}))}
                className="input-dark font-mono text-xs h-24 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary flex-1">Saqlash</button>
              <button type="button" onClick={() => setShowTemplate(false)} className="btn-ghost">Bekor</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
