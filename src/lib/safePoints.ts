/** Seleksi titik aman — PRD §7.3 (dua tingkat). Fungsi murni. */
import { arahMataAngin, bearingDeg, haversineKm, menitJalanKaki, type Arah, type LatLon } from "./geo";

export type Kandidat = {
  id: string;
  nama: string;
  /** jenis tempat dalam bahasa Indonesia, mis. "Sekolah" */
  jenis: string;
  lat: number;
  lon: number;
  elevasiM: number | null;
  /** jarak tempat ini ke garis pantai (km), bila diketahui */
  jarakPantaiKm?: number | null;
};

/**
 * "tinggi": memenuhi ambang ketinggian dan lebih tinggi dari rumah bila
 * elevasi rumah diketahui. Jika belum diketahui, hanya ambang 30 m yang dipakai.
 * "lebih-tinggi": cadangan pemetaan di bawah ambang tingkat 1 yang lebih tinggi
 * dari rumah dan lebih jauh dari pantai.
 */
export type KelasTitik = "tinggi" | "lebih-tinggi";

export type TitikAman = Kandidat & {
  elevasiM: number;
  jarakKm: number;
  arah: Arah;
  bearing: number;
  menit: number;
  kelas: KelasTitik;
};

export const RADIUS_TINGGI_KM = 5;
export const RADIUS_CADANGAN_KM = 3;
export const SELISIH_CADANGAN_M = 5;

/** Ambang awal tingkat 1: min(30 m, ketinggian rumah + 15 m). */
export function syaratKetinggian(elevasiRumah: number | null): number {
  if (elevasiRumah === null) return 30;
  return Math.min(30, elevasiRumah + 15);
}

type Rumah = LatLon & { elevasiM: number | null; jarakPantaiKm?: number | null };

export function pilihTitikAman(kandidat: Kandidat[], rumah: Rumah, lambat: boolean, jumlah = 3): TitikAman[] {
  const elevasiRumah = rumah.elevasiM;
  const batas = syaratKetinggian(elevasiRumah);
  const terlihat = new Set<string>();
  const unik = kandidat.filter((c): c is Kandidat & { elevasiM: number } => {
    if (terlihat.has(c.id) || c.elevasiM === null || !Number.isFinite(c.elevasiM)) return false;
    terlihat.add(c.id);
    return true;
  });

  const lengkapi = (c: (typeof unik)[number], kelas: KelasTitik): TitikAman => {
    const jarakKm = haversineKm(rumah, c);
    const bearing = bearingDeg(rumah, c);
    return {
      ...c,
      jarakKm,
      bearing,
      arah: arahMataAngin(bearing),
      menit: menitJalanKaki(jarakKm, lambat),
      kelas,
    };
  };

  const tinggi = unik
    .filter((c) => c.elevasiM >= batas && (elevasiRumah === null || c.elevasiM > elevasiRumah))
    .map((c) => lengkapi(c, "tinggi"))
    .filter((t) => t.jarakKm <= RADIUS_TINGGI_KM)
    .sort((a, b) => a.jarakKm - b.jarakKm)
    .slice(0, jumlah);
  if (tinggi.length >= jumlah || elevasiRumah === null) return tinggi;

  const pantaiRumah = rumah.jarakPantaiKm ?? null;
  if (pantaiRumah === null) return tinggi;
  const cadangan = unik
    .filter((c) => c.elevasiM < batas && c.elevasiM >= elevasiRumah + SELISIH_CADANGAN_M)
    .filter((c) => c.jarakPantaiKm != null && c.jarakPantaiKm > pantaiRumah)
    .map((c) => lengkapi(c, "lebih-tinggi"))
    .filter((t) => t.jarakKm <= RADIUS_CADANGAN_KM)
    // Urutkan berdasarkan jarak garis lurus.
    .sort((a, b) => a.jarakKm - b.jarakKm)
    .slice(0, jumlah - tinggi.length);

  return [...tinggi, ...cadangan];
}
