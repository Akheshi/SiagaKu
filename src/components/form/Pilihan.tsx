"use client";

import type { ReactNode } from "react";

/** Kotak pilihan (radio / checkbox asli tetap dipakai agar aksesibel) — DESAIN-UI.md §3. */
const kotak =
  "flex min-h-14 cursor-pointer flex-col justify-center border-2 border-line bg-white px-3.5 py-2.5 leading-tight font-medium " +
  "peer-checked:border-sign peer-checked:bg-sign-tint peer-checked:shadow-[inset_6px_0_0_var(--color-sign)] " +
  "peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

export type Opsi<T extends string> = { nilai: T; label: string; ket?: string };

export function GrupPilihan<T extends string>({
  nama,
  judul,
  bantuan,
  opsi,
  nilai,
  onUbah,
  galat,
  kolom = "grid-cols-[repeat(auto-fit,minmax(150px,1fr))]",
  catatan,
}: {
  nama: string;
  judul: string;
  bantuan?: string;
  opsi: Opsi<T>[];
  nilai: T | undefined;
  onUbah: (v: T) => void;
  galat?: string;
  kolom?: string;
  catatan?: ReactNode;
}) {
  const idGalat = `${nama}-galat`;
  return (
    <fieldset className="border-t border-line py-6 first-of-type:border-t-0" aria-describedby={galat ? idGalat : undefined}>
      <legend className="mb-1 font-sign text-2xl font-bold">{judul}</legend>
      {bantuan && <p className="mb-3 text-sm text-ink-3">{bantuan}</p>}
      {catatan}
      <div className={`grid gap-2 ${kolom}`}>
        {opsi.map((o) => {
          const id = `${nama}-${o.nilai}`;
          return (
            <div key={o.nilai} className="relative">
              <input
                type="radio"
                id={id}
                name={nama}
                value={o.nilai}
                checked={nilai === o.nilai}
                onChange={() => onUbah(o.nilai)}
                className="peer absolute inset-0 cursor-pointer opacity-0"
              />
              <label htmlFor={id} className={kotak}>
                {o.label}
                {o.ket && <small className="text-[13px] font-normal text-ink-3">{o.ket}</small>}
              </label>
            </div>
          );
        })}
      </div>
      {galat && (
        <p id={idGalat} className="mt-2 text-sm font-medium text-risk">
          {galat}
        </p>
      )}
    </fieldset>
  );
}

export function KotakCentang({
  id,
  label,
  ket,
  checked,
  onUbah,
}: {
  id: string;
  label: string;
  ket?: string;
  checked: boolean;
  onUbah: (v: boolean) => void;
}) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onUbah(e.target.checked)}
        className="peer absolute inset-0 cursor-pointer opacity-0"
      />
      <label htmlFor={id} className={kotak}>
        {label}
        {ket && <small className="text-[13px] font-normal text-ink-3">{ket}</small>}
      </label>
    </div>
  );
}

export function Stepper({
  label,
  nilai,
  min,
  max,
  onUbah,
}: {
  label: string;
  nilai: number;
  min: number;
  max: number;
  onUbah: (v: number) => void;
}) {
  const tombol = "size-[52px] font-mono text-[22px] font-semibold hover:bg-ink hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink";
  return (
    <div>
      <p className="mb-2 font-semibold" id={`${label}-label`}>
        {label}
      </p>
      <div className="inline-flex border-2 border-ink bg-white" role="group" aria-labelledby={`${label}-label`}>
        <button
          type="button"
          className={tombol}
          onClick={() => onUbah(Math.max(min, nilai - 1))}
          disabled={nilai <= min}
          aria-label={`Kurangi ${label.toLowerCase()}`}
        >
          −
        </button>
        <output className="grid min-w-16 place-items-center border-x-2 border-ink font-mono text-[22px] font-semibold" aria-live="polite">
          {nilai}
        </output>
        <button
          type="button"
          className={tombol}
          onClick={() => onUbah(Math.min(max, nilai + 1))}
          disabled={nilai >= max}
          aria-label={`Tambah ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
