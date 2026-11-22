"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/ButtonLink";

/** Galat di dalam halaman — tidak pernah menampilkan layar kosong (PRD F10). */
export default function Galat({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[880px] px-4 pt-12">
      <h1 className="text-[clamp(34px,4.6vw,52px)]">Halaman ini gagal dimuat</h1>
      <p className="mt-3 max-w-[60ch] text-ink-2">
        Biasanya karena koneksi terputus atau website baru diperbarui. Rencana dan centang tas siagamu tetap
        tersimpan di perangkat ini.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className={buttonClass("go")} onClick={() => retry()}>
          Coba lagi
        </button>
        <button type="button" className={buttonClass("plain")} onClick={() => window.location.reload()}>
          Muat ulang halaman
        </button>
        <Link href="/" className={buttonClass("plain")}>
          Ke beranda
        </Link>
      </div>
      <details className="mt-8 text-sm text-ink-3">
        <summary className="cursor-pointer">Detail teknis</summary>
        <pre className="mt-2 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
          {error instanceof Error
            ? `${error.name}: ${error.message}\n${(error.stack ?? "").split("\n").slice(0, 6).join("\n")}`
            : String(error)}
          {"\n"}
          {typeof navigator !== "undefined" ? navigator.userAgent : ""}
        </pre>
      </details>
    </div>
  );
}
