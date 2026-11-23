/**
 * Rencana deterministik, fokus persiapan dipilih AI dari daftar sistem, dan tas siaga dasar.
 * Semua fungsi murni — dipakai server (fallback) dan diuji unit.
 */
import { z } from "zod";
import { SAAT_GUNCANGAN, setelahGuncangan } from "./arahan";
import { pesisir } from "./hasil";
import type { InputRencanaT } from "./input";
import type { HasilSkor } from "./score";

const teks = (maks: number) => z.string().trim().min(1).max(maks);

export const RencanaSchema = z.object({
  fokus: z.array(z.object({ faktor: teks(40), nilai: teks(120), tindakan: teks(240) })).max(2),
  langkah_darurat: z.array(teks(300)).min(3).max(7),
  peran_anggota: z.array(z.object({ siapa: teks(40), tugas: teks(240) })).min(1).max(8),
  rute_narasi: teks(500),
  tas_siaga_tambahan: z.array(z.object({ barang: teks(213), alasan: teks(160) })).max(8),
  tips_rumah: z.array(teks(240)).max(5),
});

export type Rencana = z.infer<typeof RencanaSchema>;

type Konteks = { input: InputRencanaT; skor: HasilSkor };

export type ItemTas = { id: string; barang: string; ket?: string; untuk?: string };

export const CATATAN_CADANGAN = "Simpan cadangan air dan makanan untuk seluruh penghuni secara terpisah di rumah.";

/** Perlengkapan portabel mengacu Kebutuhan Dasar Tas Siaga Bencana, Buku Saku BNPB. */
export function tasDasar(penghuni: number): ItemTas[] {
  return [
    {
      id: "air",
      barang: "Air minum dalam botol",
      ket: penghuni > 1 ? "Bagi sesuai kemampuan membawa tiap orang." : "Isi sesuai kemampuan membawa.",
    },
    { id: "makanan", barang: "Makanan siap santap yang ringan dan tahan lama", ket: "misalnya biskuit atau roti kering" },
    { id: "senter", barang: "Senter dan baterai cadangan" },
    { id: "dokumen", barang: "Fotokopi KTP, KK, dan surat penting", ket: "simpan dalam plastik kedap air" },
    { id: "p3k", barang: "Kotak P3K dan obat-obatan umum" },
    { id: "peluit", barang: "Peluit", ket: "untuk memberi tanda jika terjebak" },
    { id: "powerbank", barang: "Power bank terisi penuh dan kabel" },
    { id: "pakaian", barang: "Pakaian ganti dan jas hujan" },
    { id: "uang", barang: "Uang tunai secukupnya" },
    { id: "masker", barang: "Masker dan alat kebersihan diri" },
  ];
}

/** Tambahan tas siaga sesuai kondisi keluarga (dipakai juga untuk melengkapi hasil AI). */
export function tasTambahanDasar(i: InputRencanaT): Rencana["tas_siaga_tambahan"] {
  const t: Rencana["tas_siaga_tambahan"] = [];
  if (i.obat.trim()) t.push({ barang: i.obat.trim(), alasan: "Siapkan cadangan sesuai petunjuk tenaga kesehatan. Sertakan catatan cara pakainya." });
  if (i.kerentanan.lansia) t.push({ barang: "Alat bantu lansia yang biasa dipakai", alasan: "Siapkan alat seperti tongkat atau kacamata di tempat yang mudah dijangkau." });
  if (i.kerentanan.balita) {
    t.push({ barang: "Popok dan bekal balita sesuai kebutuhan", alasan: "Siapkan perlengkapan balita yang biasa dipakai, termasuk gendongan bila sesuai." });
  }
  if (i.kerentanan.hamil) t.push({ barang: "Buku KIA dan perlengkapan kehamilan pribadi", alasan: "Buku KIA membantu petugas mengetahui riwayat kehamilan." });
  if (i.kerentanan.disabilitas) t.push({ barang: "Alat bantu yang biasa dipakai dan perlengkapannya", alasan: "Siapkan alat bantu dan komponen yang diperlukan, misalnya baterai alat dengar." });
  return t;
}

export type OpsiFokus = Rencana["fokus"][number];

/**
 * Pilihan fokus persiapan: satu per faktor skor yang menyumbang poin, dengan tindakan
 * yang sudah ditulis aplikasi. AI hanya memilih indeks dari daftar ini (lihat periksaRencanaAI).
 * Urutan bawaan: faktor dengan porsi poin terbesar lebih dulu.
 */
