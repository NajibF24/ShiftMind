# ShiftMind — Data Demo untuk Presentasi

> **PT Garuda Yamato Steel · ShiftMind v2.0 · 2025 Hackathon**
> Semua data di bawah sudah dimasukkan ke database dan siap digunakan untuk demo/presentasi.

---

## 👥 1. Users (Akun Demo)

| Role | Username | Password | Nama Lengkap | Dept / Area |
|------|----------|----------|--------------|-------------|
| **admin** | `admin` | `admin123` | Admin ShiftMind | — |
| **user** | `budi.santoso` | `user123` | Budi Santoso | Production / EAF |
| **user** | `sari.dewi` | `user123` | Sari Dewi | Production / Rolling Mill |
| **user** | `ahmad.fauzi` | `user123` | Ahmad Fauzi | Warehouse |
| **user** | `rizky.pratama` | `user123` | Rizky Pratama | Maintenance |

> **Tip demo:** Login sebagai `budi.santoso` untuk menunjukkan fitur dari perspektif operator lapangan.

---

## ☑️ 2. Checklist Templates (5 Template Standar)

Template ini bisa dipilih operator saat membuat checklist baru — tidak perlu menulis dari nol.

### Template 1 — Inspeksi Harian EAF (Electric Arc Furnace)
- **Dept:** Production | **Area:** EAF
- **Jumlah Item:** 10

| No | Item Checklist |
|----|----------------|
| 1 | Cek kondisi elektroda (tidak retak, panjang memadai) |
| 2 | Periksa sistem pendingin air elektroda — tidak ada kebocoran |
| 3 | Cek tekanan udara kompresor ≥ 6 bar |
| 4 | Inspeksi refraktori furnace — tidak ada kerusakan bata tahan api |
| 5 | Verifikasi sistem dust collection (dedusting) aktif |
| 6 | Cek level trafo — suhu oli trafo < 75°C |
| 7 | Pastikan area kerja bersih dari scrap berserakan |
| 8 | Periksa APD operator tersedia (helm, kacamata las, sarung tangan) |
| 9 | Verifikasi sistem alarm dan emergency stop berfungsi |
| 10 | Cek kondisi scrap bucket — tidak ada kerusakan |

---

### Template 2 — Inspeksi Harian Rolling Mill
- **Dept:** Production | **Area:** Rolling Mill
- **Jumlah Item:** 10

| No | Item Checklist |
|----|----------------|
| 1 | Cek kondisi roll — tidak ada retakan atau keausan berlebih |
| 2 | Periksa sistem pelumasan roll (level oli, tidak ada kebocoran) |
| 3 | Verifikasi alignment roll guide — toleransi ≤ 0.5mm |
| 4 | Cek suhu tungku pemanas billet ≥ 1100°C sebelum rolling |
| 5 | Inspeksi conveyor dan roller table — tidak ada benda asing |
| 6 | Periksa sistem pendingin air roll — tekanan ≥ 4 bar |
| 7 | Cek kondisi shear blade (gunting billet) — tajam dan tidak aus |
| 8 | Verifikasi panel kontrol rolling — tidak ada alarm aktif |
| 9 | Periksa area sekitar mill dari bahaya fisik (kabel, selang) |
| 10 | Konfirmasi jadwal produksi H-Beam dengan supervisor |

---

### Template 3 — Checklist K3 Awal Shift (Semua Area)
- **Dept:** All | **Area:** All
- **Jumlah Item:** 8

| No | Item Checklist |
|----|----------------|
| 1 | Absensi seluruh anggota shift sudah lengkap |
| 2 | Serah terima shift dengan operator sebelumnya sudah dilakukan |
| 3 | Buku log shift telah ditandatangani |
| 4 | APD lengkap tersedia di area kerja (helm, safety shoes, sarung tangan) |
| 5 | APAR (Alat Pemadam Api Ringan) siap dan tidak kadaluarsa |
| 6 | Jalur evakuasi darurat tidak terhalang |
| 7 | Kondisi cuaca dicek (jika ada pekerjaan outdoor) |
| 8 | Tool box meeting K3 sudah dilaksanakan |

---

### Template 4 — Quality Control — Inspeksi Produk H-Beam
- **Dept:** Quality | **Area:** QC Lab
- **Jumlah Item:** 8

