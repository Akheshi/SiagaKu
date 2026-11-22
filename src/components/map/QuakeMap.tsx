"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { Gempa } from "@/lib/bmkg";

/** Peta kecil: gempa terbaru (merah, besar) + 15 gempa M5+ terakhir (lingkaran sesuai magnitudo). */
export default function QuakeMap({ terbaru, terkini }: { terbaru: Gempa | null; terkini: Gempa[] }) {
  const pusat: [number, number] = terbaru ? [terbaru.lat, terbaru.lon] : [-2.5, 118];
  return (
    <MapContainer
      center={pusat}
      zoom={4}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      className="size-full"
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={10} />
      {terkini.map((g) => (
        <CircleMarker
          key={`${g.waktu}-${g.lat}`}
          center={[g.lat, g.lon]}
          radius={Math.max(3, (g.magnitudo - 4) * 3)}
          pathOptions={{ color: "#000", weight: 1, fillColor: "#C8102E", fillOpacity: 0.35 }}
        >
          <Tooltip>
            M{g.magnitudo.toLocaleString("id-ID")} · {g.tanggal}
          </Tooltip>
        </CircleMarker>
      ))}
      {terbaru && (
        <CircleMarker
          center={[terbaru.lat, terbaru.lon]}
          radius={8}
          pathOptions={{ color: "#fff", weight: 3, fillColor: "#C8102E", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
