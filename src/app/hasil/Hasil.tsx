"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { buttonClass } from "@/components/ButtonLink";
import { fmt, KUNCI_HASIL, KUNCI_TAS, kunciInput, pesisir, warnaKategori, type HasilRencana } from "@/lib/hasil";
import { CONTOH_BENGKULU, KUNCI_INPUT, InputRencana, type InputRencanaT } from "@/lib/input";

const ResultMap = dynamic(() => import("@/components/map/ResultMap"), {
  ssr: false,
  loading: () => <div className="grid size-full place-items-center text-sm text-ink-3">Memuat peta…</div>,
});

type Keadaan =
  | { tahap: "kosong" }
  | { tahap: "memuat"; input: InputRencanaT }
  | { tahap: "galat"; input: InputRencanaT; pesan: string }
  | { tahap: "siap"; data: HasilRencana };

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

function inputAwal(): InputRencanaT | null {
  if (new URLSearchParams(window.location.search).get("contoh") === "bengkulu") return CONTOH_BENGKULU;
  const cek = InputRencana.safeParse(baca(KUNCI_INPUT));
  return cek.success ? cek.data : null;
}

function keadaanAwal(): Keadaan {
  const input = inputAwal();
  if (!input) return { tahap: "kosong" };
  const tersimpan = baca<{ kunci: string; data: HasilRencana }>(KUNCI_HASIL);
  if (tersimpan?.kunci === kunciInput(input)) return { tahap: "siap", data: tersimpan.data };
  return { tahap: "memuat", input };
}

const PESAN_MUAT = ["Menghitung skor risiko…", "Mencari titik aman di sekitar rumah…", "Menyusun rencana keluarga…"];

