import { describe, expect, it } from "vitest";
import { CONTOH_BENGKULU } from "../input";
import { opsiFokus, periksaRencanaAI, rencanaTemplate, RencanaSchema, tasDasar, tasTambahanDasar } from "../rencana";
import { hitungSkor, keInputSkorDummy } from "./helper";

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
  it("tetap valid dan tidak menjadikan kandidat OSM sebagai tujuan", () => {
    const r = rencanaTemplate({ input, skor });
    expect(RencanaSchema.safeParse(r).success).toBe(true);
    expect(r.titik_tujuan_id).toBeNull();
    expect(r.rute_narasi).toContain("evakuasi resmi");
    expect(r.langkah_darurat).toContain(r.rute_narasi);
    expect(r.rute_narasi).toContain("kuat atau lama");
  });

  it("menerima catatan obat sepanjang batas isian formulir", () => {
    const r = rencanaTemplate({ input: { ...input, obat: "x".repeat(200) }, skor });
    expect(RencanaSchema.safeParse(r).success).toBe(true);
    expect(r.titik_tujuan_id).toBeNull();
    expect(r.rute_narasi).toContain("tempat yang lebih tinggi");
  });

  it("rumah jauh dari pantai tidak disuruh lari dari tsunami", () => {
    const r = rencanaTemplate({ input: { ...input, jarakPantai: "gt5" }, skor });
    expect(r.langkah_darurat).toContain(r.rute_narasi);
    expect(r.rute_narasi).toContain("ruang terbuka");
    expect(r.rute_narasi).not.toContain("pantai");
  });
});

describe("opsiFokus", () => {
  it("satu opsi per faktor yang menyumbang poin, urut porsi poin terbesar", () => {
    const o = opsiFokus({ input, skor });
    const berpoin = skor.rincian.filter((f) => f.poin > 0).map((f) => f.faktor);
    expect(o.map((x) => x.faktor).sort()).toEqual([...berpoin].sort());
    const porsi = o.map((x) => {
      const f = skor.rincian.find((r) => r.faktor === x.faktor)!;
      return f.poin / f.maks;
    });
    expect(porsi).toEqual([...porsi].sort((a, b) => b - a));
  });

  it("template memakai dua opsi teratas sebagai fokus bawaan", () => {
    expect(rencanaTemplate({ input, skor }).fokus).toEqual(opsiFokus({ input, skor }).slice(0, 2));
  });

  it("rumah jauh dari pantai tidak diberi tindakan jalur tsunami", () => {
    const jauh = { ...input, jarakPantai: "gt5" as const };
    const o = opsiFokus({ input: jauh, skor: hitungSkor(keInputSkorDummy(jauh)) });
    expect(o.every((x) => !x.tindakan.includes("tsunami"))).toBe(true);
  });
});

describe("periksaRencanaAI", () => {
  const baik = rencanaTemplate({ input, skor });
  const opsi = opsiFokus({ input, skor });

  it("fokus diambil dari daftar sistem sesuai urutan pilihan AI; bagian lain tidak berubah", () => {
    const r = periksaRencanaAI({ fokus: [2, 0] }, baik, opsi);
    expect(r).toEqual({ ...baik, fokus: [opsi[2], opsi[0]] });
    expect(r?.peran_anggota).toEqual(baik.peran_anggota);
    expect(r?.langkah_darurat).toEqual(baik.langkah_darurat);
  });

  it("menolak bentuk JSON yang salah", () => {
    expect(periksaRencanaAI({ teks: "x" }, baik, opsi)).toBeNull();
    expect(periksaRencanaAI("bukan objek", baik, opsi)).toBeNull();
    expect(periksaRencanaAI({ fokus: ["Bangunan"] }, baik, opsi)).toBeNull();
  });

  it("menolak indeks di luar daftar, duplikat, kurang, dan kolom bebas", () => {
    expect(periksaRencanaAI({ fokus: [99, 0] }, baik, opsi)).toBeNull();
    expect(periksaRencanaAI({ fokus: [1, 1] }, baik, opsi)).toBeNull();
    expect(periksaRencanaAI({ fokus: [0] }, baik, opsi)).toBeNull();
    expect(periksaRencanaAI({ fokus: [0, 1, 2] }, baik, opsi)).toBeNull();
    expect(periksaRencanaAI({ fokus: [0, 1], alasan: "teks baru" }, baik, opsi)).toBeNull();
  });
});
