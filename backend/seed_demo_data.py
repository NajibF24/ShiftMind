"""
ShiftMind — Demo Data Seeder
============================
Memasukkan data contoh realistis untuk SEMUA fitur utama ShiftMind,
khusus untuk keperluan presentasi/demo PT Garuda Yamato Steel.

Fitur yang diseed:
  1. Users (admin, operator EAF, operator Rolling Mill)
  2. Checklist Templates (template standar pabrik)
  3. Daily Checklists (contoh checklist harian + yang ada FAIL)
  4. Work Journals (jurnal kerja harian)
  5. Workflows / SOP (prosedur kerja)
  6. Approval Requests (permintaan persetujuan)
  7. Knowledge Entries tambahan (SOP operasional)

Idempotent: data yang sudah ada (berdasarkan judul/username) tidak akan di-duplikasi.

Cara pakai:
  - Script ini dipanggil dari startup atau bisa dijalankan manual.
  - Panggil: seed_demo_data(db)
"""

import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


# ─── 1. USER DATA ─────────────────────────────────────────────────────────────

DEMO_USERS = [
    {
        "username": "admin",
        "email": "admin@gyssteel.com",
        "password": "admin123",
        "role": "admin",
        "display_name": "Admin ShiftMind",
    },
    {
        "username": "budi.santoso",
        "email": "budi.santoso@gyssteel.com",
        "password": "user123",
        "role": "user",
        "display_name": "Budi Santoso",
    },
    {
        "username": "sari.dewi",
        "email": "sari.dewi@gyssteel.com",
        "password": "user123",
        "role": "user",
        "display_name": "Sari Dewi",
    },
    {
        "username": "ahmad.fauzi",
        "email": "ahmad.fauzi@gyssteel.com",
        "password": "user123",
        "role": "user",
        "display_name": "Ahmad Fauzi",
    },
    {
        "username": "rizky.pratama",
        "email": "rizky.pratama@gyssteel.com",
        "password": "user123",
        "role": "user",
        "display_name": "Rizky Pratama",
    },
]


# ─── 2. CHECKLIST TEMPLATES ───────────────────────────────────────────────────

CHECKLIST_TEMPLATES = [
    {
        "title": "Checklist Inspeksi Harian EAF (Electric Arc Furnace)",
        "department": "Production",
        "area": "EAF",
        "items": [
            {"item": "Cek kondisi elektroda (tidak retak, panjang memadai)"},
            {"item": "Periksa sistem pendingin air elektroda — tidak ada kebocoran"},
            {"item": "Cek tekanan udara kompresor ≥ 6 bar"},
            {"item": "Inspeksi refraktori furnace — tidak ada kerusakan bata tahan api"},
            {"item": "Verifikasi sistem dust collection (dedusting) aktif"},
            {"item": "Cek level trafo — suhu oli trafo < 75°C"},
            {"item": "Pastikan area kerja bersih dari scrap berserakan"},
            {"item": "Periksa APD operator tersedia (helm, kacamata las, sarung tangan)"},
            {"item": "Verifikasi sistem alarm dan emergency stop berfungsi"},
            {"item": "Cek kondisi scrap bucket — tidak ada kerusakan"},
        ],
    },
    {
        "title": "Checklist Inspeksi Harian Rolling Mill",
        "department": "Production",
        "area": "Rolling Mill",
        "items": [
            {"item": "Cek kondisi roll — tidak ada retakan atau keausan berlebih"},
            {"item": "Periksa sistem pelumasan roll (level oli, tidak ada kebocoran)"},
            {"item": "Verifikasi alignment roll guide — toleransi ≤ 0.5mm"},
            {"item": "Cek suhu tungku pemanas billet ≥ 1100°C sebelum rolling"},
            {"item": "Inspeksi conveyor dan roller table — tidak ada benda asing"},
            {"item": "Periksa sistem pendingin air roll — tekanan ≥ 4 bar"},
            {"item": "Cek kondisi shear blade (gunting billet) — tajam dan tidak aus"},
            {"item": "Verifikasi panel kontrol rolling — tidak ada alarm aktif"},
            {"item": "Periksa area sekitar mill dari bahaya fisik (kabel, selang)"},
            {"item": "Konfirmasi jadwal produksi H-Beam dengan supervisor"},
        ],
    },
    {
        "title": "Checklist K3 Awal Shift — Semua Area",
        "department": None,
        "area": None,
        "items": [
            {"item": "Absensi seluruh anggota shift sudah lengkap"},
            {"item": "Serah terima shift dengan operator sebelumnya sudah dilakukan"},
            {"item": "Buku log shift telah ditandatangani"},
            {"item": "APD lengkap tersedia di area kerja (helm, safety shoes, sarung tangan)"},
            {"item": "APAR (Alat Pemadam Api Ringan) siap dan tidak kadaluarsa"},
            {"item": "Jalur evakuasi darurat tidak terhalang"},
            {"item": "Kondisi cuaca dicek (jika ada pekerjaan outdoor)"},
            {"item": "Tool box meeting K3 sudah dilaksanakan"},
        ],
    },
    {
        "title": "Checklist Quality Control — Inspeksi Produk H-Beam",
        "department": "Quality",
        "area": "QC Lab",
        "items": [
            {"item": "Pengukuran dimensi: tinggi (h), lebar flange (b), tebal web (tw), tebal flange (tf)"},
            {"item": "Pengukuran panjang produk — toleransi ± 50mm dari target"},
            {"item": "Inspeksi visual permukaan — tidak ada retak, lipatan, atau cacat permukaan"},
            {"item": "Cek kelurusan produk (camber) — max 0.1% dari panjang"},
            {"item": "Pengambilan sampel uji tarik (tensile test) — 1 per heat"},
            {"item": "Pengambilan sampel uji komposisi kimia (spectrometer)"},
            {"item": "Penandaan/marking produk dengan heat number sudah dilakukan"},
            {"item": "Dokumentasi hasil inspeksi ke sistem QCIS sudah diinput"},
        ],
    },
    {
        "title": "Checklist Perawatan Preventif Crane Overhead",
        "department": "Maintenance",
        "area": "General",
        "items": [
            {"item": "Cek tali kawat (wire rope) — tidak ada strand putus, korosi"},
            {"item": "Pelumasan hook block dan roda rel"},
            {"item": "Uji fungsi tombol emergency stop"},
            {"item": "Periksa rem elektromotor — tidak ada slip saat beban maksimum"},
            {"item": "Cek kondisi rel overhead — tidak ada keausan atau deformasi"},
            {"item": "Inspeksi limit switch atas dan bawah berfungsi normal"},
            {"item": "Verifikasi kapasitas beban (SWL) tertera dan jelas"},
            {"item": "Dokumentasi hasil pemeriksaan di buku log crane"},
        ],
    },
]


# ─── 3. DAILY CHECKLISTS (EXAMPLE SUBMISSIONS) ────────────────────────────────

