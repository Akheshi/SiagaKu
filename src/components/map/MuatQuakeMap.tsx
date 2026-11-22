"use client";

import dynamic from "next/dynamic";
import type { Gempa } from "@/lib/bmkg";

const QuakeMap = dynamic(() => import("./QuakeMap"), {
  ssr: false,
  loading: () => <div className="size-full bg-ground" />,
});

export function MuatQuakeMap(props: { terbaru: Gempa | null; terkini: Gempa[] }) {
  return <QuakeMap {...props} />;
}
