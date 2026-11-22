import { Suspense } from "react";
import { ButtonLink } from "@/components/ButtonLink";
import { QuakePanel, QuakePanelKosong } from "@/components/QuakePanel";

const STEPS = [
  {
    label: "Langkah 1",
    title: "Tandai rumah",
    body: "Pakai GPS atau geser pin. Ketinggian tanah dan jarak ke pantai diambil otomatis.",
  },
  {
    label: "Langkah 2",
    title: "Isi kondisi keluarga",
    body: "Jenis bangunan, jumlah penghuni, ada lansia atau balita.",
  },
  {
    label: "Hasil",
    title: "Dapat rencana",
    body: "Rincian skor risiko, kandidat lokasi dari peta, dan isi tas siaga.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-4">
      <div className="grid items-start gap-8 py-8 sm:py-14 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
      <section aria-labelledby="judul-beranda">
        <h1 id="judul-beranda" className="max-w-[12ch] text-[clamp(44px,6.4vw,84px)]">
          Gempa kuat datang. Keluargamu lari ke mana?
        </h1>
        <p className="mt-5 max-w-[52ch] text-[19px] text-ink-2">
          Tandai rumahmu di peta dan ceritakan siapa saja yang tinggal di sana. SiagaKu menghitung
          risikonya dari data BMKG, ketinggian, dan peta terbuka, lalu menyusun rencana evakuasi yang
          bisa dicetak dan dibagikan ke grup keluarga.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/cek" variant="go" className="w-full sm:w-auto">
            Cek risiko rumahku
          </ButtonLink>
          <ButtonLink href="/hasil?contoh=bengkulu" className="w-full sm:w-auto">
            Coba contoh: Kota Bengkulu
          </ButtonLink>
        </div>
        <p className="mt-3.5 text-sm text-ink-3">
          Tanpa daftar akun. Data hanya tersimpan di perangkatmu.
        </p>
      </section>
      <Suspense fallback={<QuakePanelKosong pesan="Memuat data gempa BMKG…" />}>
        <QuakePanel />
      </Suspense>
      </div>

      <ol className="grid border-t-[3px] border-ink md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className={`py-5 md:py-6 md:pr-6 ${
              i > 0 ? "border-t border-line md:border-t-0 md:border-l md:pl-6" : ""
            }`}
          >
            <b className="font-mono text-[15px] font-semibold text-sign">{step.label}</b>
            <h2 className="mt-2.5 mb-2 text-[28px]">{step.title}</h2>
            <p className="max-w-[34ch] text-[15.5px] text-ink-2">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14 grid gap-4 md:grid-cols-[1fr_1.4fr] md:gap-12" aria-labelledby="judul-alasan">
        <h2 id="judul-alasan" className="max-w-[14ch] text-[40px]">
          Kenapa per rumah, bukan per kota
        </h2>
        <div className="max-w-[62ch] space-y-3 text-ink-2">
          <p>
            Peta risiko resmi menunjukkan wilayah. Tapi dua rumah di kelurahan yang sama bisa berbeda
            tingkat risiko karena ketinggian, posisi terhadap pantai, dan kondisi bangunannya.
          </p>
          <p>
            Rumus skor bisa kamu periksa. AI membantu memilih tips dan peran keluarga yang perlu
            dibahas lebih dulu.
          </p>
        </div>
      </section>
    </div>
  );
}
