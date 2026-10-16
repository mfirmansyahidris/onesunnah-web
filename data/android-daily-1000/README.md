# Rencana koleksi harian Android — 1.000 hadis

**Status: 1.000 dokumen sudah ada di Firestore sebagai draf. Publikasi masih
menunggu persetujuan. Belum ada hadis dari paket ini yang dibuka untuk Android.**

## Koleksi yang disiapkan

- `candidates.json`: tepat 1.000 kandidat unik dengan teks dan penjelasan
  HadeethEnc dalam Arab, Inggris, Indonesia, dan Urdu.
- Sebanyak 147 kandidat juga memiliki Melayu. Sebanyak 853 akan menggunakan
  Inggris dengan penanda yang jelas saat pengguna memilih Melayu.
- Dua perkataan sahabat (`hadeethenc-3041`, `hadeethenc-3300`) dan satu entri
  dengan derajat campuran (`hadeethenc-10877`) dikeluarkan dari pilihan harian.
  Penggantinya diambil dari rilis resmi yang sama.
- `release-plan.json` mencatat komposisi dan tiga pengecualian tersebut.
- `firestore-staging-result.json` mencatat pemeriksaan setelah 900 draf baru
  ditambahkan. Seluruh 100 dokumen lama dipertahankan.

Semua teks, penjelasan, tautan, dan checksum rilis telah dicocokkan dengan lima
spreadsheet resmi. Tidak dilakukan penulisan ulang, pembuatan terjemahan, atau
klaim tinjauan ulang oleh ahli hadis. Atribusi dan versi penerbit tetap ada di
setiap rekaman. Rincian sumber ada di `../collection-1000/SOURCES.md`.

## Perilaku Android 0.6.0

Koleksi luring menampung 1.000 hadis. Setiap perangkat mempunyai benih acak
yang tersimpan. Urutan hadis diacak sekali dari benih tersebut dan tanggal
lokal memilih satu hadis. Satu siklus lengkap tidak mengulang hadis selama
1.000 hari jika isi koleksi tetap. Aplikasi dan widget memakai pilihan yang
sama. ID hari ini tetap dipakai setelah sinkronisasi selama masih tersedia.

Pemilihan bahasa tidak mengubah hadis hari ini. Jika Melayu belum tersedia,
teks, penjelasan, dan tautan sumber sama-sama mengikuti Inggris. Label fallback
juga muncul saat dibagikan atau ditampilkan melalui widget/notifikasi.

Pergantian tanggal di aplikasi diperiksa saat kembali ke layar dan setiap
menit saat aktif. Widget mengikuti pembaruan sistem/launcher, perubahan waktu,
pembukaan aplikasi, dan sinkronisasi. Android dapat menunda pembaruan latar
belakang; tidak digunakan alarm tepat waktu.

## Pengelolaan Firestore

Proyek: `onesunnah-e3a1e`; database `(default)`; koleksi `hadiths`.

```sh
# Periksa sumber, keadaan dokumen lama, dan rencana perubahan; tidak menulis.
uv run --with openpyxl python tools/manage_android_daily.py

# Hanya menambahkan ID yang belum ada sebagai Draft, reviewed: false.
uv run --with openpyxl python tools/manage_android_daily.py --commit-drafts
```

Kedua langkah tersebut tidak menerbitkan hadis. Untuk publikasi, skrip
memerlukan `--publish --approval-note` yang mencatat persetujuan nyata untuk
distribusi publik. Jangan menjalankannya sebelum persetujuan diterima. Tanda
`reviewed` adalah gerbang persetujuan publikasi pada sistem ini, bukan bukti
bahwa ahli hadis baru meninjau ulang terjemahan.

Skrip memeriksa seluruh paket terhadap rilis resmi sebelum menulis, menyimpan
snapshot lokal, menggunakan prasyarat versi/keberadaan dokumen, dan berhenti
jika mendeteksi perubahan editor di luar data awal yang dikenal. Komit
dilakukan dalam kelompok 100 dan dapat dilanjutkan setelah kegagalan. Data
kredensial tidak dimasukkan ke dalam kode, APK, atau berkas kandidat.

Aturan Firestore tetap membatasi pembacaan publik ke `Published` dan
`reviewed: true`. Penambahan draf tidak mengubah izin akses.
