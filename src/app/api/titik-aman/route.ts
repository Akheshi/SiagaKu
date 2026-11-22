import { cariTitikAman } from "@/lib/server/sumber";
import { bacaKoordinat, galat } from "@/lib/server/validasi";

/** GET /api/titik-aman?lat&lon[&elevasi][&lambat=1] — ≤3 titik aman terdekat (PRD §7.3). */
export async function GET(request: Request) {
  const titik = bacaKoordinat(request.url);
  if (!titik) return galat(400, "Parameter lat dan lon wajib berupa angka yang valid.");
  const p = new URL(request.url).searchParams;
  const elev = Number.parseFloat(p.get("elevasi") ?? "");
  const hasil = await cariTitikAman(titik.lat, titik.lon, Number.isFinite(elev) ? elev : null, p.get("lambat") === "1");
  return Response.json({ ok: hasil.sumber !== "tidak-tersedia", ...titik, ...hasil });
}
