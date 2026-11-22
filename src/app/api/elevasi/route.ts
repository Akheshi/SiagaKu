import { ambilElevasi } from "@/lib/server/sumber";
import { bacaKoordinat, galat } from "@/lib/server/validasi";

export async function GET(request: Request) {
  const titik = bacaKoordinat(request.url);
  if (!titik) return galat(400, "Parameter lat dan lon wajib berupa angka yang valid.");
  try {
    const [elevasiM] = await ambilElevasi([titik]);
    return Response.json({ ok: true, ...titik, elevasiM, sumber: "Open-Meteo" });
  } catch {
    // Klien tetap bisa lanjut: skor memakai asumsi aman (lihat lib/score.ts).
    return Response.json({ ok: false, ...titik, elevasiM: null, pesan: "Ketinggian belum bisa diambil." });
  }
}
