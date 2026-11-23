import { ambilElevasi } from "@/lib/server/sumber";
import { bacaKoordinat, galat } from "@/lib/server/validasi";

export async function GET(request: Request) {
  const titik = bacaKoordinat(request.url);
  if (!titik) return galat(400, "Parameter lat dan lon wajib berupa angka yang valid.");
  let elevasiM: number | null = null;
  try {
    [elevasiM] = await ambilElevasi([titik]);
  } catch {
    // Klien tetap bisa lanjut dengan asumsi skor saat elevasi belum tersedia.
  }
  return elevasiM === null
    ? Response.json({ ok: false, ...titik, elevasiM, pesan: "Ketinggian belum bisa diambil." })
    : Response.json({ ok: true, ...titik, elevasiM, sumber: "Open-Meteo" });
}
