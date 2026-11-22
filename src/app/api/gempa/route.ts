import { ambilGempa } from "@/lib/server/sumber";
import { galat } from "@/lib/server/validasi";

export async function GET() {
  try {
    const data = await ambilGempa();
    return Response.json({ ok: true, sumber: "BMKG", ...data });
  } catch {
    return galat(502, "Data gempa BMKG sedang tidak bisa diambil. Coba lagi beberapa menit lagi.");
  }
}
