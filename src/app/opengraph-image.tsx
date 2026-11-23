import { ImageResponse } from "next/og";

export const alt = "SiagaKu — rencana siaga gempa dan tsunami untuk keluargamu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Gambar pratinjau tautan (WhatsApp, media sosial) dengan gaya papan rambu evakuasi. */
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#00703C", padding: 40 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "6px solid #fff",
            padding: "56px 64px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ width: 88, height: 88, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="56" height="56" viewBox="0 0 20 20">
                <path d="M3 10h11M9 4l6 6-6 6" stroke="#00703C" strokeWidth="3.4" fill="none" strokeLinecap="square" />
              </svg>
            </div>
            <div style={{ fontSize: 64, fontWeight: 700 }}>SiagaKu</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: -1 }}>
              Siapkan rencana keluarga sebelum gempa
            </div>
            <div style={{ fontSize: 30, opacity: 0.92 }}>
              Skor risiko rumah, kandidat lokasi evakuasi, dan lembar rencana keluarga yang bisa dicetak.
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
