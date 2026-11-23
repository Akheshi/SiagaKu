/**
 * Pengambil data eksternal (hanya di server). Hasil di-cache dengan `use cache`;
 * error tidak di-cache, jadi permintaan berikutnya mencoba lagi.
 */
import { cacheLife } from "next/cache";
import { parseGempa, type Gempa } from "@/lib/bmkg";
import { dalamCakupan, jarakKeGarisKm, type Bbox, type Garis } from "@/lib/coast";
import pantaiBengkulu from "@/data/coastline-bengkulu.json";
import titikBengkulu from "@/data/titik-bengkulu.json";
import { haversineKm, koordinatValid } from "@/lib/geo";
import { pilihTitikAman, type Kandidat, type TitikAman } from "@/lib/safePoints";

export const USER_AGENT = "SiagaKu/0.1 (+https://github.com/Akheshi/SiagaKu)";
const BMKG = "https://data.bmkg.go.id/DataMKG/TEWS";

async function ambilJson(url: string, ms: number, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init?.headers },
    signal: AbortSignal.timeout(ms),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

export type DataGempa = { terbaru: Gempa | null; terkini: Gempa[]; terkiniLengkap: boolean; diambil: string };
const JUMLAH_TERKINI_BMKG = 15;

/** Gempa terbaru (autogempa) + 15 gempa M5+ terakhir (gempaterkini). Cache ±60 dtk. */
export async function ambilGempa(): Promise<DataGempa> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });

  const [auto, terkini] = await Promise.allSettled([
    ambilJson(`${BMKG}/autogempa.json`, 8000),
    ambilJson(`${BMKG}/gempaterkini.json`, 8000),
  ]);
  if (auto.status === "rejected" && terkini.status === "rejected") throw auto.reason;

  type Bentuk = { Infogempa?: { gempa?: unknown } };
  const terbaru =
    auto.status === "fulfilled"
      ? parseGempa((auto.value as Bentuk | null)?.Infogempa?.gempa as Record<string, unknown>)
      : null;
  const mentah = terkini.status === "fulfilled" ? (terkini.value as Bentuk | null)?.Infogempa?.gempa : null;
  const daftar = Array.isArray(mentah) ? mentah : [];
  const valid = daftar.map((g) => parseGempa(g)).filter((g): g is Gempa => g !== null && g.magnitudo >= 5);
  return {
    terbaru,
    terkini: valid,
    terkiniLengkap: daftar.length === JUMLAH_TERKINI_BMKG && valid.length === JUMLAH_TERKINI_BMKG,
    diambil: new Date().toISOString(),
  };
}

/** Ketinggian (m dpl) beberapa titik sekaligus dari Open-Meteo (maks 100). Cache 1 hari. */
export async function ambilElevasi(titik: { lat: number; lon: number }[]): Promise<(number | null)[]> {
  "use cache";
  cacheLife("days");
  if (titik.length === 0) return [];
  const lat = titik.map((t) => t.lat.toFixed(5)).join(",");
  const lon = titik.map((t) => t.lon.toFixed(5)).join(",");
  const data = (await ambilJson(
    `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`,
    8000,
  )) as { elevation?: unknown[] } | null;
  if (!Array.isArray(data?.elevation) || data.elevation.length !== titik.length) {
    throw new Error("Respons Open-Meteo tidak sesuai");
  }
  return data.elevation.map((m) => typeof m === "number" && Number.isFinite(m) ? m : null);
}

export const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/** Sisakan waktu untuk server cadangan dalam batas total `ms`. */
export async function overpass(query: string, ms: number): Promise<{ elements: unknown[] }> {
  const batas = Date.now() + ms;
  let galat: unknown;
  for (const [i, url] of OVERPASS.entries()) {
    const sisa = batas - Date.now();
    if (sisa < 1500) break;
    try {
      const jatah = Math.floor(sisa / (OVERPASS.length - i));
      const data = await ambilJson(url, jatah, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
      }) as { elements?: unknown[]; remark?: unknown } | null;
      if (!Array.isArray(data?.elements) || data.remark) throw new Error("Respons Overpass tidak lengkap");
      return { elements: data.elements };
    } catch (e) {
      galat = e;
    }
  }
  throw galat ?? new Error("Overpass tidak merespons");
}

// ---------- Titik aman (PRD §7.3) ----------

type DataTitik = { bbox: Bbox; titik: [string, string, string, number, number, number | null][] };
const RADIUS_TITIK_KM = 5;

function jenisDariTag(t: Record<string, string>): string {
  const a = t.amenity;
  if (t.emergency === "assembly_point") return "Titik kumpul";
  if (a === "shelter") return "Shelter";
  if (a === "school") return "Sekolah";
  if (a === "college" || a === "university") return "Kampus";
  if (a === "hospital") return "Rumah sakit";
  if (a === "townhall") return "Kantor pemerintah";
  if (a === "community_centre") return "Balai warga";
  if (a === "place_of_worship") return t.religion === "muslim" ? "Masjid" : t.religion === "christian" ? "Gereja" : "Tempat ibadah";
  if (t.office === "government" || t.building === "government") return "Kantor pemerintah";
  return "Tempat umum";
}