| No | Item Checklist |
|----|----------------|
| 1 | Pengukuran dimensi: tinggi (h), lebar flange (b), tebal web (tw), tebal flange (tf) |
| 2 | Pengukuran panjang produk — toleransi ± 50mm dari target |
| 3 | Inspeksi visual permukaan — tidak ada retak, lipatan, atau cacat permukaan |
| 4 | Cek kelurusan produk (camber) — max 0.1% dari panjang |
| 5 | Pengambilan sampel uji tarik (tensile test) — 1 per heat |
| 6 | Pengambilan sampel uji komposisi kimia (spectrometer) |
| 7 | Penandaan/marking produk dengan heat number sudah dilakukan |
| 8 | Dokumentasi hasil inspeksi ke sistem QCIS sudah diinput |

---

### Template 5 — Perawatan Preventif Crane Overhead
- **Dept:** Maintenance | **Area:** General
- **Jumlah Item:** 8

| No | Item Checklist |
|----|----------------|
| 1 | Cek tali kawat (wire rope) — tidak ada strand putus, korosi |
| 2 | Pelumasan hook block dan roda rel |
| 3 | Uji fungsi tombol emergency stop |
| 4 | Periksa rem elektromotor — tidak ada slip saat beban maksimum |
| 5 | Cek kondisi rel overhead — tidak ada keausan atau deformasi |
| 6 | Inspeksi limit switch atas dan bawah berfungsi normal |
| 7 | Verifikasi kapasitas beban (SWL) tertera dan jelas |
| 8 | Dokumentasi hasil pemeriksaan di buku log crane |

---

## 📋 3. Daily Checklists — Contoh Pengisian (4 Contoh)

> 🎯 **Demo tip:** Checklist No. 2 dan No. 3 memiliki item **FAIL** yang memicu **AI Safety Analysis + WhatsApp Alert** secara otomatis — bagus untuk di-demo.

---

### Checklist 1 — Inspeksi Pagi EAF Shift 1 ✅ Semua OK
- **Oleh:** Budi Santoso | **Area:** EAF | **Waktu:** Hari ini
- **Status:** Semua OK (0 FAIL)

| Item | Status | Catatan |
|------|--------|---------|
| Cek kondisi elektroda | ✅ OK | Elektroda heat 3 tersisa 40cm, perlu penggantian besok |
| Periksa sistem pendingin air elektroda | ✅ OK | — |
| Cek tekanan udara kompresor ≥ 6 bar | ✅ OK | Tekanan 6.8 bar |
| Inspeksi refraktori furnace | ✅ OK | — |
| Verifikasi sistem dust collection | ✅ OK | — |
| Cek level trafo | ✅ OK | Suhu 62°C, normal |
| Area kerja bersih | ✅ OK | — |
| APD operator tersedia | ✅ OK | — |
| Sistem alarm dan emergency stop | ✅ OK | — |
| Kondisi scrap bucket | ✅ OK | — |

---

### Checklist 2 — Inspeksi Sore EAF Shift 2 🚨 Ada FAIL
- **Oleh:** Budi Santoso | **Area:** EAF | **Waktu:** Kemarin
- **Status:** 2 item FAIL → AI safety alert + WhatsApp notification terkirim

| Item | Status | Catatan |
|------|--------|---------|
| Cek kondisi elektroda | 🔴 **FAIL** | **Elektroda No.2 retak di bagian pin joint, butuh penggantian segera** |
| Periksa sistem pendingin air elektroda | 🔴 **FAIL** | **Ada rembesan kecil di fleksibel hose pendingin elektroda No.2** |
| Cek tekanan udara kompresor ≥ 6 bar | ✅ OK | Tekanan 7.1 bar |
| Inspeksi refraktori furnace | ✅ OK | — |
| Verifikasi sistem dust collection | ✅ OK | — |
| Cek level trafo | ✅ OK | Suhu 68°C |
| Area kerja bersih | ✅ OK | — |
| APD operator tersedia | ✅ OK | — |
| Sistem alarm dan emergency stop | ✅ OK | — |
| Kondisi scrap bucket | ✅ OK | — |

