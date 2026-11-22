"use client";

import dynamic from "next/dynamic";

// Wizard membaca localStorage saat dibuat → hanya dirender di browser.
const Wizard = dynamic(() => import("./Wizard"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-[880px] px-4 pt-8">
      <p className="font-mono text-sm text-ink-3">Langkah 1 dari 2</p>
      <p className="mt-4 text-ink-3">Memuat…</p>
    </div>
  ),
});

export function MuatWizard() {
  return <Wizard />;
}
