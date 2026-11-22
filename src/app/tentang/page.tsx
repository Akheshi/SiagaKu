export default function Tentang() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-3xl font-bold">Metodologi &amp; Sumber Data</h1>
            <p className="mt-2">
                Halaman ini menjelaskan cara SiagaKu menghitung skor risiko,
                dari mana datanya, dan apa batasannya.
            </p>
      
            {/* 1. Rumus skor, tabel 6 faktor + kategori */}
            <h2 className="mt-8 text-2xl font-bold">Rumus skor risiko</h2>
      
            <p className="mt-2">
                Skor 0–100 dihitung dari enam faktor. Total maksimum 100 poin.
                Angka yang sama untuk input yang sama, rumusnya terbuka di bawah ini.
            </p>

            <table className="mt-4 w-full border-2 border-black text-left">
                <thead>
                    <tr className="bg-[#00703C] text-white">
                        <th className="border border-black px-3 py-2">Faktor</th>
                        <th className="border border-black px-3 py-2">Sumber</th>
                        <th className="border border-black px-3 py-2">Poin maks</th>
                        <th className="border border-black px-3 py-2">Aturan</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border px-3 py-2">Ketinggian rumah</td>
                        <td className="border px-3 py-2">Open-Meteo</td>
                        <td className="border px-3 py-2 font-mono">30</td>
                        <td className="border px-3 py-2">&lt; 5 m: 30 | 5–10 m: 25 | 10–20 m: 18 | 20–30 m: 10 | ≥ 30 m: 3</td>
                    </tr>
                    <tr>
                        <td className="border px-3 py-2">Jarak ke pantai</td>
                        <td className="border px-3 py-2">Input pengguna</td>
                        <td className="border px-3 py-2 font-mono">25</td>
                        <td className="border px-3 py-2">&lt; 0,5 km: 25 | 0,5–1 km: 20 | 1–3 km: 13 | 3–5 km: 6 | &gt; 5 km: 0</td>
                    </tr>
                    <tr>
                        <td className="border px-3 py-2">Aktivitas gempa</td>
                        <td className="border px-3 py-2">BMKG (15 gempa M5+ terakhir)</td>
                        <td className="border px-3 py-2 font-mono">15</td>
                        <td className="border px-3 py-2">Gempa M5+ dalam radius 300 km: 0 → 0 | 1 → 5 | 2–3 → 10 | ≥ 4 → 15</td>
                    </tr>
                    <tr>
                        <td className="border px-3 py-2">Bangunan</td>
                        <td className="border px-3 py-2">Input pengguna</td>
                        <td className="border px-3 py-2 font-mono">15</td>
                        <td className="border px-3 py-2">Beton bertulang: 3 | Bata tanpa tulangan: 10 | Semi permanen/kayu: 8 | &gt; 2 lantai tanpa tulangan: +5 (maks 15)</td>
                    </tr>
                    <tr>
                        <td className="border px-3 py-2">Kerentanan keluarga</td>
                        <td className="border px-3 py-2">Input pengguna</td>
                        <td className="border px-3 py-2 font-mono">10</td>
                        <td className="border px-3 py-2">+3 per kategori: lansia, balita, ibu hamil, disabilitas (maks 10)</td>
                    </tr>
                    <tr>
                        <td className="border px-3 py-2">Banjir (sungai)</td>
                        <td className="border px-3 py-2">Input pengguna</td>
                        <td className="border px-3 py-2 font-mono">5</td>
                        <td className="border px-3 py-2">Jarak sungai &lt; 100 m: 5 | 100–500 m: 3 | &gt; 500 m: 0</td>
                    </tr>
                </tbody>
            </table>
    
            <p className="mt-3 font-mono">
            Kategori: 0–39 Rendah | 40–59 Sedang | 60–79 Tinggi | 80–100 Sangat tinggi
            </p>

            {/* 2. Sumber data, (BMKG, Open-Meteo, Overpass/OSM, DeepSeek) */}
            <h2 className="mt-8 text-2xl font-bold">Sumber data</h2>

            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                    <strong>BMKG</strong>: {" "}
                    <a className="underline" href="https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json" target="_blank" rel="noreferrer">
                    autogempa.json
                    </a>{" "}
                    (gempa terbaru) dan{" "}
                    <a className="underline" href="https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json" target="_blank" rel="noreferrer">
                    gempaterkini.json
                    </a>{" "}
                    (15 gempa M5+ terakhir). Sumber: BMKG.
                </li>
                <li>
                    <strong>Open-Meteo</strong>: {" "}
                    <a className="underline" href="https://api.open-meteo.com/v1/elevation" target="_blank" rel="noreferrer">
                    api.open-meteo.com/v1/elevation
                    </a>{" "}
                    (ketinggian lokasi, meter di atas permukaan laut).
                </li>
                <li>
                    <strong>Overpass (OpenStreetMap)</strong>: {" "}
                    <a className="underline" href="https://overpass-api.de/api/interpreter" target="_blank" rel="noreferrer">
                    overpass-api.de/api/interpreter
                    </a>{" "}
                    (calon titik aman: sekolah, masjid, kantor pemerintah, shelter).
                </li>
                <li>
                    <strong>DeepSeek</strong>: {" "}
                    <a className="underline" href="https://api.deepseek.com/chat/completions" target="_blank" rel="noreferrer">
                    api.deepseek.com/chat/completions
                    </a>{" "}
                    (AI yang menjelaskan skor dan menyusun rencana evakuasi).
                </li>
                <li>
                    <strong>Tile peta</strong>: OpenStreetMap via Leaflet. © OpenStreetMap contributors.
                </li>
            </ul>

            {/* 3. Batasan, skor heuristik, bukan kajian resmi */}
            <h2 className="mt-8 text-2xl font-bold">Batasan</h2>

            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                    Skor ini adalah <strong>heuristik indikatif</strong> berbasis faktor yang
                    dipakai BNPB/InaRISK, <strong>bukan pengganti kajian resmi</strong>{" "}
                    kerentanan bencana.
                </li>
                <li>
                    Data gempa hanya 15 kejadian M5+ terakhir dari BMKG; ketinggian berasal
                    dari model elevasi Open-Meteo (bukan survei lapangan); kelengkapan titik
                    aman tergantung data OpenStreetMap.
                </li>
                <li>
                    Rencana evakuasi di situs ini adalah panduan umum. Saat bencana terjadi,
                    ikuti arahan resmi BPBD dan otoritas setempat.
                </li>
            </ul>

            {/* 4. Pengungkapan AI, AI menjelaskan, bukan mengarang */}
            <h2 className="mt-8 text-2xl font-bold">Penggunaan AI</h2>

            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                    AI (DeepSeek) hanya <strong>menjelaskan skor</strong> dan{" "}
                    <strong>menyusun rencana</strong> dalam bahasa manusia, berdasarkan data
                    di atas.
                </li>
                <li>
                    Skor <strong>tidak</strong> dihitung AI, skor dihitung dengan rumus
                    deterministik di atas. AI juga <strong>tidak boleh</strong> menyebut
                    tempat atau angka yang tidak ada di data.
                </li>
                <li>
                    Jika AI gagal atau timeout, rencana tetap tampil dari template, halaman
                    tidak pernah kosong.
                </li>
            </ul>

        </main>
    );
}