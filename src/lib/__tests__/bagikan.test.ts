import { describe, expect, it, vi } from "vitest";
import { inputMode, modeDariUrl, qsMode, teksBagikan } from "../bagikan";
import { CONTOH_BENGKULU } from "../input";

const params = (q: string) => new URLSearchParams(q);

describe("mode rencana dari URL", () => {
  it("menampilkan halaman tautan lama untuk semua parameter r, termasuk kode kosong atau rusak", () => {
    for (const q of ["r=rusak", "r=", "r=apa-saja&contoh=bengkulu", "tautan=lama"]) {
      const mode = modeDariUrl(params(q));
      const baca = vi.fn(() => CONTOH_BENGKULU);
      expect(mode).toEqual({ jenis: "tautan-lama" });
      expect(inputMode(mode, baca)).toBeNull();
      expect(baca).not.toHaveBeenCalled();
    }
  });

  it("mempertahankan rencana pribadi dan contoh tanpa mencampur penyimpanan", () => {
    const pribadi = modeDariUrl(params(""));
    const contoh = modeDariUrl(params("contoh=bengkulu"));
    expect(pribadi).toEqual({ jenis: "pribadi" });
    expect(contoh).toEqual({ jenis: "contoh" });
    expect(qsMode({ jenis: "contoh" })).toBe("?contoh=bengkulu");
    expect(qsMode({ jenis: "pribadi" })).toBe("");
    expect(inputMode(contoh, () => ({ rusak: true }))).toEqual(CONTOH_BENGKULU);
    expect(inputMode(pribadi, () => CONTOH_BENGKULU)).toEqual(CONTOH_BENGKULU);
    expect(inputMode(pribadi, () => ({ rusak: true }))).toBeNull();
  });
});

describe("ringkasan WhatsApp", () => {
  it("memakai panduan umum dan tautan beranda tanpa isian pribadi", () => {
    const input = { ...CONTOH_BENGKULU, namaKeluarga: "NamaUji Fiktif", obat: "CatatanUji Fiktif" };
    const pesan = teksBagikan({ jenis: "pribadi" }, "https://siagaku.example");
    expect(pesan).toContain("Saat guncangan");
    expect(pesan).toContain("Setelah guncangan");
    expect(pesan).not.toContain(input.namaKeluarga);
    expect(pesan).not.toContain(input.obat);
    expect(pesan).not.toContain(String(input.lokasi.lat));
    expect(pesan).not.toContain("?r=");
    expect(pesan).toMatch(/https:\/\/siagaku\.example\/$/);
  });

  it("memakai tautan demo publik saat berbagi contoh", () => {
    expect(teksBagikan({ jenis: "contoh" }, "https://siagaku.example"))
      .toMatch(/\/hasil\?contoh=bengkulu$/);
  });

  it("ringkasan pribadi tidak berubah karena kategori lokasi yang diisi", () => {
    const pesan = teksBagikan({ jenis: "pribadi" }, "https://siagaku.example");
    expect(pesan).toContain("jika gempa terasa kuat atau lama di pesisir");
    expect(pesan).toContain("Di lokasi lain");
  });
});