**🤖 AI Analysis (otomatis muncul):**
> ⚠️ **PERINGATAN KESELAMATAN — 2 item FAIL berpotensi bahaya:**
>
> **1. Elektroda No.2 Retak pada Pin Joint** — Risiko TINGGI. Berpotensi patah saat smelting berlangsung. **Tindakan:** Hentikan EAF, hubungi maintenance untuk penggantian sebelum heat berikutnya.
>
> **2. Rembesan Hose Pendingin** — Risiko SEDANG-TINGGI. Kebocoran sistem pendingin berpotensi water-electrode explosion. **Tindakan:** Isolasi valve pendingin No.2, pasang sealant sementara, ganti hose dalam 24 jam.

---

### Checklist 3 — Inspeksi Pagi Rolling Mill ⚠️ Ada FAIL
- **Oleh:** Sari Dewi | **Area:** Rolling Mill | **Waktu:** Hari ini
- **Status:** 1 item FAIL → AI safety alert

| Item | Status | Catatan |
|------|--------|---------|
| Cek kondisi roll | ✅ OK | — |
| Sistem pelumasan roll | ✅ OK | Level oli 80%, normal |
| Alignment roll guide | ✅ OK | Alignment 0.3mm, OK |
| Suhu tungku pemanas billet | ✅ OK | Suhu tungku 1180°C |
| Conveyor dan roller table | ✅ OK | — |
| Sistem pendingin air roll — tekanan ≥ 4 bar | 🔴 **FAIL** | **Tekanan hanya 3.2 bar, filter kemungkinan tersumbat** |
| Kondisi shear blade | ✅ OK | — |
| Panel kontrol rolling | ✅ OK | — |
| Area bebas bahaya fisik | ✅ OK | — |
| Konfirmasi jadwal produksi | ✅ OK | Target 120 ton H-Beam 200x200 |

**🤖 AI Analysis:**
> ⚠️ Tekanan air pendingin roll rendah (3.2 bar dari minimal 4 bar) berpotensi overheat roll dan thermal crack. Periksa filter, cek pompa pendingin, hubungi Maintenance. Jangan mulai rolling sebelum diperbaiki.

---

### Checklist 4 — K3 Awal Shift Area Warehouse ⚠️ Ada FAIL
- **Oleh:** Ahmad Fauzi | **Area:** Warehouse | **Waktu:** 2 hari lalu
- **Status:** 1 item FAIL → AI K3 alert

| Item | Status | Catatan |
|------|--------|---------|
| Absensi lengkap | ✅ OK | 8 dari 8 hadir |
| Serah terima shift | ✅ OK | — |
| Buku log ditandatangani | ✅ OK | — |
| APD lengkap | ✅ OK | — |
| APAR siap dan tidak kadaluarsa | 🔴 **FAIL** | **APAR di titik W-3 kadaluarsa bulan lalu, belum diganti** |
| Jalur evakuasi tidak terhalang | ✅ OK | — |
| Kondisi cuaca | ✅ OK | Cerah, tidak ada peringatan |
| Tool box meeting K3 | ✅ OK | — |

**🤖 AI Analysis:**
> 🚨 APAR titik W-3 kadaluarsa = TIDAK SESUAI Permenaker No. 02/Men/1983 & ISO 45001. Tindakan wajib: tandai 'TIDAK LAYAK PAKAI', hubungi HSE untuk penggantian hari ini, catat di laporan K3 harian.

---

## 📓 4. Work Journals — Jurnal Kerja (5 Entri)

> 💡 Setiap jurnal otomatis di-analisis AI: kategori, tag, lessons learned, dan SOP terkait.

---

### Jurnal 1 — Troubleshooting: Elektroda Patah Mendadak `[critical]`
- **Oleh:** Budi Santoso | **Dept:** Production | **Area:** EAF | **Kemarin**

**Isi:**
Kronologi insiden electrode breakage saat heat ke-3 pukul 10.15 WIB. Elektroda No.1 patah di posisi 30cm dari pin joint akibat elektroda terlalu pendek (≤35cm) dan kemungkinan scrap basah di bucket. Recovery 2.5 jam penggantian elektroda baru.

**🤖 AI Auto-fill:**
- **Kategori:** EAF Operation | **Difficulty:** Critical
- **Tags:** `elektroda` `troubleshooting` `electrode breakage` `scrap` `EAF`
- **Lessons Learned:** Batas kritis: elektroda tidak boleh dioperasikan di bawah 40cm. Tanda awal: suara mendesis saat proses arc = scrap basah.
- **SOP Terkait:** SOP Penggantian Elektroda EAF Rev.5, SOP Emergency Shutdown EAF