export default function Hasil() {
  const [k, setK] = useState<Keadaan>(keadaanAwal);
  const [pesanKe, setPesanKe] = useState(0);

  const muat = useCallback(async (input: InputRencanaT) => {
    try {
      const res = await fetch("/api/rencana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.pesan || "Rencana belum bisa disusun.");
      simpan(KUNCI_HASIL, { kunci: kunciInput(input), data });
      setK({ tahap: "siap", data });
    } catch (e) {
      const pesan = e instanceof TypeError ? "Koneksi internet terputus. Periksa jaringan, lalu coba lagi." : (e as Error).message;
      setK({ tahap: "galat", input, pesan });
    }
  }, []);

  useEffect(() => {
    if (k.tahap !== "memuat") return;
    const t = setInterval(() => setPesanKe((n) => Math.min(n + 1, PESAN_MUAT.length - 1)), 2500);
    // muat() hanya memanggil setState setelah await (respons jaringan), bukan sinkron
    // eslint-disable-next-line react-hooks/set-state-in-effect
    muat(k.input);
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
        <p className="font-mono text-sm text-ink-3">Mohon tunggu, biasanya 5–20 detik</p>
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

  return <TampilanHasil data={k.data} />;
}

function teksBagikan(d: HasilRencana) {
  const t = d.titik.find((x) => x.id === d.rencana.titik_tujuan_id) ?? d.titik[0];
  return [
    `Rencana siaga ${d.input.namaKeluarga ? `Keluarga ${d.input.namaKeluarga}` : "keluarga kita"} (SiagaKu)`,
    `Skor risiko rumah: ${d.skor.total}/100 (${d.skor.kategori})`,
    t ? `Jika gempa kuat > 20 detik: jalan ke ${t.arah.nama} menuju ${t.nama} (${fmt(t.jarakKm)} km, ±${t.menit} menit). Jangan tunggu sirene.` : "",
    ...d.rencana.langkah_darurat.map((l, i) => `${i + 1}. ${l}`),
    `Buat rencanamu sendiri: ${window.location.origin}/cek`,
  ]
    .filter(Boolean)
    .join("\n");
}

function TampilanHasil({ data: d }: { data: HasilRencana }) {
  const { input, skor, titik, rencana } = d;
  const tujuan = titik.find((t) => t.id === rencana.titik_tujuan_id) ?? titik[0];
  const warna = warnaKategori(skor.kategori);
  const contoh = input.namaKeluarga === CONTOH_BENGKULU.namaKeluarga && input.lokasi.lat === CONTOH_BENGKULU.lokasi.lat;
  const judul = contoh
    ? "Contoh rencana: Kota Bengkulu"
    : `Rencana siaga ${input.namaKeluarga ? `Keluarga ${input.namaKeluarga}` : "keluargamu"}`;
  const dekatPantai = pesisir(input);
  const faktorBesar = [...skor.rincian].sort((a, b) => b.poin / b.maks - a.poin / a.maks)[0];

  return (
    <div className="mx-auto max-w-[1200px] px-4">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-7 pb-4">
        <div>
          <h1 className="text-[clamp(34px,4.6vw,52px)]">{judul}</h1>
          <p className="mt-1.5 text-ink-2">
            {fmt(input.lokasi.lat, 4)}, {fmt(input.lokasi.lon, 4)} ·{" "}
            {input.elevasiM === null ? "ketinggian tidak terbaca" : `${fmt(input.elevasiM, 0)} m dpl`} · {input.penghuni} orang
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}
            href={`https://wa.me/?text=${encodeURIComponent(teksBagikan(d))}`}
            target="_blank"
            rel="noopener"
          >
            Bagikan ke WhatsApp
          </a>
          <Link href="/cek" className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}>
            Ubah data
          </Link>
        </div>
      </div>

      <PapanRambu d={d} />

      <div className="mt-5 grid border-2 border-ink bg-white md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="relative z-0 min-h-[380px] border-b-2 border-ink md:min-h-[540px] md:border-r-2 md:border-b-0">
          <div className="absolute inset-0">
            <ResultMap rumah={input.lokasi} titik={titik} tujuanId={rencana.titik_tujuan_id} />
          </div>
          <div className="absolute bottom-3 left-3 z-[500] grid gap-1 border-2 border-ink bg-white px-3 py-2 text-[13px]">
            <span>
              <i className="mr-2 inline-block size-3 bg-ink align-[-1px]" />
              Rumah
            </span>
            <span>
              <i className="mr-2 inline-block size-3 bg-sign align-[-1px]" />
              Titik aman
            </span>
          </div>
        </div>

        <div>
          <section className="px-5 pt-5 pb-2" aria-labelledby="judul-skor">
            <h2 id="judul-skor" className="sr-only">
              Skor risiko
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <p className={`font-mono text-[72px] leading-[0.8] font-semibold tracking-tighter sm:text-[88px] ${warna.teks}`}>
                {skor.total}
                <small className="text-[22px] tracking-normal text-ink-3">/100</small>
              </p>
              <p className={`mb-1 border-[3px] px-3 pt-2 pb-1.5 font-sign text-[26px] leading-none font-bold tracking-wide uppercase ${warna.bingkai} ${warna.teks}`}>
                Risiko {skor.kategori.toLowerCase()}
              </p>
            </div>
            <div className="relative mt-5" aria-hidden="true">
              <div className="grid grid-cols-[40fr_20fr_20fr_21fr] font-mono text-[11.5px] leading-none text-ink-3">
                <div className="border-t-[6px] border-cat-rendah pt-1.5">0 Rendah</div>
                <div className="border-t-[6px] border-cat-sedang pt-1.5">40 Sedang</div>
                <div className="border-t-[6px] border-cat-tinggi pt-1.5">60 Tinggi</div>
                <div className="border-t-[6px] border-cat-sangat pt-1.5">80</div>
              </div>
              <span className="absolute -top-1.5 h-[18px] w-[3px] bg-ink" style={{ left: `${Math.min(99, skor.total)}%` }} />
            </div>
            <p className="mt-4 text-[15px] text-ink-2">
              Faktor terbesar: {faktorBesar.faktor.toLowerCase()} ({faktorBesar.nilai}).
              {d.gempaTersedia ? "" : " Data gempa BMKG sedang tidak tersedia, faktor aktivitas gempa dihitung 0."}
            </p>
          </section>

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
                    {r.poin} <small className="font-normal text-ink-3">/{r.maks}</small>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink">
                <th scope="row" className="px-5 py-2.5 text-left font-semibold">
                  Total
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

          <div className="border-t-2 border-ink" aria-label="Titik aman terdekat">
            {titik.length === 0 ? (
              <p className="px-5 py-4 text-[15px] text-ink-2">
                {d.sumberTitik === "tidak-tersedia"
                  ? "Data peta tempat umum sedang tidak bisa diambil. "
                  : "Tidak ada tempat umum yang cukup tinggi dalam radius 5 km. "}
                Bergeraklah menjauhi pantai minimal 3 km atau ke tempat dengan ketinggian 30 m ke atas.
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
                      <p className="text-[13px] font-medium text-ink-2">Di bawah 30 m: naik ke lantai paling atas</p>
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

      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        <section aria-labelledby="judul-rencana">
          <div className="mb-4 flex items-baseline justify-between gap-3 border-b-[3px] border-ink pb-2.5">
            <h2 id="judul-rencana" className="text-4xl">
              Rencana keluarga
            </h2>
            <span className="text-right text-[13px] text-ink-3">
              {d.sumberRencana === "ai" ? "Ditulis AI dari data di atas" : "Disusun dari template (AI sedang tidak tersedia)"}
            </span>
          </div>
          <p className="max-w-[62ch] text-lg leading-relaxed">{rencana.ringkasan}</p>

          <ol className="mt-6">
            {rencana.langkah_darurat.map((l, i) => (
              <li key={i} className="grid grid-cols-[52px_1fr] gap-3.5 border-t border-line py-3.5">
                <span className="grid size-11 place-items-center border-2 border-ink font-mono text-xl font-semibold">{i + 1}</span>
                <span className="self-center text-[15.5px] text-ink-2">{l}</span>
              </li>
            ))}
          </ol>

          <h3 className="mt-8 mb-2 text-2xl">Rute</h3>
          <p className="max-w-[62ch] text-ink-2">{rencana.rute_narasi}</p>

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

        <TasSiaga d={d} />
      </div>

      <p className="mt-10 max-w-[80ch] text-[13px] text-ink-3">
        {dekatPantai ? "Perkiraan waktu tiba tsunami di pesisir Bengkulu bisa kurang dari 30 menit. " : ""}
        Skor bersifat indikatif dan bukan pengganti kajian resmi BPBD. Titik aman dari OpenStreetMap
        {d.sumberTitik === "bawaan" ? " (data diunduh November 2026)" : ""}; pastikan tempat tersebut bisa dimasuki saat darurat.
        {tujuan ? "" : ""}
      </p>
    </div>
  );
}

function PapanRambu({ d }: { d: HasilRencana }) {
  const tujuan = d.titik.find((t) => t.id === d.rencana.titik_tujuan_id) ?? d.titik[0];
  const dekatPantai = pesisir(d.input);
  const judul = !dekatPantai
    ? "Setelah gempa: keluar ke ruang terbuka"
    : tujuan
      ? `Gempa lebih dari 20 detik: jalan ke ${tujuan.arah.nama}`
      : "Gempa lebih dari 20 detik: jauhi pantai";
  const sub = dekatPantai
    ? tujuan?.kelas === "lebih-tinggi"
      ? "Jangan tunggu sirene. Begitu guncangan berhenti, berangkat, lalu naik ke lantai paling atas."
      : "Jangan tunggu sirene. Begitu guncangan berhenti, ambil tas siaga dan berangkat."
    : "Jauhi kaca, tiang listrik, dan bangunan retak. Waspadai gempa susulan.";
  return (
    <div
      role="note"
      aria-label="Instruksi evakuasi utama"
      className="grid grid-cols-[auto_1fr] border-4 border-sign bg-sign text-white outline-[3px] -outline-offset-[10px] outline-white md:grid-cols-[auto_1fr_auto]"
    >
      <div className="grid place-items-center py-4 pr-1.5 pl-4 sm:p-5 sm:pl-6" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="size-[60px] sm:size-24" style={{ transform: `rotate(${(tujuan && dekatPantai ? tujuan.bearing : 90) - 90}deg)` }}>
          <path d="M8 50h62M46 18l34 32-34 32" stroke="#fff" strokeWidth="16" fill="none" strokeLinecap="square" />
        </svg>
      </div>
      <div className="self-center py-4 pr-4 pl-1 sm:py-5">
        <h2 className="text-[clamp(26px,3.6vw,46px)] leading-none tracking-wide uppercase">{judul}</h2>
        <p className="mt-2.5 max-w-[60ch] text-[15px] opacity-95 sm:text-[17px]">{sub}</p>
      </div>
      {tujuan && dekatPantai && (
        <div className="col-span-2 mx-3.5 mb-3.5 flex min-w-[230px] flex-col justify-center bg-white px-4 py-3.5 text-ink md:col-span-1 md:my-3.5 md:ml-0">
          <span className="text-[13px] text-ink-3">Tujuan utama</span>
          <b className="mt-0.5 mb-2 font-sign text-2xl leading-tight">{tujuan.nama}</b>
          <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-sm">
            <dt className="text-ink-3">Jarak</dt>
            <dd className="text-right font-mono font-semibold">{fmt(tujuan.jarakKm)} km</dd>
            <dt className="text-ink-3">Ketinggian</dt>
            <dd className="text-right font-mono font-semibold">{fmt(tujuan.elevasiM, 0)} m</dd>
            <dt className="text-ink-3">Jalan kaki</dt>
            <dd className="text-right font-mono font-semibold">±{tujuan.menit} mnt</dd>
          </dl>
          {tujuan.kelas === "lebih-tinggi" && <p className="mt-2 text-[13px] font-medium">Naik ke lantai paling atas</p>}
        </div>
      )}
    </div>
  );
}

function TasSiaga({ d }: { d: HasilRencana }) {
  const tambahan = d.rencana.tas_siaga_tambahan.map((t, i) => ({ id: `t${i}-${t.barang}`, barang: t.barang, ket: t.alasan }));
  const semua = [...d.tasDasar, ...tambahan];
  const [centang, setCentang] = useState<Record<string, boolean>>(() => baca<Record<string, boolean>>(KUNCI_TAS) ?? {});
  const jumlah = semua.filter((x) => centang[x.id]).length;

  const ubah = (id: string, v: boolean) =>
    setCentang((c) => {
      const baru = { ...c, [id]: v };
      simpan(KUNCI_TAS, baru);
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
            <span>
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
    </section>
  );
}
