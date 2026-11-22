/** DeepSeek memilih prioritas dari daftar persiapan yang sudah disusun aplikasi. */
import type { InputRencanaT } from "@/lib/input";
import { periksaRencanaAI, type Rencana } from "@/lib/rencana";

const SISTEM = "Pilih satu tips persiapan rumah dan satu peran keluarga yang paling perlu dibahas dulu. " +
  "Gunakan indeks dari daftar yang diberikan mulai dari 0. Balas hanya JSON seperti " +
  '{"prioritas_tips":0,"prioritas_peran":0}.';

export async function mintaRencanaAI(input: InputRencanaT, rencana: Rencana): Promise<Rencana | null> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return null;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        temperature: 0.3,
        max_tokens: 64,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SISTEM },
          {
            role: "user",
            content: JSON.stringify({
              bangunan: input.bangunan,
              jarak_pantai: input.jarakPantai,
              jarak_sungai: input.sungai,
              jumlah_penghuni: input.penghuni,
              anggota: input.kerentanan,
              tips: rencana.tips_rumah,
              peran: rencana.peran_anggota,
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const isi = data.choices?.[0]?.message?.content;
    return isi ? periksaRencanaAI(JSON.parse(isi), rencana) : null;
  } catch (e) {
    console.warn("[rencana] DeepSeek gagal:", (e as Error).message);
    return null;
  }
}
