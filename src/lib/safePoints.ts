/** Seleksi titik aman — PRD §7.3. Fungsi murni. */
import { arahMataAngin, bearingDeg, haversineKm, menitJalanKaki, type Arah, type LatLon } from "./geo";

export type Kandidat = {
  id: string;
  nama: string;
  /** jenis tempat dalam bahasa Indonesia, mis. "Sekolah" */
  jenis: string;
  lat: number;
  lon: number;
  elevasiM: number | null;
};

export type TitikAman = Kandidat & {
  elevasiM: number;
  jarakKm: number;
  arah: Arah;
  bearing: number;
  menit: number;
};

/** Titik dianggap aman bila ≥ 30 m, atau ≥ ketinggian rumah + 15 m (yang lebih rendah). */
export function syaratKetinggian(elevasiRumah: number | null): number {
  if (elevasiRumah === null) return 30;
  return Math.min(30, elevasiRumah + 15);
}

export function pilihTitikAman(
  kandidat: Kandidat[],
  rumah: LatLon & { elevasiM: number | null },
  lambat: boolean,
  jumlah = 3,
): TitikAman[] {
  const batas = syaratKetinggian(rumah.elevasiM);
  const terlihat = new Set<string>();
  return kandidat
    .filter((c) => {
      if (terlihat.has(c.id)) return false;
      terlihat.add(c.id);
      return c.elevasiM !== null && c.elevasiM >= batas;
    })
    .map((c) => {
      const jarakKm = haversineKm(rumah, c);
      const bearing = bearingDeg(rumah, c);
      return {
        ...c,
        elevasiM: c.elevasiM as number,
        jarakKm,
        bearing,
        arah: arahMataAngin(bearing),
        menit: menitJalanKaki(jarakKm, lambat),
      };
    })
    .sort((a, b) => a.jarakKm - b.jarakKm)
    .slice(0, jumlah);
}
