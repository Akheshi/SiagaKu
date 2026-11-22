import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Metodologi & Sumber Data — SiagaKu",
    description: "Cara SiagaKu menghitung skor risiko bencana, memilih titik aman, dan dari mana datanya berasal.",
};

export default function Tentang() {
    return (
        <article className="mx-auto max-w-[1200px] px-4 py-8 sm:py-14">
            <h1 className="max-w-[14ch] text-[40px]">Metodologi &amp; Sumber Data</h1>
            <p className="mt-5 max-w-[52ch] text-[19px] text-ink-2">
                Halaman ini menjelaskan cara SiagaKu menghitung skor risiko, memilih titik aman,
                dari mana datanya, dan apa batasannya.
            </p>

            {/* 1. Rumus skor risiko */}
            <h2 className="mt-14 text-[28px]">Rumus skor risiko</h2>
            <p className="mt-2 max-w-[62ch] text-ink-2">
                Skor 0–100 dihitung dari enam faktor. Total maksimum 100 poin. Angka yang sama
                untuk input yang sama, rumusnya terbuka di bawah ini.
            </p>

            <div className="mt-4 overflow-x-auto" role="region" aria-label="Tabel rumus skor (geser ke samping di layar kecil)" tabIndex={0}>
            <table className="w-full min-w-[560px] border-2 border-ink text-left">
                <thead>
                    <tr className="bg-sign text-white">
                        <th className="border border-line px-3 py-2">Faktor</th>
                        <th className="border border-line px-3 py-2">Sumber</th>
                        <th className="border border-line px-3 py-2">Poin maks</th>
                        <th className="border border-line px-3 py-2">Aturan</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-line px-3 py-2 align-top">Ketinggian rumah</td>
                        <td className="border border-line px-3 py-2 align-top">Open-Meteo</td>
                        <td className="border border-line px-3 py-2 font-mono align-top">30</td>
                        <td className="border border-line px-3 py-2">
                            &lt; 5 m: 30
                            <br/>
                            5–10 m: 25
                            <br/>
                            10–20 m: 18
                            <br/>
                            20–30 m: 10
                            <br/>
                            ≥ 30 m: 3
                            <br/>
                            Tidak terbaca: 25 (dianggap 5–10 m)
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-line px-3 py-2 align-top">Jarak ke pantai</td>
                        <td className="border border-line px-3 py-2 align-top">
                            Garis pantai OpenStreetMap (otomatis, bisa diubah)
                        </td>
                        <td className="border border-line px-3 py-2 font-mono align-top">25</td>
                        <td className="border border-line px-3 py-2">
                            &lt; 0,5 km: 25
                            <br/>
                            0,5–1 km: 20
                            <br/>
                            1–3 km: 13
                            <br/>
                            3–5 km: 6
                            <br/>
                            &gt; 5 km: 0
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-line px-3 py-2 align-top">Aktivitas gempa</td>
                        <td className="border border-line px-3 py-2 align-top">BMKG (15 gempa M5+ terakhir)</td>
                        <td className="border border-line px-3 py-2 font-mono align-top">15</td>
                        <td className="border border-line px-3 py-2">
                            Gempa M5+ dalam radius 300 km:
                            <br/>
                            0 → 0
                            <br/>
                            1 → 5
                            <br/>
                            2–3 → 10
                            <br/>
                            ≥ 4 → 15
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-line px-3 py-2 align-top">Bangunan</td>
                        <td className="border border-line px-3 py-2 align-top">Input pengguna</td>
                        <td className="border border-line px-3 py-2 font-mono align-top">15</td>
                        <td className="border border-line px-3 py-2">
                            Beton bertulang: 3
                            <br/>
                            Bata tanpa tulangan: 10
                            <br/>
                            Semi permanen/kayu: 8
                            <br/>
                            &gt; 2 lantai tanpa tulangan: +5 (maks 15)
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-line px-3 py-2 align-top">Kerentanan keluarga</td>
                        <td className="border border-line px-3 py-2 align-top">Input pengguna</td>
                        <td className="border border-line px-3 py-2 font-mono align-top">10</td>
                        <td className="border border-line px-3 py-2">
                            +3 per kategori: lansia, balita, ibu hamil, disabilitas
                            <br/>
                            +1 kalau tidak punya kendaraan (jalan kaki)
                            <br/>
                            (maks 10)
                        </td>
                    </tr>
                    <tr>
                        <td className="border border-line px-3 py-2 align-top">Banjir (sungai)</td>
                        <td className="border border-line px-3 py-2 align-top">Input pengguna</td>
                        <td className="border border-line px-3 py-2 font-mono align-top">5</td>
                        <td className="border border-line px-3 py-2">
                            Jarak sungai &lt; 100 m: 5
                            <br/>
                            100–500 m: 3
                            <br/>
                            &gt; 500 m: 0
                         </td>
                    </tr>
                </tbody>
            </table>
            </div>

            <p className="mt-3 font-mono">
            Kategori: 0–39 Rendah · 40–59 Sedang · 60–79 Tinggi · 80–100 Sangat tinggi
            </p>

            <p className="mt-3 max-w-[62ch] text-ink-2">
            Jarak ke pantai dihitung otomatis dari garis pantai OpenStreetMap, pengguna bisa
                mengubahnya kalau kurang tepat. Kalau deteksi gagal, pengguna memilih perkiraan sendiri.
            </p>
            <p className="mt-2 max-w-[62ch] text-ink-2">
                Kalau ketinggian rumah gagal terbaca, rumah dianggap 5–10 m (25 poin): lebih baik
                waspada daripada meremehkan.
            </p>

            {/* 2. Cara memilih titik aman */}
            <h2 className="mt-14 text-[28px]">Cara memilih titik aman</h2>
            <p  className="mt-2 max-w-[62ch] text-ink-2">
                SiagaKu tidak memilih titik aman secara acak. Dari semua calon tempat di peta, sistem
                memilih sampai 3 titik dengan dua tingkat:
            </p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
                <li>
                    <strong>Tingkat 1: tempat tinggi.</strong> Ketinggian ≥ 30 m, atau ≥ ketinggian
                    rumah + 15 m (mana yang lebih rendah), dalam radius 5 km dari rumah. Diurutkan
                    dari yang terdekat.
                </li>
                <li>
                    <strong>Tingkat 2: cadangan evakuasi vertikal.</strong> Kalau tingkat 1 kurang
                    dari 3, ditambah tempat yang ketinggiannya di bawah ambang tingkat 1 tapi
                    ≥ ketinggian rumah + 5 m dan lebih jauh dari pantai daripada rumah, dalam radius
                    3 km. Tempat seperti ini dipakai untuk naik ke lantai atas gedung bertingkat
                    saat tidak ada tempat tinggi yang dekat.
                </li>
            </ol>
            <p className="mt-3 max-w-[62ch] text-ink-2">
                Kalau ketinggian rumah tidak diketahui, hanya tingkat 1 yang dipakai.
            </p>

            {/* 3. Temuan */}
            <h2 className="mt-14 text-[28px]">Temuan</h2>
            <p className="mt-3 max-w-[62ch] text-ink-2">
                Kota Bengkulu sebagian besar dataran rendah, jadi tempat tinggi ≥ 30 m sering tidak
                tersedia dalam 5 km, tingkat cadangan inilah yang membuat rencana evakuasi tetap ada.
                Untuk Provinsi Bengkulu, tim menyimpan data 3.148 calon titik aman (sekolah, masjid,
                gereja, kantor pemerintah, rumah sakit, titik kumpul, dan lainnya) beserta
                ketinggiannya di repo (
                <code className="font-mono">src/data/titik-bengkulu.json</code>), diambil dari
                OpenStreetMap via Overpass dan ketinggiannya dari Open-Meteo.
            </p>

            {/* 4. Sumber data */}
            <h2 className="mt-14 text-[28px]">Sumber data</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                    <strong>BMKG</strong>:{" "}
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
                    <strong>Open-Meteo</strong>:{" "}
                    <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                    open-meteo.com
                    </a>{" "}
                    (ketinggian lokasi, meter di atas permukaan laut). Lisensi: CC BY 4.0.
                </li>
                <li>
                    <strong>Overpass (OpenStreetMap)</strong>:{" "}
                    <a className="underline" href="https://overpass-api.de/" target="_blank" rel="noreferrer">
                    overpass-api.de
                    </a>{" "}
                    (calon titik aman dan garis pantai: sekolah, masjid, kantor pemerintah, shelter).
                    Data © kontributor OpenStreetMap, lisensi ODbL.
                </li>
                <li>
                    <strong>DeepSeek</strong>:{" "}
                    <a className="underline" href="https://platform.deepseek.com/" target="_blank" rel="noreferrer">
                    platform.deepseek.com
                    </a>{" "}
                    (AI yang menjelaskan skor dan menyusun rencana evakuasi).
                </li>
                <li>
                    <strong>Tile peta</strong>: OpenStreetMap via Leaflet. © OpenStreetMap contributors,
                    lisensi ODbL.
                </li>
                <li>
                    <strong>Data titik aman Bengkulu</strong>: 3.148 tempat beserta ketinggian, tersimpan
                    di repo (<code className="font-mono">src/data/titik-bengkulu.json</code>), diambil
                    dari OpenStreetMap via Overpass dan Open-Meteo.
                </li>
            </ul>

            {/* 5. Batasan */}
            <h2 className="mt-14 text-[28px]">Batasan</h2>
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

            {/* 6. Penggunaan AI */}
            <h2 className="mt-14 text-[28px]">Penggunaan AI</h2>
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
        </article>
    );
}
