import { hitungGempaDekat } from "@/lib/bmkg";
import { InputRencana, keInputSkor } from "@/lib/input";
import { rencanaTemplate, tasDasar } from "@/lib/rencana";
import { hitungSkor } from "@/lib/score";
import { mintaRencanaAI } from "@/lib/server/ai";
import { bolehLewat, ipDari } from "@/lib/server/batasLaju";
import { ambilElevasi, ambilGempa, cariTitikAman } from "@/lib/server/sumber";
import { galat } from "@/lib/server/validasi";

/**
 * POST /api/rencana — hitung skor (deterministik), cari titik aman, lalu minta AI
 * menyusun rencana. AI gagal/tidak valid → template. Tidak pernah melempar error mentah.
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

  let gempaDekat = 0;
  let gempaTersedia = true;
  try {
    const g = await ambilGempa();
    gempaDekat = hitungGempaDekat(g.terkini, input.lokasi, 300);
  } catch {
    gempaTersedia = false;
  }

  const skor = hitungSkor(keInputSkor(input, gempaDekat));
  const lambat = input.kerentanan.lansia || input.kerentanan.disabilitas;
  const { titik, sumber: sumberTitik } = await cariTitikAman(lat, lon, input.elevasiM, lambat);

  const konteks = { input, skor, titik };
  const ai = await mintaRencanaAI(konteks, gempaDekat);
  const rencana = ai ?? rencanaTemplate(konteks);

  return Response.json({
    ok: true,
    dibuat: new Date().toISOString(),
    input,
    skor,
    gempaDekat,
    gempaTersedia,
    titik,
    sumberTitik,
    rencana,
    sumberRencana: ai ? "ai" : "template",
    tasDasar: tasDasar(input.penghuni),
  });
}
