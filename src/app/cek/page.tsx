import type { Metadata } from "next";
import { MuatWizard } from "./MuatWizard";

export const metadata: Metadata = {
  title: "Cek risiko rumah — SiagaKu",
  description: "Tandai lokasi rumah dan isi kondisi keluarga untuk mendapat skor risiko dan rencana evakuasi.",
};

export default function CekPage() {
  return <MuatWizard />;
}
