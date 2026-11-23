# SiagaKu

**Rencana siaga gempa dan tsunami untuk keluarga.**

Tandai rumahmu di peta dan isi kondisi keluarga untuk melihat rincian skor risiko, kandidat lokasi sekitar, rencana evakuasi keluarga, dan isi tas siaga.

- **Website:** https://siagaku.vercel.app
- **Coba langsung tanpa isi formulir:** https://siagaku.vercel.app/hasil?contoh=bengkulu
- **Lomba:** IT RUSH 2026 — Web Development (HIMATIF UNIB), subtema **Mitigasi Bencana dan Perubahan Iklim**

![Halaman hasil SiagaKu](docs/hasil-desktop.png)

---

## Masalah

Peta risiko dan kabar gempa membantu warga Bengkulu memahami ancaman di wilayahnya. Di rumah, masih ada keputusan yang perlu dibahas bersama. Siapa yang bisa membantu balita atau lansia? Di mana keluarga bertemu jika terpisah? SiagaKu menyiapkan lembar yang bisa diisi, dicetak, dan dibahas.

## Fitur

| | |
|---|---|
| **Info gempa terkini BMKG** | Gempa terbaru dan daftar 15 kejadian M5+ terakhir, dengan waktu kejadian dan sumber |
| **Pilih lokasi rumah** | GPS atau geser pin di peta; ketinggian (Open-Meteo) dan **jarak ke pantai dihitung otomatis** dari garis pantai OpenStreetMap |
| **Skor risiko 0–100 yang transparan** | Rumus terbuka dari 6 faktor, setiap poin ditampilkan beserta alasannya |
| **Kandidat lokasi dari peta** | Tempat umum dari OpenStreetMap yang disaring berdasarkan ketinggian dan jarak. Status evakuasi serta akses perlu dikonfirmasi ke BPBD |
| **Papan rambu evakuasi** | Arahan sesuai kondisi pesisir atau nonpesisir, berdasarkan panduan BMKG |
| **Rencana keluarga** | Aplikasi menyusun langkah, tugas, dan tas siaga. DeepSeek memilih dua fokus persiapan dari daftar yang ditulis aplikasi |
| **Checklist tas siaga** | Isi dasar + kebutuhan khusus (lansia, balita, ibu hamil, disabilitas, obat rutin), tersimpan di perangkat |
| **Cetak dan bagikan** | Simpan lembar lengkap sebagai PDF atau bagikan arahan umum dan tautan SiagaKu lewat WhatsApp |
| **Tanpa akun** | Isian dikirim ke server saat dihitung. Draf, hasil, dan centang disimpan di browser |

## Cara kerja

```
Lokasi rumah ──► Open-Meteo (ketinggian)
             ──► garis pantai OSM (jarak pantai, dihitung di server)
             ──► BMKG (gempa M5+ dalam 300 km)
Data keluarga ─┐
               ▼
        Skor risiko (rumus deterministik, lib/score.ts)
               │
        Kandidat lokasi (OSM + ketinggian, lib/safePoints.ts)
               │
               ▼
        Rencana dari aplikasi (lib/rencana.ts)
               │
        DeepSeek memilih 2 fokus ───────────► indeks divalidasi (zod)
               │                                   │ gagal / tidak valid
               ▼                                   ▼
        Halaman hasil  ◄──────────────────  fokus bawaan dari skor
```

### Prinsip AI di dalam produk

