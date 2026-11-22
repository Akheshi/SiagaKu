/**
 * Rencana dari DeepSeek (format OpenAI) — PRD §7.4. Hanya dipanggil di server.
 * AI tidak menghitung angka & tidak memilih tempat di luar daftar; hasil divalidasi
 * oleh periksaRencanaAI(). Gagal/timeout → null (pemanggil memakai template).
 */
import { LABEL_BANGUNAN, LABEL_PANTAI, LABEL_SUNGAI } from "@/lib/score";
import { periksaRencanaAI, tasDasar, type Konteks, type Rencana } from "@/lib/rencana";

const URL_DEEPSEEK = "https://api.deepseek.com/chat/completions";
const BATAS_MS = 20_000;

const SISTEM = `Kamu penyusun rencana kesiapsiagaan gempa dan tsunami untuk satu rumah tangga di Indonesia.
Aturan wajib:
- Tulis dalam Bahasa Indonesia sederhana, kalimat pendek, nada tenang dan tegas. Tanpa emoji.
- HANYA boleh menyebut titik aman dari "daftar_titik_aman" dan merujuknya lewat "id". Jangan menyebut nama jalan, gedung, atau tempat lain yang tidak ada di data.
- Jangan membuat angka baru. Pakai hanya angka yang ada di data (skor, jarak, ketinggian, menit).
- Ikuti pedoman umum: gempa kuat atau lama (lebih dari 20 detik) di pesisir → segera evakuasi ke tempat tinggi tanpa menunggu sirene.
- Titik dengan "kelas": "lebih_tinggi" berada di bawah 30 m (tidak ada dataran tinggi yang cukup dekat). Untuk titik ini, minta keluarga segera naik ke lantai paling atas bangunan (evakuasi vertikal). Jangan menulis kata "kelas" atau "lebih_tinggi" dalam teks; cukup jelaskan bahwa tempatnya di bawah 30 m sehingga harus naik ke lantai atas.
- Jika rumah jauh dari pantai (lebih dari 5 km), fokus pada keselamatan saat guncangan dan gempa susulan, bukan tsunami.
- "skor" adalah skor RISIKO 0–100: makin tinggi makin berbahaya. Sebut "skor risiko", jangan "skor kesiapsiagaan".
- Jangan memberi nama orang. Sebut peran, mis. "Orang dewasa pertama", "Pendamping lansia". Jangan membuat dua peran dengan tugas yang sama.
- "tas_siaga_tambahan" hanya berisi barang KHUSUS kondisi keluarga ini (lansia, balita, ibu hamil, disabilitas, obat rutin). JANGAN mengulang isi "tas_dasar".
Balas HANYA dengan objek JSON dengan kunci persis:
{"ringkasan": string (2–3 kalimat menjelaskan skor),
 "langkah_darurat": string[] (4–6 langkah berurutan),
 "peran_anggota": [{"siapa": string, "tugas": string}],
 "titik_tujuan_id": string | null (id dari daftar; null hanya jika daftar kosong),
 "rute_narasi": string (cara menuju titik tujuan, sebut arah mata angin dan jarak dari data; sebut titik cadangan bila ada),
 "tas_siaga_tambahan": [{"barang": string, "alasan": string}] (maks 6, khusus kondisi keluarga ini),
 "tips_rumah": string[] (maks 3)}`;

function dataPengguna({ input, skor, titik }: Konteks, gempaDekat: number) {
  const k = input.kerentanan;
  return {
    ketinggian_rumah_m: input.elevasiM,
    jarak_ke_pantai: LABEL_PANTAI[input.jarakPantai],
    jarak_ke_sungai: LABEL_SUNGAI[input.sungai],
    bangunan: `${LABEL_BANGUNAN[input.bangunan]}, ${input.lantai} lantai`,
    jumlah_penghuni: input.penghuni,
    anggota_rentan: [k.lansia && "lansia", k.balita && "balita", k.hamil && "ibu hamil", k.disabilitas && "penyandang disabilitas"].filter(Boolean),
    obat_rutin: input.obat || null,
    kendaraan: input.kendaraan === "jalan" ? "tidak ada (jalan kaki)" : input.kendaraan,
    gempa_m5_dalam_300km_dari_15_terakhir: gempaDekat,
    tas_dasar: tasDasar(input.penghuni).map((t) => t.barang),
    skor: { total: skor.total, kategori: skor.kategori, rincian: skor.rincian.map(({ faktor, nilai, poin, maks }) => ({ faktor, nilai, poin, maks })) },
    daftar_titik_aman: titik.map((t) => ({
      id: t.id,
      nama: t.nama,
      jenis: t.jenis,
      jarak_km: Math.round(t.jarakKm * 100) / 100,
      ketinggian_m: t.elevasiM,
      arah: t.arah.nama,
      menit_jalan_kaki: t.menit,
      kelas: t.kelas === "tinggi" ? "tinggi" : "lebih_tinggi",
    })),
  };
}

async function sekali(konteks: Konteks, gempaDekat: number, key: string): Promise<Rencana | null> {
  const res = await fetch(URL_DEEPSEEK, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      temperature: 0.3,
      max_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SISTEM },
        { role: "user", content: JSON.stringify(dataPengguna(konteks, gempaDekat)) },
      ],
    }),
    signal: AbortSignal.timeout(BATAS_MS),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const isi = data.choices?.[0]?.message?.content;
  if (!isi) throw new Error("DeepSeek: respons kosong");
  return periksaRencanaAI(JSON.parse(isi), konteks.titik);
}

/** Coba DeepSeek maks 2 kali. Mengembalikan null bila tidak ada key, gagal, atau tidak lolos validasi. */
export async function mintaRencanaAI(konteks: Konteks, gempaDekat: number): Promise<Rencana | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  for (let coba = 0; coba < 2; coba++) {
    try {
      const r = await sekali(konteks, gempaDekat, key);
      if (r) return r;
    } catch (e) {
      console.warn("[rencana] DeepSeek gagal:", (e as Error).message);
    }
  }
  return null;
}
