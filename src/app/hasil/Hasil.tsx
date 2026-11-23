"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/ButtonLink";
import TautanRencanaLama from "@/components/TautanRencanaLama";
import { SAAT_GUNCANGAN, setelahGuncangan } from "@/lib/arahan";
import { fmt, KETERANGAN_SKOR_SEMENTARA, kunciInput, kunciPenyimpananRencana, pesisir, warnaKategori, type HasilRencana } from "@/lib/hasil";
import { inputMode, modeDariUrl, qsMode, teksBagikan, type ModeAktif } from "@/lib/bagikan";
import { KUNCI_INPUT, type InputRencanaT } from "@/lib/input";
import { CATATAN_CADANGAN } from "@/lib/rencana";

const ResultMap = dynamic(() => import("@/components/map/ResultMap"), {
  ssr: false,
  loading: () => <div className="grid size-full place-items-center text-sm text-ink-3">Memuat peta…</div>,
});

type Keadaan =
  | { tahap: "kosong" }
  | { tahap: "memuat"; input: InputRencanaT; sebelumnya?: HasilRencana }
  | { tahap: "galat"; input: InputRencanaT; pesan: string }
  | { tahap: "siap"; input: InputRencanaT; data: HasilRencana; galatPembaruan?: string };

function simpan(kunci: string, nilai: unknown) {
  try {
    localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* abaikan */
  }
}
function baca<T>(kunci: string): T | null {
  try {
    const s = localStorage.getItem(kunci);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

function keadaanAwal(mode: ModeAktif, kunciHasil: string): Keadaan {
  const input = inputMode(mode, () => baca(KUNCI_INPUT));
  if (!input) return { tahap: "kosong" };
  const tersimpan = baca<{ kunci: string; data: HasilRencana }>(kunciHasil);
  if (tersimpan?.kunci === kunciInput(input)) return { tahap: "siap", input, data: tersimpan.data };
  return { tahap: "memuat", input };
}

const PESAN_MUAT = ["Menghitung skor risiko…", "Mencari kandidat lokasi di sekitar rumah…", "Menyusun rencana keluarga…"];

export default function Hasil() {
  const mode = modeDariUrl(useSearchParams());
  if (mode.jenis === "tautan-lama") return <TautanRencanaLama />;
  return <IsiHasil key={mode.jenis} mode={mode} />;
}

function IsiHasil({ mode }: { mode: ModeAktif }) {
  const { hasil: kunciHasil, tas: kunciTas } = kunciPenyimpananRencana(mode);
  const [k, setK] = useState<Keadaan>(() => keadaanAwal(mode, kunciHasil));
  const [pesanKe, setPesanKe] = useState(0);

  const muat = useCallback(async (input: InputRencanaT, sebelumnya?: HasilRencana) => {
    try {
      const res = await fetch("/api/rencana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok !== true) {
        throw new Error(typeof data?.pesan === "string" ? data.pesan : "Layanan sedang bermasalah. Coba lagi sebentar.");
      }
      simpan(kunciHasil, { kunci: kunciInput(input), data });
      setK({ tahap: "siap", input, data });
    } catch (e) {
      const pesan = e instanceof TypeError ? "Koneksi internet terputus. Periksa jaringan, lalu coba lagi." : (e as Error).message;
      setK(sebelumnya
        ? { tahap: "siap", input, data: sebelumnya, galatPembaruan: pesan }
        : { tahap: "galat", input, pesan });
    }
  }, [kunciHasil]);

  useEffect(() => {
    if (k.tahap !== "memuat") return;
    const t = setInterval(() => setPesanKe((n) => Math.min(n + 1, PESAN_MUAT.length - 1)), 2500);
    // muat() hanya memanggil setState setelah await (respons jaringan), bukan sinkron
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat(k.input, k.sebelumnya);
    return () => clearInterval(t);
    // hanya saat masuk tahap memuat
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k.tahap]);

  if (k.tahap === "kosong") {
    return (
      <div className="mx-auto max-w-[880px] px-4 pt-12">
        <h1 className="text-[clamp(34px,4.6vw,52px)]">Belum ada rencana</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">
          Tandai rumahmu dan isi kondisi keluarga dulu. Hasilnya muncul di sini dan tersimpan di perangkat ini.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cek" className={buttonClass("go")}>
            Cek risiko rumahku
          </Link>
          <a href="/hasil?contoh=bengkulu" className={buttonClass("plain")}>
            Coba contoh: Kota Bengkulu
          </a>
        </div>
      </div>
    );
  }

  if (k.tahap === "memuat") {
    return (
      <div className="mx-auto max-w-[880px] px-4 pt-12" aria-live="polite" aria-busy="true">
        <h1 className="mt-2 text-[clamp(34px,4.6vw,52px)]">{PESAN_MUAT[pesanKe]}</h1>
        <div className="mt-8 grid gap-3" aria-hidden="true">
          <div className="h-28 animate-pulse bg-sign/20" />
          <div className="grid gap-3 md:grid-cols-[1.55fr_1fr]">
            <div className="h-72 animate-pulse bg-line/60" />
            <div className="h-72 animate-pulse bg-line/40" />
          </div>
        </div>
      </div>
    );
  }

  if (k.tahap === "galat") {
    return (
      <div className="mx-auto max-w-[880px] px-4 pt-12">
        <h1 className="text-[clamp(34px,4.6vw,52px)]">Rencana belum bisa disusun</h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">{k.pesan}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className={buttonClass("go")} onClick={() => setK({ tahap: "memuat", input: k.input })}>
            Coba lagi
          </button>
          <Link href="/cek" className={buttonClass("plain")}>
            Ubah data rumah
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TampilanHasil
      data={k.data}
      mode={mode}
      kunciTas={kunciTas}
      galatPembaruan={k.galatPembaruan}
      onPerbarui={() => {
        setPesanKe(0);
        setK({ tahap: "memuat", input: k.input, sebelumnya: k.data });
      }}
    />
  );
}

function TampilanHasil({ data: d, mode, kunciTas, galatPembaruan, onPerbarui }: {
  data: HasilRencana;
  mode: ModeAktif;
  kunciTas: string;
  galatPembaruan?: string;
  onPerbarui: () => void;
}) {
  const { input, skor, titik, rencana } = d;
  const warna = skor.lengkap ? warnaKategori(skor.kategori) : { teks: "text-ink", bingkai: "border-ink" };
  const judul = mode.jenis === "contoh"
    ? "Contoh rencana: Kota Bengkulu"
    : `Rencana siaga ${input.namaKeluarga ? `Keluarga ${input.namaKeluarga}` : "keluargamu"}`;
  const faktorBesar = [...skor.rincian].sort((a, b) => b.poin - a.poin)[0];
  const waktu = new Date(d.dibuat).toLocaleString("id-ID", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
  });

  return (
    <div className="mx-auto max-w-[1200px] px-4">
      <div className="pt-7 pb-4">
        <h1 className="text-[clamp(34px,4.6vw,52px)] [overflow-wrap:anywhere]">{judul}</h1>
        <p className="mt-1.5 text-ink-2">
          {fmt(input.lokasi.lat, 4)}, {fmt(input.lokasi.lon, 4)} ·{" "}
          {input.elevasiM === null ? "ketinggian tidak terbaca" : `${fmt(input.elevasiM, 0)} m dpl`} · {input.penghuni} orang
        </p>
        <p className="mt-1 text-sm text-ink-3">
          Dihitung <time dateTime={d.dibuat}>{waktu} WIB</time>
        </p>
      </div>
      <PapanRambu dekatPantai={pesisir(input)} />

      <div className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <section className="border-2 border-ink bg-white px-4 py-3" aria-labelledby="judul-skor">
          <h2 id="judul-skor" className="text-xl">{skor.lengkap ? "Skor risiko" : "Skor sementara"}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className={`font-mono text-[42px] leading-none font-semibold tracking-tight ${warna.teks}`}>
              {skor.total}<small className="text-lg text-ink-3">/100</small>
            </p>
            {skor.lengkap && (
              <p className={`border-2 px-2 py-0.5 font-sign text-xl font-bold ${warna.bingkai} ${warna.teks}`}>
                Risiko {skor.kategori.toLowerCase()}
              </p>
            )}
          </div>
          <p className="mt-2 text-sm text-ink-2">
            Poin terbanyak: {faktorBesar.faktor.toLowerCase()} ({faktorBesar.poin} poin).
          </p>
          {skor.lengkap ? (
            <div className="relative mt-3 mb-1" aria-hidden="true">
              <div className="grid grid-cols-[40fr_20fr_20fr_20fr] font-mono text-[11px] leading-tight text-ink-3">
                <div className="border-t-[5px] border-cat-rendah pt-1">0<br />Rendah</div>
                <div className="border-t-[5px] border-cat-sedang pt-1">40<br />Sedang</div>
                <div className="border-t-[5px] border-cat-tinggi pt-1">60<br />Tinggi</div>
                <div className="border-t-[5px] border-cat-sangat pt-1">80<br />Sangat tinggi</div>
              </div>
              <span className="absolute -top-1 h-[13px] w-[3px] bg-ink" style={{ left: `${Math.min(99, skor.total)}%` }} />
            </div>
          ) : <p className="mt-2 text-sm font-semibold">{KETERANGAN_SKOR_SEMENTARA}</p>}
          {input.elevasiM === null && (
            <p className="mt-2 text-sm text-ink-2">Ketinggian belum tersedia. Faktor ini memakai asumsi 25 poin.</p>
          )}
          {galatPembaruan && <p role="alert" className="mt-2 text-sm text-risk">{galatPembaruan}</p>}
          <button type="button" className={buttonClass("plain", "mt-3 min-h-11 px-3 text-sm")} onClick={onPerbarui}>
            {skor.lengkap ? "Perbarui hasil" : "Perbarui data gempa"}
          </button>
        </section>
        {rencana.fokus.length > 0 && (
          <section className="border-2 border-ink bg-white" aria-labelledby="judul-fokus">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-ink px-4 py-2 text-white">
              <h2 id="judul-fokus" className="font-sign text-xl font-bold">
                Kerjakan lebih dulu
              </h2>
              <span className="font-mono text-xs opacity-80">
                {d.sumberRencana === "ai" ? "Pilihan DeepSeek" : "Urutan bawaan dari skor"}
              </span>
            </div>
            <ol>
              {rencana.fokus.map((f, i) => (
                <li key={f.faktor} className="grid grid-cols-[28px_1fr] gap-2.5 border-t border-line px-4 py-2.5 first:border-t-0">
                  <span className="grid size-7 place-items-center bg-sign font-mono font-semibold text-white">{i + 1}</span>
                  <div>
                    <p className="font-semibold">
                      {f.faktor} <span className="font-normal text-ink-3">· {f.nilai}</span>
                    </p>
                    <p className="text-[15.5px] text-ink-2">{f.tindakan}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* Buka ulang dokumen agar lembar membaca hasil terakhir dari penyimpanan. */}
        <a href={`/hasil/cetak${qsMode(mode)}`} className={buttonClass("go", "min-h-11 px-4 text-[15px]")}>
          Cetak lembar rencana
        </a>
        <a
          className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}
          href={`https://wa.me/?text=${encodeURIComponent(teksBagikan(mode, window.location.origin))}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Bagikan ringkasan ke WhatsApp
        </a>
        <Link href="/cek" className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}>
          {mode.jenis === "contoh" ? "Cek rumahku" : "Ubah data"}
        </Link>
      </div>
      {mode.jenis !== "contoh" && (
        <p className="mt-2 text-[13px] text-ink-3">
          Ringkasan WhatsApp berisi arahan umum. Untuk membagikan rencana lengkap, simpan lembar sebagai PDF.
        </p>
      )}

      <div className="mt-5 grid border-2 border-ink bg-white md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="relative z-0 min-h-[380px] border-b-2 border-ink md:min-h-[540px] md:border-r-2 md:border-b-0">
          <div className="absolute inset-0" role="region" aria-label="Peta rumah dan kandidat lokasi">
            <ResultMap rumah={input.lokasi} titik={titik} />
          </div>
          <div className="absolute bottom-3 left-3 z-[500] grid gap-1 border-2 border-ink bg-white px-3 py-2 text-[13px]">
            <span>
              <i className="mr-2 inline-block size-3 bg-ink align-[-1px]" />
              Rumah
            </span>
            <span>
              <i className="mr-2 inline-block size-3 bg-sign align-[-1px]" />
              Kandidat lokasi
            </span>
          </div>
        </div>

        <div>
          <table className="mt-3 w-full border-collapse text-[14.5px]">
            <caption className="px-5 pt-3.5 pb-2 text-left font-sign text-xl font-bold">Dari mana angka {skor.total}</caption>
            <tbody>
              {skor.rincian.map((r) => (
                <tr key={r.faktor} className="border-t border-line" title={r.alasan}>
                  <th scope="row" className="px-5 py-2.5 text-left font-medium">
                    {r.faktor}
                  </th>
                  <td className="py-2.5 pr-2 text-[13.5px] text-ink-3">{r.nilai}</td>
                  <td className="py-2.5 pr-5 text-right font-mono text-[15px] font-semibold whitespace-nowrap">
                    {!skor.lengkap && r.faktor === "Aktivitas gempa"
                      ? <span aria-label="Belum dihitung">—</span>
                      : <>{r.poin} <small className="font-normal text-ink-3">/{r.maks}</small></>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink">
                <th scope="row" className="px-5 py-2.5 text-left font-semibold">
                  {skor.lengkap ? "Total" : "Total sementara"}
                </th>
                <td />
                <td className="py-2.5 pr-5 text-right font-mono text-[15px] font-semibold">
                  {skor.total} <small className="font-normal text-ink-3">/100</small>
                </td>
              </tr>
            </tfoot>
          </table>
          <Link href="/tentang" className="block px-5 pt-3 pb-4 text-sm underline">
            Lihat rumus dan sumber data
          </Link>

          <div className="border-t-2 border-ink" aria-label="Kandidat lokasi dari peta">
            <div className="px-5 py-4">
              <h2 className="font-sign text-xl font-bold">Kandidat lokasi dari peta</h2>
              <p className="text-sm text-ink-2">
                Status evakuasi dan akses belum terverifikasi. Cek ke BPBD sebelum memilih tujuan.
              </p>
            </div>
            {titik.length === 0 ? (
              <p className="px-5 py-4 text-[15px] text-ink-2">
                {d.sumberTitik === "tidak-tersedia"
                  ? "Data peta tempat umum sedang tidak bisa diambil. Perbarui hasil untuk mencoba lagi."
                  : "Belum ditemukan kandidat yang memenuhi kriteria di sekitar lokasi ini."}
              </p>
            ) : (
              titik.map((t, i) => (
                <div key={t.id} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-line px-5 py-3.5 last:border-b-0">
                  <span className="grid size-8 place-items-center bg-sign font-mono font-semibold text-white">{i + 1}</span>
                  <div>
                    <p className="leading-snug font-semibold">{t.nama}</p>
                    <p className="text-[13px] text-ink-3">
                      {t.jenis} · {fmt(t.elevasiM, 0)} m dpl · {t.arah.nama}
                    </p>
                    {t.kelas === "lebih-tinggi" && (
                      <p className="text-[13px] font-medium text-ink-2">Cadangan untuk dicek ke BPBD</p>
                    )}
                  </div>
                  <p className="text-right font-mono text-[17px] leading-tight font-semibold">
                    {fmt(t.jarakKm)} km
                    <small className="block font-sans text-xs font-normal text-ink-3">±{t.menit} mnt</small>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        <section aria-labelledby="judul-rencana">
          <h2 id="judul-rencana" className="border-b-[3px] border-ink pb-2.5 text-4xl">
            Rencana keluarga
          </h2>

          <ol className="mt-2">
            {rencana.langkah_darurat.map((l, i) => (
              <li key={i} className="grid grid-cols-[52px_1fr] gap-3.5 border-t border-line py-3.5">
                <span className="grid size-11 place-items-center border-2 border-ink font-mono text-xl font-semibold">{i + 1}</span>
                <span className="self-center text-[15.5px] text-ink-2">{l}</span>
              </li>
            ))}
          </ol>

          <table className="mt-8 w-full border-collapse">
            <caption className="pb-2.5 text-left font-sign text-2xl font-bold">Siapa mengerjakan apa</caption>
            <tbody>
              {rencana.peran_anggota.map((p, i) => (
                <tr key={i} className="border-t border-line align-top">
                  <th scope="row" className="w-[34%] py-3 pr-3 text-left font-semibold">
                    {p.siapa}
                  </th>
                  <td className="py-3 text-ink-2">{p.tugas}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rencana.tips_rumah.length > 0 && (
            <>
              <h3 className="mt-8 mb-2 text-2xl">Siapkan rumah dari sekarang</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-ink-2">
                {rencana.tips_rumah.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        <TasSiaga d={d} kunciTas={kunciTas} />
      </div>

      <p className="mt-10 max-w-[80ch] text-[13px] text-ink-3">
        Skor bersifat indikatif. Kandidat lokasi diambil dari OpenStreetMap
        {d.sumberTitik === "bawaan" ? " (data diunduh November 2026)." : "."} Jarak dan perkiraan waktu
        jalan kaki dihitung dari garis lurus. Gunakan jalur resmi yang bisa dilalui.
      </p>
    </div>
  );
}

function PapanRambu({ dekatPantai }: { dekatPantai: boolean }) {
  return (
    <div
      role="note"
      aria-label="Instruksi evakuasi utama"
      className="border-4 border-sign bg-sign px-6 py-5 text-white outline-[3px] -outline-offset-[10px] outline-white sm:px-8 sm:py-6"
    >
      <h2 className="text-[clamp(26px,3.6vw,46px)] leading-none tracking-wide uppercase">
        {dekatPantai ? "Gempa kuat atau lama di pesisir" : "Saat terjadi gempa"}
      </h2>
      <p className="mt-2.5 max-w-[66ch] text-[15px] sm:text-[17px]"><strong>Saat guncangan:</strong> {SAAT_GUNCANGAN}</p>
      <p className="mt-1.5 max-w-[66ch] text-[15px] sm:text-[17px]">{setelahGuncangan(dekatPantai)}</p>
    </div>
  );
}

function TasSiaga({ d, kunciTas }: { d: HasilRencana; kunciTas: string }) {
  const tambahan = d.rencana.tas_siaga_tambahan.map((t, i) => ({ id: `t${i}-${t.barang}`, barang: t.barang, ket: t.alasan }));
  const semua = [...d.tasDasar, ...tambahan];
  const [centang, setCentang] = useState<Record<string, boolean>>(() => baca<Record<string, boolean>>(kunciTas) ?? {});
  const jumlah = semua.filter((x) => centang[x.id]).length;

  const ubah = (id: string, v: boolean) =>
    setCentang((c) => {
      const baru = { ...c, [id]: v };
      simpan(kunciTas, baru);
      return baru;
    });

  const daftar = (items: { id: string; barang: string; ket?: string }[]) => (
    <ul>
      {items.map((x) => (
        <li key={x.id} className="border-t border-line">
          <label className="grid cursor-pointer grid-cols-[28px_1fr] items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={!!centang[x.id]}
              onChange={(e) => ubah(x.id, e.target.checked)}
              className="peer mt-0.5 size-6 cursor-pointer appearance-none border-2 border-ink bg-white checked:border-sign checked:bg-sign checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%3E%3Cpath%20d=%22M5%2012l5%205%209-10%22%20stroke=%22white%22%20stroke-width=%223.2%22%20fill=%22none%22/%3E%3C/svg%3E')]"
            />
            <span className="[overflow-wrap:anywhere]">
              <b className="font-medium peer-checked:text-ink-3 peer-checked:line-through">{x.barang}</b>
              {x.ket && <small className="block text-[13.5px] leading-snug text-ink-3">{x.ket}</small>}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-labelledby="judul-tas">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b-[3px] border-ink pb-2.5">
        <h2 id="judul-tas" className="text-4xl">
          Tas siaga
        </h2>
        <span className="text-[13px] text-ink-3">Tersimpan di perangkat ini</span>
      </div>
      <div className="mb-3 flex items-center gap-3.5">
        <b className="font-mono text-[28px] font-semibold" aria-live="polite">
          {jumlah}/{semua.length}
        </b>
        <div className="h-2.5 flex-1 bg-line">
          <i className="block h-full bg-sign" style={{ width: `${(jumlah / semua.length) * 100}%` }} />
        </div>
      </div>
      <p className="mt-5 mb-1 font-sign text-xl font-bold">Untuk semua</p>
      {daftar(d.tasDasar)}
      {tambahan.length > 0 && (
        <>
          <p className="mt-5 mb-1 font-sign text-xl font-bold">Khusus keluargamu</p>
          {daftar(tambahan)}
        </>
      )}
      <p className="mt-3 text-sm text-ink-2">{CATATAN_CADANGAN}</p>
    </section>
  );
}
