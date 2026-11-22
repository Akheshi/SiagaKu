"use client";

import dynamic from "next/dynamic";

// Lembar dibaca dari localStorage → hanya dirender di browser.
const Lembar = dynamic(() => import("./Lembar"), {
  ssr: false,
  loading: () => <p className="mx-auto max-w-[820px] px-4 pt-12 text-ink-3">Memuat lembar…</p>,
});

export function MuatLembar() {
  return <Lembar />;
}