DAILY_CHECKLISTS = [
    # Checklist normal (semua OK)
    {
        "user_index": 1,  # budi.santoso (operator EAF)
        "title": "Inspeksi Pagi EAF — Shift 1 (06:00)",
        "items": [
            {"item": "Cek kondisi elektroda (tidak retak, panjang memadai)", "status": "OK", "notes": "Elektroda heat 3 tersisa 40cm, perlu penggantian besok"},
            {"item": "Periksa sistem pendingin air elektroda — tidak ada kebocoran", "status": "OK", "notes": None},
            {"item": "Cek tekanan udara kompresor ≥ 6 bar", "status": "OK", "notes": "Tekanan 6.8 bar"},
            {"item": "Inspeksi refraktori furnace — tidak ada kerusakan bata tahan api", "status": "OK", "notes": None},
            {"item": "Verifikasi sistem dust collection (dedusting) aktif", "status": "OK", "notes": None},
            {"item": "Cek level trafo — suhu oli trafo < 75°C", "status": "OK", "notes": "Suhu 62°C, normal"},
            {"item": "Pastikan area kerja bersih dari scrap berserakan", "status": "OK", "notes": None},
            {"item": "Periksa APD operator tersedia (helm, kacamata las, sarung tangan)", "status": "OK", "notes": None},
            {"item": "Verifikasi sistem alarm dan emergency stop berfungsi", "status": "OK", "notes": None},
            {"item": "Cek kondisi scrap bucket — tidak ada kerusakan", "status": "OK", "notes": None},
        ],
        "ai_analysis": None,
        "days_ago": 0,
    },
    # Checklist dengan FAIL items (scenario untuk demo AI alert)
    {
        "user_index": 1,  # budi.santoso
        "title": "Inspeksi Sore EAF — Shift 2 (14:00)",
        "items": [
            {"item": "Cek kondisi elektroda (tidak retak, panjang memadai)", "status": "FAIL", "notes": "Elektroda No.2 retak di bagian pin joint, butuh penggantian segera"},
            {"item": "Periksa sistem pendingin air elektroda — tidak ada kebocoran", "status": "FAIL", "notes": "Ada rembesan kecil di fleksibel hose pendingin elektroda No.2"},
            {"item": "Cek tekanan udara kompresor ≥ 6 bar", "status": "OK", "notes": "Tekanan 7.1 bar"},
            {"item": "Inspeksi refraktori furnace — tidak ada kerusakan bata tahan api", "status": "OK", "notes": None},
            {"item": "Verifikasi sistem dust collection (dedusting) aktif", "status": "OK", "notes": None},
            {"item": "Cek level trafo — suhu oli trafo < 75°C", "status": "OK", "notes": "Suhu 68°C"},
            {"item": "Pastikan area kerja bersih dari scrap berserakan", "status": "OK", "notes": None},
            {"item": "Periksa APD operator tersedia (helm, kacamata las, sarung tangan)", "status": "OK", "notes": None},
            {"item": "Verifikasi sistem alarm dan emergency stop berfungsi", "status": "OK", "notes": None},
            {"item": "Cek kondisi scrap bucket — tidak ada kerusakan", "status": "OK", "notes": None},
        ],
        "ai_analysis": (
            "⚠️ PERINGATAN KESELAMATAN — Ditemukan 2 item FAIL yang berpotensi bahaya:\n\n"
            "**1. Elektroda No.2 Retak pada Pin Joint**\n"
            "Tingkat risiko: TINGGI. Elektroda retak berpotensi patah saat proses smelting berlangsung, "
            "dapat menyebabkan percikan api besar dan bahaya bagi operator. "
            "**Tindakan segera:** Hentikan penggunaan EAF, hubungi tim maintenance untuk penggantian elektroda "
            "sebelum heat berikutnya dimulai.\n\n"
            "**2. Rembesan pada Flexible Hose Pendingin**\n"
            "Tingkat risiko: SEDANG-TINGGI. Kebocoran sistem pendingin dapat menyebabkan overheat elektroda "
            "dan berpotensi water-electrode explosion jika air masuk ke furnace saat proses smelting. "
            "**Tindakan segera:** Isolasi valve air pendingin elektroda No.2, pasang sealant sementara, "
            "dan jadwalkan penggantian hose dalam 24 jam.\n\n"
            "**Rekomendasi:** Laporkan ke Supervisor Shift dan tim Maintenance segera. "
            "Dokumentasikan kondisi dengan foto sebelum perbaikan."
        ),
        "days_ago": 1,
    },
    # Checklist Rolling Mill
    {
        "user_index": 2,  # sari.dewi (operator Rolling Mill)
        "title": "Inspeksi Pagi Rolling Mill — Shift 1",
        "items": [
            {"item": "Cek kondisi roll — tidak ada retakan atau keausan berlebih", "status": "OK", "notes": None},
            {"item": "Periksa sistem pelumasan roll (level oli, tidak ada kebocoran)", "status": "OK", "notes": "Level oli 80%, normal"},
            {"item": "Verifikasi alignment roll guide — toleransi ≤ 0.5mm", "status": "OK", "notes": "Alignment 0.3mm, OK"},
            {"item": "Cek suhu tungku pemanas billet ≥ 1100°C sebelum rolling", "status": "OK", "notes": "Suhu tungku 1180°C"},
            {"item": "Inspeksi conveyor dan roller table — tidak ada benda asing", "status": "OK", "notes": None},
            {"item": "Periksa sistem pendingin air roll — tekanan ≥ 4 bar", "status": "FAIL", "notes": "Tekanan hanya 3.2 bar, filter kemungkinan tersumbat"},
            {"item": "Cek kondisi shear blade (gunting billet) — tajam dan tidak aus", "status": "OK", "notes": None},
            {"item": "Verifikasi panel kontrol rolling — tidak ada alarm aktif", "status": "OK", "notes": None},
            {"item": "Periksa area sekitar mill dari bahaya fisik (kabel, selang)", "status": "OK", "notes": None},
            {"item": "Konfirmasi jadwal produksi H-Beam dengan supervisor", "status": "OK", "notes": "Target 120 ton H-Beam 200x200"},
        ],
        "ai_analysis": (
            "⚠️ PERINGATAN — Item FAIL terdeteksi:\n\n"
            "**Tekanan Air Pendingin Roll Rendah (3.2 bar dari minimal 4 bar)**\n"
            "Tingkat risiko: SEDANG. Tekanan pendingin di bawah standar dapat menyebabkan overheat pada roll, "
            "mempersingkat umur roll, dan berpotensi menyebabkan thermal crack. "
            "Jika dibiarkan, roll bisa meledak saat terkena billet panas.\n\n"
            "**Tindakan yang Disarankan:**\n"
            "1. Periksa dan bersihkan filter air pendingin\n"
            "2. Cek kondisi pompa pendingin — kemungkinan pompa mulai aus\n"
            "3. Hubungi tim Maintenance untuk inspeksi sistem pendingin\n"
            "4. Jangan mulai rolling dengan kondisi pendingin di bawah standar\n\n"
            "**Referensi SOP:** SOP Sistem Pendingin Rolling Mill Rev.3"
        ),
        "days_ago": 0,
    },
    # Checklist K3
    {
        "user_index": 3,  # ahmad.fauzi
        "title": "Checklist K3 Awal Shift — Area Warehouse",
        "items": [
            {"item": "Absensi seluruh anggota shift sudah lengkap", "status": "OK", "notes": "8 dari 8 hadir"},
            {"item": "Serah terima shift dengan operator sebelumnya sudah dilakukan", "status": "OK", "notes": None},
            {"item": "Buku log shift telah ditandatangani", "status": "OK", "notes": None},
            {"item": "APD lengkap tersedia di area kerja (helm, safety shoes, sarung tangan)", "status": "OK", "notes": None},
            {"item": "APAR (Alat Pemadam Api Ringan) siap dan tidak kadaluarsa", "status": "FAIL", "notes": "APAR di titik W-3 kadaluarsa bulan lalu, belum diganti"},
            {"item": "Jalur evakuasi darurat tidak terhalang", "status": "OK", "notes": None},
            {"item": "Kondisi cuaca dicek (jika ada pekerjaan outdoor)", "status": "OK", "notes": "Cuaca cerah, tidak ada peringatan"},
            {"item": "Tool box meeting K3 sudah dilaksanakan", "status": "OK", "notes": None},
        ],
        "ai_analysis": (
            "🚨 TEMUAN K3 — TINDAK LANJUT WAJIB:\n\n"
            "**APAR Titik W-3 Kadaluarsa**\n"
            "Status: TIDAK SESUAI dengan regulasi K3 (Permenaker No. 02/Men/1983).\n"
            "APAR kadaluarsa berpotensi tidak berfungsi saat diperlukan dalam situasi darurat kebakaran.\n\n"
            "**Tindakan Wajib Hari Ini:**\n"
            "1. Tandai APAR W-3 dengan label 'TIDAK LAYAK PAKAI'\n"
            "2. Hubungi bagian HSE/K3 untuk penggantian segera\n"
            "3. Pastikan APAR terdekat yang masih valid (W-2 atau W-4) siap diakses\n"
            "4. Catat temuan ini dalam laporan K3 harian\n"
            "5. Lakukan pelatihan singkat lokasi APAR kepada seluruh tim\n\n"
            "**Catatan Audit:** Temuan ini akan tercatat untuk review inspeksi ISO 45001."
        ),
        "days_ago": 2,
    },
]


