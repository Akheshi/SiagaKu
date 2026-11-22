import { describe, expect, it } from "vitest";
import { dalamCakupan, jarakKeGarisKm, sederhanakan, type Garis } from "../coast";

// garis pantai lurus utara–selatan di bujur 102.0
const PANTAI_LURUS: Garis[] = [
  [
    [102.0, -4.0],
    [102.0, -3.0],
  ],
];

describe("jarakKeGarisKm", () => {
  it("titik 0,1° di timur garis ≈ 11,1 km (dekat khatulistiwa)", () => {
    const km = jarakKeGarisKm({ lat: -3.5, lon: 102.1 }, PANTAI_LURUS);
    expect(km).not.toBeNull();
    expect(km!).toBeCloseTo(11.1, 0);
  });

  it("titik tepat di garis = 0", () => {
    expect(jarakKeGarisKm({ lat: -3.5, lon: 102.0 }, PANTAI_LURUS)).toBeCloseTo(0, 5);
  });

  it("titik di luar ujung ruas diukur ke titik ujung", () => {
    // 0,1° utara dari ujung (102.0, -3.0)
    expect(jarakKeGarisKm({ lat: -2.9, lon: 102.0 }, PANTAI_LURUS)).toBeCloseTo(11.1, 0);
  });

  it("mengambil ruas terdekat dari beberapa garis", () => {
    const garis: Garis[] = [
      ...PANTAI_LURUS,
      [
        [102.05, -3.6],
        [102.05, -3.4],
      ],
    ];
    expect(jarakKeGarisKm({ lat: -3.5, lon: 102.1 }, garis)).toBeCloseTo(5.55, 1);
  });

  it("tanpa garis → null", () => {
    expect(jarakKeGarisKm({ lat: -3.5, lon: 102.1 }, [])).toBeNull();
  });
});

describe("dalamCakupan", () => {
  const bbox = { selatan: -5, barat: 101, utara: -2, timur: 104 };
  it("di dalam dengan margin", () => {
    expect(dalamCakupan({ lat: -3.8, lon: 102.26 }, bbox, 0.1)).toBe(true);
  });
  it("terlalu dekat tepi atau di luar", () => {
    expect(dalamCakupan({ lat: -2.05, lon: 102 }, bbox, 0.1)).toBe(false);
    expect(dalamCakupan({ lat: -7.8, lon: 110.4 }, bbox, 0.1)).toBe(false);
  });
});

describe("sederhanakan", () => {
  it("membuang titik di tengah garis lurus, mempertahankan ujung", () => {
    const g: Garis = [
      [0, 0],
      [0.5, 0.000001],
      [1, 0],
    ];
    expect(sederhanakan(g, 0.0001)).toEqual([
      [0, 0],
      [1, 0],
    ]);
  });
  it("mempertahankan sudut yang jelas", () => {
    const g: Garis = [
      [0, 0],
      [0.5, 0.5],
      [1, 0],
    ];
    expect(sederhanakan(g, 0.0001)).toHaveLength(3);
  });
});
