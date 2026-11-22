import { rentangPantai } from "@/lib/score";
import { ambilJarakPantai } from "@/lib/server/sumber";
import { bacaKoordinat, galat } from "@/lib/server/validasi";

export async function GET(request: Request) {
  const titik = bacaKoordinat(request.url);
  if (!titik) return galat(400, "Parameter lat dan lon wajib berupa angka yang valid.");
  try {
    const { jarakKm, sumber } = await ambilJarakPantai(titik.lat, titik.lon);
    return Response.json({
      ok: true,
      ...titik,
      jarakKm: jarakKm === null ? null : Math.round(jarakKm * 100) / 100,
      rentang: jarakKm === null ? null : rentangPantai(jarakKm),
      sumber,
    });
  } catch {
    // Gagal/timeout → pengguna memilih sendiri di form.
    return Response.json({ ok: false, ...titik, jarakKm: null, rentang: null, sumber: null });
  }
}