# ─── 4. WORK JOURNALS ─────────────────────────────────────────────────────────

WORK_JOURNALS = [
    {
        "user_index": 1,  # budi.santoso — operator EAF
        "title": "Troubleshooting: Elektroda Patah Mendadak saat Heat ke-3",
        "content": (
            "Hari ini mengalami kejadian elektroda patah (electrode breakage) saat tengah-tengah proses "
            "heat ke-3. Ini terjadi sekitar pukul 10.15 WIB.\n\n"
            "Kronologi:\n"
            "- Pukul 10.00: Heat ke-3 dimulai, scrap loading normal\n"
            "- Pukul 10.15: Terdengar suara 'KRAK' keras, power langsung drop dari 35MW ke 0\n"
            "- Identifikasi: Elektroda No.1 patah di posisi sekitar 30cm dari pin joint\n"
            "- Dugaan penyebab: Elektroda sudah terlalu pendek (≤35cm) dan thermal shock akibat "
            "scrap basah yang terselip di bucket\n\n"
            "Tindakan yang dilakukan:\n"
            "1. Emergency shutdown prosedur standar dijalankan\n"
            "2. Cooling period 45 menit sebelum bisa masuk ke area EAF\n"
            "3. Penggantian elektroda baru memakan waktu 2.5 jam\n"
            "4. Heat ke-3 dilanjutkan pukul 13.00, selesai normal\n\n"
            "Lesson learned: Pastikan minimal panjang elektroda tidak kurang dari 40cm. "
            "Lakukan visual check scrap bucket lebih teliti untuk mendeteksi scrap basah "
            "sebelum charging. Suara 'mendesis' saat arc adalah tanda awal scrap basah."
        ),
        "department": "Production",
        "area": "EAF",
        "category": "EAF Operation",
        "tags": ["elektroda", "troubleshooting", "electrode breakage", "scrap", "EAF"],
        "difficulty": "critical",
        "ai_summary": (
            "Operator menangani insiden electrode breakage pada EAF heat ke-3 akibat elektroda terlalu pendek "
            "dan kemungkinan scrap basah. Proses recovery memakan 2.5 jam, heat dilanjutkan sore hari."
        ),
        "ai_lessons_learned": (
            "Batasan kritis: Elektroda tidak boleh dioperasikan di bawah panjang 40cm. "
            "Inspeksi scrap bucket wajib lebih teliti untuk mendeteksi kelembapan. "
            "Tanda awal electrode stress: suara mendesis tidak normal saat proses arc."
        ),
        "ai_related_sops": "SOP Penggantian Elektroda EAF Rev.5, SOP Emergency Shutdown EAF, Checklist Inspeksi Elektroda",
        "days_ago": 1,
    },
    {
        "user_index": 1,  # budi.santoso
        "title": "Setting Optimal Power Schedule H-Beam 300x300 — Trial Baru",
        "content": (
            "Hari ini melakukan trial power schedule baru untuk produksi H-Beam 300x300 "
            "sesuai instruksi dari Dept. Metallurgy.\n\n"
            "Power Schedule yang dicoba:\n"
            "- Phase 1 (Bore Down): 25MW selama 8 menit\n"
            "- Phase 2 (Meltdown): 38MW selama 22 menit\n"
            "- Phase 3 (Refining): 30MW selama 12 menit\n"
            "- Total heat time: 42 menit (lebih cepat 5 menit dari schedule lama)\n\n"
            "Hasil:\n"
            "- Temperatur tap: 1625°C (target 1610-1640°C) ✓\n"
            "- Komposisi kimia: C 0.16%, Mn 0.82%, Si 0.21% — masuk spesifikasi ✓\n"
            "- Konsumsi elektroda: 2.1 kg/ton (turun dari 2.4 kg/ton) ✓\n"
            "- Konsumsi energi: 340 kWh/ton (lebih efisien dari target 360 kWh/ton) ✓\n\n"
            "Rekomendasi: Power schedule baru ini lebih efisien. Usulkan ke supervisor untuk "
            "dijadikan standar baru H-Beam 300x300."
        ),
        "department": "Production",
        "area": "EAF",
        "category": "EAF Operation",
        "tags": ["power schedule", "H-Beam 300x300", "efisiensi energi", "elektroda", "metallurgy"],
        "difficulty": "troubleshooting",
        "ai_summary": (
            "Trial power schedule EAF baru untuk H-Beam 300x300 berhasil menghasilkan heat 5 menit lebih cepat, "
            "dengan konsumsi elektroda 12% lebih hemat dan energi 5% lebih efisien. Semua target kualitas terpenuhi."
        ),
        "ai_lessons_learned": (
            "Power schedule baru terbukti lebih efisien: Phase 2 Meltdown 38MW selama 22 menit optimal untuk H-Beam 300. "
            "Konsumsi elektroda dan energi turun signifikan tanpa mengorbankan kualitas. "
            "Penting untuk dokumentasikan sebagai standar baru."
        ),
        "ai_related_sops": "SOP EAF Power Schedule, Spesifikasi Teknis H-Beam 300x300, Standar Komposisi Kimia Baja Profil",
        "days_ago": 3,
    },
    {
        "user_index": 2,  # sari.dewi — operator Rolling Mill
        "title": "Penyebab Cacat Surface 'Lap' pada H-Beam 200x200 — Investigasi dan Solusi",
        "content": (
            "Ditemukan cacat permukaan tipe 'lap' (lipatan) pada batch H-Beam 200x200 "
            "heat 240605-07. Sekitar 8% produksi heat tersebut reject karena cacat ini.\n\n"
            "Gejala: Lipatan memanjang di sepanjang web bagian tengah, terlihat seperti garis "
            "paralel pada permukaan baja.\n\n"
            "Investigasi penyebab:\n"
            "1. Cek temperatur billet masuk rolling: 1090°C (terlalu rendah — target ≥1100°C)\n"
            "2. Cek alignment roll pass: ditemukan misalignment 1.2mm pada pass ke-4 (H4)\n"
            "3. Review log tungku: furnace heating rate terlalu cepat, billet core belum rata panas\n\n"
            "Root cause: Kombinasi temperatur billet tidak merata (kulit sudah 1090°C tapi "
            "inti masih sekitar 1050°C) dengan misalignment H4 menyebabkan material tidak mengalir "
            "sempurna saat deformasi.\n\n"
            "Tindakan perbaikan:\n"
            "1. Set soaking time tungku minimum 25 menit untuk billet 200x200\n"
            "2. Koreksi alignment H4 ke 0.3mm\n"
            "3. Cek dan verifikasi: batch berikutnya 0% reject\n\n"
            "Ini informasi penting yang belum ada di SOP — perlu dimasukkan ke dokumen resmi."
        ),
        "department": "Production",
        "area": "Rolling Mill",
        "category": "Quality Control",
        "tags": ["lap defect", "H-Beam 200x200", "rolling mill", "cacat permukaan", "billet temperature"],
        "difficulty": "troubleshooting",
        "ai_summary": (
            "Investigasi cacat 'lap' pada H-Beam 200x200: root cause adalah billet undertemperature (1090°C vs target 1100°C) "
            "dan misalignment roll H4 sebesar 1.2mm. Solusi: perpanjang soaking time dan koreksi alignment."
        ),
        "ai_lessons_learned": (
            "Billet 200x200 memerlukan soaking time minimal 25 menit untuk memastikan panas merata hingga inti. "
            "Misalignment > 0.8mm pada pass H4 dapat menyebabkan lap defect meski temperatur cukup. "
            "Kedua faktor ini harus dikontrol bersamaan untuk menghindari reject."
        ),
        "ai_related_sops": "SOP Pengoperasian Tungku Pemanas Billet, SOP Inspeksi Roll Alignment, Standar Reject Rate H-Beam",
        "days_ago": 2,
    },
    {
        "user_index": 3,  # ahmad.fauzi — warehouse/logistik
        "title": "Optimasi Layout Gudang Produk Jadi — Implementasi FIFO Sistem Baru",
        "content": (
            "Hari ini berhasil implementasi sistem FIFO (First In First Out) baru untuk "
            "gudang produk jadi H-Beam, setelah 2 minggu perencanaan.\n\n"
            "Masalah sebelumnya:\n"
            "- Sering terjadi produk H-Beam yang lebih lama tersimpan tapi keluar belakangan\n"
            "- Pelanggan mengeluhkan ada produk yang 'umur' gudangnya sudah >60 hari\n"
            "- Tim forklift bingung dengan penempatan yang tidak sistematis\n\n"
            "Solusi yang diimplementasikan:\n"
            "1. Pembagian zona gudang berdasarkan tanggal produksi (4 zona mingguan)\n"
            "2. Kode warna tag pada setiap bundel: Hijau (<2 minggu), Kuning (2-4 minggu), "
            "Merah (>4 minggu)\n"
            "3. Aturan wajib: forklift HARUS ambil dari zona paling tua/merah dulu\n"
            "4. Update sistem barcode scanner untuk tracking otomatis\n\n"
            "Hasil setelah implementasi hari pertama:\n"
            "- 3 bundel H-Beam berusia >45 hari ditemukan dan diprioritaskan untuk pengiriman\n"
            "- Tim forklift lebih mudah orientasi\n"
            "- Proses picking 20% lebih cepat\n\n"
            "Ini adalah pengetahuan operasional yang perlu dibagikan ke supervisor gudang lain."
        ),
        "department": "Warehouse",
        "area": "Finished Goods",
        "category": "Warehouse",
        "tags": ["FIFO", "gudang", "H-Beam", "inventory management", "sistem kode warna"],
        "difficulty": "routine",
        "ai_summary": (
            "Implementasi sistem FIFO berwarna di gudang produk jadi berhasil meningkatkan efisiensi picking 20% "
            "dan memastikan produk yang lebih lama keluar lebih dulu, mengurangi risiko produk menginap terlalu lama."
        ),
        "ai_lessons_learned": (
            "Sistem kode warna sederhana (Hijau/Kuning/Merah) jauh lebih efektif daripada aturan tertulis yang kompleks. "
            "FIFO yang efektif butuh pembagian zona fisik yang jelas, bukan hanya pencatatan digital. "
            "Selalu audit produk berumur >30 hari setiap minggu."
        ),
        "ai_related_sops": "SOP Manajemen Gudang Produk Jadi, Prosedur Pengiriman H-Beam, Standar Penandaan Produk",
        "days_ago": 0,
    },
    {
        "user_index": 4,  # rizky.pratama — maintenance
        "title": "Penggantian Bearing Roll Stand H4 — Teknik Baru Tanpa Harus Buka Full Assembly",
        "content": (
            "Berhasil menemukan cara lebih cepat untuk mengganti bearing di Roll Stand H4 "
            "tanpa harus membuka seluruh assembly. Ini bisa menghemat waktu downtime secara signifikan.\n\n"
            "Latar belakang:\n"
            "Prosedur standar penggantian bearing H4 selama ini membutuhkan 8 jam downtime "
            "karena harus membuka full assembly termasuk housing dan coupling.\n\n"
            "Teknik baru yang ditemukan:\n"
            "1. Longgarkan baut housing sisi operator (bukan drive side)\n"
            "2. Geser housing 15cm ke samping — cukup untuk akses bearing\n"
            "3. Gunakan bearing puller hydraulic 20-ton dari sisi operator\n"
            "4. Pasang bearing baru tanpa melepas coupling drive\n"
            "5. Gunakan induction heater untuk memudahkan instalasi bearing baru\n\n"
            "Hasil:\n"
            "- Waktu penggantian: 3.5 jam (hemat 4.5 jam dari prosedur lama!)\n"
            "- Kualitas sama — pengukuran clearance bearing 0.05mm (sesuai spec)\n"
            "- Sudah dilakukan 2x dengan hasil konsisten\n\n"
            "Teknik ini belum terdokumentasi di SOP manapun. Perlu segera didokumentasikan "
            "dan disetujui oleh Chief Maintenance untuk dijadikan prosedur resmi."
        ),
        "department": "Maintenance",
        "area": "Rolling Mill",
        "category": "Maintenance",
        "tags": ["bearing replacement", "roll stand H4", "downtime reduction", "maintenance", "teknik baru"],
        "difficulty": "troubleshooting",
        "ai_summary": (
            "Tim maintenance menemukan teknik penggantian bearing Roll Stand H4 yang 56% lebih cepat (3.5 jam vs 8 jam) "
            "dengan menggeser housing sisi operator tanpa membuka full assembly. Sudah divalidasi 2x."
        ),
        "ai_lessons_learned": (
            "Housing sisi operator bisa digeser 15cm untuk akses bearing tanpa melepas coupling drive. "
            "Induction heater wajib untuk instalasi bearing baru — mempermudah pemasangan dan mengurangi risiko kerusakan. "
            "Teknik ini potensial diaplikasikan ke Roll Stand serupa (H2, H6)."
        ),
        "ai_related_sops": "SOP Penggantian Bearing Rolling Mill, SOP Penggunaan Bearing Puller Hydraulic, Jadwal Preventive Maintenance Roll Stand",
        "days_ago": 4,
    },
]


