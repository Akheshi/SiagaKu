"use client";

import dynamic from "next/dynamic";

// Hasil membaca localStorage & URL saat dibuat → hanya dirender di browser.
const Hasil = dynamic(() => import("./Hasil"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-[880px] px-4 pt-12">
      <p className="text-ink-3">Memuat…</p>
    </div>
  ),
});

export function MuatHasil() {
  return <Hasil />;
}