export function opsiFokus({ input, skor }: Konteks): OpsiFokus[] {
  const dekatPantai = pesisir(input);
  const tindakan: Record<string, string> = {
    "Ketinggian rumah": dekatPantai
      ? "Tanyakan lokasi dan jalur evakuasi tsunami resmi ke BPBD atau kelurahan, lalu jalani rutenya bersama keluarga."
      : "Kenali jalan menuju tempat yang lebih tinggi di sekitar rumah untuk berjaga saat banjir.",
    "Jarak ke pantai":
      "Latih evakuasi ke tempat tinggi bersama keluarga dan catat waktunya; begitu gempa kuat atau lama mereda, langsung berangkat.",
    "Aktivitas gempa": "Taruh tas siaga di dekat pintu keluar dan sepakati satu titik kumpul jika keluarga terpisah.",
    Bangunan: "Periksa dinding yang retak, ikat lemari tinggi ke dinding, dan pertimbangkan perkuatan kolom saat renovasi.",
    "Kerentanan keluarga": Object.values(input.kerentanan).some(Boolean)
      ? "Sepakati bantuan sebelum darurat dan siapkan obat serta alat bantu yang biasa dipakai agar mudah dijangkau."
      : "Latih jalur evakuasi dengan berjalan kaki dan sepakati titik kumpul di tempat yang ditetapkan petugas.",
    "Banjir sungai": "Simpan dokumen penting di tempat tinggi dan pantau peringatan banjir dari BPBD.",
  };
  return [...skor.rincian]
    .filter((f) => f.poin > 0 && tindakan[f.faktor])
    .sort((a, b) => b.poin / b.maks - a.poin / a.maks)
    .map((f) => ({ faktor: f.faktor, nilai: f.nilai, tindakan: tindakan[f.faktor] }));
}

/** Skor, arahan darurat, dan teks persiapan selalu dibentuk oleh aplikasi. */
export function rencanaTemplate({ input, skor }: Konteks): Rencana {
  const dekatPantai = pesisir(input);
  const rute_narasi = setelahGuncangan(dekatPantai);
  const langkah_darurat = dekatPantai
    ? [
        SAAT_GUNCANGAN,
        rute_narasi,
        "Jangan kembali mengambil barang.",
        "Jika evakuasi tsunami, bertahan di tempat tinggi sampai BMKG atau BPBD menyatakan aman.",
      ]
    : [
        SAAT_GUNCANGAN,
        rute_narasi,
        "Di titik kumpul, periksa apakah ada anggota keluarga yang terluka.",
        "Waspadai gempa susulan; jangan masuk kembali ke bangunan yang retak.",
        "Ikuti informasi resmi BMKG dan BPBD.",
      ];

  const sendiri = input.penghuni === 1;
  const ambilTas = "Bawa tas siaga jika terjangkau dan tidak menunda evakuasi.";
  const peran_anggota: Rencana["peran_anggota"] = [
    sendiri
      ? { siapa: "Rencana evakuasi", tugas: `Kenali jalur yang bisa kamu lalui. ${ambilTas}` }
      : { siapa: "Pemandu evakuasi", tugas: `Tentukan orang dewasa yang tersedia untuk memandu. ${ambilTas}` },
  ];
  const { balita, lansia, hamil, disabilitas } = input.kerentanan;
  const kelompok = [balita && "balita", lansia && "lansia", hamil && "ibu hamil", disabilitas && "anggota disabilitas"]
    .filter((anggota) => anggota !== false);
  if (kelompok.length) {
    const yangDibantu = new Intl.ListFormat("id").format(kelompok);
    peran_anggota.push({
      siapa: "Bantuan evakuasi",
      tugas: sendiri
        ? "Jika perlu pendamping atau alat bantu, sepakati bantuan dengan tetangga sebelum darurat. Coba jalur evakuasi bersama."
        : `Orang dewasa yang sama boleh merangkap. Dampingi ${yangDibantu} sesuai kebutuhan. Jika perlu bantuan tambahan, sepakati dengan tetangga sebelum darurat.`,
    });
  }

  const tips_rumah: string[] = [];
  if (input.bangunan !== "beton") tips_rumah.push("Periksa dinding yang retak dan pertimbangkan perkuatan kolom saat renovasi.");
  tips_rumah.push("Ikat lemari dan rak tinggi ke dinding, jangan taruh barang berat di atas tempat tidur.");
  if (input.sungai === "lt100") tips_rumah.push("Simpan dokumen penting di tempat tinggi karena rumah dekat sungai.");
  tips_rumah.push("Sepakati satu titik kumpul keluarga jika terpisah, dan latih rute evakuasi setahun dua kali.");

  return {
    fokus: opsiFokus({ input, skor }).slice(0, 2),
    langkah_darurat,
    peran_anggota,
    rute_narasi,
    tas_siaga_tambahan: tasTambahanDasar(input),
    tips_rumah: tips_rumah.slice(0, 5),
  };
}

const PilihanAISchema = z.strictObject({
  fokus: z.array(z.number().int().min(0)).min(1).max(2),
});

/**
 * Terima jawaban AI hanya jika berupa indeks unik dari `opsi`. Teks fokus selalu
 * diambil dari daftar sistem, jadi AI tidak bisa menambah angka, tempat, atau instruksi.
 */
export function periksaRencanaAI(mentah: unknown, rencana: Rencana, opsi: OpsiFokus[]): Rencana | null {
  const hasil = PilihanAISchema.safeParse(mentah);
  if (!hasil.success) return null;
  const { fokus } = hasil.data;
  if (new Set(fokus).size !== fokus.length || fokus.some((i) => i >= opsi.length)) return null;
  if (fokus.length < Math.min(2, opsi.length)) return null;
  return { ...rencana, fokus: fokus.map((i) => opsi[i]) };
}
