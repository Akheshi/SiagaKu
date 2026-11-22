/** Parser data gempa BMKG (fungsi murni). Sumber: data.bmkg.go.id/DataMKG/TEWS/. */
import { haversineKm, type LatLon } from "./geo";

export type Gempa = {
  waktu: string;
  tanggal: string;
  jam: string;
  magnitudo: number;
  kedalamanKm: number;
  lat: number;
  lon: number;
  wilayah: string;
  potensi: string;
  dirasakan?: string;
};

type Mentah = Record<string, unknown> | null | undefined;

const teks = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Ubah satu entri BMKG. Data rusak → null (dilewati, bukan error). */
export function parseGempa(m: Mentah): Gempa | null {
  if (!m || typeof m !== "object") return null;
  const [lat, lon] = teks(m.Coordinates).split(",").map(Number);
  const magnitudo = Number.parseFloat(teks(m.Magnitude));
  const kedalamanKm = Number.parseFloat(teks(m.Kedalaman));
  if (![lat, lon, magnitudo].every(Number.isFinite)) return null;

  const g: Gempa = {
    waktu: teks(m.DateTime),
    tanggal: teks(m.Tanggal),
    jam: teks(m.Jam),
    magnitudo,
    kedalamanKm: Number.isFinite(kedalamanKm) ? kedalamanKm : 0,
    lat,
    lon,
    wilayah: teks(m.Wilayah),
    potensi: teks(m.Potensi),
  };
  const dirasakan = teks(m.Dirasakan);
  if (dirasakan) g.dirasakan = dirasakan;
  return g;
}

/** Jumlah gempa dalam radius tertentu dari titik (faktor "aktivitas gempa", PRD §7.2). */
export function hitungGempaDekat(daftar: Gempa[], titik: LatLon, radiusKm: number): number {
  return daftar.filter((g) => haversineKm(titik, g) <= radiusKm).length;
}
