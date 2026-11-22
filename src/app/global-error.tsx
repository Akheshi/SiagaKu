"use client";

/** Galat di layout utama. Tidak memuat CSS global, jadi gaya ditulis langsung. */
export default function GalatGlobal() {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: "#F3F5F3", color: "#000", fontFamily: "system-ui, sans-serif" }}>
        <title>SiagaKu — gagal dimuat</title>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "48px 16px" }}>
          <h1 style={{ fontSize: 36, lineHeight: 1.1, margin: 0 }}>SiagaKu gagal dimuat</h1>
          <p style={{ color: "#3D4440", maxWidth: "60ch" }}>
            Biasanya karena koneksi terputus atau website baru diperbarui. Data rencanamu tetap tersimpan di perangkat
            ini.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              minHeight: 52,
              padding: "0 22px",
              border: "2px solid #00703C",
              background: "#00703C",
              color: "#fff",
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Muat ulang halaman
          </button>
        </div>
      </body>
    </html>
  );
}
