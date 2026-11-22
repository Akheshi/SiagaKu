/** Bentuk respons POST /api/rencana — dipakai halaman hasil & lembar cetak. */
import type { InputRencanaT } from "./input";
import type { ItemTas, Rencana } from "./rencana";
import type { TitikAman } from "./safePoints";
import type { HasilSkor } from "./score";

export type HasilRencana = {
  ok: true;
  dibuat: string;
  input: InputRencanaT;
  skor: HasilSkor;
  gempaDekat: number;
  gempaTersedia: boolean;
  titik: TitikAman[];
  sumberTitik: "bawaan" | "overpass" | "tidak-tersedia";
  rencana: Rencana;
  sumberRencana: "ai" | "template";
  tasDasar: ItemTas[];
};

/** Hasil terakhir disimpan agar muat ulang tidak memanggil AI lagi (PRD F14). */
export const KUNCI_HASIL = "siagaku:hasil";
export const KUNCI_TAS = "siagaku:tas";

export function kunciInput(i: InputRencanaT): string {
  return JSON.stringify(i);
}

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

export const pesisir = (i: InputRencanaT) => i.jarakPantai !== "gt5";
