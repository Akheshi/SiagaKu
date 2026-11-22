import type { Metadata } from "next";
import { MuatLembar } from "./MuatLembar";

export const metadata: Metadata = {
  title: "Lembar rencana siaga keluarga — SiagaKu",
  description: "Lembar rencana siaga keluarga siap cetak: langkah darurat, tujuan evakuasi, tugas tiap anggota, isi tas siaga.",
};

export default function CetakPage() {
  return <MuatLembar />;
}
