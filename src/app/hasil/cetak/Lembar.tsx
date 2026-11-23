"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ButtonLink";
import TautanRencanaLama from "@/components/TautanRencanaLama";
import { BATAS_MENIT_JALAN, fmt, KETERANGAN_SKOR_SEMENTARA, PERINGATAN_KANDIDAT_JAUH, kunciInput, kunciPenyimpananRencana, pesisir, warnaKategori, type HasilRencana } from "@/lib/hasil";
import { inputMode, modeDariUrl, qsMode, type ModeAktif } from "@/lib/bagikan";
import { KUNCI_INPUT, type InputRencanaT } from "@/lib/input";
import { CATATAN_CADANGAN } from "@/lib/rencana";

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

type Keadaan =
  | { tahap: "memuat"; input: InputRencanaT }
  | { tahap: "kosong" }
  | { tahap: "galat"; input: InputRencanaT }
  | { tahap: "siap"; data: HasilRencana };

function awal(mode: ModeAktif, kunciHasil: string): Keadaan {
  const input = inputMode(mode, () => baca(KUNCI_INPUT));
  if (!input) return { tahap: "kosong" };

  const simpan = baca<{ kunci: string; data: HasilRencana }>(kunciHasil);
  return simpan?.kunci === kunciInput(input)
    ? { tahap: "siap", data: simpan.data }
    : { tahap: "memuat", input };
}

