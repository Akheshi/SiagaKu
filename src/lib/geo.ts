/** Fungsi geografi murni (tanpa I/O). */

export type LatLon = { lat: number; lon: number };

export function koordinatValid(lat: unknown, lon: unknown): boolean {
  return typeof lat === "number" && lat >= -90 && lat <= 90
    && typeof lon === "number" && lon >= -180 && lon <= 180;
}

const R_BUMI_KM = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Jarak garis lurus (great-circle) dalam km. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_BUMI_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Arah awal dari a ke b, derajat searah jarum jam dari utara, 0 ≤ x < 360. */
export function bearingDeg(a: LatLon, b: LatLon): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const ARAH = [
  { kode: "U", nama: "utara" },
  { kode: "TL", nama: "timur laut" },
  { kode: "T", nama: "timur" },
  { kode: "TG", nama: "tenggara" },
  { kode: "S", nama: "selatan" },
  { kode: "BD", nama: "barat daya" },
  { kode: "B", nama: "barat" },
  { kode: "BL", nama: "barat laut" },
] as const;

export type Arah = (typeof ARAH)[number];

/** 8 arah mata angin, tiap sektor 45° berpusat di arahnya (U = 337,5°–22,5°). */
export function arahMataAngin(derajat: number): Arah {
  const d = ((derajat % 360) + 360) % 360;
  return ARAH[Math.floor((d + 22.5) / 45) % 8];
}

/** Faktor jalan tidak lurus (PRD §7.3). */
export const FAKTOR_RUTE = 1.3;

/**
 * Estimasi menit jalan kaki: jarak × 1,3 ÷ kecepatan.
 * Normal 4 km/jam; dengan lansia/disabilitas 3 km/jam.
 */
export function menitJalanKaki(jarakKm: number, lambat: boolean): number {
  const kecepatan = lambat ? 3 : 4;
  return Math.round(((jarakKm * FAKTOR_RUTE) / kecepatan) * 60);
}
