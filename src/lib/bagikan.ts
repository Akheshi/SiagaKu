import { SAAT_GUNCANGAN, setelahGuncangan } from "./arahan";
import { CONTOH_BENGKULU, InputRencana, type InputRencanaT } from "./input";

export type ModeAktif = { jenis: "pribadi" } | { jenis: "contoh" };
export type ModeRencana = ModeAktif | { jenis: "tautan-lama" };

export function modeDariUrl(p: { get(nama: string): string | null }): ModeRencana {
  if (p.get("r") !== null || p.get("tautan") === "lama") return { jenis: "tautan-lama" };
  return p.get("contoh") === "bengkulu" ? { jenis: "contoh" } : { jenis: "pribadi" };
}

export function qsMode(m: ModeAktif): string {
  return m.jenis === "contoh" ? "?contoh=bengkulu" : "";
}

export function inputMode(m: ModeRencana, bacaPribadi: () => unknown): InputRencanaT | null {
  if (m.jenis === "tautan-lama") return null;
  if (m.jenis === "contoh") return CONTOH_BENGKULU;
  const cek = InputRencana.safeParse(bacaPribadi());
  return cek.success ? cek.data : null;
}

export function teksBagikan(mode: ModeAktif, asal: string): string {
  const demo = mode.jenis === "contoh";
  return [
    demo ? "*Contoh rencana siaga Kota Bengkulu*" : "*Ringkasan siaga keluarga*",
    "",
    `*Saat guncangan:* ${SAAT_GUNCANGAN}`,
    `${setelahGuncangan(true)} Di lokasi lain, ikuti arahan resmi yang berlaku di tempatmu.`,
    "",
    "Sebelum gempa, sepakati titik kumpul dan siapa yang bisa mendampingi anggota keluarga yang perlu bantuan.",
    "",
    demo ? "Buka contoh SiagaKu:" : "Buat rencana keluargamu di SiagaKu:",
    demo ? `${asal}/hasil${qsMode(mode)}` : `${asal}/`,
  ].join("\n");
}
