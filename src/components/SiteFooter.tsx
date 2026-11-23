import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line pt-6 pb-10 text-[13px] text-ink-3 print:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-wrap px-4 justify-between gap-x-6 gap-y-2">
        <p>
          Data gempa:{" "}
          <a className="underline" href="https://www.bmkg.go.id/" rel="noopener">
            BMKG
          </a>{" "}
          · Peta: ©{" "}
          <a className="underline" href="https://www.openstreetmap.org/copyright" rel="noopener">
            kontributor OpenStreetMap
          </a>{" "}
          · Ketinggian:{" "}
          <a className="underline" href="https://open-meteo.com/" rel="noopener">
            Open-Meteo
          </a>
        </p>
        <p>
          Skor bersifat indikatif, bukan pengganti kajian BPBD.{" "}
          <Link className="underline" href="/tentang">
            Metodologi
          </Link>
        </p>
      </div>
    </footer>
  );
}
