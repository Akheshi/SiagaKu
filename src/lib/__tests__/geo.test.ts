import { describe, expect, it } from "vitest";
import { arahMataAngin, bearingDeg, haversineKm, menitJalanKaki } from "../geo";

const BENGKULU = { lat: -3.8004, lon: 102.2655 };

describe("haversineKm", () => {
  it("nol untuk titik yang sama", () => {
    expect(haversineKm(BENGKULU, BENGKULU)).toBe(0);
  });

  it("1 derajat lintang ≈ 111,2 km", () => {
    expect(haversineKm({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111.19, 1);
  });

  it("Kota Bengkulu → Curup ≈ 60 km", () => {
    const curup = { lat: -3.4703, lon: 102.5206 };
    expect(haversineKm(BENGKULU, curup)).toBeGreaterThan(40);
    expect(haversineKm(BENGKULU, curup)).toBeLessThan(80);
  });
});

describe("bearingDeg", () => {
  it("utara = 0, timur = 90, selatan = 180, barat = 270", () => {
    const o = { lat: 0, lon: 0 };
    expect(bearingDeg(o, { lat: 1, lon: 0 })).toBeCloseTo(0, 5);
    expect(bearingDeg(o, { lat: 0, lon: 1 })).toBeCloseTo(90, 5);
    expect(bearingDeg(o, { lat: -1, lon: 0 })).toBeCloseTo(180, 5);
    expect(bearingDeg(o, { lat: 0, lon: -1 })).toBeCloseTo(270, 5);
  });

  it("selalu di rentang 0–360", () => {
    const b = bearingDeg(BENGKULU, { lat: -3.9, lon: 102.1 });
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe("arahMataAngin", () => {
  it.each([
    [0, "U", "utara"],
    [22, "U", "utara"],
    [23, "TL", "timur laut"],
    [45, "TL", "timur laut"],
    [90, "T", "timur"],
    [135, "TG", "tenggara"],
    [180, "S", "selatan"],
    [225, "BD", "barat daya"],
    [270, "B", "barat"],
    [315, "BL", "barat laut"],
    [338, "U", "utara"],
    [359.9, "U", "utara"],
  ])("%s° → %s", (deg, kode, nama) => {
    expect(arahMataAngin(deg)).toEqual({ kode, nama });
  });
});

describe("menitJalanKaki", () => {
  it("1,8 km, kecepatan normal 4 km/jam, faktor jalan 1,3 → 35 menit", () => {
    expect(menitJalanKaki(1.8, false)).toBe(35);
  });

  it("dengan lansia/disabilitas pakai 3 km/jam → lebih lama", () => {
    expect(menitJalanKaki(1.8, true)).toBe(47);
  });

  it("jarak nol → 0 menit", () => {
    expect(menitJalanKaki(0, false)).toBe(0);
  });
});
