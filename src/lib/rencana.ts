/**
 * Rencana deterministik, prioritas persiapan dari AI, dan tas siaga dasar.
 * Semua fungsi murni — dipakai server (fallback) dan diuji unit.
 */
import { z } from "zod";
import { pesisir } from "./hasil";
import type { InputRencanaT } from "./input";
import type { HasilSkor } from "./score";

const teks = (maks: number) => z.string().trim().min(1).max(maks);

export const RencanaSchema = z.object({
  ringkasan: teks(600),
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

/** Skor, arahan darurat, dan teks persiapan selalu dibentuk oleh aplikasi. */
export function rencanaTemplate({ input, skor }: Konteks): Rencana {
  const faktorBesar = [...skor.rincian].sort((a, b) => b.poin / b.maks - a.poin / a.maks).slice(0, 2);
  const lambat = input.kerentanan.lansia || input.kerentanan.disabilitas || input.kerentanan.balita;

  const ringkasan = [
    `Skor risiko rumahmu ${skor.total} dari 100, kategori ${skor.kategori.toLowerCase()}.`,
    `Penyumbang terbesar: ${faktorBesar.map((f) => `${f.faktor.toLowerCase()} (${f.nilai})`).join(" dan ")}.`,
    pesisir(input)
      ? "Jika gempa terasa kuat atau lama di pesisir, segera evakuasi setelah guncangan mereda."
      : "Rumahmu jauh dari pantai, jadi fokus utamanya adalah selamat dari guncangan dan reruntuhan.",
  ].join(" ");

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
    ringkasan,
    langkah_darurat,
    peran_anggota: peran_anggota.slice(0, 8),
    titik_tujuan_id: null,
    rute_narasi,
    tas_siaga_tambahan: tasTambahanDasar(input),
    tips_rumah: tips_rumah.slice(0, 5),
  };
}

const PrioritasSchema = z.strictObject({
  prioritas_tips: z.number().int().min(0),
  prioritas_peran: z.number().int().min(0),
});

function dahulukan<T>(daftar: T[], indeks: number): T[] {
  return [daftar[indeks], ...daftar.slice(0, indeks), ...daftar.slice(indeks + 1)];
}

export function periksaRencanaAI(mentah: unknown, rencana: Rencana): Rencana | null {
  const hasil = PrioritasSchema.safeParse(mentah);
  if (!hasil.success) return null;
  const { prioritas_tips, prioritas_peran } = hasil.data;
  if (prioritas_tips >= rencana.tips_rumah.length || prioritas_peran >= rencana.peran_anggota.length) return null;
  return {
    ...rencana,
    tips_rumah: dahulukan(rencana.tips_rumah, prioritas_tips),
    peran_anggota: dahulukan(rencana.peran_anggota, prioritas_peran),
  };
}