# ─── 5. WORKFLOWS / SOP ───────────────────────────────────────────────────────

WORKFLOWS = [
    {
        "user_index": 1,  # budi.santoso
        "title": "Prosedur Penggantian Elektroda EAF saat Proses Berjalan (Hot Replacement)",
        "description": "Cara mengganti elektroda yang patah atau habis saat furnace dalam kondisi hot standby, meminimalkan downtime.",
        "category": "Maintenance",
        "department": "Production",
        "area": "EAF",
        "steps": [
            {"step": 1, "action": "Aktifkan prosedur emergency shutdown: turunkan power ke 0MW, buka breaker utama", "notes": "WAJIB: konfirmasi dengan operator panel bahwa power sudah 0", "duration": "5 menit"},
            {"step": 2, "action": "Naikkan elektroda ke posisi atas penuh menggunakan hydraulic arm", "notes": "Tunggu hingga elektroda berhenti sepenuhnya sebelum lanjut", "duration": "3 menit"},
            {"step": 3, "action": "Pasang interlock mekanis pada hydraulic arm — pastikan terkunci", "notes": "Interlock wajib dipasang SEBELUM siapapun masuk ke area EAF", "duration": "2 menit"},
            {"step": 4, "action": "Cooling period — tunggu elektroda dingin minimal 30 menit (gunakan pyrometer: < 300°C)", "notes": "Jangan percaya perkiraan visual. Gunakan pyrometer!", "duration": "30 menit"},
            {"step": 5, "action": "Kenakan APD lengkap: face shield, aluminized jacket, gloves anti-heat, safety boots", "notes": "APD ini wajib bahkan jika merasa sudah dingin", "duration": "5 menit"},
            {"step": 6, "action": "Pasang sling crane pada elektroda lama, kencangkan dengan aman", "notes": "Load test sling sebelum digunakan", "duration": "10 menit"},
            {"step": 7, "action": "Lepaskan pin joint elektroda menggunakan kunci torsi hydraulic 800 Nm", "notes": "Dua orang diperlukan: satu memutar, satu menjaga kestabilan elektroda", "duration": "15 menit"},
            {"step": 8, "action": "Turunkan elektroda lama menggunakan crane ke area disposal yang ditentukan", "notes": "Komunikasi via radio dengan operator crane", "duration": "10 menit"},
            {"step": 9, "action": "Pasang elektroda baru: angkat dengan crane, masukkan ke pin joint, kencangkan 800 Nm", "notes": "Cek panjang elektroda baru minimal 150cm sebelum dipasang", "duration": "20 menit"},
            {"step": 10, "action": "Cek visual: elektroda terpasang lurus, tidak ada jarak antara elektroda-nipple", "notes": None, "duration": "5 menit"},
            {"step": 11, "action": "Lepas interlock hydraulic arm, turunkan elektroda ke posisi kerja", "notes": None, "duration": "3 menit"},
            {"step": 12, "action": "Test run tanpa power 2 menit, verifikasi gerakan normal", "notes": None, "duration": "2 menit"},
            {"step": 13, "action": "Prosedur startup: tutup breaker, power up bertahap ke 15MW dulu, monitor 5 menit", "notes": "Jika ada anomali suara/getaran, segera matikan dan investigasi", "duration": "10 menit"},
            {"step": 14, "action": "Dokumentasi: catat nomor seri elektroda baru, panjang, waktu penggantian di logbook", "notes": None, "duration": "5 menit"},
        ],
        "ai_sop_draft": (
            "# SOP PENGGANTIAN ELEKTRODA EAF — HOT REPLACEMENT\n"
            "**Nomor SOP:** GYS-EAF-SOP-003 | **Revisi:** 1 | **Dept:** Production\n\n"
            "## 1. Tujuan\n"
            "Prosedur ini mengatur penggantian elektroda EAF dalam kondisi hot standby "
            "untuk meminimalkan downtime produksi sambil memastikan keselamatan pekerja.\n\n"
            "## 2. Ruang Lingkup\n"
            "Berlaku untuk semua operator EAF dan teknisi maintenance yang melakukan "
            "penggantian elektroda dalam kondisi darurat maupun terjadwal.\n\n"
            "## 3. Peralatan yang Dibutuhkan\n"
            "- Kunci torsi hydraulic (800 Nm)\n- Crane overhead (min. kapasitas 5 ton)\n"
            "- Pyrometer (pengukur suhu infrared)\n- Sling baja bersertifikat\n"
            "- APD: face shield, aluminized jacket, gloves anti-heat\n\n"
            "## 4. Langkah Prosedur\n"
            "[Lihat langkah-langkah detail di atas]\n\n"
            "## 5. Catatan Keselamatan\n"
            "⚠️ BAHAYA UTAMA: Arc flash, logam pijar, gas beracun (CO, SO2)\n"
            "⚠️ Jangan pernah masuk area EAF tanpa interlock terpasang\n"
            "⚠️ Minimum 2 orang untuk setiap penggantian elektroda\n\n"
            "## 6. Catatan Penting\n"
            "Total downtime prosedur ini: ±130 menit. Dokumentasi wajib di logbook setiap penggantian."
        ),
        "ai_safety_notes": (
            "Bahaya utama: Arc flash (potensi fatal), logam pijar, gas beracun CO dan SO2 dari proses smelting. "
            "APD minimum: face shield, aluminized jacket, heat-resistant gloves. "
            "Interlock hydraulic arm WAJIB dipasang sebelum masuk area. "
            "Batas suhu aman: elektroda harus < 300°C sebelum dipegang."
        ),
        "ai_optimization": (
            "Pertimbangkan penggunaan elektroda pre-nippled yang sudah disiapkan sebelumnya untuk mengurangi waktu "
            "langkah 9 dari 20 menit menjadi 10 menit. Siapkan 'electrode change kit' di dekat EAF "
            "untuk mengurangi waktu mencari peralatan."
        ),
        "ai_estimated_time": "±130 menit (termasuk cooling period 30 menit)",
        "tags": ["elektroda", "EAF", "maintenance", "hot replacement", "SOP", "keselamatan"],
        "is_approved": 1,
        "used_count": 7,
    },
    {
        "user_index": 2,  # sari.dewi
        "title": "Setting Roll Pass untuk Produksi H-Beam 200x200 mm",
        "description": "Panduan setting roll guide, alignment, dan parameter rolling untuk memproduksi H-Beam 200x200 dengan kualitas optimal.",
        "category": "Machine Setup",
        "department": "Production",
        "area": "Rolling Mill",
        "steps": [
            {"step": 1, "action": "Ambil roll pass schedule dari sistem PIMS untuk H-Beam 200x200", "notes": "Pastikan schedule yang digunakan adalah revisi terbaru", "duration": "5 menit"},
            {"step": 2, "action": "Set suhu tungku: zona preheating 850°C, zona heating 1100°C, zona soaking 1150°C", "notes": "Soaking time minimum 25 menit untuk billet 200x200", "duration": "60 menit (pemanasan tungku)"},
            {"step": 3, "action": "Setting gap roll Roughing Stand R1 sesuai schedule: gap = 210mm", "notes": "Gunakan feeler gauge untuk verifikasi, bukan hanya skala digital", "duration": "15 menit"},
            {"step": 4, "action": "Setting guide di setiap pass: R1, R2, H1-H6, F1-F3", "notes": "Guide harus simetris — ukur dari kedua sisi", "duration": "30 menit"},
            {"step": 5, "action": "Setting gap roll Finishing Stand F1-F3 sesuai schedule: dimensi final web dan flange", "notes": "F3 adalah pass akhir — paling kritis untuk dimensi final", "duration": "20 menit"},
            {"step": 6, "action": "Billet pertama (dummy pass): masukkan billet test, amati aliran material", "notes": "Hentikan jika billet bengkok atau masuk miring. Koreksi guide sebelum lanjut", "duration": "10 menit"},
            {"step": 7, "action": "Ukur dimensi produk pertama: h, b, tw, tf menggunakan jangka sorong kalibrasi", "notes": "Semua dimensi harus dalam toleransi ± toleransi dari standar SNI", "duration": "10 menit"},
            {"step": 8, "action": "Jika dimensi OK: konfirmasi ke supervisor untuk mulai produksi penuh", "notes": "Dokumentasikan setting parameter aktual di logbook produksi", "duration": "5 menit"},
            {"step": 9, "action": "Monitor produk setiap 20 billet: cek visual dan ukur 1 produk per 20 billet", "notes": "Jika ada tren menyimpang, koreksi segera sebelum reject menumpuk", "duration": "Berkelanjutan"},
        ],
        "ai_sop_draft": (
            "# SOP SETTING ROLL PASS H-BEAM 200x200 MM\n"
            "**Nomor SOP:** GYS-RM-SOP-007 | **Revisi:** 2 | **Dept:** Production\n\n"
            "## 1. Tujuan\n"
            "Memastikan setting rolling mill yang benar untuk produksi H-Beam 200x200 mm "
            "yang memenuhi standar SNI 2610:2011 dan spesifikasi pelanggan.\n\n"
            "## 2. Parameter Kritis\n"
            "- Suhu billet masuk rolling: 1100-1200°C\n"
            "- Soaking time minimum: 25 menit\n"
            "- Kecepatan rolling: 4-6 m/s (pass finishing)\n\n"
            "## 3. Langkah Prosedur\n"
            "[Lihat langkah-langkah detail]\n\n"
            "## 4. Poin Kritis Kualitas\n"
            "- Billet undertemperature (< 1100°C) → risiko lap defect\n"
            "- Misalignment guide > 0.5mm → web bengkok atau cacat edge\n"
            "- Soaking time kurang → temperatur tidak merata → lap/fold defect"
        ),
        "ai_safety_notes": (
            "Bahaya utama: billet pijar 1100°C+, percikan metal, nip point pada roll. "
            "APD wajib: safety shoes, sarung tangan heat-resistant, face shield saat dekat tungku. "
            "Jangan pernah mendorong billet macet dengan tangan — gunakan bar penorong yang sesuai."
        ),
        "ai_optimization": (
            "Siapkan setting sheet H-Beam 200x200 yang sudah diisi sebelumnya berdasarkan produksi sebelumnya. "
            "Ini bisa memotong waktu setup dari 2 jam menjadi 1.5 jam. "
            "Pertimbangkan pembuatan 'first piece inspection checklist' khusus H-Beam 200x200."
        ),
        "ai_estimated_time": "±2 jam (termasuk pemanasan tungku)",
        "tags": ["H-Beam 200x200", "roll setting", "rolling mill", "setup", "SNI"],
        "is_approved": 1,
        "used_count": 15,
    },
]


