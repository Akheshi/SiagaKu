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
 * "tinggi": memenuhi syarat ketinggian (≥ 30 m atau ≥ rumah + 15 m).
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

/** Titik dianggap tinggi bila ≥ 30 m, atau ≥ ketinggian rumah + 15 m (yang lebih rendah). */
export function syaratKetinggian(elevasiRumah: number | null): number {
  if (elevasiRumah === null) return 30;
  return Math.min(30, elevasiRumah + 15);
}

type Rumah = LatLon & { elevasiM: number | null; jarakPantaiKm?: number | null };

export function pilihTitikAman(kandidat: Kandidat[], rumah: Rumah, lambat: boolean, jumlah = 3): TitikAman[] {
  const batas = syaratKetinggian(rumah.elevasiM);
  const terlihat = new Set<string>();
  const unik = kandidat.filter((c) => {
    if (terlihat.has(c.id) || c.elevasiM === null) return false;
    terlihat.add(c.id);
    return true;
  });

  const lengkapi = (c: Kandidat, kelas: KelasTitik): TitikAman => {
    const jarakKm = haversineKm(rumah, c);
    const bearing = bearingDeg(rumah, c);
    return {
      ...c,
      elevasiM: c.elevasiM as number,
      jarakKm,
      bearing,
      arah: arahMataAngin(bearing),
      menit: menitJalanKaki(jarakKm, lambat),
      kelas,
    };
  };

  const tinggi = unik
    .filter((c) => (c.elevasiM as number) >= batas)
    .map((c) => lengkapi(c, "tinggi"))
    .filter((t) => t.jarakKm <= RADIUS_TINGGI_KM)
    .sort((a, b) => a.jarakKm - b.jarakKm)
    .slice(0, jumlah);
  if (tinggi.length >= jumlah || rumah.elevasiM === null) return tinggi;

  const pantaiRumah = rumah.jarakPantaiKm ?? null;
  if (pantaiRumah === null) return tinggi;
  const cadangan = unik
    .filter((c) => (c.elevasiM as number) < batas && (c.elevasiM as number) >= (rumah.elevasiM as number) + SELISIH_CADANGAN_M)
    .filter((c) => c.jarakPantaiKm != null && c.jarakPantaiKm > pantaiRumah)
    .map((c) => lengkapi(c, "lebih-tinggi"))
    .filter((t) => t.jarakKm <= RADIUS_CADANGAN_KM)
    // yang terdekat dulu — waktu tempuh paling menentukan saat tsunami
    .sort((a, b) => a.jarakKm - b.jarakKm)
    .slice(0, jumlah - tinggi.length);

  return [...tinggi, ...cadangan];
}
