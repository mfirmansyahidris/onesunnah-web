# Sumber dan cakupan — 16 Oktober 2026

## Sumber yang benar-benar dimasukkan

[HadeethEnc](https://hadeethenc.com/en/home) menyediakan unduhan resmi per
bahasa, teks hadis, penjelasan, derajat, dan atribusi rujukan. Paket ini
menggunakan lima spreadsheet resmi, tanpa menulis ulang isinya. Versi dan
checksum tersimpan dalam `source-manifest.json`.

| Bahasa | Versi | Rekaman dalam rilis | Rekaman dalam koleksi ini |
| --- | --- | ---: | ---: |
| Inggris | v1.25.0 | 2.328 | 1.000 |
| Indonesia | v1.22.0 | 2.260 | 1.000 |
| Melayu | v1.2.0 | 147 | 147 |
| Arab | v1.8.0 | 3.582 | 1.000 |
| Urdu | v1.36.0 | 2.220 | 1.000 |

Irisan ID dengan teks tidak kosong: 2.206 dalam Arab–Inggris–Indonesia–Urdu,
147 dalam kelima bahasa. Angka ini berasal dari berkas yang diunduh pada
tanggal di atas; bukan klaim bahwa hanya ada 147 terjemahan Melayu di dunia.

## Calon sumber Melayu tambahan, belum dimasukkan

| Sumber | Temuan dan alasan belum digunakan |
| --- | --- |
| [API Hadis Malaysia](https://developer.hadis.my/docs/) | Dokumentasi menyebut sembilan kitab dengan teks Arab, Melayu, dan Indonesia. Memerlukan API key; pengguna belum mempunyai akses. Identitas penerjemah dan pemetaan riwayat tetap harus diperiksa sebelum integrasi. |
| [Mengaji.my](https://www.mengaji.my/api/) | Tautan dokumentasi Hadis mengarah ke API Hadis Malaysia yang sama; bukan sumber API tanpa kunci yang terpisah. |
| [Mutiara Hadis UiTM](https://sigir.uitm.edu.my/webhadis/) | Situs pencarian menampilkan enam koleksi. Penelusuran ini belum menemukan ekspor resmi dengan atribusi dan ketentuan penggunaan kembali yang cukup untuk integrasi; beberapa halaman pendukung juga mengalami galat server. Belum ada isi koleksinya yang disalin. |
| [e-Hadith JAKIM](https://e-hadith.elib.com.my/) | Portal perpustakaan digital dapat diakses. Belum ditemukan unduhan dataset untuk dipetakan ke ID HadeethEnc dalam pemeriksaan ini. |
| [Riyadh Islamenc](https://riyadh.islamenc.com/) | Pilihan terjemahan yang ditemukan adalah Inggris dan Indonesia; belum menambah cakupan Melayu. |
| [i-muslim downloads](https://i-muslim.com/id/downloads) | Halaman unduhan hadis mencantumkan Arab, Inggris, Rusia, dan Turki; tidak menyediakan bahasa Melayu yang dibutuhkan koleksi ini. |

[Penelitian korpus Melayu dari UiTM](https://link.springer.com/article/10.1016/j.jksuci.2020.07.011)
mengonfirmasi penggunaan Mutiara Hadis dan membahas koreksi kesalahan OCR.
Artikel ilmiah tersebut tidak dengan sendirinya memberikan ekspor hadis atau
izin penggunaan ulang seluruh terjemahan dasarnya. Korpus hasil normalisasi
untuk penelitian bahasa juga tidak langsung dianggap sebagai teks siap terbit.

## Syarat menambahkan sumber lain

Simpan teks asli, penerjemah/penerbit, versi, URL, ketentuan penggunaan, dan
riwayat pemeriksaan. Cocokkan kitab dan matan/variasi riwayat; jangan menyamakan
nomor ID antar-layanan. Terjemahan Indonesia tidak boleh diberi label Melayu.
Teks mesin, bila kelak diminta sebagai bantuan editorial, harus ditandai dan
ditinjau; tidak dihitung sebagai terjemahan sumber yang telah terverifikasi.

Dokumen ini mencatat hasil penelusuran terbatas, bukan penolakan menyeluruh
atas semua sumber lain yang mungkin tersedia.
