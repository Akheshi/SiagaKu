/**
 * Tautan rencana yang bisa dibagikan tanpa database: isi formulir dikemas ke parameter `?r=`
 * (JSON → UTF-8 → base64url). Penerima membuka rencana dan lembar cetak dengan data yang sama.
 */
import { CONTOH_BENGKULU, InputRencana, type InputRencanaT } from "./input";

function keBase64Url(teks: string): string {
  let biner = "";
  for (const b of new TextEncoder().encode(teks)) biner += String.fromCharCode(b);
  return btoa(biner).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function dariBase64Url(kode: string): string {
  const b64 = kode.replace(/-/g, "+").replace(/_/g, "/");
  const biner = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(biner, (c) => c.charCodeAt(0)));
}

export function kodeRencana(input: InputRencanaT): string {
  return keBase64Url(JSON.stringify(input));
}

/** Null jika kode rusak, terlalu panjang, atau isinya tidak lolos skema formulir. */
export function bacaKodeRencana(kode: string | null): InputRencanaT | null {
  if (!kode || kode.length > 2000) return null;
  try {
    const cek = InputRencana.safeParse(JSON.parse(dariBase64Url(kode)));
    return cek.success ? cek.data : null;
  } catch {
    return null;
  }
}

export type ModeRencana =
  | { jenis: "pribadi" }
  | { jenis: "contoh" }
  | { jenis: "bagikan"; kode: string; input: InputRencanaT };

export function modeDariUrl(p: { get(nama: string): string | null }): ModeRencana {
  if (p.get("contoh") === "bengkulu") return { jenis: "contoh" };
  const kode = p.get("r");
  const input = bacaKodeRencana(kode);
  return input && kode ? { jenis: "bagikan", kode, input } : { jenis: "pribadi" };
}

/** Query string yang mempertahankan mode saat pindah antara /hasil dan /hasil/cetak. */
export function qsMode(m: ModeRencana): string {
  return m.jenis === "contoh" ? "?contoh=bengkulu" : m.jenis === "bagikan" ? `?r=${m.kode}` : "";
}

/** Input untuk mode ini; mode pribadi membaca dari penyimpanan lewat `bacaPribadi`. */
export function inputMode(m: ModeRencana, bacaPribadi: () => unknown): InputRencanaT | null {
  if (m.jenis === "contoh") return CONTOH_BENGKULU;
  if (m.jenis === "bagikan") return m.input;
  const cek = InputRencana.safeParse(bacaPribadi());
  return cek.success ? cek.data : null;
}
