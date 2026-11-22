import { describe, expect, it } from "vitest";
import { pilihTitikAman, syaratKetinggian, type Kandidat } from "../safePoints";

const RUMAH = { lat: -3.8, lon: 102.26, elevasiM: 8 };

const k = (id: string, dLat: number, dLon: number, elevasiM: number | null, jarakPantaiKm?: number): Kandidat => ({
  id,
  nama: `Tempat ${id}`,
  jenis: "Sekolah",
  lat: RUMAH.lat + dLat,
  lon: RUMAH.lon + dLon,
  elevasiM,
  jarakPantaiKm,
});

describe("syaratKetinggian", () => {
  it("≥ 30 m atau ≥ rumah + 15 m, mana yang lebih rendah", () => {
    expect(syaratKetinggian(8)).toBe(23);
    expect(syaratKetinggian(20)).toBe(30);
    expect(syaratKetinggian(null)).toBe(30);
  });
});

describe("pilihTitikAman — tingkat 1 (tempat tinggi)", () => {
  it("menyaring yang terlalu rendah, mengurutkan dari terdekat, ambil 3", () => {
    const hasil = pilihTitikAman(
      [
        k("a", 0.03, 0.03, 40),
        k("b", 0.005, 0.005, 10), // terlalu rendah & < rumah+5? 10 ≥ 13? tidak → dibuang
        k("c", 0.01, 0.0, 24),
        k("d", 0.0, 0.02, 31),
        k("e", 0.02, 0.02, 35),
        k("f", 0.001, 0.001, null),
      ],
      RUMAH,
      false,
    );
    expect(hasil.map((t) => t.id)).toEqual(["c", "d", "e"]);
    expect(hasil.every((t) => t.kelas === "tinggi")).toBe(true);
  });

  it("menghitung jarak, arah, dan menit jalan kaki", () => {
    const [t] = pilihTitikAman([k("c", 0.01, 0.0, 40)], RUMAH, false);
    expect(t.jarakKm).toBeCloseTo(1.11, 1);
    expect(t.arah.nama).toBe("utara");
    expect(t.menit).toBe(Math.round(((t.jarakKm * 1.3) / 4) * 60));
  });

  it("dengan lansia/disabilitas waktu tempuh lebih lama", () => {
    const [cepat] = pilihTitikAman([k("c", 0.01, 0, 40)], RUMAH, false);
    const [lambat] = pilihTitikAman([k("c", 0.01, 0, 40)], RUMAH, true);
    expect(lambat.menit).toBeGreaterThan(cepat.menit);
  });

  it("tempat tinggi di luar 5 km tidak dipakai", () => {
    expect(pilihTitikAman([k("jauh", 0.06, 0, 50)], RUMAH, false)).toEqual([]);
  });

  it("id ganda dibuang", () => {
    expect(pilihTitikAman([k("x", 0.01, 0, 40), k("x", 0.01, 0, 40)], RUMAH, false)).toHaveLength(1);
  });
});

describe("pilihTitikAman — tingkat 2 (cadangan lebih tinggi)", () => {
  const rumah = { ...RUMAH, elevasiM: 16, jarakPantaiKm: 0.9 };

  it("dipakai bila tempat tinggi kurang: ≥ rumah+5 m, lebih jauh dari pantai, ≤ 3 km, terdekat dulu", () => {
    const hasil = pilihTitikAman(
      [
        k("rendah", 0.005, 0.005, 18, 2), // < 21 → dibuang
        k("pantai", 0.005, 0, 24, 0.5), // lebih dekat ke pantai → dibuang
        k("jauh", 0.04, 0, 24, 5), // > 3 km → dibuang
        k("a", 0.01, 0.01, 22, 2),
        k("b", 0.015, 0.01, 24, 2.5),
        k("c", 0.005, 0.01, 22, 1.5),
      ],
      rumah,
      false,
    );
    expect(hasil.map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(hasil.every((t) => t.kelas === "lebih-tinggi")).toBe(true);
  });

  it("tempat tinggi tetap di depan, cadangan hanya melengkapi", () => {
    const hasil = pilihTitikAman([k("tinggi", 0.02, 0, 35, 3), k("cad", 0.01, 0, 23, 2)], rumah, false);
    expect(hasil.map((t) => [t.id, t.kelas])).toEqual([
      ["tinggi", "tinggi"],
      ["cad", "lebih-tinggi"],
    ]);
  });

  it("ketinggian rumah tidak diketahui → tanpa cadangan", () => {
    expect(pilihTitikAman([k("cad", 0.01, 0, 23, 2)], { ...rumah, elevasiM: null }, false)).toEqual([]);
  });

  it("memerlukan bukti kandidat cadangan lebih jauh dari pantai", () => {
    const diketahui = k("diketahui", 0.01, 0, 23, 2);
    const tidakDiketahui = k("tanpa-jarak", 0.005, 0, 23);
    expect(pilihTitikAman([tidakDiketahui, diketahui], rumah, false).map((t) => t.id)).toEqual(["diketahui"]);
    expect(pilihTitikAman([diketahui], { ...RUMAH, elevasiM: rumah.elevasiM }, false)).toEqual([]);
  });

  it("tidak ada kandidat → daftar kosong", () => {
    expect(pilihTitikAman([], rumah, false)).toEqual([]);
  });
});
