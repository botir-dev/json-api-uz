import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Sahifa topilmadi | json-api",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] grid-dots flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-zinc-700 text-sm mb-4">404</p>
      <h1 className="font-display text-4xl font-bold text-white mb-3">
        Sahifa topilmadi
      </h1>
      <p className="text-zinc-500 text-sm mb-8">
        Siz izlagan sahifa mavjud emas yoki ko&apos;chirilgan.
      </p>
      <Link href="/" className="btn-primary">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
