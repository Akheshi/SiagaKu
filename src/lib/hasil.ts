/** Bentuk respons POST /api/rencana — dipakai halaman hasil & lembar cetak. */
import type { ModeAktif } from "./bagikan";
import type { InputRencanaT } from "./input";
import type { ItemTas, Rencana } from "./rencana";
import type { TitikAman } from "./safePoints";
import type { HasilSkor } from "./score";

export type HasilRencana = {
  ok: true;
  dibuat: string;
  input: InputRencanaT;
  skor: HasilSkor;
  gempaDekat: number | null;
  gempaTersedia: boolean;
  titik: TitikAman[];
  sumberTitik: "bawaan" | "overpass" | "tidak-tersedia";
  rencana: Rencana;
  sumberRencana: "ai" | "template";
  /** Faktor fokus menurut urutan skor saja, untuk dibandingkan dengan pilihan AI. */
  fokusBawaan?: string[];
  tasDasar: ItemTas[];
};

/** Hasil terakhir disimpan agar muat ulang tidak memanggil AI lagi (PRD F14). */
// Buat ulang hasil lama agar arahan sebelumnya tidak ditampilkan atau dicetak.
export function kunciPenyimpananRencana(mode: ModeAktif) {
  return mode.jenis === "contoh"
    ? { hasil: "siagaku:hasil:contoh:v7", tas: "siagaku:tas:contoh" }
    : { hasil: "siagaku:hasil:v7", tas: "siagaku:tas" };
}

export function kunciInput(i: InputRencanaT): string {
  return JSON.stringify(i);
}

/** Di atas batas ini, jalan kaki ke kandidat kemungkinan terlalu lama saat peringatan tsunami. */
export const BATAS_MENIT_JALAN = 30;

export const PERINGATAN_KANDIDAT_JAUH =
  "Ada kandidat yang lebih dari 30 menit berjalan kaki. Saat peringatan tsunami, waktu sebanyak itu bisa tidak cukup. Tanyakan tempat evakuasi sementara atau gedung evakuasi terdekat ke BPBD.";

export const KETERANGAN_SKOR_SEMENTARA = "Data aktivitas gempa BMKG belum tersedia, jadi faktor itu (maks. 15 poin) belum dihitung. Skor sebenarnya bisa lebih tinggi.";

export const fmt = (n: number, d = 1) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");

export function warnaKategori(k: HasilSkor["kategori"]) {
  switch (k) {
    case "Sangat tinggi":
      return { teks: "text-cat-sangat", bingkai: "border-cat-sangat" };
    case "Tinggi":
      return { teks: "text-risk", bingkai: "border-risk" };
    case "Sedang":
      return { teks: "text-[#9a5b00]", bingkai: "border-[#9a5b00]" };
    default:
      return { teks: "text-sign", bingkai: "border-sign" };
  }
}

export const pesisir = (i: Pick<InputRencanaT, "jarakPantai">) => i.jarakPantai !== "gt5";
