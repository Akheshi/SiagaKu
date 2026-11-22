/**
 * Skor risiko 0–100 — rumus PRD §7.2. Fungsi murni & deterministik.
 * Heuristik indikatif, bukan pengganti kajian resmi BPBD/InaRISK.
 */

export type RentangPantai = "lt0_5" | "0_5_1" | "1_3" | "3_5" | "gt5";
export type RentangSungai = "lt100" | "100_500" | "gt500";
export type JenisBangunan = "beton" | "bata" | "kayu";
export type Kendaraan = "jalan" | "motor" | "mobil";
export type Kerentanan = { lansia: boolean; balita: boolean; hamil: boolean; disabilitas: boolean };
export type Kategori = "Rendah" | "Sedang" | "Tinggi" | "Sangat tinggi";

export type InputSkor = {
  /** m dpl dari Open-Meteo; null jika gagal diambil */
  elevasiM: number | null;
  jarakPantai: RentangPantai;
  /** jumlah gempa M5+ (dari 15 terakhir BMKG) dalam radius 300 km */
  jumlahGempaDekat: number;
  bangunan: JenisBangunan;
  lantai: number;
  kerentanan: Kerentanan;
  kendaraan: Kendaraan;
  sungai: RentangSungai;
};

export type RincianFaktor = {
  faktor: string;
  /** nilai input yang dipakai, dalam kata-kata */
  nilai: string;
  poin: number;
  maks: number;
  alasan: string;
};

export type HasilSkor = { total: number; kategori: Kategori; rincian: RincianFaktor[] };

export const LABEL_PANTAI: Record<RentangPantai, string> = {
  lt0_5: "kurang dari 500 m",
  "0_5_1": "500 m – 1 km",
  "1_3": "1 – 3 km",
  "3_5": "3 – 5 km",
  gt5: "lebih dari 5 km",
};

export const LABEL_SUNGAI: Record<RentangSungai, string> = {
  lt100: "kurang dari 100 m",
  "100_500": "100 – 500 m",
  gt500: "lebih dari 500 m / tidak ada",
};

export const LABEL_BANGUNAN: Record<JenisBangunan, string> = {
  beton: "beton bertulang",
  bata: "bata tanpa tulangan",
  kayu: "kayu / semi permanen",
};

const LABEL_KERENTANAN: Record<keyof Kerentanan, string> = {
  lansia: "lansia",
  balita: "balita",
  hamil: "ibu hamil",
  disabilitas: "penyandang disabilitas",
};

const POIN_PANTAI: Record<RentangPantai, number> = { lt0_5: 25, "0_5_1": 20, "1_3": 13, "3_5": 6, gt5: 0 };
const POIN_SUNGAI: Record<RentangSungai, number> = { lt100: 5, "100_500": 3, gt500: 0 };
const POIN_BANGUNAN: Record<JenisBangunan, number> = { beton: 3, bata: 10, kayu: 8 };

/** Ketinggian null dianggap 5–10 m (25 poin): lebih baik waspada daripada meremehkan. */
export function poinKetinggian(m: number | null): number {
  if (m === null) return 25;
  if (m < 5) return 30;
  if (m < 10) return 25;
  if (m < 20) return 18;
  if (m < 30) return 10;
  return 3;
}

export function rentangPantai(km: number): RentangPantai {
  if (km < 0.5) return "lt0_5";
  if (km < 1) return "0_5_1";
  if (km < 3) return "1_3";
  if (km < 5) return "3_5";
  return "gt5";
}

export function poinGempa(jumlah: number): number {
  if (jumlah <= 0) return 0;
  if (jumlah === 1) return 5;
  if (jumlah <= 3) return 10;
  return 15;
}

export function poinBangunan(jenis: JenisBangunan, lantai: number): number {
  const tambahan = lantai > 2 && jenis !== "beton" ? 5 : 0;
  return Math.min(15, POIN_BANGUNAN[jenis] + tambahan);
}