---

### Jurnal 2 — Setting Optimal Power Schedule H-Beam 300x300 `[troubleshooting]`
- **Oleh:** Budi Santoso | **Dept:** Production | **Area:** EAF | **3 hari lalu**

**Isi:**
Trial power schedule baru untuk H-Beam 300x300. Phase 2 Meltdown 38MW/22 menit. Hasil: heat 5 menit lebih cepat, konsumsi elektroda turun dari 2.4 → 2.1 kg/ton (-12%), energi 340 kWh/ton (target 360). Semua kualitas terpenuhi.

**🤖 AI Auto-fill:**
- **Kategori:** EAF Operation | **Difficulty:** Troubleshooting
- **Tags:** `power schedule` `H-Beam 300x300` `efisiensi energi` `elektroda`
- **Lessons Learned:** Power schedule baru lebih efisien. Phase 2 Meltdown 38MW/22 menit adalah optimal untuk H-Beam 300.

---

### Jurnal 3 — Penyebab Cacat 'Lap' H-Beam 200x200 — Investigasi `[troubleshooting]`
- **Oleh:** Sari Dewi | **Dept:** Production | **Area:** Rolling Mill | **2 hari lalu**

**Isi:**
Ditemukan cacat 'lap' (lipatan) pada batch H-Beam 200x200 heat 240605-07, 8% reject. Root cause: billet undertemperature (1090°C vs target ≥1100°C) + misalignment roll H4 sebesar 1.2mm. Perbaikan: soaking time minimum 25 menit + koreksi alignment ke 0.3mm. Batch berikutnya: 0% reject.

**🤖 AI Auto-fill:**
- **Kategori:** Quality Control | **Difficulty:** Troubleshooting
- **Tags:** `lap defect` `H-Beam 200x200` `rolling mill` `billet temperature`
- **Lessons Learned:** Billet 200x200 harus soaking minimal 25 menit. Misalignment > 0.8mm pada pass H4 menyebabkan lap defect.

---

### Jurnal 4 — Implementasi FIFO Sistem Baru di Gudang `[routine]`
- **Oleh:** Ahmad Fauzi | **Dept:** Warehouse | **Area:** Finished Goods | **Hari ini**

**Isi:**
Implementasi sistem FIFO dengan kode warna (Hijau <2 minggu, Kuning 2-4 minggu, Merah >4 minggu) di gudang produk jadi. Hasil: 20% lebih cepat picking, 3 bundel H-Beam berusia >45 hari ditemukan dan diprioritaskan pengiriman.

**🤖 AI Auto-fill:**
- **Kategori:** Warehouse | **Difficulty:** Routine
- **Tags:** `FIFO` `gudang` `H-Beam` `inventory management` `kode warna`
- **Lessons Learned:** Kode warna fisik lebih efektif dari aturan tertulis. FIFO butuh pembagian zona fisik yang jelas.

---

### Jurnal 5 — Teknik Penggantian Bearing Roll Stand H4 Lebih Cepat `[troubleshooting]`
- **Oleh:** Rizky Pratama | **Dept:** Maintenance | **Area:** Rolling Mill | **4 hari lalu**

**Isi:**
Teknik baru penggantian bearing Roll Stand H4: geser housing operator 15cm tanpa buka full assembly. Hasil: downtime dari 8 jam → 3.5 jam (hemat 56%). Sudah divalidasi 2x, clearance bearing 0.05mm (spec Timken ≤0.08mm).

**🤖 AI Auto-fill:**
- **Kategori:** Maintenance | **Difficulty:** Troubleshooting
- **Tags:** `bearing replacement` `roll stand H4` `downtime reduction` `teknik baru`
- **Lessons Learned:** Housing sisi operator bisa digeser 15cm untuk akses bearing tanpa lepas coupling drive. Gunakan induction heater untuk instalasi.

---

## 🔄 5. Workflows / SOP (2 SOP Resmi, Sudah Approved ✅)

---

