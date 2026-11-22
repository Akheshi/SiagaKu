import { keInputSkor, type InputRencanaT } from "../input";

export { hitungSkor } from "../score";

/** Input skor dari input form dengan elevasi & gempa tetap, untuk test. */
export function keInputSkorDummy(i: InputRencanaT) {
  return keInputSkor({ ...i, elevasiM: i.elevasiM ?? 6 }, 3);
}
