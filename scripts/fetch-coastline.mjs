// Unduh garis pantai OSM (natural=coastline) untuk Provinsi Bengkulu dan sekitarnya,
// sederhanakan, simpan ke src/data/coastline-bengkulu.json. Cukup dijalankan sekali.
//
//   node scripts/fetch-coastline.mjs
//
// Data © kontributor OpenStreetMap, lisensi ODbL.
import { writeFileSync, mkdirSync } from "node:fs";
import { sederhanakan } from "../src/lib/coast.ts";

const BBOX = { selatan: -5.7, barat: 100.9, utara: -2.0, timur: 104.0 };
const TOLERANSI_DERAJAT = 0.00015; // ±16 m
const SERVER = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const query = `[out:json][timeout:180];way["natural"="coastline"](${BBOX.selatan},${BBOX.barat},${BBOX.utara},${BBOX.timur});out geom;`;

async function ambil() {
  for (const url of SERVER) {
    try {
      console.log("Meminta", url, "…");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "SiagaKu/0.1 (+https://github.com/Akheshi/SiagaKu)",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(240_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("Gagal:", e.message);
    }
  }
  throw new Error("Semua server Overpass gagal");
}

const data = await ambil();
const bulat = (x) => Math.round(x * 1e5) / 1e5;
let titikAsli = 0;
const garis = data.elements
  .filter((e) => e.type === "way" && e.geometry?.length > 1)
  .map((e) => {
    titikAsli += e.geometry.length;
    return sederhanakan(
      e.geometry.map((p) => [bulat(p.lon), bulat(p.lat)]),
      TOLERANSI_DERAJAT,
    );
  });

const titikAkhir = garis.reduce((s, g) => s + g.length, 0);
const keluaran = {
  sumber: "OpenStreetMap natural=coastline via Overpass API — © kontributor OpenStreetMap (ODbL)",
  diunduh: new Date().toISOString().slice(0, 10),
  bbox: BBOX,
  toleransiDerajat: TOLERANSI_DERAJAT,
  garis,
};

mkdirSync(new URL("../src/data/", import.meta.url), { recursive: true });
const path = new URL("../src/data/coastline-bengkulu.json", import.meta.url);
writeFileSync(path, JSON.stringify(keluaran));
console.log(`${garis.length} garis, ${titikAsli} → ${titikAkhir} titik, disimpan ke ${path.pathname}`);
