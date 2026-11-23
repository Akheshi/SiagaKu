/** Parser data gempa BMKG (fungsi murni). Sumber: data.bmkg.go.id/DataMKG/TEWS/. */
import { haversineKm, koordinatValid, type LatLon } from "./geo";

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
  const bagian = teks(m.Coordinates).split(",").map((nilai) => nilai.trim());
  if (bagian.length !== 2 || !bagian.every(Boolean)) return null;
  const [lat, lon] = bagian.map(Number);
  const nilaiMagnitudo = teks(m.Magnitude);
  const magnitudo = nilaiMagnitudo ? Number(nilaiMagnitudo) : NaN;
  const kedalamanKm = Number.parseFloat(teks(m.Kedalaman));
  if (!koordinatValid(lat, lon) || !Number.isFinite(magnitudo)) return null;

  const g: Gempa = {
    waktu: teks(m.DateTime),
    tanggal: teks(m.Tanggal),
    jam: teks(m.Jam),
    magnitudo,
    kedalamanKm: Number.isFinite(kedalamanKm) ? kedalamanKm : 0,
    lat,
    lon,
    wilayah: rapikanWilayah(teks(m.Wilayah)),
    potensi: teks(m.Potensi),
  };
  const dirasakan = teks(m.Dirasakan);
  if (dirasakan) g.dirasakan = dirasakan;
  return g;
}

const AKHIRAN_WILAYAH: [string, string][] = [
  ["BARATDAYA", "BARAT DAYA"], ["BRTDAYA", "BARAT DAYA"], ["BARATLAUT", "BARAT LAUT"],
  ["TIMURLAUT", "TIMUR LAUT"], ["TENGGARA", "TENGGARA"], ["SELATAN", "SELATAN"], ["TENGAH", "TENGAH"],
  ["TIMUR", "TIMUR"], ["BARAT", "BARAT"], ["UTARA", "UTARA"], ["BRT", "BARAT"],
];

function rapikanNama(kata: string): string {
  for (const [akhir, ganti] of AKHIRAN_WILAYAH) {
    if (kata.endsWith(akhir) && kata.length - akhir.length >= 3) return `${kata.slice(0, -akhir.length)} ${ganti}`;
  }
  return kata;
}

/**
 * "87 km TimurLaut MALUKUBRTDAYA" → "87 km timur laut Maluku Barat Daya".
 * Hanya nama wilayah yang seluruhnya huruf kapital yang dirapikan; teks lain dibiarkan.
 */
export function rapikanWilayah(s: string): string {
  const m = s.match(/^(.*?\d+ km) ([A-Z][a-z]+(?:[A-Z][a-z]+)?) (.+)$/);
  if (!m) return s;
  const [, jarak, arah, nama] = m;
  const arahRapi = arah.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  if (/[a-z]/.test(nama)) return `${jarak} ${arahRapi} ${nama}`;
  const namaRapi = nama
    .replace(/KEP\./g, "KEP. ")
    .split("-")
    .map((bagian) => bagian.trim().split(/\s+/).map(rapikanNama).join(" ")
      .split(" ")
      .map((w) => (w.length <= 3 && w !== "KEP." ? w : w.charAt(0) + w.slice(1).toLowerCase()))
      .join(" "))
    .join(", ");
  return `${jarak} ${arahRapi} ${namaRapi}`;
}

/** Jumlah gempa dalam radius tertentu dari titik (faktor "aktivitas gempa", PRD §7.2). */
export function hitungGempaDekat(daftar: Gempa[], titik: LatLon, radiusKm: number): number {
  return daftar.filter((g) => haversineKm(titik, g) <= radiusKm).length;
}