export function poinKeluarga(k: Kerentanan, kendaraan: Kendaraan): number {
  const kategori = Object.values(k).filter(Boolean).length;
  return Math.min(10, kategori * 3 + (kendaraan === "jalan" ? 1 : 0));
}

export function kategoriSkor(total: number): Kategori {
  if (total >= 80) return "Sangat tinggi";
  if (total >= 60) return "Tinggi";
  if (total >= 40) return "Sedang";
  return "Rendah";
}

export function hitungSkor(input: InputSkor): HasilSkor {
  const { elevasiM, jarakPantai, jumlahGempaDekat, bangunan, lantai, kerentanan, kendaraan, sungai } = input;

  const rentan = (Object.keys(kerentanan) as (keyof Kerentanan)[])
    .filter((k) => kerentanan[k])
    .map((k) => LABEL_KERENTANAN[k]);

  const rincian: RincianFaktor[] = [
    {
      faktor: "Ketinggian rumah",
      nilai: elevasiM === null ? "tidak diketahui" : `${Math.round(elevasiM)} m dpl`,
      poin: poinKetinggian(elevasiM),
      maks: 30,
      alasan:
        elevasiM === null
          ? "Data ketinggian tidak tersedia, dianggap rendah agar tetap waspada."
          : elevasiM < 10
            ? "Rumah di bawah 10 m sangat rawan terjangkau tsunami."
            : elevasiM < 30
              ? "Ketinggian menengah; tsunami besar masih bisa mencapai."
              : "Di atas 30 m, umumnya di luar jangkauan tsunami.",
    },
    {
      faktor: "Jarak ke pantai",
      nilai: LABEL_PANTAI[jarakPantai],
      poin: POIN_PANTAI[jarakPantai],
      maks: 25,
      alasan:
        POIN_PANTAI[jarakPantai] >= 20
          ? "Kurang dari 1 km dari pantai: waktu evakuasi sangat singkat."
          : POIN_PANTAI[jarakPantai] > 0
            ? "Masih dalam jangkauan genangan tsunami besar."
            : "Jauh dari pantai, risiko tsunami kecil.",
    },
    {
      faktor: "Aktivitas gempa",
      nilai: `${jumlahGempaDekat} gempa M5+ ≤ 300 km`,
      poin: poinGempa(jumlahGempaDekat),
      maks: 15,
      alasan: "Dihitung dari 15 gempa M5+ terakhir yang dicatat BMKG.",
    },
    {
      faktor: "Bangunan",
      nilai: `${LABEL_BANGUNAN[bangunan]}, ${lantai} lantai`,
      poin: poinBangunan(bangunan, lantai),
      maks: 15,
      alasan:
        bangunan === "beton"
          ? "Beton bertulang paling tahan guncangan."
          : lantai > 2
            ? "Bangunan tinggi tanpa tulangan rawan runtuh saat gempa."
            : "Tanpa tulangan, dinding mudah retak atau roboh saat gempa kuat.",
    },
    {
      faktor: "Kerentanan keluarga",
      nilai:
        [rentan.join(", "), kendaraan === "jalan" ? "tanpa kendaraan" : ""].filter(Boolean).join("; ") ||
        "tidak ada",
      poin: poinKeluarga(kerentanan, kendaraan),
      maks: 10,
      alasan:
        rentan.length > 0
          ? "Anggota yang perlu dibantu memperlambat evakuasi."
          : "Semua anggota bisa bergerak sendiri.",
    },
    {
      faktor: "Banjir sungai",
      nilai: LABEL_SUNGAI[sungai],
      poin: POIN_SUNGAI[sungai],
      maks: 5,
      alasan:
        POIN_SUNGAI[sungai] > 0
          ? "Dekat sungai: rawan banjir dan tsunami yang masuk lewat muara."
          : "Jauh dari sungai.",
    },
  ];

  const total = Math.min(100, rincian.reduce((s, r) => s + r.poin, 0));
  return { total, kategori: kategoriSkor(total), rincian };
}
