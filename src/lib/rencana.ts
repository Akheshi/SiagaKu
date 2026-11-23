/**
 * Rencana deterministik, fokus persiapan dipilih AI dari daftar sistem, dan tas siaga dasar.
 * Semua fungsi murni — dipakai server (fallback) dan diuji unit.
 */
import { z } from "zod";
import { pesisir } from "./hasil";
import type { InputRencanaT } from "./input";
import type { HasilSkor } from "./score";

const teks = (maks: number) => z.string().trim().min(1).max(maks);

export const RencanaSchema = z.object({
  fokus: z.array(z.object({ faktor: teks(40), nilai: teks(120), tindakan: teks(240) })).max(2),
  langkah_darurat: z.array(teks(300)).min(3).max(7),
  peran_anggota: z.array(z.object({ siapa: teks(40), tugas: teks(240) })).min(1).max(8),
  titik_tujuan_id: z.string().nullable(),
  rute_narasi: teks(500),
  tas_siaga_tambahan: z.array(z.object({ barang: teks(213), alasan: teks(160) })).max(8),
  tips_rumah: z.array(teks(240)).max(5),
});

export type Rencana = z.infer<typeof RencanaSchema>;

type Konteks = { input: InputRencanaT; skor: HasilSkor };

export type ItemTas = { id: string; barang: string; ket?: string; untuk?: string };

/** Isi dasar tas siaga (mengacu panduan umum BNPB), disesuaikan jumlah penghuni. */
export function tasDasar(penghuni: number): ItemTas[] {
  return [
    { id: "air", barang: `Air minum ${penghuni * 3} liter`, ket: "3 liter per orang untuk 1 hari pertama" },
    { id: "makanan", barang: "Makanan siap santap untuk 3 hari", ket: "biskuit, roti kering, makanan kaleng" },
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
  if (i.obat.trim()) t.push({ barang: `${i.obat.trim()} untuk 7 hari`, alasan: "Obat rutin tidak boleh terputus selama mengungsi." });
  if (i.kerentanan.lansia) t.push({ barang: "Tongkat lipat dan alas kaki tertutup", alasan: "Membantu lansia berjalan di jalan yang rusak." });
  if (i.kerentanan.balita) {
    t.push({ barang: "Popok dan susu untuk 3 hari", alasan: "Kebutuhan balita sulit didapat di pengungsian." });
    t.push({ barang: "Gendongan bayi", alasan: "Tangan tetap bebas saat berjalan cepat." });
  }
  if (i.kerentanan.hamil) t.push({ barang: "Buku KIA dan vitamin kehamilan", alasan: "Catatan kesehatan dibutuhkan bila harus ke fasilitas kesehatan." });
  if (i.kerentanan.disabilitas) t.push({ barang: "Alat bantu cadangan (kacamata, alat dengar, kursi roda lipat)", alasan: "Alat bantu sering tertinggal saat panik." });
  return t.slice(0, 8);
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
    "Kerentanan keluarga":
      "Tentukan siapa yang mendampingi anggota yang perlu dibantu, dan simpan obat serta alat bantunya di tas siaga.",
    "Banjir sungai": "Simpan dokumen penting di tempat tinggi dan pantau peringatan banjir dari BPBD.",
  };
  return [...skor.rincian]
    .filter((f) => f.poin > 0 && tindakan[f.faktor])
    .sort((a, b) => b.poin / b.maks - a.poin / a.maks)
    .map((f) => ({ faktor: f.faktor, nilai: f.nilai, tindakan: tindakan[f.faktor] }));
}

/** Skor, arahan darurat, dan teks persiapan selalu dibentuk oleh aplikasi. */
export function rencanaTemplate({ input, skor }: Konteks): Rencana {
  const lambat = input.kerentanan.lansia || input.kerentanan.disabilitas || input.kerentanan.balita;


  const rute_narasi = pesisir(input)
    ? "Jika gempa terasa kuat atau lama di pesisir, segera evakuasi setelah guncangan mereda. Ikuti rambu evakuasi resmi menuju tempat yang lebih tinggi. Jauhi pantai dan tepi sungai. Jangan tunggu sirene."
    : "Setelah guncangan mereda, menuju ruang terbuka terdekat yang jauh dari bangunan, tiang listrik, dan kabel. Ikuti arahan petugas setempat.";
  const langkah_darurat = pesisir(input)
    ? [
        "Saat guncangan: lindungi kepala, berlindung di bawah meja yang kokoh, jauhi kaca dan lemari tinggi.",
        rute_narasi,
        lambat
          ? "Bantu anggota yang lebih lambat sejak awal; jangan berpencar."
          : "Tetap bersama keluarga; jangan kembali mengambil barang.",
        "Bertahan di tempat tinggi sampai BMKG atau BPBD menyatakan aman.",
      ]
    : [
        "Saat guncangan: lindungi kepala, berlindung di bawah meja yang kokoh, jauhi kaca dan lemari tinggi.",
        rute_narasi,
        "Periksa anggota keluarga yang terluka; matikan kompor dan listrik bila aman.",
        "Waspadai gempa susulan; jangan masuk kembali ke bangunan yang retak.",
        "Ikuti informasi resmi BMKG dan BPBD.",
      ];

  const peran_anggota: Rencana["peran_anggota"] = [
    { siapa: "Orang dewasa pertama", tugas: "Pandu keluarga keluar. Bawa tas siaga jika sudah terjangkau dan tidak menunda evakuasi." },
  ];
  if (input.kerentanan.balita) peran_anggota.push({ siapa: "Orang dewasa kedua", tugas: "Menggendong balita dengan gendongan agar tangan tetap bebas." });
  if (input.kerentanan.lansia) peran_anggota.push({ siapa: "Pendamping lansia", tugas: "Menuntun lansia sejak awal dan membawa obat rutinnya." });
  if (input.kerentanan.hamil) peran_anggota.push({ siapa: "Ibu hamil", tugas: "Berjalan bersama pendamping, tidak membawa beban berat." });
  if (input.kerentanan.disabilitas) peran_anggota.push({ siapa: "Pendamping disabilitas", tugas: "Membantu anggota disabilitas beserta alat bantunya." });
  if (input.penghuni > peran_anggota.length) peran_anggota.push({ siapa: "Anggota lainnya", tugas: "Membawa air dan senter, berjalan di belakang agar tidak ada yang tertinggal." });

  const tips_rumah: string[] = [];
  if (input.bangunan !== "beton") tips_rumah.push("Periksa dinding yang retak dan pertimbangkan perkuatan kolom saat renovasi.");
  tips_rumah.push("Ikat lemari dan rak tinggi ke dinding, jangan taruh barang berat di atas tempat tidur.");
  if (input.sungai === "lt100") tips_rumah.push("Simpan dokumen penting di tempat tinggi karena rumah dekat sungai.");
  tips_rumah.push("Sepakati satu titik kumpul keluarga jika terpisah, dan latih rute evakuasi setahun dua kali.");

  return {
    fokus: opsiFokus({ input, skor }).slice(0, 2),
    langkah_darurat,
    peran_anggota: peran_anggota.slice(0, 8),
    titik_tujuan_id: null,
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
