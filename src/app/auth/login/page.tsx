"use client";
import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/api";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [form, setForm] = useState({ tenantSlug: "", email: "", password: "" });
  const [totpCode, setTotpCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveAndRedirect = (
    accessToken: string,
    refreshToken: string | undefined,
    slug: string,
  ) => {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("tenantSlug", slug);
    window.location.href = "/dashboard";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await auth.login(
        form.email.trim(),
        form.password,
        form.tenantSlug.trim(),
      );
      if (data.requires2FA && data.tempToken) {
        setTempToken(data.tempToken);
        setStep("2fa");
        return;
      }
      if (data.accessToken) {
        saveAndRedirect(
          data.accessToken,
          data.refreshToken,
          form.tenantSlug.trim(),
        );
      } else {
        setError("Server noto'g'ri javob qaytardi. Qayta urinib ko'ring.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xato yuz berdi";
      setError(
        msg.includes("Invalid credentials")
          ? "Email, parol yoki tenant slug noto'g'ri"
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await auth.totpVerify(totpCode, tempToken);
      saveAndRedirect(
        data.accessToken,
        data.refreshToken,
        form.tenantSlug.trim(),
      );
    } catch {
      setError("Noto'g'ri kod. Qayta kiriting.");
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = (
    <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col p-14 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Decorative glow */}
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-1">
            <div className="w-4 h-4 bg-zinc-500 rounded-sm" />
            <div className="w-4 h-4 bg-zinc-300 rounded-sm" />
            <div className="w-4 h-4 bg-zinc-700 rounded-sm" />
            <div className="w-4 h-4 bg-zinc-500 rounded-sm" />
          </div>
          <span className="text-white font-display text-xl font-bold tracking-wide">
            JSON-API
          </span>
        </div>
        <div className="my-auto space-y-6">
          <blockquote className="text-4xl font-display leading-tight text-white">
            &ldquo;Platformangiz
            <br />
            uchun <em className="italic text-zinc-400">kuchli</em>
            <br />
            backend.&rdquo;
          </blockquote>
          <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
            Kolleksiyalar, API kalitlar, webhooklar va analitikani bir joyda
            boshqaring.
          </p>
        </div>
        <div className="flex gap-10 pt-8 border-t border-zinc-800/80">
          {[
            { val: "99.9%", label: "Uptime SLA" },
            { val: "< 80ms", label: "O'rtacha javob" },
            { val: "2.4M+", label: "API chaqiruv / kun" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-white font-display text-lg font-bold">
                {s.val}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (step === "2fa") {
    return (
      <div className="min-h-screen flex">
        {leftPanel}
        <div className="flex-1 flex items-center justify-center bg-zinc-50 px-8">
          <div className="w-full max-w-sm space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-zinc-900">
                2FA Tasdiqlash
              </h1>
              <p className="text-zinc-500 text-sm mt-2">
                Autentifikator ilovangizdan 6 xonali kodni kiriting
              </p>
            </div>
            <form onSubmit={handle2FA} className="space-y-5">
              <input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="auth-input text-center text-2xl tracking-[0.5em] font-mono"
                maxLength={6}
                autoFocus
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? <Spinner /> : "Tasdiqlash"}
              </button>
            </form>
            <button
              onClick={() => {
                setStep("login");
                setError("");
              }}
              className="text-zinc-400 text-sm hover:text-zinc-700 transition-colors"
            >
              ← Orqaga
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {leftPanel}
      <div className="flex-1 flex items-center justify-center bg-zinc-50 px-8 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="grid grid-cols-2 gap-0.5">
              <div className="w-3 h-3 bg-zinc-500 rounded-sm" />
              <div className="w-3 h-3 bg-zinc-400 rounded-sm" />
              <div className="w-3 h-3 bg-zinc-600 rounded-sm" />
              <div className="w-3 h-3 bg-zinc-500 rounded-sm" />
            </div>
            <span className="font-display font-bold text-zinc-900">
              JSON-API
            </span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-900">
              Xush kelibsiz
            </h1>
            <p className="text-zinc-500 text-sm mt-1.5">
              Davom etish uchun akkauntingizga kiring
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="auth-label">
                TENANT SLUG <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  <SlugIcon />
                </span>
                <input
                  type="text"
                  placeholder="mening-loyiham"
                  value={form.tenantSlug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tenantSlug: slugify(e.target.value),
                    }))
                  }
                  className="auth-input pl-9 font-mono"
                  required
                  autoComplete="organization"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                />
              </div>
              <p className="text-zinc-400 text-xs">
                Ro&apos;yxatdan o&apos;tganda ko&apos;rsatilgan slug
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="auth-label">
                EMAIL <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <EmailIcon />
                </span>
                <input
                  type="email"
                  placeholder="siz@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="auth-input pl-9"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="auth-label">
                PAROL <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="auth-input pl-9"
                  required
                  autoComplete="current-password"
                  minLength={8}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <Spinner /> : "Kirish"}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm">
            Akkaunt yo&apos;qmi?{" "}
            <Link
              href="/auth/register"
              className="text-zinc-900 font-semibold underline underline-offset-2 hover:text-zinc-600 transition-colors"
            >
              Yaratish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function EmailIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
function SlugIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}
function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}
