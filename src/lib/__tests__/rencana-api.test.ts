import { afterEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rencana/route";
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

it.each([
  { feed: "gagal", daftar: null, tersedia: false, dekat: null },
  { feed: "kosong", daftar: [], tersedia: false, dekat: null },
  { feed: "berisi gempa jauh", daftar: [{ ...gempa, Coordinates: "3.12,126.57" }], tersedia: true, dekat: 0 },
  { feed: "berisi gempa dekat", daftar: [gempa], tersedia: true, dekat: 1 },
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
