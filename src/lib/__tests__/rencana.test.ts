import { describe, expect, it } from "vitest";
import { CONTOH_BENGKULU } from "../input";
import { periksaRencanaAI, rencanaTemplate, RencanaSchema, tasDasar, tasTambahanDasar } from "../rencana";
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
    expect(r.ringkasan).toContain(`${skor.total} dari 100`);
  });

  it("menerima catatan obat sepanjang batas isian formulir", () => {
    const r = rencanaTemplate({ input: { ...input, obat: "x".repeat(200) }, skor });
    expect(RencanaSchema.safeParse(r).success).toBe(true);
    expect(r.titik_tujuan_id).toBeNull();
    expect(r.rute_narasi).toContain("tempat yang lebih tinggi");
  });

  it("rumah jauh dari pantai tidak disuruh lari dari tsunami", () => {
    const r = rencanaTemplate({ input: { ...input, jarakPantai: "gt5" }, skor });
    expect(r.ringkasan).toContain("jauh dari pantai");
    expect(r.langkah_darurat).toContain(r.rute_narasi);
    expect(r.rute_narasi).toContain("ruang terbuka");
    expect(r.rute_narasi).not.toContain("pantai");
  });
});

describe("periksaRencanaAI", () => {
  const baik = rencanaTemplate({ input, skor });

  it("hanya memindahkan prioritas dari daftar sistem ke urutan pertama", () => {
    const r = periksaRencanaAI({ prioritas_tips: 1, prioritas_peran: 1 }, baik);
    expect(r).toEqual({
      ...baik,
      tips_rumah: [baik.tips_rumah[1], baik.tips_rumah[0], ...baik.tips_rumah.slice(2)],
      peran_anggota: [baik.peran_anggota[1], baik.peran_anggota[0], ...baik.peran_anggota.slice(2)],
    });
  });

  it("menolak bentuk JSON yang salah", () => {
    expect(periksaRencanaAI({ ringkasan: "x" }, baik)).toBeNull();
    expect(periksaRencanaAI("bukan objek", baik)).toBeNull();
  });

  it("menolak indeks di luar daftar dan respons dengan kolom bebas", () => {
    expect(periksaRencanaAI({ prioritas_tips: 99, prioritas_peran: 0 }, baik)).toBeNull();
    expect(periksaRencanaAI({ prioritas_tips: 0, prioritas_peran: 0, ringkasan: "teks baru" }, baik)).toBeNull();
  });
});
