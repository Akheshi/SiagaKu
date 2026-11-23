import { describe, expect, it } from "vitest";
import { bacaKodeRencana, inputMode, kodeRencana, modeDariUrl, qsMode } from "../bagikan";
import { CONTOH_BENGKULU } from "../input";

const params = (q: string) => new URLSearchParams(q);

describe("kode rencana", () => {
  it("bolak-balik utuh, termasuk huruf non-ASCII", () => {
    const input = { ...CONTOH_BENGKULU, namaKeluarga: "Siti Ña’imah", obat: "Insulin — Kakek" };
    const kode = kodeRencana(input);
    expect(kode).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(bacaKodeRencana(kode)).toEqual(input);
  });

  it("menolak kode rusak, kosong, atau isi yang tidak lolos skema", () => {
    expect(bacaKodeRencana(null)).toBeNull();
    expect(bacaKodeRencana("%%%")).toBeNull();
    expect(bacaKodeRencana(kodeRencana({ ...CONTOH_BENGKULU, penghuni: 999 }))).toBeNull();
    expect(bacaKodeRencana("a".repeat(2001))).toBeNull();
  });
});

describe("mode rencana dari URL", () => {
  it("contoh, bagikan, dan pribadi", () => {
    expect(modeDariUrl(params("contoh=bengkulu"))).toEqual({ jenis: "contoh" });
    const kode = kodeRencana(CONTOH_BENGKULU);
    const m = modeDariUrl(params(`r=${kode}`));
    expect(m).toEqual({ jenis: "bagikan", kode, input: CONTOH_BENGKULU });
    expect(qsMode(m)).toBe(`?r=${kode}`);
    expect(modeDariUrl(params("r=rusak"))).toEqual({ jenis: "pribadi" });
    expect(qsMode({ jenis: "pribadi" })).toBe("");
  });

  it("mode pribadi hanya memakai data tersimpan yang valid", () => {
    expect(inputMode({ jenis: "pribadi" }, () => CONTOH_BENGKULU)).toEqual(CONTOH_BENGKULU);
    expect(inputMode({ jenis: "pribadi" }, () => ({ rusak: true }))).toBeNull();
  });
});
