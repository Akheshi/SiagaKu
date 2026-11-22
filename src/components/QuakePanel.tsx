import { ambilGempa, type DataGempa } from "@/lib/server/sumber";

const angka = (n: number, d = 1) => n.toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

function koordinat(lat: number, lon: number) {
  const ns = lat < 0 ? "LS" : "LU";
  const ew = lon < 0 ? "BB" : "BT";
  return `${angka(Math.abs(lat), 2)} ${ns} · ${angka(Math.abs(lon), 2)} ${ew}`;
}

/** Status tsunami dari teks BMKG. "dirasakan" bukan info tsunami → netral. */
function statusTsunami(potensi: string): { warna: string; teks: string } {
  const p = potensi.toLowerCase();
  if (p.includes("tidak berpotensi")) return { warna: "bg-sign", teks: potensi };
  if (p.includes("berpotensi tsunami")) return { warna: "bg-risk", teks: potensi };
  return { warna: "bg-ink-3", teks: potensi || "Status tsunami tidak disebutkan" };
}

function Bingkai({ children }: { children: React.ReactNode }) {
  return (
    <aside id="gempa" className="scroll-mt-4 border-2 border-ink bg-white" aria-labelledby="judul-gempa">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3 text-sm">
        <h2 id="judul-gempa" className="text-xl font-semibold">
          Gempa terbaru
        </h2>
        <span className="font-mono text-xs text-ink-3">Sumber: BMKG</span>
      </div>
      {children}
    </aside>
  );
}

export function QuakePanelKosong({ pesan }: { pesan: string }) {
  return (
    <Bingkai>
      <p className="px-4 py-6 text-[15px] text-ink-2">{pesan}</p>
    </Bingkai>
  );
}

export async function QuakePanel() {
  let data: DataGempa;
  try {
    data = await ambilGempa();
  } catch {
    return (
      <QuakePanelKosong pesan="Data gempa BMKG sedang tidak bisa diambil. Kamu tetap bisa mengecek risiko rumah." />
    );
  }
  const g = data.terbaru ?? data.terkini[0];
  if (!g) return <QuakePanelKosong pesan="Belum ada data gempa dari BMKG." />;

  const tsunami = statusTsunami(g.potensi);
  return (
    <Bingkai>
      <div className="grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-1 px-4 pt-4 pb-4">
        <p className="font-mono text-[64px] leading-[0.9] font-semibold tracking-tighter">
          {angka(g.magnitudo)}
          <span className="mt-1.5 block font-sans text-[13px] leading-snug font-medium tracking-normal text-ink-3">
            magnitudo
          </span>
        </p>
        <div>
          <p className="text-[17px] leading-snug font-semibold">{g.wilayah}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1 text-sm">
            <dt className="text-ink-3">Waktu</dt>
            <dd className="font-mono text-[13.5px]">
              {g.tanggal}, {g.jam}
            </dd>
            <dt className="text-ink-3">Kedalaman</dt>
            <dd className="font-mono text-[13.5px]">{g.kedalamanKm} km</dd>
            <dt className="text-ink-3">Koordinat</dt>
            <dd className="font-mono text-[13.5px]">{koordinat(g.lat, g.lon)}</dd>
          </dl>
        </div>
      </div>
      <p className="flex items-center gap-2.5 border-t border-line px-4 py-3 text-sm">
        <span className={`size-2.5 flex-none ${tsunami.warna}`} aria-hidden="true" />
        {tsunami.teks}
      </p>
      {g.dirasakan && (
        <p className="border-t border-line px-4 py-3 text-sm text-ink-2">
          Dirasakan (skala MMI): <span className="font-mono text-[13px]">{g.dirasakan}</span>
        </p>
      )}
    </Bingkai>
  );
}