### SOP 1 — Penggantian Elektroda EAF (Hot Replacement) `[approved]`
- **Oleh:** Budi Santoso | **Kategori:** Maintenance | **Area:** EAF
- **Estimasi Waktu:** ±130 menit | **Digunakan:** 7x | **Status:** ✅ Approved

| Step | Tindakan | Durasi | Catatan Penting |
|------|----------|--------|-----------------|
| 1 | Emergency shutdown: turunkan power ke 0MW, buka breaker utama | 5 menit | Konfirmasi power = 0 dengan operator panel |
| 2 | Naikkan elektroda ke posisi atas penuh | 3 menit | Tunggu elektroda berhenti sepenuhnya |
| 3 | Pasang interlock mekanis pada hydraulic arm | 2 menit | ⚠️ WAJIB sebelum siapapun masuk area EAF |
| 4 | Cooling period — tunggu elektroda < 300°C (pyrometer) | 30 menit | Jangan percaya perkiraan visual! |
| 5 | Kenakan APD lengkap: face shield, aluminized jacket, gloves | 5 menit | Wajib bahkan jika merasa sudah dingin |
| 6 | Pasang sling crane pada elektroda lama | 10 menit | Load test sling sebelum digunakan |
| 7 | Lepaskan pin joint menggunakan kunci torsi hydraulic 800 Nm | 15 menit | 2 orang diperlukan |
| 8 | Turunkan elektroda lama ke area disposal | 10 menit | Komunikasi via radio dengan operator crane |
| 9 | Pasang elektroda baru, kencangkan 800 Nm | 20 menit | Cek panjang ≥ 150cm sebelum dipasang |
| 10 | Cek visual: lurus, tidak ada jarak elektroda-nipple | — | — |
| 11 | Lepas interlock, turunkan elektroda ke posisi kerja | 3 menit | — |
| 12 | Test run tanpa power 2 menit | 2 menit | — |
| 13 | Startup: power up bertahap ke 15MW, monitor 5 menit | 10 menit | Jika ada anomali, segera matikan |
| 14 | Dokumentasi di logbook: nomor seri, panjang, waktu | 5 menit | — |

**🔒 Catatan Keselamatan:** Arc flash (potensi fatal), logam pijar, gas CO/SO2. Minimum 2 orang. Interlock WAJIB.

---

### SOP 2 — Setting Roll Pass H-Beam 200x200 mm `[approved]`
- **Oleh:** Sari Dewi | **Kategori:** Machine Setup | **Area:** Rolling Mill
- **Estimasi Waktu:** ±2 jam | **Digunakan:** 15x | **Status:** ✅ Approved

| Step | Tindakan | Durasi | Catatan Penting |
|------|----------|--------|-----------------|
| 1 | Ambil roll pass schedule dari PIMS untuk H-Beam 200x200 | 5 menit | Pastikan revisi terbaru |
| 2 | Set suhu tungku: preheating 850°C, heating 1100°C, soaking 1150°C | 60 menit | Soaking time min. 25 menit untuk billet 200x200 |
| 3 | Setting gap roll Roughing Stand R1: gap = 210mm | 15 menit | Gunakan feeler gauge, bukan hanya skala digital |
| 4 | Setting guide di setiap pass: R1, R2, H1-H6, F1-F3 | 30 menit | Guide harus simetris — ukur dari kedua sisi |
| 5 | Setting gap Finishing Stand F1-F3 sesuai schedule | 20 menit | F3 paling kritis untuk dimensi final |
| 6 | Dummy pass: masukkan billet test, amati aliran material | 10 menit | Stop jika billet bengkok/miring, koreksi guide |
| 7 | Ukur dimensi produk pertama: h, b, tw, tf | 10 menit | Semua dimensi harus dalam toleransi SNI |
| 8 | Jika OK: konfirmasi ke supervisor untuk produksi penuh | 5 menit | Dokumentasikan setting di logbook |
| 9 | Monitor setiap 20 billet: cek visual + ukur 1 produk | Berkelanjutan | Koreksi segera jika ada tren menyimpang |

**⚠️ Poin Kritis:** Billet < 1100°C → risiko lap defect. Misalignment > 0.5mm → web bengkok.

---

## 📝 6. Approval Requests — Contoh Persetujuan (3 Contoh)

---

