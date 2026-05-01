"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, tenants, ApiError } from "@/lib/api";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function Spinner() {
  return <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ projectName: "", name: "", email: "", password: "", confirm: "" });
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");

  const onProject = (v: string) => {
    setForm(f => ({ ...f, projectName: v }));
    setSlug(slugify(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Parollar mos kelmadi"); return; }
    if (form.password.length < 8) { setError("Parol kamida 8 ta belgi bo'lishi kerak"); return; }
    if (!slug) { setError("Loyiha nomi kiritilishi shart"); return; }

    setLoading(true);
    let finalSlug = slug;

    try {
      // 1. Tenant yaratish
      setStep("Loyiha yaratilmoqda...");
      try {
        const t = await tenants.create(form.projectName);
        finalSlug = t.slug;
      } catch (err) {
        // 409 = mavjud — shu slugni ishlat
        if (err instanceof ApiError && err.status === 409) {
          finalSlug = slug; // mavjud tenant slugini ishlatamiz
        } else {
          throw err;
        }
      }

      // 2. Register
      setStep("Hisob yaratilmoqda...");
      try {
        await auth.register(form.email.trim(), form.password, finalSlug, form.name);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setError("Bu email allaqachon ro'yxatdan o'tgan. Iltimos kiring.");
          setLoading(false); setStep(""); return;
        }
        throw err;
      }

      // 3. Login
      setStep("Kirilmoqda...");
      const loginData = await auth.login(form.email.trim(), form.password, finalSlug);
      if (loginData.accessToken) {
        localStorage.setItem("accessToken", loginData.accessToken);
        if (loginData.refreshToken) localStorage.setItem("refreshToken", loginData.refreshToken);
        localStorage.setItem("tenantSlug", finalSlug);
        router.push("/dashboard");
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xato yuz berdi";
      setError(msg);
      setLoading(false);
      setStep("");
    }
  };

  const leftPanel = (
    <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col p-14 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-auto">
          <div className="grid grid-cols-2 gap-1">
            <div className="w-4 h-4 bg-zinc-500 rounded-sm" />
            <div className="w-4 h-4 bg-zinc-400 rounded-sm" />
            <div className="w-4 h-4 bg-zinc-600 rounded-sm" />
            <div className="w-4 h-4 bg-zinc-500 rounded-sm" />
          </div>
          <span className="text-white font-display text-xl font-bold tracking-wide">JSON-API</span>
        </div>
        <div className="my-auto space-y-6">
          <blockquote className="text-4xl font-display leading-tight text-white">
            &ldquo;Minutlar ichida<br />
            <em className="italic text-zinc-400">professional</em><br />
            backend.&rdquo;
          </blockquote>
          <p className="text-zinc-500 text-sm max-w-xs">
            Tenant yarating, ma&apos;lumotlar bazasini sozlang va API orqali ishlang — hamma narsa tayyor.
          </p>
        </div>
        <div className="flex gap-8 pt-8 border-t border-zinc-800">
          {[
            { val: "Bepul", label: "Boshlash" },
            { val: "∞", label: "API chaqiruvlar" },
            { val: "< 1 min", label: "O'rnatish" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-white font-display text-lg font-bold">{s.val}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {leftPanel}
      <div className="flex-1 flex items-center justify-center bg-zinc-50 px-8 py-12">
        <div className="w-full max-w-sm space-y-7">
          <div className="lg:hidden flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-3 h-3 bg-zinc-500 rounded-sm" /><div className="w-3 h-3 bg-zinc-400 rounded-sm" />
              <div className="w-3 h-3 bg-zinc-600 rounded-sm" /><div className="w-3 h-3 bg-zinc-500 rounded-sm" />
            </div>
            <span className="font-display font-bold text-zinc-900">JSON-API</span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900">Hisob yaratish</h1>
            <p className="text-zinc-500 text-sm mt-1.5">Loyihangizni bir daqiqada boshlang</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="auth-label">LOYIHA NOMI <span className="text-red-400">*</span></label>
              <input
                type="text"
                placeholder="Mening Loyiham"
                value={form.projectName}
                onChange={(e) => onProject(e.target.value)}
                className="auth-input"
                required
                disabled={loading}
              />
              {slug && (
                <p className="text-zinc-400 text-xs font-mono">
                  slug: <span className="text-zinc-600">{slug}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="auth-label">ISMINGIZ</label>
              <input
                type="text"
                placeholder="Asilbek Karimov"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="auth-input"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="auth-label">EMAIL <span className="text-red-400">*</span></label>
              <input
                type="email"
                placeholder="siz@company.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="auth-input"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="auth-label">PAROL <span className="text-red-400">*</span></label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="auth-input"
                required
                autoComplete="new-password"
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="auth-label">PAROLNI TASDIQLANG <span className="text-red-400">*</span></label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
                className="auth-input"
                required
                autoComplete="new-password"
                minLength={8}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {error}
                {error.includes("allaqachon") && (
                  <Link href="/auth/login" className="block mt-1 underline text-red-500 hover:text-red-700">
                    Kirish sahifasiga o&apos;tish →
                  </Link>
                )}
              </div>
            )}

            <button type="submit" className="auth-btn mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  <span className="text-sm">{step || "Yaratilmoqda..."}</span>
                </span>
              ) : "Hisob yaratish"}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm">
            Akkaunt bormi?{" "}
            <Link href="/auth/login" className="text-zinc-900 font-semibold underline underline-offset-2 hover:text-zinc-600 transition-colors">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
