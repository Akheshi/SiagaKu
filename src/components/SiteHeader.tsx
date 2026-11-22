import Link from "next/link";

const NAV = [
  { href: "/#gempa", label: "Info gempa", hideOnPhone: true },
  { href: "/hasil/cetak", label: "Contoh lembar", hideOnPhone: true },
  { href: "/tentang", label: "Metodologi", hideOnPhone: false },
];

export function SiteHeader() {
  return (
    <header className="border-b-[3px] border-ink bg-white print:hidden">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SiagaKu, beranda">
          <span className="grid size-[34px] place-items-center bg-sign" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path
                d="M3 10h11M9 4l6 6-6 6"
                stroke="#fff"
                strokeWidth="3.2"
                fill="none"
                strokeLinecap="square"
              />
            </svg>
          </span>
          <span className="font-sign text-[26px] leading-none font-bold">SiagaKu</span>
        </Link>
        <nav aria-label="Utama" className="flex gap-5 text-[15px]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 border-transparent py-2 hover:border-ink ${
                item.hideOnPhone ? "hidden sm:inline" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
