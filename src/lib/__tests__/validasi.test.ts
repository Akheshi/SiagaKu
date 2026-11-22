import { describe, expect, it } from "vitest";
import { bacaKoordinat } from "../server/validasi";

const u = (q: string) => `http://localhost/api/x${q}`;

describe("bacaKoordinat", () => {
  it("membaca dan membulatkan 4 desimal", () => {
    expect(bacaKoordinat(u("?lat=-3.800412&lon=102.265549"))).toEqual({ lat: -3.8004, lon: 102.2655 });
  });

  it.each(["", "?lat=-3.8", "?lat=&lon=", "?lat=abc&lon=1", "?lat=91&lon=0", "?lat=0&lon=181"])(
    "menolak %s",
    (q) => {
      expect(bacaKoordinat(u(q))).toBeNull();
    },
  );
});
