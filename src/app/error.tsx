"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-red-500/60 text-sm mb-4">xato</p>
      <h1 className="font-display text-3xl font-bold text-white mb-3">Nimadir noto&apos;g&apos;ri ketdi</h1>
      <p className="text-zinc-500 text-sm mb-8 max-w-sm">{error.message || "Kutilmagan xato yuz berdi."}</p>
      <button onClick={reset} className="btn-primary w-auto px-6">Qayta urinish</button>
    </div>
  );
}
