import Link from "next/link";
import { buttonClass } from "@/components/ButtonLink";

export default function TidakDitemukan() {
  return (
    <div className="mx-auto max-w-[880px] px-4 pt-12">
      <p className="font-mono text-sm text-ink-3">404</p>
      <h1 className="mt-2 text-[clamp(34px,4.6vw,52px)]">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-[60ch] text-ink-2">Alamatnya mungkin salah ketik. Mulai lagi dari beranda.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className={buttonClass("go")}>
          Ke beranda
        </Link>
        <Link href="/cek" className={buttonClass("plain")}>
          Cek risiko rumahku
        </Link>
      </div>
    </div>
  );
}
