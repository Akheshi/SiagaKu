import type { Metadata } from "next";
import { MuatHasil } from "./MuatHasil";

export const metadata: Metadata = {
  title: "Rencana siaga keluarga — SiagaKu",
  description: "Skor risiko rumah, titik aman terdekat, rencana evakuasi, dan isi tas siaga keluargamu.",
};

export default function HasilPage() {
  return <MuatHasil />;
}
