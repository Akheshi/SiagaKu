"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/ButtonLink";

export default function TautanRencanaLama() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("r")) {
      window.history.replaceState(null, "", `${window.location.pathname}?tautan=lama`);
    }
  }, []);

  return (
    <div className="mx-auto max-w-[880px] px-4 pt-12">
      <h1 className="text-[clamp(34px,4.6vw,52px)]">Tautan rencana ini sudah tidak berlaku</h1>
      <p className="mt-3 max-w-[60ch] text-ink-2">
        Untuk melindungi data keluarga, SiagaKu sekarang membagikan ringkasan lewat WhatsApp. Minta pengirim
        mengirim lembar PDF jika kamu perlu melihat rencana lengkapnya.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/cek" className={buttonClass("go")}>Buat rencana keluarga</Link>
        <Link href="/hasil?contoh=bengkulu" className={buttonClass("plain")}>Lihat contoh Bengkulu</Link>
      </div>
    </div>
  );
}
