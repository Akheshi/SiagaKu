/** Jarak ke garis pantai — PRD §7.5. Fungsi murni (tanpa I/O). */
import type { LatLon } from "./geo";

/** Satu garis pantai: daftar [bujur, lintang] (urutan GeoJSON). */
export type Garis = [number, number][];
export type Bbox = { selatan: number; barat: number; utara: number; timur: number };

const KM_PER_DERAJAT_LINTANG = 110.574;
const KM_PER_DERAJAT_BUJUR_EKUATOR = 111.32;

/**
 * Jarak terdekat (km) dari titik ke kumpulan garis.
 * Pakai proyeksi ekuirektangular lokal yang berpusat di titik —
 * galat < 0,5% untuk jarak di bawah ±50 km, cukup untuk rentang skor.
 * Mengembalikan null bila tidak ada garis.
 */
export function jarakKeGarisKm(titik: LatLon, garis: Garis[]): number | null {
  const kx = KM_PER_DERAJAT_BUJUR_EKUATOR * Math.cos((titik.lat * Math.PI) / 180);
  const ky = KM_PER_DERAJAT_LINTANG;
  let terbaik = Infinity;

  for (const g of garis) {
    for (let i = 0; i < g.length - 1; i++) {
      const x1 = (g[i][0] - titik.lon) * kx;
      const y1 = (g[i][1] - titik.lat) * ky;
      const x2 = (g[i + 1][0] - titik.lon) * kx;
      const y2 = (g[i + 1][1] - titik.lat) * ky;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const panjang2 = dx * dx + dy * dy;
      const t = panjang2 === 0 ? 0 : Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / panjang2));
      const d = Math.hypot(x1 + t * dx, y1 + t * dy);
      if (d < terbaik) terbaik = d;
    }
    if (g.length === 1) {
      terbaik = Math.min(terbaik, Math.hypot((g[0][0] - titik.lon) * kx, (g[0][1] - titik.lat) * ky));
    }
  }
  return Number.isFinite(terbaik) ? terbaik : null;
}

/** Titik berada di dalam bbox dengan jarak aman `marginDerajat` dari tepinya. */
export function dalamCakupan(titik: LatLon, bbox: Bbox, marginDerajat: number): boolean {
  return (
    titik.lat >= bbox.selatan + marginDerajat &&
    titik.lat <= bbox.utara - marginDerajat &&
    titik.lon >= bbox.barat + marginDerajat &&
    titik.lon <= bbox.timur - marginDerajat
  );
}

/** Penyederhanaan Douglas–Peucker (toleransi dalam derajat). Dipakai skrip pengunduh data. */
export function sederhanakan(g: Garis, toleransi: number): Garis {
  if (g.length <= 2) return g;
  const simpan = new Uint8Array(g.length);
  simpan[0] = simpan[g.length - 1] = 1;
  const tumpukan: [number, number][] = [[0, g.length - 1]];

  while (tumpukan.length) {
    const [a, b] = tumpukan.pop()!;
    const [ax, ay] = g[a];
    const [bx, by] = g[b];
    const dx = bx - ax;
    const dy = by - ay;
    const panjang = Math.hypot(dx, dy);
    let maks = -1;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = g[i];
      const d =
        panjang === 0
          ? Math.hypot(px - ax, py - ay)
          : Math.abs(dy * px - dx * py + bx * ay - by * ax) / panjang;
      if (d > maks) {
        maks = d;
        idx = i;
      }
    }
    if (maks > toleransi) {
      simpan[idx] = 1;
      tumpukan.push([a, idx], [idx, b]);
    }
  }
  return g.filter((_, i) => simpan[i]);
}
