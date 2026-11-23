import { rentangPantai } from "@/lib/score";
import { ambilJarakPantai } from "@/lib/server/sumber";
import { bacaKoordinat, galat } from "@/lib/server/validasi";

export async function GET(request: Request) {
  const titik = bacaKoordinat(request.url);
  if (!titik) return galat(400, "Parameter lat dan lon wajib berupa angka yang valid.");
  try {
    const data = await ambilJarakPantai(titik.lat, titik.lon);
    return Response.json({
      ok: true,
      ...titik,
      ...data,
      rentang: rentangPantai(data.jarakKm ?? data.radiusCariKm),
    });
  } catch {
    // Gagal/timeout → pengguna memilih sendiri di form.
    return Response.json({ ok: false, ...titik, jarakKm: null, radiusCariKm: null, rentang: null, sumber: null });
  }
}
