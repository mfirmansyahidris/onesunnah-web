# Koleksi kandidat hadis — target 1.000 × 5 bahasa

Status per **16 Oktober 2026**: terkumpul **1.000 kandidat unik**, tetapi baru
**147 kandidat lengkap dalam lima bahasa**. **853 kandidat belum memiliki
terjemahan Melayu**. Target 1.000 hadis lengkap dalam lima bahasa **belum tercapai**.

| Bahasa | Teks dari sumber | Penjelasan/syarah dari sumber |
| --- | ---: | ---: |
| Inggris (`en`) | 1.000 | 1.000 |
| Indonesia (`id`) | 1.000 | 1.000 |
| Melayu (`ms`) | 147 | 147 |
| Arab (`ar`) | 1.000 | 1.000 |
| Urdu (`ur`) | 1.000 | 1.000 |

## Isi paket

- `candidates.json`: 1.000 kandidat dengan lima kolom bahasa, referensi,
  penjelasan yang tersedia, derajat menurut sumber, dan asal data. Kolom
  `texts.ms` yang belum tersedia sengaja kosong, bukan terjemahan Indonesia
  yang diberi label Melayu dan bukan terjemahan buatan AI.
- `complete-five-languages.json`: hanya 147 kandidat yang memiliki seluruh
  lima teks dari sumber. Seluruhnya tetap draf, belum disahkan oleh editor.
- `missing-malay.json`: antrean 853 kandidat yang memerlukan sumber Melayu
  untuk hadis yang sama, bukan sekadar nomor yang terlihat sama di kitab lain.
- `coverage.json`: jumlah sebenarnya, pemeriksaan duplikat, derajat dari
  sumber, label kitab, dan ukuran rekaman. `fiveLanguageTargetMet` masih `false`.
- `source-manifest.json`: versi, transkrip atribusi, tautan unduhan resmi,
  jumlah rekaman, serta SHA-256 lima rilis sumber.
- `source-records.jsonl`: rekaman spreadsheet asli per ID dan bahasa,
  termasuk kolom tambahan seperti manfaat, makna kata, dan teks Arab yang
  menyertai terjemahan. Teks sumber tidak diubah.
- `VALIDATION.md`: hasil pemeriksaan data dan batasan yang masih ada.
- `SOURCES.md`: sumber utama dan hasil penelusuran sumber Melayu tambahan.

## Cara memilih kandidat

Identitas 100 kandidat lama dipertahankan. Koleksi memasukkan seluruh 147 ID
yang tersedia dalam lima bahasa terlebih dahulu. Sisanya dipilih dari 2.206
ID yang cocok dalam empat bahasa, dengan prioritas label Bukhari/Muslim dan
hadis yang lebih pendek. Pemilihan ini merupakan antrean editorial, bukan
keputusan keabsahan atau kelayakan publikasi. Variasi riwayat yang berbeda
tetap perlu ditinjau walaupun teks Arab yang sama persis telah disaring.

Teks, penjelasan, label sumber, derajat, versi, dan transkrip dipertahankan
sesuai rilis [HadeethEnc](https://hadeethenc.com/en/home). Informasi yang tidak
disediakan sumber tidak diisi dengan perkiraan. Nomor ID HadeethEnc adalah
ID ensiklopedia, bukan otomatis nomor hadis Bukhari atau Muslim.

## Kekurangan terjemahan Melayu

Rilis Melayu terbaru yang diunduh pada 16 Oktober 2026 adalah **v1.2.0** dan
berisi **147 rekaman**. Rilis Arab, Inggris, Indonesia, dan Urdu masing-masing
berisi 3.582, 2.328, 2.260, dan 2.220 rekaman. Rinciannya ada pada manifest.

[API Hadis Malaysia](https://developer.hadis.my/docs/collections/bukhari/)
menyediakan sumber tambahan Melayu dan Arab, tetapi memerlukan API key.
Akses tersebut belum tersedia pada saat paket ini dibuat. Jika digunakan,
teks Arab dan rujukan kitab harus dicocokkan; ID layanan yang berbeda tidak
boleh langsung disamakan. Identitas penerjemah, asal terjemahan, dan ketentuan
penggunaannya juga harus dicatat dari layanan tersebut.

## Status Firestore dan publikasi

Laporan dalam paket ini adalah snapshot saat pengumpulan awal, sebelum
penyiapan rilis Android. Pada tahap lanjutan, [pilihan harian Android](../android-daily-1000/README.md)
dengan tiga kandidat pengganti disiapkan di Firestore sebagai 900 draf baru dan
100 dokumen lama yang dipertahankan. Setelah persetujuan pengguna pada
16 Oktober 2026, seluruh 1.000 pilihan harian diterbitkan. Pemeriksaan publik
pada 18 Oktober tercatat di [hasil rilis](../android-daily-1000/firestore-release-result.json).
Nilai `uploadedToFirestore: false` dalam `coverage.json` mencatat keadaan saat
kolektor awal berjalan, bukan status produksi terbaru.

Tidak ada rekaman dalam paket penelitian ini yang diterbitkan otomatis.
Semua rekaman lokal menggunakan `status: Draft` dan `reviewed: false`. Berkas
`candidates.json` adalah snapshot penelitian, bukan status rilis produksi.
Validasi web kini memerlukan teks Inggris, rujukan HTTPS, dan persetujuan
publikasi; bahasa lain boleh kosong. Tampilan menggunakan Inggris ketika
terjemahan yang dipilih belum tersedia, tanpa mengisi kolom sumber yang kosong.
Impor web yang menimpa ID lama dapat menghapus hasil tinjauan editor; jangan
menggunakannya untuk memperbarui 100 rekaman lama tanpa membandingkan perubahan.

Android 0.6.1 menyimpan paling banyak 1.000 hadis yang telah disetujui untuk
publikasi. Pengambilan dan penyimpanan luring seluruh 1.000 rekaman dari
Firestore telah diperiksa di emulator. Persetujuan distribusi tidak berarti
telah dilakukan tinjauan keilmuan baru atas terjemahan.

## Membangun ulang

Simpan lima spreadsheet resmi sebagai `en.xlsx`, `id.xlsx`, `ms.xlsx`,
`ar.xlsx`, dan `ur.xlsx` dalam satu direktori, lalu jalankan dari akar proyek:

```sh
uv run --with openpyxl python tools/collect_hadeethenc_catalog.py \
  --source-dir .cache/hadeethenc/2026-10-16
```

Tambahkan `--require-complete` untuk menggagalkan proses jika 1.000 kandidat
belum lengkap dalam lima bahasa. Jangan mengganti berkas 100 kandidat lama
atau mengubah tanda tinjauan untuk meloloskan jumlah.

## Atribusi dan penggunaan kembali

Ikuti [ketentuan penerbit](https://hadeethenc.com/en/home): pertahankan isi,
atribusi, nomor versi, transkrip sumber, dan pembaruan rilis. Paket ini
menyimpan seluruh informasi tersebut. Draf tetap memerlukan pemeriksaan
teks Arab, derajat, konteks, rujukan, dan setiap terjemahan sebelum publikasi.