### Approval 1 — Purchase Order APAR Kadaluarsa `[PENDING]`
- **Diajukan oleh:** Ahmad Fauzi | **Tipe:** Purchase | **Status:** ⏳ Pending

**Ringkasan:**
Pengadaan 12 unit APAR ABC Powder 6 kg untuk mengganti unit kadaluarsa di Warehouse. Total: Rp 4.500.000 (Rp 375.000/unit). Urgensi tinggi — audit ISO 45001 dijadwalkan 20 Juni 2026.

**🤖 AI Risk Assessment:**
- **Risiko Regulasi:** TINGGI — APAR kadaluarsa = pelanggaran Permenaker No. 02/Men/1983 & ISO 45001
- **Kewajaran Harga:** WAJAR (harga pasar Rp 350.000-420.000/unit)
- **Rekomendasi:** ✅ **SETUJUI** — minta 3 penawaran harga, pastikan sertifikat SNI valid, jadwalkan training penggunaan APAR

---

### Approval 2 — Update SOP Bearing Roll Stand H4 Rev.2 `[APPROVED ✅]`
- **Diajukan oleh:** Rizky Pratama | **Tipe:** Workflow/SOP | **Status:** ✅ Approved by Admin

**Ringkasan:**
Update SOP penggantian bearing Roll Stand H4 dari prosedur 8 jam → 3.5 jam. Teknik baru: geser housing operator tanpa buka coupling drive. Sudah divalidasi 2x.

**🤖 AI Assessment:**
- **Penilaian Teknis:** POSITIF — teknik valid, digunakan di industri baja modern
- **Validasi:** CUKUP — 2x validasi dengan clearance 0.05mm (dalam spec)
- **Rekomendasi:** ✅ **SETUJUI** dengan catatan: tambah langkah verifikasi alignment housing setelah penggantian

---

### Approval 3 — Kontrak NDT Eksternal PT Inspeksi Nusa Mandiri `[PENDING]`
- **Diajukan oleh:** Sari Dewi | **Tipe:** Contract | **Status:** ⏳ Pending

**Ringkasan:**
Kontrak inspeksi NDT (UT + MT) crane overhead tahunan: 24 unit crane, 1x/tahun + on-call. Nilai: Rp 185.000.000/tahun. Vendor sudah 3 tahun bermitra dengan GYS.

**🤖 AI Contract Review:**
- **Kepatuhan Regulasi:** WAJIB — Permenaker No. 8/2020 mewajibkan inspeksi NDT oleh pihak ketiga bersertifikat
- **Kewajaran Nilai:** WAJAR (±Rp 7.7 juta/crane/tahun, pasar Rp 6-10 juta)
- **Risiko Kontrak:** RENDAH — vendor terpercaya, sertifikasi lengkap
- **Rekomendasi:** ✅ **SETUJUI** — pastikan ada klausul penalti keterlambatan, hak audit GYS, dan jaminan liability

---

## 🎯 Skenario Demo yang Disarankan (3 Menit)

| Waktu | Langkah | Fitur yang Ditunjukkan |
|-------|---------|------------------------|
| 0:00–0:30 | Login sebagai `admin`, buka 3D Gallery, klik painting "Ask ShiftMind" | AI Chat (RAG), 3D Gallery |
| 0:30–1:00 | Login sebagai `budi.santoso`, buka Checklists → Inspeksi Sore EAF Shift 2 | Checklist + **AI Safety Alert + WhatsApp Notif** |
| 1:00–1:30 | Buka Work Journal → Jurnal "Elektroda Patah" | Work Journal + AI auto-categorize |
| 1:30–2:00 | Buka Workflows → SOP Penggantian Elektroda | Workflow Recorder + AI SOP Generator |
| 2:00–2:30 | Buka Approvals → Lihat AI review pada Purchase Order APAR | Approval + AI Risk Assessment |
| 2:30–3:00 | Buka Expert Finder → Search "elektroda" → lihat Budi Santoso di top | Expert Finder dari data journal |

> 💡 **Momen paling impresif:** Buka checklist "Inspeksi Sore EAF" dan tunjukkan AI analysis + notifikasi WhatsApp yang muncul otomatis karena ada FAIL item. Ini adalah differentiator utama ShiftMind.

---

*ShiftMind v2.0 · PT Garuda Yamato Steel · Data Demo siap pakai*
