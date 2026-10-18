# Daftar rilis awal: 100 hadis keseharian

Disiapkan pada 18 Oktober 2026 untuk pola satu bacaan hadis per hari, dengan
fokus adab dan rutinitas sehari-hari. [Daftar lengkap](DAFTAR.md) menyediakan
tema, judul, derajat dari penerbit, serta tautan sumber setiap hadis.

| Isi paket | Jumlah |
| --- | ---: |
| Rekaman dengan matan unik | 100 |
| Teks dan penjelasan Arab | 100 |
| Terjemahan dan penjelasan Inggris | 100 |
| Terjemahan dan penjelasan Indonesia | 100 |
| Terjemahan dan penjelasan Urdu | 100 |
| Terjemahan dan penjelasan Melayu | 21 |
| Derajat sahih menurut penerbit | 94 |
| Derajat hasan menurut penerbit | 6 |
| Rujukan silang Riyadus Salihin yang diperiksa | 26 |
| Kandidat ditunda dari daftar ini | 11 |

Kolom Melayu pada 79 rekaman tetap berupa string kosong. Struktur satu hadis
dengan lima kolom bahasa dipertahankan. Kebijakan tampilan yang sudah ada
menggunakan Inggris ketika terjemahan pilihan belum tersedia.

## Tema

| Tema | Hadis |
| --- | ---: |
| Akhlak dan menjaga lisan | 19 |
| Keluarga, tetangga dan kepedulian | 19 |
| Doa dan zikir | 15 |
| Sabar, ikhlas dan kebiasaan baik | 14 |
| Ibadah dalam rutinitas | 11 |
| Kebersihan dan adab diri | 7 |
| Al-Quran dalam rutinitas | 6 |
| Makan dan bersyukur | 5 |
| Kejujuran, pekerjaan dan muamalah | 4 |

Kandidat sahur dan berbuka disimpan sebagai bahan kelompok Ramadan berikutnya.
Tema dan judul ringkas pada manifest adalah sarana navigasi editorial; teks
hadis serta terjemahan sumber tetap dipertahankan.

## Pemeriksaan dan sumber

Seluruh teks berasal dari unduhan resmi HadeethEnc yang diarsipkan pada
16 Oktober 2026. Versi yang digunakan: Arab v1.8.0, Inggris v1.25.0,
Indonesia v1.22.0, Melayu v1.2.0, dan Urdu v1.36.0. Teks, penjelasan, tautan,
versi, checksum, dan pemberitahuan penerbit dibandingkan dengan arsip tersebut.

Rekaman terpilih diambil utuh dari snapshot pembacaan seluruh koleksi Firestore
pada 18 Oktober 2026. Matan Arab beserta terjemahan Inggris dan Indonesianya
dibaca dalam peninjauan editorial. Harakat tidak ditambahkan otomatis dan
terjemahan baru tidak dibuat. Pengantar perawi dan seluruh sanad belum
disahkan berharakat lengkap; peninjauan ini juga tidak menjamin setiap tanda
baca Arab bebas kesalahan.

Sebanyak 26 rekaman memiliki tambahan pencocokan matan dengan halaman publik
[Riyadh IslamEnc](https://riyadh.islamenc.com/ar/page/17). Untuk 74 rekaman
lainnya, pemeriksaan pada batch ini menggunakan sumber utama HadeethEnc.
Setiap rekaman menyimpan tingkat pemeriksaannya; pencocokan lintas penerbit
tidak diasumsikan untuk semua rekaman. Terjemahan Riyadh tidak digabungkan
ke dalam rekaman HadeethEnc.

Derajat sahih/hasan mengikuti penilaian yang dicantumkan penerbit. Tiga dari
enam penilaian hasan secara eksplisit diatribusikan sumber kepada an-Nawawi.
Tidak dilakukan penilaian keilmuan baru atau pemeriksaan oleh ahli hadis manusia.

Perbedaan kata lintas riwayat, salah ketik pada terjemahan utama, dan harakat
yang memerlukan rujukan kedua dicatat sebagai alasan penundaan. Rekaman
ditunda tetap berada pada koleksi produksi dengan keadaan sebelumnya.
Entri 5497 sejak sumbernya merupakan petikan khotbah; label petikan dan
pengantarnya tetap ada. Entri 4704 tetap membedakan sabda Nabi dan perkataan
Ibnu Umar sesudahnya.

[Ketentuan penerbit HadeethEnc](https://hadeethenc.com/en/home) mengizinkan
pengunduhan dan penerbitan ulang dengan syarat mempertahankan teks, atribusi,
versi, pemberitahuan, dan mengikuti pembaruan sumber. Paket ini mempertahankan
informasi tersebut pada setiap rekaman.

## Status terhadap aplikasi dan Firestore

Daftar ini adalah hasil seleksi editorial untuk rilis awal. Penyusunannya
belum mengubah rotasi aplikasi atau widget yang memakai pustaka 1.000 hadis.
Tidak ada penulisan, penghapusan, perubahan status publikasi, atau perubahan
struktur bahasa pada Firestore dalam pekerjaan ini.

`entries.json` adalah salinan rekaman produksi yang dipilih, sehingga masih
memiliki status dan persetujuan distribusi dari rilis 1.000 hadis sebelumnya.
Status itu tidak menyatakan bahwa daftar 100 ini sudah diterapkan sebagai
filter produksi. Berkas ini merupakan snapshot arsip, bukan berkas impor
yang sebaiknya langsung digunakan untuk menimpa dokumen editor.

## Berkas dan pemeriksaan ulang

- `release-list.json`: keputusan per hadis, lingkup matan, rujukan, tema,
  kandidat ditunda, dan sidik jari rekaman asal.
- `entries.json`: 100 rekaman asli beserta lima kolom bahasa, penjelasan,
  atribusi, dan metadata penerbit.
- `verification.json`: hasil pemeriksaan integritas terakhir.
- `DAFTAR.md`: daftar bacaan yang dapat ditinjau tanpa membaca JSON.

Dari akar proyek web, dengan lima spreadsheet resmi pada lokasi arsip:

```sh
uv run --with openpyxl python tools/verify_vocalized_release.py
```

Pemeriksa berjalan luring, menolak perubahan terhadap sumber atau duplikasi
matan, dan tidak terhubung ke Firestore. Program memeriksa integritas data;
penilaian keterbacaan harakat dan kesesuaian tema tetap bersifat editorial.
