/** Skema input rencana — dipakai wizard (klien) dan /api/rencana (server). */
import { z } from "zod";
import type { InputSkor } from "./score";

export const PILIHAN_PANTAI = ["lt0_5", "0_5_1", "1_3", "3_5", "gt5"] as const;
export const PILIHAN_SUNGAI = ["lt100", "100_500", "gt500"] as const;
export const PILIHAN_BANGUNAN = ["beton", "bata", "kayu"] as const;
export const PILIHAN_KENDARAAN = ["jalan", "motor", "mobil"] as const;

export const InputRencana = z.object({
  namaKeluarga: z.string().trim().max(60),
  lokasi: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  elevasiM: z.number().min(-500).max(9000).nullable(),
  jarakPantaiKm: z.number().min(0).max(20000).nullable(),
  jarakPantai: z.enum(PILIHAN_PANTAI),
  /** true jika pilihan jarak pantai masih sama dengan hasil deteksi otomatis */
  pantaiOtomatis: z.boolean(),
  sungai: z.enum(PILIHAN_SUNGAI),
  bangunan: z.enum(PILIHAN_BANGUNAN),
  lantai: z.number().int().min(1).max(20),
  penghuni: z.number().int().min(1).max(30),
  kerentanan: z.object({
    lansia: z.boolean(),
    balita: z.boolean(),
    hamil: z.boolean(),
    disabilitas: z.boolean(),
  }),
  obat: z.string().trim().max(200),
  kendaraan: z.enum(PILIHAN_KENDARAAN),
});

export type InputRencanaT = z.infer<typeof InputRencana>;

export function keInputSkor(i: InputRencanaT, jumlahGempaDekat: number): InputSkor {
  return {
    elevasiM: i.elevasiM,
    jarakPantai: i.jarakPantai,
    jumlahGempaDekat,
    bangunan: i.bangunan,
    lantai: i.lantai,
    kerentanan: i.kerentanan,
    kendaraan: i.kendaraan,
    sungai: i.sungai,
  };
}

/** Kunci localStorage */
export const KUNCI_DRAF = "siagaku:draf";
export const KUNCI_INPUT = "siagaku:input";

/** Titik contoh Kota Bengkulu (tombol "Coba contoh"). */
export const CONTOH_BENGKULU: InputRencanaT = {
  namaKeluarga: "Contoh",
  lokasi: { lat: -3.8004, lon: 102.2655 },
  elevasiM: null,
  jarakPantaiKm: null,
  jarakPantai: "0_5_1",
  pantaiOtomatis: true,
  sungai: "100_500",
  bangunan: "bata",
  lantai: 1,
  penghuni: 5,
  kerentanan: { lansia: true, balita: true, hamil: false, disabilitas: false },
  obat: "Obat darah tinggi (Nenek)",
  kendaraan: "motor",
};
