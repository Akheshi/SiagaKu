import { describe, expect, it } from "vitest";
import { hitungGempaDekat, parseGempa, type Gempa } from "../bmkg";

const MENTAH = {
  Tanggal: "22 Nov 2026",
  Jam: "14:54:39 WIB",
  DateTime: "2026-11-22T07:54:39+00:00",
  Coordinates: "-4.12,101.57",
  Lintang: "4.12 LS",
  Bujur: "101.57 BT",
  Magnitude: "5.4",
  Kedalaman: "10 km",
  Wilayah: "Pusat gempa berada di laut 98 km BaratDaya Kaur",
  Potensi: "Tidak berpotensi tsunami",
  Dirasakan: "III Kaur",
};

describe("parseGempa", () => {
  it("mengubah data BMKG mentah jadi angka", () => {
    const g = parseGempa(MENTAH);
    expect(g).toEqual({
      waktu: "2026-11-22T07:54:39+00:00",
      tanggal: "22 Nov 2026",
      jam: "14:54:39 WIB",
      magnitudo: 5.4,
      kedalamanKm: 10,
      lat: -4.12,
      lon: 101.57,
      wilayah: "Pusat gempa berada di laut 98 km BaratDaya Kaur",
      potensi: "Tidak berpotensi tsunami",
      dirasakan: "III Kaur",
    });
  });

  it("data rusak → null, bukan error", () => {
    expect(parseGempa({ ...MENTAH, Coordinates: "abc" })).toBeNull();
    expect(parseGempa({ ...MENTAH, Magnitude: undefined })).toBeNull();
    expect(parseGempa(null)).toBeNull();
  });

  it.each([",106.8", "-3.8,", "91,110", "-7,181", "0,0,0"])(
    "menolak koordinat tidak lengkap atau di luar rentang (%s)",
    (Coordinates) => expect(parseGempa({ ...MENTAH, Coordinates })).toBeNull(),
  );
});

describe("hitungGempaDekat", () => {
  const titik = { lat: -3.8, lon: 102.26 };
  const g = (lat: number, lon: number): Gempa => ({ ...parseGempa(MENTAH)!, lat, lon });

  it("hanya menghitung gempa dalam radius", () => {
    const daftar = [g(-4.12, 101.57), g(-5.0, 102.5), g(3.12, 126.57)];
    expect(hitungGempaDekat(daftar, titik, 300)).toBe(2);
  });

  it("daftar kosong = 0", () => {
    expect(hitungGempaDekat([], titik, 300)).toBe(0);
  });
});
