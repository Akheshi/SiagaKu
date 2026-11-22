"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLon } from "@/lib/geo";
import { useTerpasang } from "./useTerpasang";
import type { TitikAman } from "@/lib/safePoints";


const ikonRumah = L.divIcon({ className: "", html: '<div class="mk-home"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
const ikonAman = (n: number) =>
  L.divIcon({ className: "", html: `<div class="mk-safe">${n}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });

function Bingkai({ titik }: { titik: LatLon[] }) {
  const map = useMap();
  const kunci = titik.map((p) => `${p.lat},${p.lon}`).join(";");
  useEffect(() => {
    // Bingkai ulang setiap ukuran kontainer berubah dan sudah > 0 (saat pertama dibuat
    // kontainer bisa masih 0 px → fitBounds menghasilkan zoom maksimal).
    const el = map.getContainer();
    const bingkai = () => {
      if (el.clientWidth === 0 || el.clientHeight === 0) return;
      map.invalidateSize();
      if (titik.length > 1) map.fitBounds(L.latLngBounds(titik.map((p) => [p.lat, p.lon])), { padding: [36, 36], animate: false });
      else map.setView([titik[0].lat, titik[0].lon], 15, { animate: false });
    };
    const ro = new ResizeObserver(bingkai);
    ro.observe(el);
    const t = setTimeout(bingkai, 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
    // hanya saat daftar titik berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, kunci]);
  return null;
}

export default function ResultMap({ rumah, titik, tujuanId }: { rumah: LatLon; titik: TitikAman[]; tujuanId: string | null }) {
  const terpasang = useTerpasang();
  if (!terpasang) return <div className="size-full bg-ground" aria-hidden="true" />;
  const tujuan = titik.find((t) => t.id === tujuanId) ?? titik[0];
  return (
    <MapContainer center={[rumah.lat, rumah.lon]} zoom={14} scrollWheelZoom={false} className="size-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Marker position={[rumah.lat, rumah.lon]} icon={ikonRumah} title="Rumah">
        <Tooltip>Rumah</Tooltip>
      </Marker>
      {titik.map((t, i) => (
        <Marker key={t.id} position={[t.lat, t.lon]} icon={ikonAman(i + 1)} title={t.nama}>
          <Tooltip>
            {i + 1}. {t.nama}
          </Tooltip>
        </Marker>
      ))}
      {tujuan && (
        <Polyline
          positions={[
            [rumah.lat, rumah.lon],
            [tujuan.lat, tujuan.lon],
          ]}
          pathOptions={{ color: "#00703C", weight: 5, dashArray: "10 8" }}
        />
      )}

      <Bingkai titik={[rumah, ...titik]} />
    </MapContainer>
  );
}