/** Calon titik aman di luar data bawaan: Overpass + Open-Meteo. Cache 1 hari per titik (dibulatkan 3 desimal). */
async function kandidatLangsung(lat: number, lon: number): Promise<Kandidat[]> {
  "use cache";
  cacheLife("days");
  const r = RADIUS_TITIK_KM * 1000;
  const q = `[out:json][timeout:7];(nwr["amenity"~"^(school|college|university|place_of_worship|townhall|hospital|shelter|community_centre)$"](around:${r},${lat},${lon});nwr["emergency"="assembly_point"](around:${r},${lat},${lon});nwr["office"="government"](around:${r},${lat},${lon}););out center tags;`;
  const hasil = await overpass(q, 15_000);
  type El = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
  const dasar = (hasil.elements as El[])
    .map((e) => {
      const t = e.tags ?? {};
      const jenis = jenisDariTag(t);
      const nama = (t.name || "").trim() || (jenis === "Titik kumpul" || jenis === "Shelter" ? jenis : "");
      const la = e.lat ?? e.center?.lat;
      const lo = e.lon ?? e.center?.lon;
      if (!nama || la == null || lo == null || !koordinatValid(la, lo)) return null;
      return { id: `osm-${e.type[0]}${e.id}`, nama, jenis, lat: la, lon: lo, elevasiM: null as number | null };
    })
    .filter((x): x is Kandidat => x !== null)
    .sort((a, b) => haversineKm({ lat, lon }, a) - haversineKm({ lat, lon }, b))
    .slice(0, 100);
  if (dasar.length === 0) return [];
  const elev = await ambilElevasi(dasar.map(({ lat: la, lon: lo }) => ({ lat: la, lon: lo })));
  if (elev.every((m) => m === null)) throw new Error("Elevasi kandidat tidak tersedia");
  return dasar.map((d, i) => ({ ...d, elevasiM: elev[i] }));
}

export type HasilTitik = { titik: TitikAman[]; sumber: "bawaan" | "overpass" | "tidak-tersedia" };

/** Cari ≤3 titik aman terdekat. Bengkulu: data bawaan (instan); lainnya: Overpass (bisa gagal). */
export async function cariTitikAman(lat: number, lon: number, elevasiRumah: number | null, lambat: boolean): Promise<HasilTitik> {
  const rumah = { lat, lon, elevasiM: elevasiRumah };
  const data = titikBengkulu as unknown as DataTitik;
  if (dalamCakupan(rumah, data.bbox, 0.05)) {
    const pantai = pantaiBengkulu as unknown as { garis: Garis[] };
    const kandidat: Kandidat[] = data.titik
      .map(([id, nama, jenis, la, lo, elevasiM]) => ({ id, nama, jenis, lat: la, lon: lo, elevasiM }))
      .filter((k) => haversineKm(rumah, k) <= RADIUS_TITIK_KM)
      .map((k) => ({ ...k, jarakPantaiKm: jarakKeGarisKm(k, pantai.garis) }));
    const jarakPantaiKm = jarakKeGarisKm(rumah, pantai.garis);
    return { titik: pilihTitikAman(kandidat, { ...rumah, jarakPantaiKm }, lambat), sumber: "bawaan" };
  }
  try {
    const kandidat = await kandidatLangsung(Math.round(lat * 1000) / 1000, Math.round(lon * 1000) / 1000);
    return { titik: pilihTitikAman(kandidat, rumah, lambat), sumber: "overpass" };
  } catch {
    return { titik: [], sumber: "tidak-tersedia" };
  }
}

export type HasilPantai = { sumber: "bawaan" | "overpass" } & (
  | { jarakKm: number; radiusCariKm: null }
  | { jarakKm: null; radiusCariKm: number }
);

const RADIUS_CARI_KM = 10;

/**
 * Jarak ke garis pantai (PRD §7.5): data bawaan Bengkulu → Overpass (radius 10 km).
 * Jika tidak ada garis pantai dalam 10 km, hanya batas pencarian yang diketahui.
 */
export async function ambilJarakPantai(lat: number, lon: number): Promise<HasilPantai> {
  "use cache";
  cacheLife("days");
  const titik = { lat, lon };
  const data = pantaiBengkulu as unknown as { bbox: Bbox; garis: Garis[] };

  const sumber = dalamCakupan(titik, data.bbox, 0.1) ? "bawaan" : "overpass";
  let garis = data.garis;
  if (sumber === "overpass") {
    const q = `[out:json][timeout:7];way(around:${RADIUS_CARI_KM * 1000},${lat},${lon})["natural"="coastline"];out geom;`;
    const hasil = await overpass(q, 15_000);
    type Way = { geometry: { lat: number; lon: number }[] };
    const ways = hasil.elements as Way[];
    if (ways.some((w) => !Array.isArray(w?.geometry) || w.geometry.length < 2
      || w.geometry.some((p) => !koordinatValid(p?.lat, p?.lon)))) {
      throw new Error("Geometri garis pantai tidak tersedia");
    }
    garis = ways.map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  }

  const km = jarakKeGarisKm(titik, garis);
  return km === null || km > RADIUS_CARI_KM
    ? { jarakKm: null, radiusCariKm: RADIUS_CARI_KM, sumber }
    : { jarakKm: km, radiusCariKm: null, sumber };
}
