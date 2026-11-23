import { hitungGempaDekat } from "@/lib/bmkg";
import { InputRencana, keInputSkor } from "@/lib/input";
import { opsiFokus, rencanaTemplate, tasDasar } from "@/lib/rencana";
import { hitungSkor } from "@/lib/score";
import { mintaRencanaAI } from "@/lib/server/ai";
import { bolehLewat, ipDari } from "@/lib/server/batasLaju";
import { ambilElevasi, ambilGempa, cariTitikAman } from "@/lib/server/sumber";
import { galat } from "@/lib/server/validasi";

/**
 * POST /api/rencana — hitung skor dan arahan serta cari kandidat OSM.
 * DeepSeek hanya memilih dua fokus persiapan dari daftar aplikasi. Jika gagal, pakai urutan bawaan.
 */
export async function POST(request: Request) {
  if (!bolehLewat(ipDari(request))) {
    return galat(429, "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return galat(400, "Data yang dikirim tidak terbaca.");
  }
  const cek = InputRencana.safeParse(body);
  if (!cek.success) return galat(400, "Ada isian yang belum sesuai. Kembali ke formulir dan periksa lagi.");
  const input = { ...cek.data };
  const { lat, lon } = input.lokasi;

  // ketinggian: pakai dari klien; jika kosong coba ambil sekali lagi
  if (input.elevasiM === null) {
    try {
      [input.elevasiM] = await ambilElevasi([{ lat, lon }]);
    } catch {
      /* tetap null → skor memakai asumsi waspada */
    }
  }

  // Feed gempa terbaru dan daftar untuk skor bisa gagal secara terpisah.
  const dataGempa = await ambilGempa().catch(() => null);
  const gempaDekat = dataGempa?.terkiniLengkap
    ? hitungGempaDekat(dataGempa.terkini, input.lokasi, 300)
    : null;
  const skor = hitungSkor(keInputSkor(input, gempaDekat));
  const lambat = Object.values(input.kerentanan).some(Boolean);
  const template = rencanaTemplate({ input, skor });
  const [{ titik, sumber: sumberTitik }, ai] = await Promise.all([
    cariTitikAman(lat, lon, input.elevasiM, lambat),
    mintaRencanaAI(input, template, opsiFokus({ input, skor })),
  ]);
  const rencana = ai ?? template;

  return Response.json({
    ok: true,
    dibuat: new Date().toISOString(),
    input,
    skor,
    gempaDekat,
    gempaTersedia: skor.lengkap,
    titik,
    sumberTitik,
    rencana,
    sumberRencana: ai ? "ai" : "template",
    tasDasar: tasDasar(input.penghuni),
  });
}
