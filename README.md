# Klim AI — WhatsApp Relationship Diagnosis 🧠💬

Aplikasi web analisis chat WhatsApp yang tajam, estetik, sastrawi, dan jujur tanpa filter, terinspirasi dari format editorial *What Brandon Thinks* namun hadir dalam versi **100% Gratis, Tanpa Biaya Langganan, dan Menjaga Privasi Penuh di Browser**.

Aplikasi ini menggunakan persona **Klim**: seorang AI analis hubungan yang observatif, sinis, sastrawi, dan membedah psikologis kedua belah pihak langsung dari riwayat percakapan WhatsApp yang diekspor.

---

## ✨ Fitur Utama

- **100% Gratis & Bebas Batasan**: Seluruh laporan (Report 1 hingga 5) terbuka penuh tanpa paywall atau langganan berbayar.
- **Privasi Aman (Offline First)**: Chat WhatsApp diproses secara instan langsung di peramban web (client-side) tanpa dikirim ke server luar manapun jika menggunakan mode built-in.
- **5 Laporan Komprehensif**:
  1. **Report 1: Diagnosis & Real-Time**: Bedah psikologis karakter, perbandingan rasio pesan, audit jam aktif, deteksi pesan dihapus (*deleted messages*), kutipan chat otentik dengan bubble WhatsApp, dan vonis akhir Klim.
  2. **Report 2: Tindakan & Solusi**: Protokol gencatan senjata konkret, hal yang wajib dihentikan malam ini, dan draf teks WhatsApp siap kirim untuk rekonsiliasi.
  3. **Report 3: Malam Penghargaan & Roasting**: Kategori piala unik seperti *"Detektif Forensik"*, *"Menteri Pertahanan & Pelarian Taktis"*, dan *"Ahli Hapus Bukti"*.
  4. **Report 4: Bahasa Sandi & Dekoder Teks**: Menerjemahkan makna terselubung di balik kata *“gtau”*, *“terserah”*, *“aku cuma nanya baik-baik”*, hingga *[Pesan ini telah dihapus]*.
  5. **Report 5: Timeline Gesekan & Evolusi Chat**: Rekonstruksi 5 babak hubungan mulai dari era bulan madu hingga fase krisis logika.
- **Deteksi Pesan Dihapus Canggih**: Mendukung format multisistem WhatsApp (Android/iOS, Bahasa Indonesia & Bahasa Inggris) serta membersihkan karakter tersembunyi (*Unicode RTL/LTR marks*).
- **Kustomisasi Provider AI Opsional**:
  - **Built-in Smart Engine**: Bawaan langsung gratis tanpa perlu API key.
  - **Google Gemini API**: Mendukung tier gratis Google Gemini untuk analisis AI dinamis tambahan.
  - **OpenAI API**: Mendukung GPT-4o bagi pengguna yang memiliki API Key sendiri.
- **Cetak & Simpan PDF**: Dilengkapi tombol cetak dan optimasi print stylesheet untuk menyimpan laporan sebagai dokumen arsip elegan.

---

## 🚀 Cara Menjalankan Secara Lokal

Aplikasi ini dibuat murni menggunakan teknologi web modern (HTML5, Vanilla CSS, dan JavaScript murni) tanpa ketergantungan build tool yang rumit:

1. **Clone repositori**:
   ```bash
   git clone https://github.com/G-breel/kli-ai-AI-Relationship-Diagnosis.git
   cd kli-ai-AI-Relationship-Diagnosis
   ```

2. **Jalankan local server** (bisa menggunakan Live Server VS Code, Laragon, Python, atau PHP):
   ```bash
   # Contoh via PHP:
   php -S 127.0.0.1:8088

   # Atau via Python:
   python -m http.server 8088
   ```

3. **Buka di Browser**:
   Kunjungi `http://127.0.0.1:8088` atau klik ganda langsung pada file `index.html`.

---

## 📖 Cara Menggunakan

1. Buka aplikasi WhatsApp di HP Anda.
2. Buka ruang obrolan dengan orang yang ingin dianalisis.
3. Ketuk opsi **More (Lainnya) > Export Chat (Ekspor Chat)**.
4. Pilih **Without Media (Tanpa Media)** agar menghasilkan file `.txt`.
5. Seret (*drag & drop*) atau pilih file `.txt` tersebut ke area upload aplikasi Klim AI.
6. Tunggu beberapa detik selagi Klim membaca percakapan kalian, dan laporan interaktif siap dibaca!

---

## 🎨 Teknologi & Desain

- **Tipografi Editorial**: *EB Garamond* (Serif Substack/New Yorker style) dipadukan dengan *Plus Jakarta Sans* & *JetBrains Mono*.
- **Desain UI**: Warm cream paper background dengan nuansa koran vintage dan komponen bubble chat WhatsApp yang interaktif.
- **Penyimpanan Lokal**: Preferensi dan API Key tersimpan di `localStorage` peramban pengguna.

---

## 📄 Lisensi

Didistribusikan di bawah lisensi MIT. Bebas dimodifikasi dan dikembangkan untuk keperluan pribadi maupun komunitas.
