"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ButtonLink";
import { fmt, KUNCI_HASIL, KUNCI_TAS, kunciInput, pesisir, type HasilRencana } from "@/lib/hasil";
import { CONTOH_BENGKULU } from "@/lib/input";

function baca<T>(k: string): T | null {
  try {
    const s = localStorage.getItem(k);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

/** Nomor dokumen stabil dari isi input (bukan acak), mis. SK-2611-0348. */
function nomorDokumen(d: HasilRencana) {
  let h = 0;
  for (const c of kunciInput(d.input)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const t = new Date(d.dibuat);
  const yymm = `${String(t.getFullYear()).slice(2)}${String(t.getMonth() + 1).padStart(2, "0")}`;
  return `SK-${yymm}-${String(h % 10000).padStart(4, "0")}`;
}

type Keadaan = { tahap: "memuat" } | { tahap: "kosong" } | { tahap: "siap"; data: HasilRencana };

function awal(): Keadaan {
  const simpan = baca<{ kunci: string; data: HasilRencana }>(KUNCI_HASIL);
  const contoh = new URLSearchParams(window.location.search).get("contoh") === "bengkulu";
  if (contoh) {
    return simpan?.kunci === kunciInput(CONTOH_BENGKULU) ? { tahap: "siap", data: simpan.data } : { tahap: "memuat" };
  }
  return simpan ? { tahap: "siap", data: simpan.data } : { tahap: "kosong" };
}

export default function Lembar() {
  const [k, setK] = useState<Keadaan>(awal);

  useEffect(() => {
    if (k.tahap !== "memuat") return;
    // hanya untuk tautan contoh yang belum pernah dibuka: susun dulu lewat API
    fetch("/api/rencana", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(CONTOH_BENGKULU) })
      .then((r) => r.json())
      .then((data: HasilRencana) => {
        if (!data.ok) throw new Error();
        try {
          localStorage.setItem(KUNCI_HASIL, JSON.stringify({ kunci: kunciInput(CONTOH_BENGKULU), data }));
        } catch {
          /* abaikan */
        }
        setK({ tahap: "siap", data });
      })
      .catch(() => setK({ tahap: "kosong" }));
  }, [k.tahap]);

  if (k.tahap === "memuat") {
    return <p className="mx-auto max-w-[820px] px-4 pt-12 text-ink-3">Menyiapkan lembar contoh…</p>;
  }
  if (k.tahap === "kosong") {
    return (
      <div className="mx-auto max-w-[880px] px-4 pt-12">
        <h1 className="text-[clamp(34px,4.6vw,52px)]">Belum ada lembar rencana</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">Buat rencana keluargamu dulu, lalu cetak dari halaman hasil.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cek" className={buttonClass("go")}>
            Cek risiko rumahku
          </Link>
          <a href="/hasil/cetak?contoh=bengkulu" className={buttonClass("plain")}>
            Lihat contoh lembar
          </a>
        </div>
      </div>
    );
  }

  const d = k.data;
  const { input, skor, titik, rencana } = d;
  const tujuan = titik.find((t) => t.id === rencana.titik_tujuan_id) ?? titik[0];
  const cadangan = titik.filter((t) => t !== tujuan);
  const centang = baca<Record<string, boolean>>(KUNCI_TAS) ?? {};
  const tas = [
    ...d.tasDasar,
    ...rencana.tas_siaga_tambahan.map((t, i) => ({ id: `t${i}-${t.barang}`, barang: t.barang })),
  ];
  // input dari server sudah berisi ketinggian, jadi cocokkan nama & lokasi saja
  const contoh = input.namaKeluarga === CONTOH_BENGKULU.namaKeluarga && input.lokasi.lat === CONTOH_BENGKULU.lokasi.lat;
  const judul = contoh ? "Contoh — Kota Bengkulu" : input.namaKeluarga ? `Keluarga ${input.namaKeluarga}` : "Keluarga kami";

  return (
    <div className="px-4 py-8 print:p-0">
      <div className="mx-auto mb-4 flex max-w-[820px] flex-wrap gap-2 print:hidden">
        <Link href={contoh ? "/hasil?contoh=bengkulu" : "/hasil"} className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}>
          Kembali ke hasil
        </Link>
        <button type="button" onClick={() => window.print()} className={buttonClass("go", "min-h-11 px-4 text-[15px]")}>
          Cetak / simpan PDF
        </button>
      </div>

      <article className="lembar mx-auto max-w-[820px] border border-[#d8cdb4] bg-paper px-5 py-7 font-serif text-[15.5px] leading-[1.7] text-[#1d1b16] shadow-[0_2px_0_#d8cdb4] sm:px-16 sm:py-14 print:max-w-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="grid grid-cols-[1fr_auto] gap-6 border-b-2 border-[#1d1b16] pb-4">
          <div>
            <p className="font-mono text-xs leading-snug text-[#6a6250]">LEMBAR RENCANA SIAGA KELUARGA · No. {nomorDokumen(d)}</p>
            <h1 className="mt-2 mb-1 font-serif text-[30px] leading-tight font-semibold sm:text-[34px]">{judul}</h1>
            <p>
              {fmt(input.lokasi.lat, 4)}, {fmt(input.lokasi.lon, 4)} — {input.elevasiM === null ? "ketinggian tidak terbaca" : `${fmt(input.elevasiM, 0)} m di atas laut`} — {input.penghuni} penghuni
            </p>
          </div>
          <div
            className="grid size-24 -rotate-6 place-items-center border-[3px] border-double border-risk p-2 text-center font-mono text-[11px] leading-tight font-semibold text-risk sm:size-[132px]"
            aria-label={`Skor risiko ${skor.total}, ${skor.kategori}`}
          >
            <div>
              <b className="block text-[32px] leading-none sm:text-[44px]">{skor.total}</b>
              RISIKO
              <br />
              {skor.kategori.toUpperCase()}
            </div>
          </div>
        </header>

        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">
          {pesisir(input) ? "Jika gempa terasa kuat atau lebih dari 20 detik" : "Saat dan setelah gempa"}
        </h2>
        <ol className="list-decimal pl-6">
          {rencana.langkah_darurat.map((l, i) => (
            <li key={i} className="my-1">
              {l}
            </li>
          ))}
        </ol>

        {tujuan && (
          <>
            <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Tujuan evakuasi</h2>
            <table className="w-full border-collapse text-[14.5px]">
              <tbody>
                {[tujuan, ...cadangan].map((t, i) => (
                  <tr key={t.id} className="border-b border-[#cdbf9f] align-top">
                    <th className="w-[30%] py-1.5 pr-2 text-left font-semibold">{i === 0 ? "Utama" : `Cadangan ${i}`}</th>
                    <td className="py-1.5">
                      <b>{t.nama}</b> — {fmt(t.jarakKm)} km ke arah {t.arah.nama}, {fmt(t.elevasiM, 0)} m, ±{t.menit} menit jalan kaki
                      {t.kelas === "lebih-tinggi" ? ". Naik ke lantai paling atas." : "."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Tugas tiap anggota</h2>
        <table className="w-full border-collapse text-[14.5px]">
          <tbody>
            {rencana.peran_anggota.map((p, i) => (
              <tr key={i} className="border-b border-[#cdbf9f] align-top">
                <th className="w-[30%] py-1.5 pr-2 text-left font-semibold">{p.siapa}</th>
                <td className="py-1.5">{p.tugas}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Isi tas siaga</h2>
        <ul className="columns-1 gap-8 sm:columns-2 print:columns-2">
          {tas.map((x) => (
            <li key={x.id} className="break-inside-avoid py-0.5">
              <span className="mr-2 font-mono text-[13px]">{centang[x.id] ? "[x]" : "[  ]"}</span>
              {x.barang}
            </li>
          ))}
        </ul>

        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Kontak darurat</h2>
        <table className="w-full border-collapse text-[14.5px]">
          <tbody>
            <tr className="border-b border-[#cdbf9f]">
              <th className="w-[45%] py-1.5 pr-2 text-left font-semibold">Panggilan darurat nasional</th>
              <td className="py-1.5 font-mono">112</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">BPBD kabupaten/kota</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">Keluarga di luar kota</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">Titik kumpul jika terpisah</th>
              <td className="py-1.5">{tujuan ? `${tujuan.nama}, di depan gerbang` : "…………………………………"}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 grid grid-cols-2 gap-10 text-[13px]">
          <div className="border-t border-[#1d1b16] pt-1.5">Dibahas bersama keluarga, tanggal</div>
          <div className="border-t border-[#1d1b16] pt-1.5">Latihan evakuasi berikutnya</div>
        </div>

        <footer className="mt-8 flex flex-wrap justify-between gap-4 border-t border-[#1d1b16] pt-3 text-[12.5px] text-[#6a6250]">
          <span>Dibuat dengan SiagaKu · skor indikatif, bukan kajian resmi</span>
          <span>Data: BMKG, OpenStreetMap, Open-Meteo</span>
        </footer>
      </article>
    </div>
  );
}
