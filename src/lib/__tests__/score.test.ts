import { describe, expect, it } from "vitest";
import {
  hitungSkor,
  kategoriSkor,
  poinBangunan,
  poinGempa,
  poinKeluarga,
  poinKetinggian,
  rentangPantai,
  type InputSkor,
} from "../score";

const CONTOH: InputSkor = {
  elevasiM: 6,
  jarakPantai: "0_5_1",
  jumlahGempaDekat: 3,
  bangunan: "bata",
  lantai: 1,
  kerentanan: { lansia: true, balita: true, hamil: false, disabilitas: false },
  kendaraan: "motor",
  sungai: "100_500",
};

describe("poinKetinggian", () => {
  it.each([
    [0, 30],
    [4.9, 30],
    [5, 25],
    [9.9, 25],
    [10, 18],
    [19.9, 18],
    [20, 10],
    [29.9, 10],
    [30, 3],
    [500, 3],
  ])("%s m → %s poin", (m, poin) => {
    expect(poinKetinggian(m)).toBe(poin);
  });

  it("ketinggian tidak diketahui dianggap rendah (hati-hati) = 25", () => {
    expect(poinKetinggian(null)).toBe(25);
  });
});

describe("rentangPantai", () => {
  it.each([
    [0.2, "lt0_5"],
    [0.5, "0_5_1"],
    [0.91, "0_5_1"],
    [1, "1_3"],
    [2.9, "1_3"],
    [3, "3_5"],
    [4.99, "3_5"],
    [5, "3_5"],
    [5.001, "gt5"],
    [40, "gt5"],
  ])("%s km → %s", (km, rentang) => {
    expect(rentangPantai(km)).toBe(rentang);
  });
});

describe("poinGempa", () => {
  it.each([
    [0, 0],
    [1, 5],
    [2, 10],
    [3, 10],
    [4, 15],
    [15, 15],
  ])("%s gempa → %s poin", (n, poin) => {
    expect(poinGempa(n)).toBe(poin);
  });
});

describe("poinBangunan", () => {
  it("beton bertulang 3, bata 10, kayu 8", () => {
    expect(poinBangunan("beton", 1)).toBe(3);
    expect(poinBangunan("bata", 1)).toBe(10);
    expect(poinBangunan("kayu", 2)).toBe(8);
  });

  it("lebih dari 2 lantai tanpa tulangan +5, maksimum 15", () => {
    expect(poinBangunan("bata", 3)).toBe(15);
    expect(poinBangunan("kayu", 3)).toBe(13);
    expect(poinBangunan("beton", 5)).toBe(3);
  });
});

describe("poinKeluarga", () => {
  const tidakAda = { lansia: false, balita: false, hamil: false, disabilitas: false };

  it("tanpa kerentanan dan punya kendaraan = 0", () => {
    expect(poinKeluarga(tidakAda, "mobil")).toBe(0);
  });

  it("+3 per kategori, +1 jika jalan kaki", () => {
    expect(poinKeluarga({ ...tidakAda, lansia: true }, "motor")).toBe(3);
    expect(poinKeluarga({ ...tidakAda, lansia: true, balita: true }, "jalan")).toBe(7);
  });

  it("maksimum 10", () => {
    const semua = { lansia: true, balita: true, hamil: true, disabilitas: true };
    expect(poinKeluarga(semua, "jalan")).toBe(10);
  });
});

describe("kategoriSkor", () => {
  it.each([
    [0, "Rendah"],
    [39, "Rendah"],
    [40, "Sedang"],
    [59, "Sedang"],
    [60, "Tinggi"],
    [79, "Tinggi"],
    [80, "Sangat tinggi"],
    [100, "Sangat tinggi"],
  ])("%s → %s", (skor, kat) => {
    expect(kategoriSkor(skor)).toBe(kat);
  });
});

describe("hitungSkor", () => {
  it("contoh Kota Bengkulu = 74, Tinggi, dengan 6 faktor", () => {
    const hasil = hitungSkor(CONTOH);
    expect(hasil.total).toBe(74);
    expect(hasil.kategori).toBe("Tinggi");
    expect(hasil.rincian.map((r) => r.poin)).toEqual([25, 20, 10, 10, 6, 3]);
    expect(hasil.rincian.map((r) => r.maks)).toEqual([30, 25, 15, 15, 10, 5]);
  });

  it("total = jumlah poin rincian", () => {
    const hasil = hitungSkor(CONTOH);
    expect(hasil.total).toBe(hasil.rincian.reduce((s, r) => s + r.poin, 0));
  });

  it("deterministik: input sama → hasil sama", () => {
    expect(hitungSkor(CONTOH)).toEqual(hitungSkor({ ...CONTOH }));
  });

  it("skenario terburuk = 100, terbaik = 6 (ketinggian 3 + beton 3)", () => {
    const terburuk = hitungSkor({
      elevasiM: 1,
      jarakPantai: "lt0_5",
      jumlahGempaDekat: 9,
      bangunan: "bata",
      lantai: 3,
      kerentanan: { lansia: true, balita: true, hamil: true, disabilitas: true },
      kendaraan: "jalan",
      sungai: "lt100",
    });
    expect(terburuk.total).toBe(100);
    expect(terburuk.kategori).toBe("Sangat tinggi");

    const terbaik = hitungSkor({
      elevasiM: 300,
      jarakPantai: "gt5",
      jumlahGempaDekat: 0,
      bangunan: "beton",
      lantai: 1,
      kerentanan: { lansia: false, balita: false, hamil: false, disabilitas: false },
      kendaraan: "mobil",
      sungai: "gt500",
    });
    expect(terbaik.total).toBe(6);
    expect(terbaik.kategori).toBe("Rendah");
  });

  it("setiap rincian punya alasan yang bisa dibaca", () => {
    for (const r of hitungSkor(CONTOH).rincian) {
      expect(r.faktor.length).toBeGreaterThan(0);
      expect(r.nilai.length).toBeGreaterThan(0);
      expect(r.alasan.length).toBeGreaterThan(0);
    }
  });

  it("memakai asumsi 25 poin secara eksplisit saat elevasi tidak tersedia", () => {
    const [elevasi] = hitungSkor({ ...CONTOH, elevasiM: null }).rincian;
    expect(elevasi.poin).toBe(25);
    expect(elevasi.alasan).toMatch(/belum tersedia.*25 poin/);
  });

  it("menjelaskan poin tanpa menyatakan batas genangan atau ketahanan bangunan", () => {
    const { rincian } = hitungSkor({ ...CONTOH, elevasiM: 30, jarakPantai: "gt5", bangunan: "beton" });
    const [elevasi, pantai, gempa, bangunan] = rincian;
    expect(elevasi.alasan).toContain("poin");
    expect(pantai.alasan).toContain("0 poin");
    expect(gempa.alasan).toContain("aktivitas terkini");
    expect(bangunan.alasan).toContain("poin");
  });
});