1. Skor dan arahan darurat disusun aplikasi. Panduan darurat mengacu pada [edukasi BMKG](https://www.bmkg.go.id/gempabumi/mitigasi/edukasi-gempabumi-tsunami).
2. DeepSeek menerima opsi persiapan yang dibuat aplikasi. Server hanya menerima dua indeks yang sesuai dengan daftar. Nama keluarga, koordinat rumah, dan tulisan obat rutin tidak dikirim ke DeepSeek.
3. Jika AI gagal atau melampaui batas 8 detik, rencana tampil dengan urutan persiapan bawaan.

Dalam satu uji contoh Kota Bengkulu, urutan bawaan memilih jarak ke pantai dan bangunan. DeepSeek memilih jarak ke pantai dan kerentanan keluarga. Untuk keluarga dengan lansia dan balita, kesepakatan siapa yang mendampingi bisa dibuat minggu ini, sedangkan perkuatan bangunan butuh biaya dan waktu. Jika pilihan DeepSeek berbeda, halaman hasil menampilkan urutan dari skor saja sebagai pembanding.

### Cara isian dipakai

Formulir diproses oleh server saat pengguna meminta rencana. Koordinat dipakai untuk mengambil data peta atau elevasi. DeepSeek menerima jumlah penghuni, kategori anggota yang perlu bantuan, status obat rutin, kendaraan, dan opsi tindakan. WhatsApp menerima arahan umum dan tautan situs. Pengguna dapat menyimpan PDF secara terpisah. Tautan berbasis isian dari versi lama sudah dinonaktifkan.

## Metodologi skor (ringkas)

| Faktor | Sumber | Maks | Aturan |
|---|---|---|---|
| Ketinggian rumah | Open-Meteo | 30 | < 5 m: 30 · 5 hingga < 10: 25 · 10 hingga < 20: 18 · 20 hingga < 30: 10 · ≥ 30: 3 · data tidak tersedia: 25 |
| Jarak ke pantai | garis pantai OSM (bisa diubah pengguna) | 25 | < 0,5 km: 25 · 0,5 hingga < 1: 20 · 1 hingga < 3: 13 · 3–5: 6 · > 5: 0 |
| Aktivitas gempa | BMKG, 15 gempa M5+ terakhir | 15 | dalam 300 km: 0 → 0 · 1 → 5 · 2–3 → 10 · ≥ 4 → 15 · daftar tidak lengkap: skor sementara |
| Bangunan | pengguna | 15 | beton bertulang 3 · bata tanpa tulangan 10 · kayu 8 · > 2 lantai tanpa tulangan +5 |
| Kerentanan keluarga | pengguna | 10 | +3 per kategori (lansia, balita, ibu hamil, disabilitas), +1 tanpa kendaraan |
| Banjir sungai | pengguna | 5 | < 100 m: 5 · 100–500 m: 3 · lebih jauh: 0 |

Kategori: 0–39 Rendah · 40–59 Sedang · 60–79 Tinggi · 80–100 Sangat tinggi. Detail di halaman [/tentang](https://siagaku.vercel.app/tentang).

**Kandidat lokasi dua tingkat.** Data contoh dari Kota Bengkulu menunjukkan sedikit tempat umum di ketinggian ≥ 30 m dalam radius 5 km. Peta menampilkan kandidat untuk diperiksa saat menyusun rencana keluarga.
1. **Tingkat 1.** Radius 5 km, ambang terendah di antara 30 m dan elevasi rumah ditambah 15 m. Jika elevasi rumah diketahui, kandidat juga harus lebih tinggi dari rumah. Jika tidak, ambangnya 30 m.
2. **Cadangan pemetaan.** Digunakan pada data bawaan Bengkulu jika tingkat pertama kurang dari tiga kandidat. Radius 3 km, minimal 5 m lebih tinggi dari rumah dan lebih jauh dari garis pantai berdasarkan kedua jarak yang terukur.

> Skor indikatif ini memakai bobot yang disusun tim untuk membantu persiapan. Untuk kajian bahaya wilayah dan tujuan evakuasi resmi, cek InaRISK dan BPBD.

## Tech stack

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| Tampilan | Tailwind CSS 4, font Barlow Condensed + IBM Plex Sans/Mono/Serif (Google Fonts via `next/font`) |
| Peta | Leaflet 1.9 + react-leaflet 5, tile OpenStreetMap |
| Validasi | zod 4 |
| AI dalam produk | DeepSeek `deepseek-chat` (API format OpenAI), dipanggil hanya dari server |
| Uji | Vitest untuk logika dan API, serta pengujian alur di browser |
| Hosting | Vercel |

## Menjalankan di komputer sendiri

Gunakan Node.js 22.12+ pada seri 22, atau seri 24 dan 26.

```bash
git clone https://github.com/Akheshi/SiagaKu.git
cd SiagaKu
npm install
cp .env.example .env.local   # isi DEEPSEEK_API_KEY (opsional — tanpa key, rencana memakai template)
npm run dev                   # http://localhost:3000
```

Perintah lain:

```bash
npm test          # unit test (skor, geo, garis pantai, titik aman, rencana, validasi)
npm run lint
npm run build
node scripts/fetch-coastline.mjs   # unduh ulang garis pantai Bengkulu
node scripts/fetch-places.mjs      # unduh ulang calon titik aman Bengkulu (+ ketinggian)
```

## Struktur folder

```
src/
  app/
    page.tsx              beranda + panel gempa BMKG
    cek/                  wizard: lokasi → rumah & keluarga
    hasil/                halaman hasil
    tentang/              metodologi & sumber data
    api/                  gempa, elevasi, pantai, titik-aman, rencana
  components/             header, footer, panel gempa, peta, kontrol form
  lib/
    score.ts              rumus skor (fungsi murni)
    geo.ts                jarak, arah mata angin, waktu jalan kaki
    coast.ts              jarak ke garis pantai
    safePoints.ts         seleksi titik aman dua tingkat
    rencana.ts            skema rencana, template cadangan, tas siaga
    arahan.ts             arahan saat dan setelah guncangan
    bagikan.ts            mode contoh/pribadi, teks WhatsApp
    hasil.ts              bentuk respons hasil, kunci penyimpanan
    bmkg.ts, input.ts     parser BMKG, skema input
    server/               pengambil data eksternal, AI, batas laju
    __tests__/            unit test
  data/                   garis pantai & calon titik aman Bengkulu (OSM)
scripts/                  pengunduh data
```

## Batasan & pengembangan lanjutan

- Ketinggian dari model elevasi global (resolusi ±90 m), bukan survei lapangan.
- Kandidat lokasi dan jarak pantai otomatis saat ini andal untuk Provinsi Bengkulu (data bawaan). Di wilayah lain, aplikasi mencoba Overpass, yang sering tidak merespons. Jika gagal, pengguna memilih jarak pantai sendiri dan rencana tampil tanpa kandidat.
- Kandidat yang lebih dari 30 menit berjalan kaki diberi peringatan, karena waktu sebanyak itu bisa tidak cukup saat peringatan tsunami.
- Rentang 15 gempa terakhir mengikuti data BMKG. Batas 5 km dari pantai adalah aturan aplikasi untuk skor dan arahan awal. Ikuti peringatan resmi yang berlaku di lokasimu.
- Akses dan kelayakan setiap kandidat harus dicek ke BPBD. Jarak garis lurus dan taksiran waktu hanya membantu persiapan awal.
- Lanjutan: data TES (tempat evakuasi sementara) resmi dari BPBD, rute jalan kaki nyata, mode luring (PWA), dan versi untuk sekolah.

## Pengungkapan penggunaan AI, library, aset, dan data

Bagian ini wajib menurut panduan lomba.

**AI coding assistant**
- **Claude Code (Anthropic)** — membantu menulis, menguji, dan merapikan kode, serta menyusun dokumen perencanaan, atas arahan dan keputusan tim. Commit yang dibantu ditandai `Co-Authored-By: Claude` di riwayat git.
- **OpenAI Codex** — membantu menulis dan meninjau kode, menguji regresi di browser, dan menyelaraskan dokumentasi. Commit yang dibantu Codex tidak memakai penanda khusus di riwayat git.

**AI di dalam produk**
- **DeepSeek** (`deepseek-chat`) — membaca kondisi keluarga dan memilih dua *fokus persiapan* paling mendesak ("Kerjakan lebih dulu") dari daftar faktor-tindakan yang disusun aplikasi. AI hanya mengembalikan nomor opsi; teks, skor, langkah darurat, dan peran selalu dari aplikasi, sehingga AI tidak bisa menambahkan angka, tempat, atau instruksi baru. Gagal/tidak valid/lebih dari 8 detik → fokus bawaan dari skor.

**Template**
- Proyek dibuat dari `create-next-app` (Next.js). Tidak memakai template UI siap pakai; tampilan dirancang sendiri dengan konsep "bahasa rambu evakuasi".

**Library open-source:** Next.js, React (MIT) · Tailwind CSS (MIT) · Leaflet (BSD-2-Clause) · react-leaflet (Hippocratic License 2.1) · zod (MIT) · Vitest (MIT) · TypeScript (Apache-2.0) · ESLint (MIT).

**Alat uji di luar kode aplikasi:** Playwright (Apache-2.0), Google Chrome, dan Lighthouse untuk pengujian alur dan audit halaman di peramban.

**Font:** Barlow Condensed, IBM Plex Sans, IBM Plex Mono, IBM Plex Serif — SIL Open Font License, via Google Fonts.

**Data:**
- **BMKG** — data gempa terbuka (data.bmkg.go.id). Sumber: BMKG.
- **OpenStreetMap** — peta, garis pantai, dan calon titik aman. © kontributor OpenStreetMap, lisensi ODbL.
- **Open-Meteo** — API ketinggian berbasis Copernicus DEM GLO-90, [lisensi data CC BY 4.0](https://open-meteo.com/en/license).

## Tim

**Tim Cihuyy** — IT RUSH 2026

| Nama | Peran |
|---|---|
| **Akbar Akheshi Ario Damar** — [@Akheshi](https://github.com/Akheshi) | Ketua & pengembang utama: arah produk, desain, pengembangan bersama Claude Code, deploy, pengujian |
| **Malika Afrian Nevilla** — [@Malkyyway](https://github.com/Malkyyway) | Halaman metodologi, konten, proposal & video, pengujian di perangkat |

## Lisensi

Kode: [MIT](LICENSE). Data OpenStreetMap di `src/data/` berlisensi [ODbL](https://www.openstreetmap.org/copyright).
