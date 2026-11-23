import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rencana/route";
import { menitJalanKaki } from "../geo";
import { CONTOH_BENGKULU } from "../input";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const gempa = {
  Coordinates: "-3.8004,102.2655",
  Magnitude: "5.2",
  Kedalaman: "10 km",
  Wilayah: "Contoh Bengkulu",
};

const gempaJauh = Array.from({ length: 15 }, (_, i) => ({
  ...gempa,
  Coordinates: `${3.12 + i / 100},126.57`,
}));

it.each([
  { feed: "gagal", daftar: null, tersedia: false, dekat: null },
  { feed: "kosong", daftar: [], tersedia: false, dekat: null },
  { feed: "14 entri", daftar: [gempa, ...gempaJauh.slice(1, 14)], tersedia: false, dekat: null },
  { feed: "15 entri dengan satu rusak", daftar: [{ ...gempa, Coordinates: "tidak valid" }, ...gempaJauh.slice(1)], tersedia: false, dekat: null },
  { feed: "15 entri dengan satu di bawah M5", daftar: [{ ...gempa, Magnitude: "4.9" }, ...gempaJauh.slice(1)], tersedia: false, dekat: null },
  { feed: "15 gempa jauh", daftar: gempaJauh, tersedia: true, dekat: 0 },
  { feed: "15 gempa termasuk satu dekat", daftar: [gempa, ...gempaJauh.slice(1)], tersedia: true, dekat: 1 },
])("menghitung aktivitas gempa saat daftar BMKG $feed", async ({ daftar, tersedia, dekat }) => {
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  vi.stubGlobal("fetch", async (url: string) => {
    if (url.endsWith("/autogempa.json")) return Response.json({ Infogempa: { gempa } });
    if (url.endsWith("/gempaterkini.json")) {
      return daftar
        ? Response.json({ Infogempa: { gempa: daftar } })
        : new Response(null, { status: 503 });
    }
    throw new Error("Sumber di luar skenario uji");
  });

  const respons = await POST(new Request("http://localhost/api/rencana", {
    method: "POST",
    body: JSON.stringify({ ...CONTOH_BENGKULU, elevasiM: 16 }),
  }));
  const hasil = await respons.json();

  expect(respons.ok).toBe(true);
  expect(hasil.gempaTersedia).toBe(tersedia);
  expect(hasil.gempaDekat).toBe(dekat);
  expect(hasil.skor.lengkap).toBe(tersedia);
  expect(hasil.skor.rincian.find((f: { faktor: string }) => f.faktor === "Aktivitas gempa")).toMatchObject({
    nilai: dekat === null ? "Data BMKG belum tersedia" : `${dekat} gempa M5+ ≤ 300 km`,
    poin: dekat === 1 ? 5 : 0,
  });
});

it.each([null, "lansia", "balita", "hamil", "disabilitas"] as const)(
  "menerapkan asumsi kecepatan jalan untuk kerentanan %s",
  async (kategori) => {
    vi.stubEnv("DEEPSEEK_API_KEY", "");
    vi.stubGlobal("fetch", async (url: string) => {
      if (url.endsWith("/autogempa.json")) return Response.json({ Infogempa: { gempa } });
      if (url.endsWith("/gempaterkini.json")) return Response.json({ Infogempa: { gempa: gempaJauh } });
      throw new Error("Sumber di luar skenario uji");
    });

    const respons = await POST(new Request("http://localhost/api/rencana", {
      method: "POST",
      headers: { "x-forwarded-for": "192.0.2.30" },
      body: JSON.stringify({
        ...CONTOH_BENGKULU,
        elevasiM: 16,
        kerentanan: {
          lansia: kategori === "lansia",
          balita: kategori === "balita",
          hamil: kategori === "hamil",
          disabilitas: kategori === "disabilitas",
        },
      }),
    }));
    const hasil = await respons.json();

    expect(respons.ok).toBe(true);
    expect(hasil.titik.length).toBeGreaterThan(0);
    for (const titik of hasil.titik) {
      expect(titik.menit).toBe(menitJalanKaki(titik.jarakKm, kategori !== null));
    }
  },
);