/** Kerangka lembar selama rencana disusun ulang. */
function MemuatLembar() {
  const baris = "h-3 bg-[#e4dac2] motion-safe:animate-pulse";
  return (
    <div className="px-4 py-8" role="status" aria-live="polite">
      <div className="mx-auto mb-4 max-w-[820px]">
        <h1 className="mt-1 text-[clamp(28px,3.6vw,40px)]">Menyusun lembar rencana keluarga…</h1>
        <p className="mt-1 text-ink-2">Menghitung skor, mencari kandidat lokasi di sekitar rumah, dan memilih fokus persiapan.</p>
      </div>
      <div aria-hidden="true" className="mx-auto grid max-w-[820px] gap-6 border border-[#d8cdb4] bg-paper px-5 py-7 sm:px-16 sm:py-14">
        <div className="grid grid-cols-[1fr_auto] gap-6 border-b-2 border-[#d8cdb4] pb-4">
          <div className="grid content-start gap-3">
            <div className={`${baris} w-2/5`} />
            <div className="h-8 w-3/5 bg-[#e4dac2] motion-safe:animate-pulse" />
            <div className={`${baris} w-4/5`} />
          </div>
          <div className="size-24 -rotate-6 border-[3px] border-double border-[#d8cdb4] sm:size-[120px]" />
        </div>
        {[5, 3, 4].map((n, i) => (
          <div key={i} className="grid gap-2.5">
            <div className="h-4 w-1/3 bg-[#d8cdb4] motion-safe:animate-pulse" />
            {Array.from({ length: n }, (_, j) => (
              <div key={j} className={baris} style={{ width: `${92 - ((j * 17) % 30)}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Lembar() {
  const mode = modeDariUrl(useSearchParams());
  if (mode.jenis === "tautan-lama") return <TautanRencanaLama />;
  return <IsiLembar key={mode.jenis} mode={mode} />;
}

function IsiLembar({ mode }: { mode: ModeAktif }) {
  const contoh = mode.jenis === "contoh";
  const { hasil: kunciHasil, tas: kunciTas } = kunciPenyimpananRencana(mode);
  const [k, setK] = useState<Keadaan>(() => awal(mode, kunciHasil));

  useEffect(() => {
    if (k.tahap !== "memuat") return;
    const { input } = k;
    const ctrl = new AbortController();
    fetch("/api/rencana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data: HasilRencana) => {
        if (ctrl.signal.aborted) return;
        if (!data.ok) throw new Error();
        try {
          localStorage.setItem(kunciHasil, JSON.stringify({ kunci: kunciInput(input), data }));
        } catch {
          /* abaikan */
        }
        setK({ tahap: "siap", data });
      })
      .catch(() => { if (!ctrl.signal.aborted) setK({ tahap: "galat", input }); });
    return () => ctrl.abort();
  }, [k, kunciHasil]);

  if (k.tahap === "memuat") {
    return <MemuatLembar />;
  }
  if (k.tahap === "galat") {
    return (
      <div className="mx-auto max-w-[820px] px-4 pt-12">
        <h1 className="text-4xl">Lembar rencana belum bisa disiapkan</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">Layanan sedang sibuk atau koneksi terputus. Periksa jaringan, lalu coba lagi.</p>
        <button type="button" className={buttonClass("go", "mt-4")} onClick={() => setK({ tahap: "memuat", input: k.input })}>
          Coba lagi
        </button>
      </div>
    );
  }
  if (k.tahap === "kosong") {
    return (
      <div className="mx-auto max-w-[880px] px-4 pt-12">
        <h1 className="text-[clamp(34px,4.6vw,52px)]">Belum ada lembar rencana</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">Buat rencana keluargamu dulu, lalu cetak dari halaman hasil.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/hasil" className={buttonClass("go")}>
            Buka rencana keluarga
          </Link>
          <a href="/hasil/cetak?contoh=bengkulu" className={buttonClass("plain")}>
            Lihat contoh lembar
          </a>
        </div>
      </div>
    );
  }

  const d = k.data;
  const { input, skor, rencana } = d;
  const centang = baca<Record<string, boolean>>(kunciTas) ?? {};
  const tas = [
    ...d.tasDasar,
    ...rencana.tas_siaga_tambahan.map((t, i) => ({ id: `t${i}-${t.barang}`, barang: t.barang })),
  ];
  const warna = skor.lengkap ? warnaKategori(skor.kategori) : { teks: "text-ink", bingkai: "border-ink" };
  const tanggal = new Date(d.dibuat).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });
  const kandidat = d.titik.slice(0, 3);
  const judul = contoh ? "Contoh — Kota Bengkulu" : input.namaKeluarga ? `Keluarga ${input.namaKeluarga}` : "Keluarga kami";

  return (
    <div className="px-4 py-8 print:p-0">
      <div className="mx-auto mb-4 flex max-w-[820px] flex-wrap gap-2 print:hidden">
        <a href={`/hasil${qsMode(mode)}`} className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}>
          Kembali ke hasil
        </a>
        <button type="button" onClick={() => window.print()} className={buttonClass("go", "min-h-11 px-4 text-[15px]")}>
          Cetak / simpan PDF
        </button>
      </div>
      {!contoh && (
        <p className="mx-auto mb-4 max-w-[820px] text-sm text-ink-2 print:hidden">
          Lembar lengkap bisa memuat lokasi rumah dan catatan keluarga. Bagikan PDF hanya kepada orang yang kamu percaya.
        </p>
      )}

      <article className="lembar mx-auto max-w-[820px] border border-[#d8cdb4] bg-paper px-5 py-7 font-serif text-[15.5px] leading-[1.7] text-[#1d1b16] shadow-[0_2px_0_#d8cdb4] sm:px-16 sm:py-14 print:max-w-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] gap-6 border-b-2 border-[#1d1b16] pb-4">
          <div>
            <p className="font-mono text-xs leading-snug text-[#6a6250]">LEMBAR RENCANA SIAGA KELUARGA · No. {nomorDokumen(d)}</p>
            <h1 className="mt-2 mb-1 font-serif text-[30px] leading-tight font-semibold sm:text-[34px]">{judul}</h1>
            <p>
              {fmt(input.lokasi.lat, 4)}, {fmt(input.lokasi.lon, 4)} — {input.elevasiM === null ? "ketinggian tidak terbaca" : `${fmt(input.elevasiM, 0)} m di atas laut`} — {input.penghuni} penghuni
            </p>
            <p className="flex gap-2">Alamat:<span className="mb-1 flex-1 border-b border-dotted border-[#1d1b16]" /></p>
            <p className="text-[13.5px] text-[#4a4436] print:text-[11px]">
              Disusun {tanggal}
            </p>
          </div>
          <div
            className={`mr-2 grid size-24 -rotate-6 place-items-center border-[3px] border-double p-2 text-center font-mono text-[11px] leading-tight font-semibold sm:size-[132px] print:size-[104px] ${warna.teks} ${warna.bingkai}`}
            aria-label={skor.lengkap ? `Skor risiko ${skor.total}, ${skor.kategori}` : `Skor sementara ${skor.total}`}
          >
            <div>
              <b className="block text-[32px] leading-none sm:text-[44px]">{skor.total}</b>
              {skor.lengkap ? <>RISIKO<br />{skor.kategori.toUpperCase()}</> : <>SKOR<br />SEMENTARA</>}
            </div>
          </div>
        </header>
        {!skor.lengkap && <p className="mt-2 text-sm font-semibold print:mt-1 print:text-[11px]">{KETERANGAN_SKOR_SEMENTARA}</p>}
        {input.elevasiM === null && (
          <p className="mt-2 text-sm print:mt-1 print:text-[11px]">Ketinggian belum tersedia. Faktor ini memakai asumsi 25 poin.</p>
        )}

        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">
          {pesisir(input) ? "Saat gempa — rumah dekat pantai" : "Saat dan setelah gempa"}
        </h2>
        <ol className="list-decimal pl-6">
          {rencana.langkah_darurat.map((l, i) => (
            <li key={i} className="my-1">
              {l}
            </li>
          ))}
        </ol>

        {(rencana.fokus ?? []).length > 0 && (
          <>
            <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Kerjakan lebih dulu</h2>
            <ol className="list-decimal pl-6">
              {rencana.fokus.map((f) => (
                <li key={f.faktor} className="my-1">
                  <b className="font-semibold">{f.faktor}</b> ({f.nilai}): {f.tindakan}
                </li>
              ))}
            </ol>
          </>
        )}

        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Tujuan evakuasi</h2>
        <table className="w-full border-collapse text-[14.5px]">
          <tbody>
            <tr className="border-b border-[#cdbf9f]">
              <th className="w-[45%] py-1.5 pr-2 text-left font-semibold">Lokasi evakuasi resmi (dari BPBD/kelurahan)</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">Titik kumpul keluarga jika terpisah</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
          </tbody>
        </table>
        {kandidat.length > 0 && (
          <>
            <p className="mt-2 text-[13px] text-[#4a4436] print:mt-1 print:text-[11px]">
              Kandidat OpenStreetMap. Konfirmasi status, akses, dan rute ke BPBD sebelum mencentang.
              Jarak dan waktu di bawah ini ditaksir dari garis lurus.
            </p>
            <table className="w-full border-collapse text-[13.5px] print:!text-[11px]">
              <tbody>
                {kandidat.map((t) => (
                  <tr key={t.id} className="border-b border-[#cdbf9f] align-top">
                    <td className="w-8 py-1 font-mono">[  ]</td>
                    <th className="py-1 pr-2 text-left font-semibold">
                      {t.nama} <span className="font-normal text-[#6a6250]">· {t.jenis}</span>
                    </th>
                    <td className="py-1 text-right font-mono sm:whitespace-nowrap print:whitespace-nowrap">
                      {fmt(t.jarakKm)} km {t.arah.nama} · {fmt(t.elevasiM, 0)} m · ±{t.menit} mnt jalan
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pesisir(input) && kandidat.some((t) => t.menit > BATAS_MENIT_JALAN) && (
              <p className="mt-1 text-[13px] font-semibold print:text-[11px]">{PERINGATAN_KANDIDAT_JAUH}</p>
            )}
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
        <ul className="lembar-tas columns-1 gap-8 sm:columns-2 print:columns-2">
          {tas.map((x) => (
            <li key={x.id} className="break-inside-avoid py-0.5 print:py-0">
              <span className="mr-2 font-mono text-[13px]">{centang[x.id] ? "[x]" : "[  ]"}</span>
              {x.barang}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-[#4a4436] print:mt-1 print:text-[11px]">{CATATAN_CADANGAN}</p>

        <section className="lembar-penutup">
        <h2 className="mt-7 mb-2 font-serif text-[19px] font-semibold">Kontak darurat</h2>
        <table className="w-full border-collapse text-[14.5px]">
          <tbody>
            <tr className="border-b border-[#cdbf9f]">
              <th className="w-[45%] py-1.5 pr-2 text-left font-semibold">Darurat daerah (jika aktif) · Darurat medis · Polisi</th>
              <td className="py-1.5 font-mono">112 · 119 · 110</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">BPBD / pemadam kabupaten atau kota</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">Keluarga di luar kota</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
            <tr className="border-b border-[#cdbf9f]">
              <th className="py-1.5 pr-2 text-left font-semibold">Puskesmas / RS terdekat</th>
              <td className="py-1.5">…………………………………</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8 grid grid-cols-2 gap-10 text-[13px] print:mt-6">
          <div className="border-t border-[#1d1b16] pt-1.5">Dibahas bersama keluarga, tanggal</div>
          <div className="border-t border-[#1d1b16] pt-1.5">Latihan evakuasi berikutnya</div>
        </div>

        <footer className="mt-8 flex flex-wrap justify-between gap-4 border-t border-[#1d1b16] pt-3 text-[12.5px] text-[#6a6250]">
          <span>SiagaKu · lembar persiapan keluarga · skor indikatif</span>
          <span>Data: BMKG, OpenStreetMap, Open-Meteo</span>
        </footer>
        </section>
      </article>
    </div>
  );
}
