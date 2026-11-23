"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ButtonLink";
import { GrupPilihan, KotakCentang, Stepper, type Opsi } from "@/components/form/Pilihan";
import type { LatLon } from "@/lib/geo";
import { InputRencana, KUNCI_DRAF, KUNCI_INPUT, type InputRencanaT } from "@/lib/input";
import type { JenisBangunan, Kendaraan, RentangPantai, RentangSungai } from "@/lib/score";

const MapPicker = dynamic(() => import("@/components/map/MapPicker"), {
  ssr: false,
  loading: () => <div className="grid size-full place-items-center text-sm text-ink-3">Memuat peta…</div>,
});

/** Titik awal: pusat Kota Bengkulu. */
const AWAL: LatLon = { lat: -3.7956, lon: 102.2592 };

type Draf = Omit<InputRencanaT, "jarakPantai" | "sungai" | "bangunan" | "kendaraan"> & {
  jarakPantai?: RentangPantai;
  sungai?: RentangSungai;
  bangunan?: JenisBangunan;
  kendaraan?: Kendaraan;
};

const DRAF_KOSONG: Draf = {
  namaKeluarga: "",
  lokasi: AWAL,
  elevasiM: null,
  jarakPantaiKm: null,
  pantaiOtomatis: false,
  lantai: 1,
  penghuni: 4,
  kerentanan: { lansia: false, balita: false, hamil: false, disabilitas: false },
  obat: "",
};

const OPSI_PANTAI: Opsi<RentangPantai>[] = [
  { nilai: "lt0_5", label: "Kurang dari 500 m" },
  { nilai: "0_5_1", label: "500 m – 1 km" },
  { nilai: "1_3", label: "1 – 3 km" },
  { nilai: "3_5", label: "3 – 5 km" },
  { nilai: "gt5", label: "Lebih dari 5 km", ket: "atau tidak dekat laut" },
];
const OPSI_SUNGAI: Opsi<RentangSungai>[] = [
  { nilai: "lt100", label: "Kurang dari 100 m" },
  { nilai: "100_500", label: "100 – 500 m" },
  { nilai: "gt500", label: "Lebih jauh / tidak ada" },
];
const OPSI_BANGUNAN: Opsi<JenisBangunan>[] = [
  { nilai: "beton", label: "Beton bertulang", ket: "ada kolom dan balok besi" },
  { nilai: "bata", label: "Bata tanpa tulangan" },
  { nilai: "kayu", label: "Kayu / semi permanen" },
];
const OPSI_KENDARAAN: Opsi<Kendaraan>[] = [
  { nilai: "jalan", label: "Tidak ada, jalan kaki" },
  { nilai: "motor", label: "Sepeda motor" },
  { nilai: "mobil", label: "Mobil" },
];

type Status = "memuat" | "ok" | "gagal";

const fmt = (n: number, d: number) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");

function bacaDraf(): Draf {
  try {
    const s = localStorage.getItem(KUNCI_DRAF);
    if (s) {
      const d: Draf = { ...DRAF_KOSONG, ...JSON.parse(s) };
      return {
        ...d,
        elevasiM: null,
        jarakPantaiKm: null,
        jarakPantai: d.pantaiOtomatis ? undefined : d.jarakPantai,
        pantaiOtomatis: false,
      };
    }
  } catch {
    /* localStorage tidak tersedia */
  }
  return DRAF_KOSONG;
}

