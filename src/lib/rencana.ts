/**
 * Bentuk rencana (output AI, PRD §7.4), template cadangan, dan tas siaga dasar.
 * Semua fungsi murni — dipakai server (fallback) dan diuji unit.
 */
import { z } from "zod";
import type { InputRencanaT } from "./input";
import type { HasilSkor } from "./score";
import type { TitikAman } from "./safePoints";

const teks = (maks: number) => z.string().trim().min(1).max(maks);

export const RencanaSchema = z.object({
  ringkasan: teks(600),
  langkah_darurat: z.array(teks(300)).min(3).max(7),
  peran_anggota: z.array(z.object({ siapa: teks(40), tugas: teks(240) })).min(1).max(8),
  titik_tujuan_id: z.string().nullable(),
  rute_narasi: teks(500),
  tas_siaga_tambahan: z.array(z.object({ barang: teks(80), alasan: teks(160) })).max(8),
  tips_rumah: z.array(teks(240)).max(5),
});

export type Rencana = z.infer<typeof RencanaSchema>;

export type Konteks = { input: InputRencanaT; skor: HasilSkor; titik: TitikAman[] };

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

const pesisir = (i: InputRencanaT) => i.jarakPantai !== "gt5";

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

const angka = (n: number, d = 1) => n.toLocaleString("id-ID", { maximumFractionDigits: d });

/** Rencana tanpa AI — selalu bisa dibuat dari data yang sama. */
export function rencanaTemplate({ input, skor, titik }: Konteks): Rencana {
  const tujuan = titik[0];
  const faktorBesar = [...skor.rincian].sort((a, b) => b.poin / b.maks - a.poin / a.maks).slice(0, 2);
  const lambat = input.kerentanan.lansia || input.kerentanan.disabilitas || input.kerentanan.balita;

  const ringkasan = [
    `Skor risiko rumahmu ${skor.total} dari 100, kategori ${skor.kategori.toLowerCase()}.`,
    `Penyumbang terbesar: ${faktorBesar.map((f) => `${f.faktor.toLowerCase()} (${f.nilai})`).join(" dan ")}.`,
    pesisir(input)
      ? "Jika gempa terasa kuat atau lama, anggap tsunami bisa datang dalam 20–30 menit dan segera evakuasi."
      : "Rumahmu jauh dari pantai, jadi fokus utamanya adalah selamat dari guncangan dan reruntuhan.",
  ].join(" ");

  const tujuanTeks = tujuan ? `${tujuan.nama} (${angka(tujuan.jarakKm)} km ke arah ${tujuan.arah.nama})` : "tempat tinggi terdekat";
  const langkah_darurat = pesisir(input)
    ? [
        "Saat guncangan: lindungi kepala, berlindung di bawah meja yang kokoh, jauhi kaca dan lemari tinggi.",
        "Begitu guncangan berhenti, ambil tas siaga dan segera keluar. Jangan menunggu sirene atau pengumuman.",
        `Jalan kaki menjauhi pantai menuju ${tujuanTeks}. Hindari jembatan dan tepi sungai.`,
        lambat
          ? "Bantu anggota yang lebih lambat sejak awal; jangan berpencar."
          : "Tetap bersama keluarga; jangan kembali mengambil barang.",
        "Bertahan di tempat tinggi sampai BMKG atau BPBD menyatakan aman.",
      ]
    : [
        "Saat guncangan: lindungi kepala, berlindung di bawah meja yang kokoh, jauhi kaca dan lemari tinggi.",
        "Setelah guncangan berhenti, keluar dengan tenang ke ruang terbuka yang jauh dari bangunan dan tiang listrik.",
        "Periksa anggota keluarga yang terluka; matikan kompor dan listrik bila aman.",
        "Waspadai gempa susulan; jangan masuk kembali ke bangunan yang retak.",
        "Ikuti informasi resmi BMKG dan BPBD.",
      ];

  const peran_anggota: Rencana["peran_anggota"] = [
    { siapa: "Orang dewasa pertama", tugas: `Membawa tas siaga dan memimpin jalan ke ${tujuan ? tujuan.nama : "tempat aman"}.` },
  ];
  if (input.kerentanan.balita) peran_anggota.push({ siapa: "Orang dewasa kedua", tugas: "Menggendong balita dengan gendongan agar tangan tetap bebas." });
  if (input.kerentanan.lansia) peran_anggota.push({ siapa: "Pendamping lansia", tugas: "Menuntun lansia sejak awal dan membawa obat rutinnya." });
  if (input.kerentanan.hamil) peran_anggota.push({ siapa: "Ibu hamil", tugas: "Berjalan bersama pendamping, tidak membawa beban berat." });
  if (input.kerentanan.disabilitas) peran_anggota.push({ siapa: "Pendamping disabilitas", tugas: "Membantu anggota disabilitas beserta alat bantunya." });
  if (input.penghuni > peran_anggota.length) peran_anggota.push({ siapa: "Anggota lainnya", tugas: "Membawa air dan senter, berjalan di belakang agar tidak ada yang tertinggal." });

  const vertikal = tujuan?.kelas === "lebih-tinggi"
    ? " Tempat ini di bawah 30 m, jadi begitu sampai segera naik ke lantai paling atas bangunan."
    : "";
  const rute_narasi = tujuan
    ? `Dari rumah, jalan kaki ke arah ${tujuan.arah.nama} sejauh sekitar ${angka(tujuan.jarakKm)} km menuju ${tujuan.nama}, yang berada ${angka(tujuan.elevasiM, 0)} m di atas laut. Perkiraan waktu tempuh ${tujuan.menit} menit.${vertikal} ${titik[1] ? `Jika jalan tertutup, pilih ${titik[1].nama} (${angka(titik[1].jarakKm)} km ke arah ${titik[1].arah.nama}).` : ""}`.trim()
    : "Belum ditemukan tempat tinggi bernama di sekitar rumah. Bergeraklah menjauhi pantai minimal 3 km atau menuju tempat dengan ketinggian 30 m ke atas.";

  const tips_rumah: string[] = [];
  if (input.bangunan !== "beton") tips_rumah.push("Periksa dinding yang retak dan pertimbangkan perkuatan kolom saat renovasi.");
  tips_rumah.push("Ikat lemari dan rak tinggi ke dinding, jangan taruh barang berat di atas tempat tidur.");
  if (input.sungai === "lt100") tips_rumah.push("Simpan dokumen penting di tempat tinggi karena rumah dekat sungai.");
  tips_rumah.push("Sepakati satu titik kumpul keluarga jika terpisah, dan latih rute evakuasi setahun dua kali.");

  return {
    ringkasan,
    langkah_darurat,
    peran_anggota: peran_anggota.slice(0, 8),
    titik_tujuan_id: tujuan?.id ?? null,
    rute_narasi,
    tas_siaga_tambahan: tasTambahanDasar(input),
    tips_rumah: tips_rumah.slice(0, 5),
  };
}

/**
 * Validasi hasil AI terhadap aturan produk: bentuk JSON benar dan
 * titik tujuan hanya dari daftar sistem. Gagal → null (pakai template).
 */
export function periksaRencanaAI(mentah: unknown, titik: TitikAman[]): Rencana | null {
  const hasil = RencanaSchema.safeParse(mentah);
  if (!hasil.success) return null;
  const r = hasil.data;
  const ids = new Set(titik.map((t) => t.id));
  if (titik.length === 0) return { ...r, titik_tujuan_id: null };
  if (r.titik_tujuan_id === null || !ids.has(r.titik_tujuan_id)) return null;
  return r;
}
