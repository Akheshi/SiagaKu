import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Metodologi & Sumber Data — SiagaKu",
    description: "Cara SiagaKu menghitung skor risiko, memilih kandidat lokasi, dan menggunakan data.",
};

export default function Tentang() {
    return (
        <article className="mx-auto max-w-[1200px] px-4 py-8 sm:py-14">
            <h1 className="max-w-[14ch] text-[40px]">Metodologi &amp; Sumber Data</h1>
            <p className="mt-5 max-w-[52ch] text-[19px] text-ink-2">
                Halaman ini menjelaskan cara SiagaKu menghitung skor risiko, memilih kandidat lokasi,
                dari mana datanya, dan apa batasannya.
            </p>

            {/* 1. Rumus skor risiko */}
            <h2 className="mt-14 text-[28px]">Rumus skor risiko</h2>
            <p className="mt-2 max-w-[62ch] text-ink-2">
                Enam faktor menyumbang hingga 100 poin. Angka ini membantu menyiapkan rencana keluarga
                dan bisa berubah ketika data sumber diperbarui.
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
                            5 hingga &lt; 10 m: 25
                            <br/>
                            10 hingga &lt; 20 m: 18
                            <br/>
                            20 hingga &lt; 30 m: 10
                            <br/>
                            ≥ 30 m: 3
                            <br/>
                            Tidak terbaca: asumsi 25 poin
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
                            0,5 hingga &lt; 1 km: 20
                            <br/>
                            1 hingga &lt; 3 km: 13
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
                Jarak diukur dari garis pantai yang dipetakan OpenStreetMap. Jika pencarian tidak menemukan
                garis pantai dalam 10 km, sistem memilih rentang lebih dari 5 km tanpa menampilkan angka jarak.
                Jika layanan gagal, pilih perkiraan sendiri. Batas 5 km hanya dipakai SiagaKu untuk skor dan
                memilih arahan awal, sehingga peringatan resmi untuk lokasimu tetap perlu diikuti.
            </p>
            <p className="mt-2 max-w-[62ch] text-ink-2">
                Jika daftar 15 gempa belum lengkap, faktor aktivitas gempa ditunda dan skor ditandai sementara.
                Data ketinggian yang belum tersedia ditandai terpisah, dengan asumsi 25 poin.
            </p>

            <h2 className="mt-14 text-[28px]">Cara memilih kandidat lokasi</h2>
            <p  className="mt-2 max-w-[62ch] text-ink-2">
                SiagaKu menampilkan hingga tiga lokasi dari OpenStreetMap berdasarkan ketinggian dan jarak.
                Cek status lokasi evakuasi, akses, dan jalurnya ke BPBD saat menyusun rencana keluarga.
            </p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
                <li>
                    <strong>Tingkat 1.</strong> Radius 5 km. Ambangnya adalah nilai terendah di antara
                    30 m dan ketinggian rumah ditambah 15 m. Kandidat juga harus lebih tinggi dari rumah
                    jika elevasi rumah diketahui. Jika tidak, ambangnya 30 m.
                </li>
                <li>
                    <strong>Tingkat 2: cadangan pemetaan.</strong> Kalau tingkat 1 kurang
                    dari 3, ditambah tempat yang ketinggiannya di bawah ambang tingkat 1 tapi
                    ≥ ketinggian rumah + 5 m dan lebih jauh dari pantai daripada rumah, dalam radius
                    3 km. Syarat ini harus didukung data jarak pantai rumah dan kandidat.
                </li>
            </ol>
            <p className="mt-3 max-w-[62ch] text-ink-2">
                Data untuk tingkat 2 tersedia pada wilayah data bawaan Bengkulu. Jarak diurutkan dari garis
                lurus. Waktu jalan kaki memakai taksiran dari jarak itu dan bisa jauh berbeda dari rute sebenarnya.
            </p>

            {/* 3. Temuan */}
            <h2 className="mt-14 text-[28px]">Temuan</h2>
            <p className="mt-3 max-w-[62ch] text-ink-2">
                Kota Bengkulu sebagian besar dataran rendah, jadi tempat tinggi ≥ 30 m sering tidak
                tersedia dalam 5 km dari titik contoh. Untuk Provinsi Bengkulu, tim menyimpan data
                3.148 calon lokasi (sekolah, masjid,
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
                    <a className="underline" href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noreferrer">
                    Elevation API
                    </a>{" "}
                    (Copernicus DEM GLO-90, resolusi 90 m). Lisensi data: CC BY 4.0.
                </li>
                <li>
                    <strong>Overpass (OpenStreetMap)</strong>:{" "}
                    <a className="underline" href="https://overpass-api.de/" target="_blank" rel="noreferrer">
                    overpass-api.de
                    </a>{" "}
                    (calon lokasi dan garis pantai: sekolah, masjid, kantor pemerintah, shelter).
                    Data © kontributor OpenStreetMap, lisensi ODbL.
                </li>
                <li>
                    <strong>DeepSeek</strong>:{" "}
                    <a className="underline" href="https://platform.deepseek.com/" target="_blank" rel="noreferrer">
                    platform.deepseek.com
                    </a>{" "}
                    (memilih dua fokus persiapan paling mendesak dari daftar yang disusun aplikasi; teks dan arahan tetap dari aplikasi).
                </li>
                <li>
                    <strong>Tile peta</strong>: OpenStreetMap via Leaflet. © OpenStreetMap contributors,
                    lisensi ODbL.
                </li>
                <li>
                    <strong>Data kandidat lokasi Bengkulu</strong>: 3.148 tempat beserta ketinggian, tersimpan
                    di repo (<code className="font-mono">src/data/titik-bengkulu.json</code>), diambil
                    dari OpenStreetMap via Overpass dan Open-Meteo.
                </li>
            </ul>

            {/* 5. Batasan */}
            <h2 className="mt-14 text-[28px]">Batasan</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                    <strong>Skor indikatif.</strong> Bobot disusun tim sebagai alat bantu persiapan dan belum
                    divalidasi di lapangan. Untuk kajian bahaya wilayah, lihat{" "}
                    <a className="underline" href="https://inarisk.bnpb.go.id/">InaRISK</a> atau hubungi BPBD.
                </li>
                <li>
                    Lima belas kejadian M5+ terakhir menggambarkan aktivitas terkini dengan rentang waktu yang bisa
                    berubah. Ketinggian berasal dari model tanah dan kelengkapan kandidat lokasi bergantung pada OpenStreetMap.
                </li>
                <li>
                    Kontak pada lembar cetak mengacu pada{" "}
                    <a className="underline" href="https://layanan112.komdigi.go.id/tentang">112 (wilayah yang sudah melayani)</a>,{" "}
                    <a className="underline" href="https://www.kemkes.go.id/id/akses-darurat-medis-119-kini-bisa-melalui-satusehat-mobile">119 (darurat medis)</a>, dan{" "}
                    <a className="underline" href="https://polri.go.id/kontak/call-center-110">110 (Polri)</a>.
                </li>
                <li>
                    Arahan darurat mengacu pada{" "}
                    <a className="underline" href="https://www.bmkg.go.id/gempabumi/mitigasi/edukasi-gempabumi-tsunami">
                        panduan gempa bumi dan tsunami BMKG
                    </a>. Saat bencana terjadi, ikuti arahan resmi BPBD dan otoritas setempat.
                </li>
            </ul>

            {/* 6. Penggunaan AI */}
            <h2 className="mt-14 text-[28px]">Penggunaan AI</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>
                    DeepSeek memilih dua fokus persiapan dari daftar yang sudah disusun SiagaKu.
                </li>
                <li>
                    Aplikasi menghitung skor dan menetapkan arahan darurat. Server hanya menerima nomor
                    pilihan yang cocok dengan daftar persiapan yang disediakan aplikasi.
                </li>
                <li>
                    Jika DeepSeek gagal, aplikasi memilih urutan bawaan dari porsi poin tiap faktor.
                </li>
            </ul>
            <h2 id="privasi" className="mt-14 scroll-mt-4 text-[28px]">Cara isian dipakai</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>Isian dan hasil tersimpan di penyimpanan browser. Saat menghitung, formulir dikirim ke server SiagaKu. Aplikasi tidak memiliki akun atau basis data rencana.</li>
                <li>Koordinat dipakai untuk mengambil data peta dan elevasi. DeepSeek menerima ringkasan kondisi keluarga dan opsi persiapan. Nama keluarga, koordinat persis, dan teks obat rutin tidak ikut dikirim ke DeepSeek.</li>
                <li>WhatsApp membagikan arahan umum dan tautan situs. Lembar PDF yang kamu simpan sendiri bisa memuat lokasi rumah dan catatan keluarga.</li>
            </ul>
        </article>
    );
}
