/**
 * Batas laju sederhana per IP (memori proses). Di serverless ini "usaha terbaik":
 * tiap instance punya hitungan sendiri — cukup untuk menahan klik beruntun/penyalahgunaan ringan.
 */
const jendela = new Map<string, { n: number; reset: number }>();

export function bolehLewat(ip: string, batas = 10, ms = 60_000): boolean {
  const kini = Date.now();
  const e = jendela.get(ip);
  if (!e || e.reset < kini) {
    jendela.set(ip, { n: 1, reset: kini + ms });
    if (jendela.size > 5000) for (const [k, v] of jendela) if (v.reset < kini) jendela.delete(k);
    return true;
  }
  e.n += 1;
  return e.n <= batas;
}

export function ipDari(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "lokal";
}
