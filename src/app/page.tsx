import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "json-api — O'zbekistoning BaaS platformasi",
  description:
    "Backend infratuzilmasini bir zumda yarating. Kolleksiyalar, autentifikatsiya, API kalitlar, webhooklar va analitika.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] grid-lines flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-3 h-3 bg-zinc-500 rounded-sm" />
            <div className="w-3 h-3 bg-zinc-400 rounded-sm" />
            <div className="w-3 h-3 bg-zinc-600 rounded-sm" />
            <div className="w-3 h-3 bg-zinc-500 rounded-sm" />
          </div>
          <span className="font-display text-xl font-bold text-white tracking-tight">
            json-api
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors font-medium px-4 py-2.5 rounded-lg hover:bg-white/10"
          >
            Kirish
          </Link>
          <Link
            href="/auth/register"
            className="bg-white text-black font-medium px-5 py-2.5 rounded-lg text-sm transition-all hover:bg-zinc-100 active:scale-[0.98] flex items-center gap-2"
          >
            Boshlash
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Backend as a Service · O&apos;zbekiston
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-bold text-white leading-none mb-6">
          Backend, <span className="text-gradient">bir zumda.</span>
        </h1>
        <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
          json-api bilan ilovangiz uchun to&apos;liq backend infratuzilmasini
          minutlar ichida yarating.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/auth/register"
            className="bg-white text-black font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            Bepul boshlash
          </Link>
          <Link
            href="/auth/login"
            className="text-zinc-400 hover:text-white px-8 py-3.5 text-base transition-colors font-medium"
          >
            Akkauntga kirish →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto w-full px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: "⬡",
              title: "Kolleksiyalar",
              desc: "Ma'lumotlar bazasini sxema orqali boshqaring. To'liq CRUD, filtrlash, sahifalash.",
            },
            {
              icon: "🔐",
              title: "Autentifikatsiya",
              desc: "JWT, refresh token, 2FA (TOTP), magic link — hammasi tayyor.",
            },
            {
              icon: "◆",
              title: "API Kalitlari",
              desc: "Xavfsiz API kalitlari. Ruxsatlar va tezlik chegaralari.",
            },
            {
              icon: "◉",
              title: "Webhooklar",
              desc: "Hodisalarga asoslangan integratsiyalar. Istalgan URL ga bildirishnomalar.",
            },
            {
              icon: "◧",
              title: "Edge Funksiyalar",
              desc: "Serverless JavaScript funksiyalar yozing va API orqali chaqiring.",
            },
            {
              icon: "▦",
              title: "Analitika",
              desc: "So'rovlar tarixi, muvaffaqiyat darajasi, javob vaqti statistikasi.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#111111] border border-[#222222] rounded-xl p-6 space-y-3
                         hover:border-white/20 hover:bg-[#141414] transition-all duration-200 group"
            >
              <div className="text-3xl opacity-50 group-hover:opacity-80 transition-opacity">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#1a1a1a] py-5 px-6 text-center text-zinc-700 text-xs">
        © 2024 json-api · O&apos;zbekistoning BaaS platformasi
      </footer>
    </main>
  );
}