# ─── 6. APPROVAL REQUESTS ─────────────────────────────────────────────────────

APPROVAL_REQUESTS = [
    {
        "user_index": 3,  # ahmad.fauzi
        "title": "Purchase Order: Penggantian APAR Kadaluarsa — Area Warehouse (12 Unit)",
        "details": (
            "Permohonan pengadaan APAR (Alat Pemadam Api Ringan) untuk mengganti unit yang kadaluarsa "
            "di area Warehouse Produk Jadi.\n\n"
            "Detail Kebutuhan:\n"
            "- Jenis: APAR ABC Powder 6 kg\n"
            "- Jumlah: 12 unit\n"
            "- Merek rekomendasi: Yamato Fire Fighting Pro atau setara\n"
            "- Sertifikasi: SNI, BSNI, NFPA\n\n"
            "Justifikasi:\n"
            "APAR di 12 titik area Warehouse sudah melampaui masa pakai 5 tahun (terakhir diisi ulang 2019). "
            "Hasil inspeksi K3 tanggal 9 Juni 2026 menemukan 3 unit sudah kadaluarsa dan tidak layak pakai. "
            "Ini berpotensi menjadi temuan non-conformance saat audit ISO 45001 bulan depan.\n\n"
            "Estimasi Biaya: Rp 4.500.000 (12 unit × Rp 375.000/unit)\n"
            "Vendor: CV Sumber Api Jaya (vendor terdaftar GYS)\n"
            "Delivery: 3-5 hari kerja\n\n"
            "Urgensi: TINGGI — Diperlukan sebelum audit ISO 45001 dijadwalkan tanggal 20 Juni 2026."
        ),
        "request_type": "purchase",
        "status": "pending",
        "ai_assessment": (
            "📋 ANALISIS AI — PURCHASE REQUEST\n\n"
            "**Risiko Regulasi:** TINGGI\n"
            "APAR kadaluarsa merupakan pelanggaran Permenaker No. 02/Men/1983 dan persyaratan "
            "ISO 45001:2018 Klausul 8.1. Temuan ini dalam audit akan menghasilkan NCR (Non-Conformance Report) "
            "yang dapat berdampak pada sertifikasi ISO 45001 GYS.\n\n"
            "**Kewajaran Harga:** WAJAR\n"
            "Harga Rp 375.000/unit untuk APAR ABC 6 kg bersertifikasi SNI adalah harga pasar yang wajar "
            "(rata-rata pasar Rp 350.000-420.000/unit). Tidak ada indikasi over-pricing.\n\n"
            "**Rekomendasi AI:** SETUJUI dengan catatan:\n"
            "1. Minta tiga penawaran harga (perbandingan vendor) sesuai SOP Procurement\n"
            "2. Pastikan APAR yang dipesan memiliki sertifikat SNI yang valid\n"
            "3. Jadwalkan inspeksi dan training penggunaan APAR setelah pengiriman\n"
            "4. Buat jadwal inspeksi APAR rutin 6 bulan untuk semua area"
        ),
    },
    {
        "user_index": 4,  # rizky.pratama
        "title": "Approval: Update SOP Penggantian Bearing Roll Stand H4 — Metode Baru (Rev.2)",
        "details": (
            "Permohonan persetujuan untuk update SOP Penggantian Bearing Roll Stand H4 dari Rev.1 ke Rev.2, "
            "berdasarkan penemuan teknik baru yang lebih efisien.\n\n"
            "Perubahan yang Diusulkan (Rev.2 vs Rev.1):\n\n"
            "Rev.1 (Prosedur Lama):\n"
            "- Buka full assembly termasuk coupling drive\n"
            "- Waktu downtime: 8 jam\n"
            "- Diperlukan 4 orang\n\n"
            "Rev.2 (Prosedur Baru — Diusulkan):\n"
            "- Geser housing sisi operator 15cm tanpa lepas coupling drive\n"
            "- Waktu downtime: 3.5 jam (hemat 56%)\n"
            "- Diperlukan 3 orang\n"
            "- Menggunakan induction heater untuk instalasi bearing\n\n"
            "Validasi:\n"
            "Teknik ini sudah divalidasi 2x pada tanggal 2 Juni 2026 dan 7 Juni 2026. "
            "Hasil pengukuran clearance bearing: 0.05mm (sesuai spec Timken ≤ 0.08mm). "
            "Tidak ada keluhan operasional setelah penggantian.\n\n"
            "Dokumen Pendukung:\n"
            "- Laporan validasi (terlampir di sistem)\n"
            "- Foto step-by-step prosedur\n"
            "- Data pengukuran bearing clearance\n\n"
            "Mohon persetujuan Chief Maintenance untuk dijadikan SOP resmi."
        ),
        "request_type": "workflow",
        "status": "approved",
        "ai_assessment": (
            "📋 ANALISIS AI — PERMINTAAN UPDATE SOP\n\n"
            "**Penilaian Teknis:** POSITIF\n"
            "Teknik yang diusulkan secara prinsip valid: menggeser housing operator untuk akses bearing "
            "tanpa melepas coupling drive adalah pendekatan yang digunakan di industri baja modern. "
            "Penghematan waktu 56% sangat signifikan untuk operasional produksi.\n\n"
            "**Validasi:** CUKUP\n"
            "Dua kali validasi dengan hasil pengukuran clearance 0.05mm (dalam spec Timken ≤ 0.08mm) "
            "menunjukkan teknik ini menghasilkan kualitas pemasangan yang baik.\n\n"
            "**Risiko:** RENDAH-SEDANG\n"
            "Risiko utama: memastikan housing dapat dikembalikan ke posisi sempurna setelah penggantian. "
            "Rekomendasi: tambahkan langkah verifikasi alignment housing setelah penggantian.\n\n"
            "**Rekomendasi AI:** SETUJUI dengan catatan:\n"
            "1. Tambahkan langkah verifikasi alignment housing dengan dial indicator\n"
            "2. Sertakan foto/video ilustrasi di SOP untuk memudahkan training\n"
            "3. Evaluasi kembali setelah 5x penerapan untuk data lebih kuat"
        ),
    },
    {
        "user_index": 2,  # sari.dewi
        "title": "Kontrak Kerjasama Pengujian NDT Eksternal — PT Inspeksi Nusa Mandiri",
        "details": (
            "Permohonan persetujuan kontrak kerjasama pengujian Non-Destructive Testing (NDT) "
            "dengan PT Inspeksi Nusa Mandiri untuk kebutuhan inspeksi crane overhead tahunan.\n\n"
            "Lingkup Pekerjaan:\n"
            "- Uji NDT (UT dan MT) pada wire rope, hook block, dan struktur girder crane\n"
            "- Jumlah crane: 24 unit (semua crane overhead di area produksi)\n"
            "- Frekuensi: 1x per tahun + on-call untuk kasus khusus\n\n"
            "Detail Kontrak:\n"
            "- Nilai kontrak: Rp 185.000.000/tahun\n"
            "- Masa berlaku: 1 tahun (Juni 2026 - Mei 2027)\n"
            "- Vendor: PT Inspeksi Nusa Mandiri (sudah terdaftar dan pre-qualified)\n"
            "- Sertifikasi vendor: ISO 9001:2015, IACS, Kemenaker\n\n"
            "Justifikasi:\n"
            "Regulasi Permenaker No. 8 Tahun 2020 mewajibkan inspeksi NDT crane oleh pihak "
            "ketiga yang bersertifikat setiap tahun. Kontrak ini memastikan kepatuhan regulasi "
            "dan keselamatan operasional crane.\n\n"
            "Perbandingan vendor sudah dilakukan — PT Inspeksi Nusa Mandiri menawarkan harga "
            "kompetitif dengan track record baik (sudah 3 tahun bermitra dengan GYS)."
        ),
        "request_type": "contract",
        "status": "pending",
        "ai_assessment": (
            "📋 ANALISIS AI — REVIEW KONTRAK\n\n"
            "**Kepatuhan Regulasi:** WAJIB\n"
            "Inspeksi NDT crane oleh pihak ketiga bersertifikat adalah kewajiban regulasi "
            "(Permenaker No. 8/2020). Tidak ada opsi untuk tidak melakukan ini tanpa risiko "
            "sanksi dan pencabutan izin operasional crane.\n\n"
            "**Kewajaran Nilai Kontrak:**\n"
            "Rp 185.000.000 untuk 24 crane (±Rp 7.7 juta/crane/tahun) adalah harga yang wajar "
            "untuk lingkup UT + MT inspection. Harga pasar berkisar Rp 6-10 juta per crane per tahun.\n\n"
            "**Risiko Kontrak:** RENDAH\n"
            "- Vendor sudah 3 tahun bermitra dengan GYS — track record terbukti\n"
            "- Sertifikasi vendor lengkap dan valid\n"
            "- Cakupan on-call adalah nilai tambah yang mengurangi risiko downtime\n\n"
            "**Rekomendasi AI:** SETUJUI — dengan memastikan:\n"
            "1. Klausul penalti keterlambatan delivery laporan NDT (rekomendasi: 0.1%/hari)\n"
            "2. Hak audit GYS terhadap prosedur pengujian vendor\n"
            "3. Jaminan liability jika ditemukan ketidaksesuaian pasca inspeksi\n"
            "4. Klausul terminasi kontrak dengan notice 30 hari\n\n"
            "**Poin Legal Perhatikan:** Pastikan sertifikasi Kemenaker vendor masih valid "
            "minimal 1 tahun ke depan sebelum penandatanganan kontrak."
        ),
    },
]


