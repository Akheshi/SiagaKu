/** DeepSeek memilih fokus persiapan keluarga dari daftar yang sudah disusun aplikasi. */
import type { InputRencanaT } from "@/lib/input";
import { periksaRencanaAI, type OpsiFokus, type Rencana } from "@/lib/rencana";

const SISTEM =
  "Kamu membantu satu keluarga di Indonesia memprioritaskan persiapan menghadapi gempa dan tsunami. " +
  "Dari daftar opsi (bernomor mulai 0), pilih DUA opsi yang paling mendesak dikerjakan lebih dulu oleh keluarga ini, " +
  "dengan mempertimbangkan anggota keluarga, bangunan, dan lokasinya. Urutkan dari yang paling mendesak. " +
  'Balas hanya JSON seperti {"fokus":[2,0]}. Jika hanya ada satu opsi, balas {"fokus":[0]}.';

export async function mintaRencanaAI(input: InputRencanaT, rencana: Rencana, opsi: OpsiFokus[]): Promise<Rencana | null> {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key || opsi.length < 2) return null; // tidak ada yang perlu dipilih

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        temperature: 0.2,
        max_tokens: 32,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SISTEM },
          {
            role: "user",
            content: JSON.stringify({
              keluarga: {
                jumlah_penghuni: input.penghuni,
                anggota_perlu_dibantu: input.kerentanan,
                punya_obat_rutin: input.obat.trim() !== "",
                kendaraan: input.kendaraan,
              },
              opsi: opsi.map((o, i) => ({ nomor: i, faktor: o.faktor, kondisi: o.nilai, tindakan: o.tindakan })),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const isi = data.choices?.[0]?.message?.content;
    return isi ? periksaRencanaAI(JSON.parse(isi), rencana, opsi) : null;
  } catch (e) {
    console.warn("[rencana] DeepSeek gagal:", (e as Error).message);
    return null;
  }
}
