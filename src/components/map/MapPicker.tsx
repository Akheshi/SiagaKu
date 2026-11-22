"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLon } from "@/lib/geo";
import { useTerpasang } from "./useTerpasang";

const ikonRumah = L.divIcon({
  className: "",
  html: '<div class="mk-home"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function KlikPeta({ onPilih }: { onPilih: (t: LatLon) => void }) {
  useMapEvents({
    click(e) {
      onPilih({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

/**
 * Leaflet menghitung ukuran saat dibuat; jika CSS/layout belum siap, pusat peta meleset.
 * Hitung ulang ukuran setiap kontainer berubah ukuran, dan sekali setelah dipasang.
 */
export function PasUkuran({ pusat }: { pusat?: LatLon }) {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const pas = () => {
      map.invalidateSize();
      if (pusat) map.setView([pusat.lat, pusat.lon], map.getZoom(), { animate: false });
    };
    const t = setTimeout(pas, 0);
    let pertama = true;
    const ro = new ResizeObserver(() => {
      if (pertama) return void (pertama = false);
      map.invalidateSize();
    });
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
    // hanya saat dipasang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

/** Geser tampilan peta saat `pusatKey` berubah (mis. setelah GPS). */
function IkutiPusat({ titik, pusatKey }: { titik: LatLon; pusatKey: number }) {
  const map = useMap();
  useEffect(() => {
    if (pusatKey > 0) map.setView([titik.lat, titik.lon], Math.max(map.getZoom(), 16));
    // hanya bereaksi pada pusatKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pusatKey, map]);
  return null;
}

type Props = {
  titik: LatLon;
  onPilih: (t: LatLon) => void;
  /** naikkan angka ini untuk memaksa peta berpindah ke `titik` */
  pusatKey: number;
};

export default function MapPicker({ titik, onPilih, pusatKey }: Props) {
  const terpasang = useTerpasang();
  if (!terpasang) return <div className="size-full bg-ground" aria-hidden="true" />;
  return (
    <MapContainer
      center={[titik.lat, titik.lon]}
      zoom={15}
      scrollWheelZoom={false}
      className="size-full"
      aria-label="Peta pilih lokasi rumah. Klik peta atau geser penanda."
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Marker
        position={[titik.lat, titik.lon]}
        icon={ikonRumah}
        draggable
        keyboard
        title="Lokasi rumah"
        eventHandlers={{
          dragend(e) {
            const p = (e.target as L.Marker).getLatLng();
            onPilih({ lat: p.lat, lon: p.lng });
          },
        }}
      />
      <PasUkuran pusat={titik} />
      <KlikPeta onPilih={onPilih} />
      <IkutiPusat titik={titik} pusatKey={pusatKey} />
    </MapContainer>
  );
}