export default function Wizard() {
  const [draf, setDraf] = useState<Draf>(bacaDraf);
  const [langkah, setLangkah] = useState<1 | 2>(1);
  const [pusatKey, setPusatKey] = useState(0);
  const [stElevasi, setStElevasi] = useState<Status>("memuat");
  const [stPantai, setStPantai] = useState<Status>("memuat");
  const [gps, setGps] = useState<string | null>(null);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const judulRef = useRef<HTMLHeadingElement>(null);
  const lokasiAktif = useRef(draf.lokasi);
  const permintaanGps = useRef(0);
  const fokusGalat = useRef<string | null>(null);

  const ubah = (patch: Partial<Draf>) => {
    setDraf((d) => ({ ...d, ...patch }));
    // hapus pesan galat begitu pertanyaannya dijawab
    const kunciGalat: Partial<Record<keyof Draf, string>> = {
      jarakPantai: "pantai",
      sungai: "sungai",
      bangunan: "bangunan",
      kendaraan: "kendaraan",
    };
    const hapus = Object.keys(patch).map((k) => kunciGalat[k as keyof Draf]).filter(Boolean) as string[];
    if (hapus.length) setGalat((g) => Object.fromEntries(Object.entries(g).filter(([k]) => !hapus.includes(k))));
  };

  function ubahLokasi(lokasi: LatLon) {
    if (lokasi.lat === lokasiAktif.current.lat && lokasi.lon === lokasiAktif.current.lon) return;
    lokasiAktif.current = lokasi;
    setStElevasi("memuat");
    setStPantai("memuat");
    ubah({ lokasi, elevasiM: null, jarakPantaiKm: null, jarakPantai: undefined, pantaiOtomatis: false });
  }

  // simpan draf agar tidak hilang saat kembali / muat ulang
  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_DRAF, JSON.stringify(draf));
    } catch {
      /* abaikan */
    }
  }, [draf]);

  // ambil ketinggian & jarak pantai setiap lokasi berubah (debounce 400 ms)
  const { lokasi } = draf;
  const { lat, lon } = lokasi;
  useEffect(() => {
    const ctrl = new AbortController();
    const masihAktif = () => !ctrl.signal.aborted && lokasiAktif.current === lokasi;

    const t = setTimeout(() => {
      const q = `lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}`;
      const ambil = <T,>(p: string): Promise<T | null> =>
        fetch(`/api/${p}?${q}`, { signal: ctrl.signal })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null);

      void ambil<{ ok: boolean; elevasiM: number | null }>("elevasi").then((r) => {
        if (!masihAktif()) return;
        const elevasiM = r?.ok ? r.elevasiM : null;
        setDraf((d) => d.lokasi === lokasi ? { ...d, elevasiM } : d);
        setStElevasi(elevasiM === null ? "gagal" : "ok");
      });

      void ambil<{ ok: boolean; jarakKm: number; rentang: RentangPantai }>("pantai").then((r) => {
        if (!masihAktif()) return;
        if (!r?.ok) {
          setStPantai("gagal");
          return;
        }
        setDraf((d) => d.lokasi === lokasi ? {
          ...d,
          jarakPantaiKm: r.jarakKm,
          ...(d.jarakPantai === undefined ? { jarakPantai: r.rentang, pantaiOtomatis: true } : {}),
        } : d);
        setStPantai("ok");
      });
    }, 400);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [lokasi, lat, lon]);

  useEffect(() => {
    judulRef.current?.focus();
  }, [langkah]);

  useEffect(() => {
    const nama = fokusGalat.current;
    if (!nama) return;
    fokusGalat.current = null;
    const pesan = document.getElementById(`${nama}-galat`);
    const grup = pesan?.closest("fieldset");
    grup?.querySelector<HTMLInputElement>(`input[name="${nama}"]`)?.focus({ preventScroll: true });
    grup?.scrollIntoView({ block: "start" });
  }, [galat]);

  function pakaiGps() {
    if (!("geolocation" in navigator)) {
      setGps("Perangkat ini tidak mendukung GPS. Geser pin di peta.");
      return;
    }
    const permintaan = ++permintaanGps.current;
    setGps("Mencari lokasimu…");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (permintaan !== permintaanGps.current) return;
        ubahLokasi({ lat: p.coords.latitude, lon: p.coords.longitude });
        setPusatKey((k) => k + 1);
        setGps(`Lokasi ditemukan (akurasi ±${Math.round(p.coords.accuracy)} m). Geser pin jika kurang tepat.`);
      },
      (e) => {
        if (permintaan !== permintaanGps.current) return;
        setGps(
          e.code === e.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Tidak apa-apa, geser pin di peta ke rumahmu."
            : "Lokasi belum bisa ditemukan. Geser pin di peta ke rumahmu.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    const g: Record<string, string> = {};
    if (!draf.jarakPantai) g.pantai = "Pilih perkiraan jarak rumah ke pantai.";
    if (!draf.sungai) g.sungai = "Pilih jarak rumah ke sungai.";
    if (!draf.bangunan) g.bangunan = "Pilih jenis bangunan rumah.";
    if (!draf.kendaraan) g.kendaraan = "Pilih kendaraan yang biasa tersedia.";
    fokusGalat.current = Object.keys(g)[0] ?? null;
    setGalat(g);
    if (fokusGalat.current) return;
    const hasil = InputRencana.safeParse(draf);
    if (!hasil.success) {
      setGalat({ umum: "Ada isian yang belum sesuai. Periksa lagi isian di atas." });
      return;
    }
    try {
      localStorage.setItem(KUNCI_INPUT, JSON.stringify(hasil.data));
    } catch {
      setGalat({ umum: "Izin penyimpanan browser diperlukan. Izinkan penyimpanan untuk situs ini, lalu coba lagi." });
      return;
    }
    // Mulai halaman hasil dari input yang baru, tanpa mempertahankan rencana lama di navigasi klien.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/hasil");
  }

  const ketPantai =
    stPantai === "memuat" ? (
      <p className="mb-3 text-sm text-ink-3">Mendeteksi jarak dari peta…</p>
    ) : draf.jarakPantaiKm !== null && draf.pantaiOtomatis ? (
      <p className="mb-3 text-sm text-ink-2">
        Terdeteksi otomatis dari peta: <b className="font-mono">{fmt(draf.jarakPantaiKm, 2)} km</b>. Ganti jika kurang tepat.
      </p>
    ) : draf.jarakPantaiKm !== null ? (
      <p className="mb-3 text-sm text-ink-3">
        Dari peta: {fmt(draf.jarakPantaiKm, 2)} km. Kamu memilih sendiri.
      </p>
    ) : (
      <p className="mb-3 text-sm text-ink-3">Jarak belum bisa dideteksi otomatis. Pilih perkiraanmu.</p>
    );

  return (
    <div className="mx-auto max-w-[880px] px-4 pt-8">
      <div className="mb-6 flex gap-1.5" aria-hidden="true">
        <i className="h-1.5 flex-1 bg-sign" />
        <i className={`h-1.5 flex-1 ${langkah === 2 ? "bg-sign" : "bg-line"}`} />
      </div>
      <p className="font-mono text-sm text-ink-3">Langkah {langkah} dari 2</p>

      {langkah === 1 ? (
        <section aria-labelledby="judul-langkah">
          <h1 id="judul-langkah" ref={judulRef} tabIndex={-1} className="my-2.5 text-[clamp(36px,5vw,52px)] outline-none">
            Di mana rumahmu?
          </h1>
          <p className="max-w-[60ch] text-ink-2">
            Pastikan pin berada di rumahmu sebelum lanjut.
          </p>

          <div className="mt-6 border-2 border-ink bg-white">
            <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-3">
              <button type="button" onClick={pakaiGps} className={buttonClass("plain", "min-h-11 px-4 text-[15px]")}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <circle cx="9" cy="9" r="4" fill="currentColor" />
                  <path d="M9 0v4M9 14v4M0 9h4M14 9h4" stroke="currentColor" strokeWidth="2" />
                </svg>
                Pakai lokasi saya
              </button>
              <span className="text-sm text-ink-3" aria-live="polite">
                {gps ?? (lat === AWAL.lat && lon === AWAL.lon
                  ? "Titik awal di Kota Bengkulu. Ketuk peta atau geser pin."
                  : "Ketuk peta atau geser pin untuk mengubah titik.")}
              </span>
            </div>
            <div className="relative z-0 h-[285px] sm:h-[420px]">
              <MapPicker
                titik={draf.lokasi}
                onPilih={(lokasi) => {
                  permintaanGps.current++;
                  setGps(null);
                  ubahLokasi(lokasi);
                }}
                pusatKey={pusatKey}
              />
            </div>
            <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4" aria-live="polite">
              {[
                ["Lintang", fmt(draf.lokasi.lat, 4)],
                ["Bujur", fmt(draf.lokasi.lon, 4)],
                [
                  "Ketinggian",
                  stElevasi === "memuat" ? "…" : draf.elevasiM === null ? "tidak terbaca" : `${fmt(draf.elevasiM, 0)} m dpl`,
                ],
                [
                  "Ke pantai",
                  stPantai === "memuat" ? "…" : draf.jarakPantaiKm === null ? "tidak terdeteksi" : `${fmt(draf.jarakPantaiKm, 2)} km`,
                ],
              ].map(([k, v], i) => (
                <div key={k} className={`px-3.5 py-3 ${i % 2 ? "border-l border-line" : ""} ${i === 2 ? "border-t border-line sm:border-t-0 sm:border-l" : ""} ${i === 3 ? "border-t border-line sm:border-t-0" : ""}`}>
                  <dt className="text-[13px] text-ink-3">{k}</dt>
                  <dd className="font-mono text-base font-semibold sm:text-xl">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {stElevasi === "gagal" && (
            <p className="mt-3 text-sm text-ink-2">
              Ketinggian belum bisa dibaca. Kamu tetap bisa lanjut; skor akan menganggap rumah berada di dataran rendah agar tetap waspada.
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Link href="/" className={buttonClass("plain", "flex-1 sm:flex-none")}>
              Kembali
            </Link>
            <button
              type="button"
              onClick={() => {
                permintaanGps.current++;
                setGps(null);
                setLangkah(2);
              }}
              className={buttonClass("go", "flex-1 sm:flex-none")}
            >
              Pakai titik ini dan lanjut
            </button>
          </div>
        </section>
      ) : (
        <section aria-labelledby="judul-langkah">
          <h1 id="judul-langkah" ref={judulRef} tabIndex={-1} className="my-2.5 text-[clamp(36px,5vw,52px)] outline-none">
            Rumah dan keluargamu
          </h1>
          <p className="max-w-[60ch] text-ink-2">Cukup perkiraan. Jawaban ini mengubah skor dan isi rencana.</p>

          <form onSubmit={kirim} noValidate className="mt-4">
            <GrupPilihan
              nama="pantai"
              judul="Seberapa jauh rumah dari pantai?"
              opsi={OPSI_PANTAI}
              nilai={draf.jarakPantai}
              onUbah={(v) => ubah({ jarakPantai: v, pantaiOtomatis: draf.jarakPantaiKm !== null && v === draf.jarakPantai && draf.pantaiOtomatis })}
              galat={draf.jarakPantai ? undefined : galat.pantai}
              catatan={ketPantai}
            />
            <GrupPilihan
              nama="sungai"
              judul="Ada sungai di dekat rumah?"
              opsi={OPSI_SUNGAI}
              nilai={draf.sungai}
              onUbah={(v) => ubah({ sungai: v })}
              galat={galat.sungai}
            />

            <fieldset className="border-t border-line py-6">
              <legend className="mb-1 font-sign text-2xl font-bold">Bangunan rumah</legend>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="grid gap-2">
                    {OPSI_BANGUNAN.map((o) => (
                      <div key={o.nilai} className="relative">
                        <input
                          type="radio"
                          id={`bangunan-${o.nilai}`}
                          name="bangunan"
                          aria-describedby={galat.bangunan ? "bangunan-galat" : undefined}
                          checked={draf.bangunan === o.nilai}
                          onChange={() => ubah({ bangunan: o.nilai })}
                          className="peer absolute inset-0 cursor-pointer opacity-0"
                        />
                        <label
                          htmlFor={`bangunan-${o.nilai}`}
                          className="flex min-h-14 cursor-pointer flex-col justify-center border-2 border-line bg-white px-3.5 py-2.5 leading-tight font-medium peer-checked:border-sign peer-checked:bg-sign-tint peer-checked:shadow-[inset_6px_0_0_var(--color-sign)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
                        >
                          {o.label}
                          {o.ket && <small className="text-[13px] font-normal text-ink-3">{o.ket}</small>}
                        </label>
                      </div>
                    ))}
                  </div>
                  {galat.bangunan && (
                    <p id="bangunan-galat" className="mt-2 text-sm font-medium text-risk">
                      {galat.bangunan}
                    </p>
                  )}
                </div>
                <div className="space-y-5">
                  <Stepper label="Jumlah lantai" nilai={draf.lantai} min={1} max={20} onUbah={(v) => ubah({ lantai: v })} />
                  <Stepper label="Jumlah penghuni" nilai={draf.penghuni} min={1} max={30} onUbah={(v) => ubah({ penghuni: v })} />
                </div>
              </div>
            </fieldset>

            <fieldset className="border-t border-line py-6">
              <legend className="mb-1 font-sign text-2xl font-bold">Siapa yang perlu dibantu saat evakuasi?</legend>
              <p className="mb-3 text-sm text-ink-3">Pilih semua yang ada di rumah. Boleh dikosongkan.</p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2">
                <KotakCentang id="k-lansia" label="Lansia" ket="60 tahun ke atas" checked={draf.kerentanan.lansia} onUbah={(v) => ubah({ kerentanan: { ...draf.kerentanan, lansia: v } })} />
                <KotakCentang id="k-balita" label="Balita" checked={draf.kerentanan.balita} onUbah={(v) => ubah({ kerentanan: { ...draf.kerentanan, balita: v } })} />
                <KotakCentang id="k-hamil" label="Ibu hamil" checked={draf.kerentanan.hamil} onUbah={(v) => ubah({ kerentanan: { ...draf.kerentanan, hamil: v } })} />
                <KotakCentang id="k-disabilitas" label="Penyandang disabilitas" checked={draf.kerentanan.disabilitas} onUbah={(v) => ubah({ kerentanan: { ...draf.kerentanan, disabilitas: v } })} />
              </div>
              <div className="mt-4">
                <label htmlFor="obat" className="mb-1.5 block font-semibold">
                  Obat rutin yang harus dibawa
                </label>
                <input
                  id="obat"
                  type="text"
                  maxLength={200}
                  value={draf.obat}
                  onChange={(e) => ubah({ obat: e.target.value })}
                  className="min-h-[52px] w-full border-2 border-line bg-white px-3.5 focus:border-ink focus:outline-none"
                  aria-describedby="obat-bantuan"
                />
                <p id="obat-bantuan" className="mt-1.5 text-sm text-ink-3">
                  Opsional. Contoh: insulin, inhaler, obat darah tinggi.
                </p>
              </div>
            </fieldset>

            <GrupPilihan
              nama="kendaraan"
              judul="Kendaraan yang biasa tersedia"
              opsi={OPSI_KENDARAAN}
              nilai={draf.kendaraan}
              onUbah={(v) => ubah({ kendaraan: v })}
              galat={galat.kendaraan}
            />

            <fieldset className="border-t border-line py-6">
              <legend className="mb-1 font-sign text-2xl font-bold">Nama keluarga</legend>
              <label htmlFor="nama" className="mb-1.5 block text-sm text-ink-3">
                Opsional. Dipakai sebagai judul lembar rencana, mis. &ldquo;Keluarga Rahman&rdquo;.
              </label>
              <input
                id="nama"
                type="text"
                maxLength={60}
                value={draf.namaKeluarga}
                onChange={(e) => ubah({ namaKeluarga: e.target.value })}
                className="min-h-[52px] w-full border-2 border-line bg-white px-3.5 focus:border-ink focus:outline-none sm:max-w-sm"
              />
            </fieldset>

            {galat.umum && <p role="alert" className="mb-3 font-medium text-risk">{galat.umum}</p>}
            <div className="mt-2 flex flex-wrap justify-between gap-3">
              <button type="button" onClick={() => setLangkah(1)} className={buttonClass("plain", "flex-1 sm:flex-none")}>
                Ubah lokasi
              </button>
              <button type="submit" className={buttonClass("go", "flex-1 sm:flex-none")}>
                Hitung risiko dan susun rencana
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
