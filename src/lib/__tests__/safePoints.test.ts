import { describe, expect, it } from "vitest";
import { pilihTitikAman, syaratKetinggian, type Kandidat } from "../safePoints";

const RUMAH = { lat: -3.8, lon: 102.26, elevasiM: 8 };

const k = (id: string, dLat: number, dLon: number, elevasiM: number | null, nama = `Tempat ${id}`): Kandidat => ({
  id,
  nama,
  jenis: "Sekolah",
  lat: RUMAH.lat + dLat,
  lon: RUMAH.lon + dLon,
  elevasiM,
});

describe("syaratKetinggian", () => {
  it("≥ 30 m atau ≥ rumah + 15 m, mana yang lebih rendah", () => {
    expect(syaratKetinggian(8)).toBe(23);
    expect(syaratKetinggian(20)).toBe(30);
    expect(syaratKetinggian(null)).toBe(30);
  });
});

describe("pilihTitikAman", () => {
  it("menyaring yang terlalu rendah, mengurutkan dari terdekat, ambil 3", () => {
    const hasil = pilihTitikAman(
      [
        k("a", 0.03, 0.03, 40), // jauh
        k("b", 0.005, 0.005, 10), // terlalu rendah
        k("c", 0.01, 0.0, 24), // dekat & cukup (≥ 23)
        k("d", 0.0, 0.02, 31),
        k("e", 0.02, 0.02, 35),
        k("f", 0.001, 0.001, null), // ketinggian tidak diketahui → dibuang
      ],
      RUMAH,
      false,
    );
    expect(hasil.map((t) => t.id)).toEqual(["c", "d", "e"]);
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

  it("nama sama di lokasi berbeda tetap boleh, id ganda dibuang", () => {
    const hasil = pilihTitikAman([k("x", 0.01, 0, 40), k("x", 0.01, 0, 40)], RUMAH, false);
    expect(hasil).toHaveLength(1);
  });

  it("tidak ada kandidat → daftar kosong", () => {
    expect(pilihTitikAman([], RUMAH, false)).toEqual([]);
  });
});
