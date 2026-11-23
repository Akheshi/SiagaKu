export const SAAT_GUNCANGAN =
  "Lindungi kepala. Jika di dalam ruangan, merunduk, berlindung di bawah meja kokoh, dan berpegangan.";

export function setelahGuncangan(dekatPantai: boolean): string {
  return dekatPantai
    ? "Setelah guncangan berhenti, jika gempa terasa kuat atau lama di pesisir, segera ikuti rambu evakuasi resmi menuju tempat lebih tinggi. Jauhi pantai dan tepi sungai. Jangan tunggu sirene."
    : "Setelah guncangan berhenti, menuju tempat terbuka yang jauh dari bangunan dan kabel. Ikuti arahan resmi, termasuk peringatan tsunami yang berlaku di lokasimu.";
}
