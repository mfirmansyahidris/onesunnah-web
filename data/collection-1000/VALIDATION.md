# Hasil pemeriksaan — 16 Oktober 2026

Catatan ini merekam pemeriksaan awal, sebelum persetujuan rilis dan perubahan
validasi web. Status produksi terbaru: 1.000 pilihan harian telah diterbitkan,
147 memiliki Melayu dan 853 memakai pengganti Inggris. Lihat
[pemeriksaan publik 18 Oktober](../android-daily-1000/firestore-release-result.json).
Berkas kandidat penelitian tetap berstatus draf; pemeriksaan awal di bawah
tidak menggambarkan status dokumen Firestore saat ini.

**Target 1.000 hadis lengkap dalam lima bahasa belum tercapai.** Koleksi ini
berisi 1.000 kandidat; 147 lengkap dan 853 belum memiliki teks serta penjelasan
Melayu. Lengkap secara struktur tidak berarti sudah lolos tinjauan keilmuan.

## Pemeriksaan yang lulus

- Tepat 1.000 ID unik dan 1.000 rekaman asal yang berpasangan.
- Tidak ada teks Arab yang sama setelah penyaringan huruf dan diakritik untuk
  mendeteksi duplikat. Teks yang disimpan tetap identik dengan sumber.
- Kelima kolom bahasa tersedia pada seluruh kandidat; bahasa yang belum
  tersedia kosong dan dicatat dalam `translationCoverage.missingLanguages`.
- Teks hadis, penjelasan, serta tautan setiap bahasa dicocokkan dengan rekaman
  spreadsheet sumber. Tidak ada terjemahan yang dibuat atau diganti.
- 100 ID kandidat sebelumnya tetap tercakup. Berkas 100 kandidat sebelumnya
  tidak diubah oleh pengumpulan ini.
- Semua 1.000 rekaman berstatus `Draft`, `reviewed: false`, dan lulus validasi
  draf pada fungsi `validate()` aplikasi web yang sekarang.
- Simulasi validasi publikasi pada fungsi aplikasi tersebut menolak seluruh
  853 rekaman yang belum lengkap. Sebanyak 147 rekaman memenuhi persyaratan
  kolom lima bahasa; status dan tanda tinjauannya tetap tidak diubah.
- Teks dan penjelasan tersedia: Inggris 1.000, Indonesia 1.000, Melayu 147,
  Arab 1.000, dan Urdu 1.000.
- Rekaman JSON terbesar berukuran 39.722 byte dalam serialisasi yang dipakai
  pemeriksa. Ini adalah ukuran JSON, bukan pengukuran ukuran dokumen Firestore.
- Manifest mencatat versi, transkrip atribusi, URL unduhan resmi, dan SHA-256
  untuk masing-masing dari lima spreadsheet sumber.

Pemeriksaan menggunakan data hasil kolektor dan fungsi validasi aplikasi web
yang dikompilasi dari `src/data.ts`. Tidak dilakukan perubahan aplikasi web,
aturan Firestore, data produksi, atau aplikasi Android untuk pengumpulan ini.

## Yang masih harus diselesaikan

1. Mendapatkan sumber terjemahan Melayu untuk 853 hadis yang sama, dengan
   atribusi penerjemah dan ketentuan penggunaan yang jelas.
2. Memeriksa kesesuaian matan, variasi riwayat, rujukan kitab, derajat dari
   sumber, konteks, dan terjemahan setiap bahasa oleh editor yang kompeten.
3. Melengkapi kategori dan metadata editorial. Label `Editorial review`
   merupakan penanda antrean, bukan kategori akhir.
4. Membandingkan perubahan sebelum mengimpor ID yang sudah ada, agar hasil
   tinjauan atau perubahan editor tidak tertimpa.

Tidak ada kandidat yang otomatis ditandai terverifikasi, diunggah ke Firestore,
atau diterbitkan. Validasi teknis tidak menggantikan pemeriksaan keilmuan.
