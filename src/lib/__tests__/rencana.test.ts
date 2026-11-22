import { describe, expect, it } from "vitest";
import { arahMataAngin } from "../geo";
import { CONTOH_BENGKULU } from "../input";
import { periksaRencanaAI, rencanaTemplate, RencanaSchema, tasDasar, tasTambahanDasar } from "../rencana";
import type { TitikAman } from "../safePoints";
import { hitungSkor, keInputSkorDummy } from "./helper";

const TITIK: TitikAman[] = [
  { id: "osm-n1", nama: "SMP Negeri 14", jenis: "Sekolah", lat: -3.79, lon: 102.28, elevasiM: 34, jarakKm: 1.8, bearing: 45, arah: arahMataAngin(45), menit: 35, kelas: "tinggi" },
  { id: "osm-w2", nama: "Masjid Al-Hidayah", jenis: "Masjid", lat: -3.8, lon: 102.29, elevasiM: 31, jarakKm: 2.3, bearing: 90, arah: arahMataAngin(90), menit: 45, kelas: "tinggi" },
];

const input = CONTOH_BENGKULU;
const skor = hitungSkor(keInputSkorDummy(input));

describe("tasDasar", () => {
  it("air menyesuaikan jumlah penghuni", () => {
    expect(tasDasar(5)[0].barang).toBe("Air minum 15 liter");
  });
});

describe("tasTambahanDasar", () => {
  it("menambah obat, kebutuhan lansia & balita", () => {
    const t = tasTambahanDasar(input).map((x) => x.barang);
    expect(t[0]).toContain("Obat darah tinggi");
    expect(t.some((b) => b.includes("Tongkat"))).toBe(true);
    expect(t.some((b) => b.includes("Popok"))).toBe(true);
  });
  it("keluarga tanpa kerentanan & obat → kosong", () => {
    expect(
      tasTambahanDasar({ ...input, obat: "", kerentanan: { lansia: false, balita: false, hamil: false, disabilitas: false } }),
    ).toEqual([]);
  });
});

describe("rencanaTemplate", () => {
  it("selalu valid terhadap skema dan memakai titik pertama", () => {
    const r = rencanaTemplate({ input, skor, titik: TITIK });
    expect(RencanaSchema.safeParse(r).success).toBe(true);
    expect(r.titik_tujuan_id).toBe("osm-n1");
    expect(r.rute_narasi).toContain("SMP Negeri 14");
    expect(r.rute_narasi).toContain("Masjid Al-Hidayah");
    expect(r.ringkasan).toContain(`${skor.total} dari 100`);
  });

  it("tanpa titik aman → saran umum, tetap valid", () => {
    const r = rencanaTemplate({ input, skor, titik: [] });
    expect(RencanaSchema.safeParse(r).success).toBe(true);
    expect(r.titik_tujuan_id).toBeNull();
    expect(r.rute_narasi).toContain("3 km");
  });

  it("rumah jauh dari pantai tidak disuruh lari dari tsunami", () => {
    const r = rencanaTemplate({ input: { ...input, jarakPantai: "gt5" }, skor, titik: TITIK });
    expect(r.ringkasan).toContain("jauh dari pantai");
    expect(r.langkah_darurat.join(" ")).toContain("ruang terbuka");
  });
});

describe("periksaRencanaAI", () => {
  const baik = rencanaTemplate({ input, skor, titik: TITIK });

  it("menerima rencana dengan titik dari daftar", () => {
    expect(periksaRencanaAI({ ...baik, titik_tujuan_id: "osm-w2" }, TITIK)?.titik_tujuan_id).toBe("osm-w2");
  });

  it("menolak titik karangan", () => {
    expect(periksaRencanaAI({ ...baik, titik_tujuan_id: "osm-palsu" }, TITIK)).toBeNull();
    expect(periksaRencanaAI({ ...baik, titik_tujuan_id: null }, TITIK)).toBeNull();
  });

  it("menolak bentuk JSON yang salah", () => {
    expect(periksaRencanaAI({ ringkasan: "x" }, TITIK)).toBeNull();
    expect(periksaRencanaAI("bukan objek", TITIK)).toBeNull();
  });

  it("tanpa daftar titik → titik_tujuan_id dipaksa null", () => {
    expect(periksaRencanaAI({ ...baik, titik_tujuan_id: "osm-n1" }, [])?.titik_tujuan_id).toBeNull();
  });
});
