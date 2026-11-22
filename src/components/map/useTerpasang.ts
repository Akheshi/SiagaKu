"use client";

import { useEffect, useState } from "react";

/**
 * true hanya saat komponen sedang tampil.
 *
 * Next.js 16 dengan `cacheComponents` menyembunyikan halaman sebelumnya memakai
 * React <Activity> (efek dibersihkan, DOM disimpan). Saat halaman tampil lagi,
 * react-leaflet mencoba membuat peta baru di kontainer yang sama → Leaflet melempar
 * "Map container is being reused by another instance". Dengan menunda render peta
 * sampai efek berjalan, peta selalu dibuat ulang di elemen DOM yang baru.
 */
export function useTerpasang(): boolean {
  const [terpasang, setTerpasang] = useState(false);
  useEffect(() => {
    // sengaja: sinkron dengan siklus tampil/sembunyi <Activity>
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerpasang(true);
    return () => setTerpasang(false);
  }, []);
  return terpasang;
}
