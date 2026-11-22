import { describe, expect, it } from "vitest";
import { InputRencana, keInputSkor, type InputRencanaT } from "../input";

const VALID: InputRencanaT = {
  namaKeluarga: "Rahman",
  lokasi: { lat: -3.8004, lon: 102.2655 },
  elevasiM: 16,
  jarakPantaiKm: 0.92,
  jarakPantai: "0_5_1",
  pantaiOtomatis: true,
  sungai: "100_500",
  bangunan: "bata",
  lantai: 1,
  penghuni: 5,
  kerentanan: { lansia: true, balita: true, hamil: false, disabilitas: false },
  obat: "Amlodipin (Nenek)",
  kendaraan: "motor",
};

describe("InputRencana", () => {
  it("menerima input lengkap", () => {
    expect(InputRencana.safeParse(VALID).success).toBe(true);
  });

  it("elevasi & jarak pantai boleh null (gagal diambil)", () => {
    expect(InputRencana.safeParse({ ...VALID, elevasiM: null, jarakPantaiKm: null }).success).toBe(true);
  });

  it("menolak nilai di luar pilihan dan angka tidak masuk akal", () => {
    expect(InputRencana.safeParse({ ...VALID, bangunan: "istana" }).success).toBe(false);
    expect(InputRencana.safeParse({ ...VALID, lantai: 0 }).success).toBe(false);
    expect(InputRencana.safeParse({ ...VALID, penghuni: 0 }).success).toBe(false);
    expect(InputRencana.safeParse({ ...VALID, lokasi: { lat: 120, lon: 0 } }).success).toBe(false);
  });

  it("membatasi panjang teks bebas", () => {
    expect(InputRencana.safeParse({ ...VALID, obat: "x".repeat(201) }).success).toBe(false);
    expect(InputRencana.safeParse({ ...VALID, namaKeluarga: "x".repeat(61) }).success).toBe(false);
  });

  it("nama keluarga & obat boleh kosong", () => {
    expect(InputRencana.safeParse({ ...VALID, namaKeluarga: "", obat: "" }).success).toBe(true);
  });
});

describe("keInputSkor", () => {
  it("memetakan input form ke input skor", () => {
    expect(keInputSkor(VALID, 3)).toEqual({
      elevasiM: 16,
      jarakPantai: "0_5_1",
      jumlahGempaDekat: 3,
      bangunan: "bata",
      lantai: 1,
      kerentanan: VALID.kerentanan,
      kendaraan: "motor",
      sungai: "100_500",
    });
  });
});
