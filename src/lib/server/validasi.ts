import { z } from "zod";

/** lat/lon dari query string. Dibulatkan 4 desimal (±11 m) agar cache lebih sering kena. */
const angka = z.string().trim().min(1).pipe(z.coerce.number());

export const KoordinatQuery = z.object({
  lat: angka.pipe(z.number().min(-90).max(90)),
  lon: angka.pipe(z.number().min(-180).max(180)),
});

export function bacaKoordinat(url: string) {
  const p = new URL(url).searchParams;
  const hasil = KoordinatQuery.safeParse({ lat: p.get("lat"), lon: p.get("lon") });
  if (!hasil.success) return null;
  const bulat = (x: number) => Math.round(x * 1e4) / 1e4;
  return { lat: bulat(hasil.data.lat), lon: bulat(hasil.data.lon) };
}

export function galat(status: number, pesan: string) {
  return Response.json({ ok: false, pesan }, { status });
}
