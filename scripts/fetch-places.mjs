// Unduh calon titik aman (sekolah, tempat ibadah, kantor pemerintah, rumah sakit,
// shelter, titik kumpul) se-Provinsi Bengkulu dari OSM + ketinggiannya dari Open-Meteo.
// Disimpan ke src/data/titik-bengkulu.json agar aplikasi tidak bergantung pada
// Overpass yang sering lambat/error. Cukup dijalankan sekali.
//
//   node scripts/fetch-places.mjs
//
// Data © kontributor OpenStreetMap (ODbL); ketinggian © Open-Meteo (CC BY 4.0).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CACHE = new URL("./.cache/", import.meta.url);
mkdirSync(CACHE, { recursive: true });
const cacheBaca = (n) => (existsSync(new URL(n, CACHE)) ? JSON.parse(readFileSync(new URL(n, CACHE), "utf8")) : null);
const cacheTulis = (n, v) => writeFileSync(new URL(n, CACHE), JSON.stringify(v));

const BBOX = { selatan: -5.7, barat: 100.9, utara: -2.0, timur: 104.0 };
const UA = "SiagaKu/0.1 (+https://github.com/Akheshi/SiagaKu)";
const SERVER = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const b = `${BBOX.selatan},${BBOX.barat},${BBOX.utara},${BBOX.timur}`;
const query = `[out:json][timeout:240];(
nwr["amenity"~"^(school|college|university|place_of_worship|townhall|hospital|shelter|community_centre)$"](${b});
nwr["emergency"="assembly_point"](${b});
nwr["office"="government"](${b});
nwr["building"="government"](${b});
);out center tags;`;

const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass() {
  for (let putaran = 1; putaran <= 6; putaran++) {
    for (const url of SERVER) {
      try {
        console.log(`[${putaran}] ${url}`);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(300_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.elements)) throw new Error("respons tanpa elements");
        return data.elements;
      } catch (e) {
        console.warn("  gagal:", e.message);
      }
    }
    await tunggu(20_000 * putaran);
  }
  throw new Error("Overpass gagal setelah 6 putaran");
}

function jenisDari(t) {
  const a = t.amenity;
  if (t.emergency === "assembly_point") return "Titik kumpul";
  if (a === "shelter") return "Shelter";
  if (a === "school") return "Sekolah";
  if (a === "college" || a === "university") return "Kampus";
  if (a === "hospital") return "Rumah sakit";
  if (a === "townhall") return "Kantor pemerintah";
  if (a === "community_centre") return "Balai warga";
  if (a === "place_of_worship") {
    const r = t.religion;
    return r === "muslim" ? "Masjid" : r === "christian" ? "Gereja" : r === "buddhist" ? "Vihara" : r === "hindu" ? "Pura" : "Tempat ibadah";
  }
  if (t.office === "government" || t.building === "government") return "Kantor pemerintah";
  return "Tempat umum";
}

let el = cacheBaca("overpass.json");
if (!el) {
  el = await overpass();
  cacheTulis("overpass.json", el);
} else console.log("pakai cache Overpass");
const bulat = (x) => Math.round(x * 1e5) / 1e5;
const titik = el
  .map((e) => {
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    const t = e.tags ?? {};
    if (lat == null || lon == null) return null;
    // tempat tanpa nama sulit dipakai sebagai tujuan evakuasi — kecuali titik kumpul/shelter
    const jenis = jenisDari(t);
    const nama = (t.name || t["name:id"] || "").trim();
    if (!nama && jenis !== "Titik kumpul" && jenis !== "Shelter") return null;
    return { id: `osm-${e.type[0]}${e.id}`, nama: nama || jenis, jenis, lat: bulat(lat), lon: bulat(lon) };
  })
  .filter(Boolean);
console.log(`${el.length} elemen OSM → ${titik.length} titik bernama`);

// ketinggian, 100 titik per permintaan. Open-Meteo membatasi laju → jeda ±12 dtk,
// progres disimpan agar bisa dilanjutkan.
const elevCache = cacheBaca("elevasi.json") ?? {};
for (let i = 0; i < titik.length; i += 100) {
  const potong = titik.slice(i, i + 100);
  if (potong.every((p) => elevCache[p.id] !== undefined)) {
    potong.forEach((p) => (p.elevasiM = elevCache[p.id]));
    continue;
  }
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${potong.map((p) => p.lat).join(",")}&longitude=${potong.map((p) => p.lon).join(",")}`;
  for (let coba = 1; ; coba++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
      if (r.status === 429) throw Object.assign(new Error("HTTP 429"), { tunggu: 65_000 });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { elevation } = await r.json();
      potong.forEach((p, j) => {
        p.elevasiM = Math.round(elevation[j]);
        elevCache[p.id] = p.elevasiM;
      });
      cacheTulis("elevasi.json", elevCache);
      break;
    } catch (e) {
      if (coba >= 8) throw e;
      console.warn(`
  elevasi gagal (${e.message}), ulang…`);
      await tunggu(e.tunggu ?? 5000 * coba);
    }
  }
  process.stdout.write(`elevasi ${Math.min(i + 100, titik.length)}/${titik.length}`);
  await tunggu(12_000);
}
console.log();

const keluaran = {
  sumber: "OpenStreetMap via Overpass API (© kontributor OpenStreetMap, ODbL); ketinggian Open-Meteo (CC BY 4.0)",
  diunduh: new Date().toISOString().slice(0, 10),
  bbox: BBOX,
  // [id, nama, jenis, lat, lon, elevasiM] — ringkas
  titik: titik.map((p) => [p.id, p.nama, p.jenis, p.lat, p.lon, p.elevasiM]),
};
const path = new URL("../src/data/titik-bengkulu.json", import.meta.url);
writeFileSync(path, JSON.stringify(keluaran));
console.log(`disimpan ${titik.length} titik ke ${path.pathname}`);
