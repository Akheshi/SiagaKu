import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as elevasi } from "@/app/api/elevasi/route";
import { GET as pantai } from "@/app/api/pantai/route";
import { CONTOH_BENGKULU } from "../input";
import { ambilElevasi, ambilGempa, cariTitikAman, overpass } from "../server/sumber";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Overpass", () => {
  it("mencoba server cadangan saat server utama menghabiskan jatah waktunya", async () => {
    let waktu = 0;
    let jatah = 0;
    vi.spyOn(Date, "now").mockImplementation(() => waktu);
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
      jatah = ms;
      return new AbortController().signal;
    });
    vi.stubGlobal("fetch", vi.fn<typeof fetch>()
      .mockImplementationOnce(async () => {
        waktu += jatah;
        throw new DOMException("Timeout", "TimeoutError");
      })
      .mockResolvedValueOnce(Response.json({ elements: [] })));

    await expect(overpass("[out:json];out;", 15_000)).resolves.toEqual({ elements: [] });
    expect(fetch).toHaveBeenNthCalledWith(2, "https://overpass.private.coffee/api/interpreter", expect.anything());
    expect(waktu + jatah).toBeLessThanOrEqual(15_000);
  });

  it("menganggap respons 200 dengan remark runtime sebagai kegagalan", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(async () =>
      Response.json({ elements: [], remark: "runtime error: Query timed out" }),
    ));

    await expect(overpass("[out:json];out;", 15_000)).rejects.toThrow();
  });
});

describe("sumber pantai dan elevasi", () => {
  const lokasi = "lat=-7.8&lon=110.36";

  it("contoh Bengkulu pada elevasi rumah 16 m memberi jarak terukur dan tiga kandidat bawaan", async () => {
    const { lat, lon } = CONTOH_BENGKULU.lokasi;
    const respons = await pantai(new Request(`http://localhost/api/pantai?lat=${lat}&lon=${lon}`));
    const data = await respons.json();
    expect(data).toMatchObject({ ok: true, sumber: "bawaan", radiusCariKm: null, rentang: "0_5_1" });
    expect(data.jarakKm).toBeCloseTo(0.92, 2);
    const hasil = await cariTitikAman(lat, lon, 16, false);
    expect(hasil.sumber).toBe("bawaan");
    expect(hasil.titik).toHaveLength(3);
  });

  it("jarak yang melewati batas data bawaan memberi rentang tanpa angka jarak", async () => {
    const respons = await pantai(new Request("http://localhost/api/pantai?lat=-3.651&lon=102.578"));
    expect(await respons.json()).toMatchObject({ ok: true, sumber: "bawaan", jarakKm: null, rentang: "gt5", radiusCariKm: 10 });
  });

  it("garis pantai kosong dalam radius pencarian memberi rentang tanpa angka jarak", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ elements: [] })));

    const respons = await pantai(new Request(`http://localhost/api/pantai?${lokasi}`));
    expect(await respons.json()).toMatchObject({ ok: true, jarakKm: null, rentang: "gt5", radiusCariKm: 10 });
  });

  it("geometri rusak tidak memicu pilihan otomatis lebih dari 5 km", async () => {
    const elements = [{ geometry: [{ lat: "rusak", lon: 110 }, { lat: "rusak", lon: 111 }] }];
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ elements })));
    const respons = await pantai(new Request(`http://localhost/api/pantai?${lokasi}`));
    expect(await respons.json()).toMatchObject({ ok: false, rentang: null, jarakKm: null });
  });

  it("mempertahankan elevasi valid dari respons campuran", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ elevation: [null, 42] })));

    await expect(ambilElevasi([{ lat: 0, lon: 0 }, { lat: 1, lon: 1 }])).resolves.toEqual([null, 42]);
  });

  it("status API elevasi gagal ketika sumber mengembalikan nilai kosong", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ elevation: [null] })));

    const respons = await elevasi(new Request(`http://localhost/api/elevasi?${lokasi}`));
    expect(await respons.json()).toMatchObject({ ok: false, elevasiM: null });
  });
});

describe("daftar BMKG untuk faktor aktivitas terkini", () => {
  it.each([15, 14])("daftar dengan %i entri valid tetap bisa ditampilkan", async (jumlah) => {
    const gempa = Array.from({ length: 15 }, (_, i) => i < jumlah
      ? { Coordinates: `${-7.8 + i * 0.01},110.36`, Magnitude: "5.2" }
      : null,
    );
    vi.stubGlobal("fetch", vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("Feed terbaru tidak tersedia"))
      .mockResolvedValueOnce(Response.json({ Infogempa: { gempa } })));

    const data = await ambilGempa();
    expect(data.terbaru).toBeNull();
    expect(data.terkini).toHaveLength(jumlah);
    expect(data.terkiniLengkap).toBe(jumlah === 15);
  });
});