# ─── SEED FUNCTIONS ───────────────────────────────────────────────────────────

def _seed_users(db: Session) -> list:
    """Seed demo users. Returns list of user objects in same order as DEMO_USERS."""
    from models.user import User, RoleEnum
    from services.auth import get_password_hash

    user_objects = []
    for u in DEMO_USERS:
        existing = db.query(User).filter(User.username == u["username"]).first()
        if existing:
            logger.info(f"[Users] Skipping existing user: {u['username']}")
            user_objects.append(existing)
        else:
            user = User(
                username=u["username"],
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role=RoleEnum(u["role"]),
                is_ldap_user=False,
                display_name=u["display_name"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            user_objects.append(user)
            logger.info(f"[Users] Created: {u['username']} ({u['role']})")
    return user_objects


def _seed_checklist_templates(db: Session, users: list) -> list:
    """Seed checklist templates. Returns list of template objects."""
    from models.checklist import ChecklistTemplate

    template_objects = []
    for t in CHECKLIST_TEMPLATES:
        existing = db.query(ChecklistTemplate).filter(
            ChecklistTemplate.title == t["title"]
        ).first()
        if existing:
            logger.info(f"[Templates] Skipping: {t['title'][:50]}")
            template_objects.append(existing)
        else:
            template = ChecklistTemplate(
                title=t["title"],
                items=t["items"],
                department=t.get("department"),
                area=t.get("area"),
                created_by=users[0].id,  # admin
            )
            db.add(template)
            db.commit()
            db.refresh(template)
            template_objects.append(template)
            logger.info(f"[Templates] Created: {t['title'][:50]}")
    return template_objects


def _seed_daily_checklists(db: Session, users: list):
    """Seed daily checklist submissions with example data."""
    from models.checklist import DailyChecklist
    from datetime import datetime, timezone, timedelta

    for c in DAILY_CHECKLISTS:
        existing = db.query(DailyChecklist).filter(
            DailyChecklist.title == c["title"]
        ).first()
        if existing:
            logger.info(f"[Checklists] Skipping: {c['title'][:50]}")
            continue

        user = users[c["user_index"]]
        # Set created_at based on days_ago
        created_at = datetime.now(timezone.utc) - timedelta(days=c["days_ago"])

        checklist = DailyChecklist(
            user_id=user.id,
            title=c["title"],
            items=c["items"],
            ai_analysis=c.get("ai_analysis"),
            created_at=created_at,
        )
        db.add(checklist)
        db.commit()
        logger.info(f"[Checklists] Created: {c['title'][:50]}")


def _seed_work_journals(db: Session, users: list):
    """Seed work journal entries (without embedding — use placeholder)."""
    from models.work_journal import WorkJournal
    from datetime import datetime, timezone, timedelta

    for j in WORK_JOURNALS:
        existing = db.query(WorkJournal).filter(
            WorkJournal.title == j["title"]
        ).first()
        if existing:
            logger.info(f"[Journals] Skipping: {j['title'][:50]}")
            continue

        user = users[j["user_index"]]
        created_at = datetime.now(timezone.utc) - timedelta(days=j["days_ago"])

        # Try to generate embedding, fall back to None if AI service unavailable
        embedding = None
        try:
            from services.ai_service import generate_embedding
            embedding = generate_embedding(j["title"] + "\n" + j["content"])
        except Exception as e:
            logger.warning(f"[Journals] Embedding generation failed for '{j['title'][:30]}': {e}")

        journal = WorkJournal(
            user_id=user.id,
            title=j["title"],
            content=j["content"],
            department=j.get("department"),
            area=j.get("area"),
            category=j.get("category"),
            tags=j.get("tags", []),
            difficulty=j.get("difficulty", "routine"),
            ai_summary=j.get("ai_summary"),
            ai_lessons_learned=j.get("ai_lessons_learned"),
            ai_related_sops=j.get("ai_related_sops"),
            is_public=1,
            helpful_count=0,
            embedding=embedding,
            created_at=created_at,
        )
        db.add(journal)

        # Also add to knowledge base
        from models.knowledge import KnowledgeEntry
        kb_existing = db.query(KnowledgeEntry).filter(
            KnowledgeEntry.title == f"[Work Journal] {j['title']}",
            KnowledgeEntry.source == "journal",
        ).first()
        if not kb_existing:
            kb_entry = KnowledgeEntry(
                title=f"[Work Journal] {j['title']}",
                content=f"{j['content']}\n\nAI Summary: {j.get('ai_summary', '')}\nLessons: {j.get('ai_lessons_learned', '')}",
                category=j.get("category"),
                department=j.get("department"),
                source="journal",
                confidence_score=0.7,
                embedding=embedding,
                author_id=user.id,
                created_at=created_at,
            )
            db.add(kb_entry)

        db.commit()
        logger.info(f"[Journals] Created: {j['title'][:50]}")


def _seed_workflows(db: Session, users: list):
    """Seed workflow/SOP records."""
    from models.workflow import Workflow
    from models.knowledge import KnowledgeEntry
    from datetime import datetime, timezone, timedelta

    for i, w in enumerate(WORKFLOWS):
        existing = db.query(Workflow).filter(
            Workflow.title == w["title"],
            Workflow.is_latest == 1,
        ).first()
        if existing:
            logger.info(f"[Workflows] Skipping: {w['title'][:50]}")
            continue

        user = users[w["user_index"]]
        created_at = datetime.now(timezone.utc) - timedelta(days=(i + 1) * 3)

        # Generate embedding
        text = f"{w['title']}\n{w.get('description', '')}"
        for s in w["steps"]:
            text += f"\nStep {s['step']}: {s['action']}"

        embedding = None
        try:
            from services.ai_service import generate_embedding
            embedding = generate_embedding(text)
        except Exception as e:
            logger.warning(f"[Workflows] Embedding failed for '{w['title'][:30]}': {e}")

        wf = Workflow(
            user_id=user.id,
            title=w["title"],
            description=w.get("description"),
            steps=w["steps"],
            category=w.get("category"),
            department=w.get("department"),
            area=w.get("area"),
            ai_sop_draft=w.get("ai_sop_draft"),
            ai_safety_notes=w.get("ai_safety_notes"),
            ai_optimization=w.get("ai_optimization"),
            ai_estimated_time=w.get("ai_estimated_time"),
            tags=w.get("tags", []),
            embedding=embedding,
            version=1,
            is_latest=1,
            is_approved=w.get("is_approved", 0),
            used_count=w.get("used_count", 0),
            created_at=created_at,
        )
        db.add(wf)
        db.flush()

        # Add to knowledge base
        kb_title = f"[Workflow] {w['title']}"
        kb_existing = db.query(KnowledgeEntry).filter(
            KnowledgeEntry.title == kb_title,
            KnowledgeEntry.source == "workflow",
        ).first()
        if not kb_existing:
            kb_entry = KnowledgeEntry(
                title=kb_title,
                content=w.get("ai_sop_draft") or text,
                category=w.get("category") or "Workflow",
                department=w.get("department"),
                source="workflow",
                confidence_score=1.0 if w.get("is_approved") else 0.6,
                embedding=embedding,
                author_id=user.id,
                created_at=created_at,
            )
            db.add(kb_entry)

        db.commit()
        logger.info(f"[Workflows] Created: {w['title'][:50]}")


def _seed_approvals(db: Session, users: list):
    """Seed approval request examples."""
    from models.approval import ApprovalRequest
    from datetime import datetime, timezone, timedelta

    for i, a in enumerate(APPROVAL_REQUESTS):
        existing = db.query(ApprovalRequest).filter(
            ApprovalRequest.title == a["title"]
        ).first()
        if existing:
            logger.info(f"[Approvals] Skipping: {a['title'][:50]}")
            continue

        user = users[a["user_index"]]
        created_at = datetime.now(timezone.utc) - timedelta(days=i)

        approved_by_id = None
        approved_at = None
        if a["status"] == "approved":
            approved_by_id = users[0].id  # admin
            approved_at = datetime.now(timezone.utc) - timedelta(hours=2)

        approval = ApprovalRequest(
            requester_id=user.id,
            title=a["title"],
            details=a["details"],
            request_type=a["request_type"],
            status=a["status"],
            ai_assessment=a.get("ai_assessment"),
            approved_by_id=approved_by_id,
            approved_at=approved_at,
            created_at=created_at,
            comments=[],
        )
        db.add(approval)
        db.commit()
        logger.info(f"[Approvals] Created ({a['status']}): {a['title'][:50]}")


# ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────

def seed_demo_data(db: Session) -> dict:
    """
    Main entry point. Seed all demo data for presentation.
    Idempotent — safe to call multiple times.
    Returns stats dict.
    """
    logger.info("=" * 60)
    logger.info("ShiftMind Demo Data Seeder — Starting...")
    logger.info("=" * 60)

    stats = {}

    try:
        logger.info("[1/6] Seeding Users...")
        users = _seed_users(db)
        stats["users"] = len(users)
    except Exception as e:
        logger.error(f"User seeding failed: {e}")
        users = []
        stats["users_error"] = str(e)
        return stats

    try:
        logger.info("[2/6] Seeding Checklist Templates...")
        _seed_checklist_templates(db, users)
        stats["checklist_templates"] = len(CHECKLIST_TEMPLATES)
    except Exception as e:
        logger.error(f"Checklist template seeding failed: {e}")
        stats["checklist_templates_error"] = str(e)

    try:
        logger.info("[3/6] Seeding Daily Checklists (with FAIL examples)...")
        _seed_daily_checklists(db, users)
        stats["daily_checklists"] = len(DAILY_CHECKLISTS)
    except Exception as e:
        logger.error(f"Daily checklist seeding failed: {e}")
        stats["daily_checklists_error"] = str(e)

    try:
        logger.info("[4/6] Seeding Work Journals...")
        _seed_work_journals(db, users)
        stats["work_journals"] = len(WORK_JOURNALS)
    except Exception as e:
        logger.error(f"Work journal seeding failed: {e}")
        stats["work_journals_error"] = str(e)

    try:
        logger.info("[5/6] Seeding Workflows (SOP)...")
        _seed_workflows(db, users)
        stats["workflows"] = len(WORKFLOWS)
    except Exception as e:
        logger.error(f"Workflow seeding failed: {e}")
        stats["workflows_error"] = str(e)

    try:
        logger.info("[6/6] Seeding Approval Requests...")
        _seed_approvals(db, users)
        stats["approvals"] = len(APPROVAL_REQUESTS)
    except Exception as e:
        logger.error(f"Approval seeding failed: {e}")
        stats["approvals_error"] = str(e)

    logger.info("=" * 60)
    logger.info(f"Demo data seeding complete: {stats}")
    logger.info("=" * 60)
    return stats
