"""
Company Knowledge Seeder — Seeds the knowledge base with static information
about PT Garuda Yamato Steel from the company website.
Idempotent: checks if entries already exist before inserting.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.knowledge import KnowledgeEntry
from services.ai_service import generate_embedding

logger = logging.getLogger(__name__)

# ─── Company Knowledge Entries ────────────────────────────────────────────────
COMPANY_KNOWLEDGE = [
    {
        "title": "Profil Perusahaan PT Garuda Yamato Steel (GYS)",
        "content": (
            "PT Garuda Yamato Steel (GYS) merupakan perusahaan gabungan (joint venture) yang didirikan pada tahun 2024, "
            "yang dibentuk melalui kolaborasi dengan para investor strategis, yaitu Yamato Kogyo Co, Ltd (Jepang), "
            "Siam Yamato Steel Co, Ltd (Thailand), PT Hanwa Indonesia, dan PT Gunung Raja Paksi Tbk (Indonesia).\n\n"
            "Perusahaan ini dibangun di atas fondasi PT Gunung Raja Paksi, produsen baja terkemuka yang didirikan pada tahun 1970, "
            "dengan pabrik modern di Cikarang, Bekasi, Jawa Barat, Indonesia.\n\n"
            "PT Garuda Yamato Steel mengkhususkan diri dalam memproduksi produk baja panjang berkualitas tinggi. "
            "Dengan fokus pada keunggulan, GYS berdedikasi untuk menghasilkan baja terbaik untuk memenuhi kebutuhan "
            "pasar domestik dan ekspor.\n\n"
            "Alamat: Jl. Perjuangan No.8, Sukadanau, Kec. Cikarang Bar., Kabupaten Bekasi, Jawa Barat 17530\n"
            "Jam Operasional: Senin - Jumat, 08:00 - 17:00 WIB\n"
            "Website: https://www.garudayamatosteel.com"
        ),
        "department": None,
        "category": "Company",
    },
    {
        "title": "Visi dan Misi PT Garuda Yamato Steel",
        "content": (
            "VISI:\n"
            "Menjadi perusahaan terkemuka dalam kategori baja panjang yang dilengkapi dengan standar internasional "
            "dan keahlian terbaik, sekaligus berkontribusi pada kemajuan industri baja dalam negeri.\n\n"
            "MISI:\n"
            "Memberikan kepuasan pelanggan yang tak tertandingi melalui inovasi produk, produktivitas, dan kualitas "
            "yang luar biasa dalam produk dan layanan kami. Kami bertekad untuk menjunjung tinggi tanggung jawab sosial "
            "dan lingkungan, pilar penting untuk memastikan keberlanjutan perusahaan dalam jangka panjang."
        ),
        "department": None,
        "category": "Company",
    },
    {
        "title": "Core Values PT Garuda Yamato Steel: Kualitas, Inovasi, Keberlanjutan",
        "content": (
            "Core values GYS adalah kekuatan pendorong di balik operasi bisnis sehari-hari:\n\n"
            "1. KUALITAS:\n"
            "Kami berkomitmen untuk memproduksi produk baja berkualitas tinggi yang memenuhi atau melampaui "
            "standar industri dan harapan pelanggan.\n\n"
            "2. INOVASI:\n"
            "Kami berusaha untuk terus meningkatkan proses, produk, dan layanan kami melalui inovasi dan teknologi "
            "untuk tetap menjadi yang terdepan dalam industri manufaktur baja yang kompetitif.\n\n"
            "3. KEBERLANJUTAN:\n"
            "Kami berdedikasi untuk meminimalkan dampak lingkungan dengan menerapkan praktik-praktik berkelanjutan, "
            "mengurangi limbah, serta mempromosikan daur ulang dan efisiensi energi."
        ),
        "department": None,
        "category": "Company",
    },
    {
        "title": "Investor dan Pemegang Saham PT Garuda Yamato Steel",
        "content": (
            "PT Garuda Yamato Steel dibentuk melalui kolaborasi 4 investor strategis:\n\n"
            "1. Yamato Kogyo Co, Ltd — Perusahaan baja terkemuka dari Jepang dengan keahlian dalam produksi baja panjang.\n"
            "2. Siam Yamato Steel Co, Ltd — Produsen baja dari Thailand, bagian dari grup Yamato Kogyo.\n"
            "3. PT Hanwa Indonesia — Anak perusahaan Hanwa Co., Ltd (Jepang), bergerak di bidang perdagangan baja.\n"
            "4. PT Gunung Raja Paksi Tbk — Produsen baja terkemuka Indonesia yang didirikan pada tahun 1970, "
            "menjadi fondasi operasional GYS dengan pabrik modern di Cikarang, Bekasi."
        ),
        "department": None,
        "category": "Company",
    },
    {
        "title": "Produk H-Beam PT Garuda Yamato Steel",
        "content": (
            "H-Beam adalah produk baja profil canai panas berbentuk huruf H.\n\n"
            "Karakteristik:\n"
            "- Potongan logam persegi panjang dengan penampang melintang yang seragam\n"
            "- Dikenal juga sebagai baja berbentuk 'H' atau balok universal\n"
            "- Flange (sayap) memiliki lebar yang sama atau hampir sama dengan tinggi web\n\n"
            "Kegunaan:\n"
            "- Kolom bangunan bertingkat tinggi\n"
            "- Tiang pancang\n"
            "- Struktur jembatan\n"
            "- Konstruksi infrastruktur berat\n\n"
            "Sertifikasi: SNI 2610:2011, CE Marking (EN 10225-2:2019), UKCA, ACRS, SIRIM\n"
            "TKDN: > 90% (Certificate No. 63696)"
        ),
        "department": "Production",
        "category": "Product",
    },
    {
        "title": "Produk IWF (Wide Flange Beam) PT Garuda Yamato Steel",
        "content": (
            "IWF (I-beam Wide Flange) adalah balok baja dengan flange yang lebih lebar.\n\n"
            "Karakteristik:\n"
            "- Balok flange lebar yang membantu mendistribusikan berat secara lebih merata di seluruh struktur\n"
            "- Dapat digunakan sebagai Groove Crane\n"
            "- Flange lebih lebar dibanding balok I standar\n\n"
            "Kegunaan:\n"
            "- Struktur bangunan\n"
            "- Groove Crane (rel crane overhead)\n"
            "- Rangka atap bentang lebar\n"
            "- Konstruksi industri\n\n"
            "Sertifikasi: SNI 07-7178-2006, CE Marking (EN 10225-2:2019), UKCA, SIRIM\n"
            "TKDN: > 90% (Certificate No. 63700)"
        ),
        "department": "Production",
        "category": "Product",
    },
    {
        "title": "Produk Channel (Kanal U) PT Garuda Yamato Steel",
        "content": (
            "Channel adalah baja profil dengan penampang berbentuk huruf C atau U.\n\n"
            "Karakteristik:\n"
            "- Penampang berbentuk 'C' (U Channel)\n"
            "- Ringan namun kuat untuk menahan beban struktural\n\n"
            "Kegunaan:\n"
            "- Konstruksi dan teknik sipil\n"
            "- Menciptakan sistem pendukung struktural bangunan\n"
            "- Rangka dinding, atap, dan lantai\n"
            "- Konstruksi kendaraan\n\n"
            "Sertifikasi: SNI 07-0052-2006, SIRIM (Universal Beam, H-Beam, U Channel)\n"
            "TKDN: > 90% (Certificate No. 63702)"
        ),
        "department": "Production",
        "category": "Product",
    },
    {
        "title": "Produk Equal Angle (Siku Sama Kaki) PT Garuda Yamato Steel",
        "content": (
            "Equal Angle adalah baja profil siku dengan kedua sisi yang panjangnya sama.\n\n"
            "Karakteristik:\n"
            "- Sudut baja dengan sisi yang sama panjang (sama kaki)\n"
            "- Bentuk L dengan ketebalan seragam\n\n"
            "Kegunaan:\n"
            "- Konstruksi dan teknik untuk menopang beban\n"
            "- Memberikan stabilitas struktural\n"
            "- Rangka tower, menara transmisi\n"
            "- Penguatan struktur bangunan\n\n"
            "Sertifikasi: SNI 07-2054-2006\n"
            "TKDN: > 90% (Certificate No. 63704)"
        ),
        "department": "Production",
        "category": "Product",
    },
    {
        "title": "Layanan GYS: Pemotongan, Pemesinan, dan Pengerjaan Logam",
        "content": (
            "PT Garuda Yamato Steel menyediakan layanan pengolahan baja komprehensif:\n\n"
            "1. PEMOTONGAN PRODUKSI:\n"
            "   - Cold Sawing: Pemotongan presisi menggunakan mesin gergaji dingin\n"
            "   - Oxy Cutting: Pemotongan dengan api oksigen untuk material tebal\n\n"
            "2. PEMESINAN:\n"
            "   - Pemboran (Drilling)\n"
            "   - Pengeboran (Boring)\n"
            "   - Pelubangan (Punching)\n\n"
            "3. PENGERJAAN LOGAM:\n"
            "   - Pembengkokan (Bending)\n"
            "   - Produksi Balok T (T-Beam fabrication)\n\n"
            "Semua layanan dilakukan dengan peralatan modern dan standar kualitas tinggi."
        ),
        "department": "Production",
        "category": "Service",
    },
    {
        "title": "Sertifikasi ISO dan Akreditasi Laboratorium GYS",
        "content": (
            "PT Garuda Yamato Steel memiliki sertifikasi sistem manajemen ISO dan akreditasi laboratorium:\n\n"
            "SERTIFIKASI ISO:\n"
            "1. ISO 9001:2015 — Sistem Manajemen Mutu (Quality Management System)\n"
            "   Menjamin konsistensi kualitas produk dan layanan.\n\n"
            "2. ISO 14001:2015 — Sistem Manajemen Lingkungan (Environmental Management System)\n"
            "   Komitmen terhadap pengelolaan dampak lingkungan.\n\n"
            "3. ISO 45001:2018 — Sistem Manajemen Keselamatan dan Kesehatan Kerja (K3)\n"
            "   Menjamin keselamatan dan kesehatan pekerja di lingkungan pabrik.\n\n"
            "AKREDITASI LABORATORIUM:\n"
            "4. ISO/IEC 17025:2017 — Kompetensi Laboratorium Pengujian (KAN Accreditation)\n"
            "   Laboratorium terakreditasi oleh Komite Akreditasi Nasional (KAN)."
        ),
        "department": "Quality",
        "category": "Certification",
    },
    {
        "title": "Sertifikasi TKDN Produk GYS (Tingkat Komponen Dalam Negeri)",
        "content": (
            "PT Garuda Yamato Steel telah mencapai TKDN lebih dari 90% untuk semua produk baja canai panas utama. "
            "Sertifikat TKDN diterbitkan oleh Kementerian Perindustrian RI:\n\n"
            "1. TKDN Certificate No. 63696 — Baja Profil H-Beam (Bj P H-Beam)\n"
            "2. TKDN Certificate No. 63700 — Baja Profil WF-Beam Proses Canai Panas (BjP WF Beam)\n"
            "3. TKDN Certificate No. 63702 — Baja Profil Kanal U Proses Canai Panas (BjP Kanal U)\n"
            "4. TKDN Certificate No. 63704 — Baja Profil Siku Sama Kaki Proses Canai Panas (Bj P siku sama kaki)\n\n"
            "TKDN > 90% memenuhi persyaratan preferensi harga dalam pengadaan pemerintah "
            "dan proyek infrastruktur nasional."
        ),
        "department": "Quality",
        "category": "Certification",
    },
    {
        "title": "Sertifikasi Internasional GYS: CE, UKCA, ACRS, SIRIM, EPD",
        "content": (
            "Selain sertifikasi Indonesia, GYS memiliki sertifikasi internasional berikut:\n\n"
            "1. CE Marking — EN 10225-2:2019 (Structural Steel Sections)\n"
            "   Memenuhi standar keselamatan Uni Eropa untuk produk baja struktural.\n\n"
            "2. UKCA Marking — EN 10225-2:2019 (Structural Steel Sections)\n"
            "   Memenuhi standar keselamatan United Kingdom.\n\n"
            "3. SIRIM QAS (Malaysia) — Universal Beam, H-Beam, U Channel\n"
            "   Sertifikasi kualitas dari Malaysia.\n\n"
            "4. ACRS Certificate No. 260204\n"
            "   Australasian Certification Authority for Reinforcing and Structural Steels.\n\n"
            "5. Environmental Product Declaration (EPD)\n"
            "   - Produk: Hot Rolled Structural Steel Shapes\n"
            "   - Registration No.: S-P-06674\n"
            "   Deklarasi dampak lingkungan produk untuk transparansi keberlanjutan."
        ),
        "department": "Quality",
        "category": "Certification",
    },
    {
        "title": "Kebijakan Manajemen GYS — 7 Pilar Utama",
        "content": (
            "Kebijakan Manajemen PT Garuda Yamato Steel mencakup 7 pilar utama:\n\n"
            "1. PENGEJARAN KUALITAS:\n"
            "Memprioritaskan produk baja berkualitas tertinggi dan melampaui ekspektasi pelanggan. "
            "Terus meningkatkan sistem manajemen kualitas untuk keandalan dan keselamatan produk.\n\n"
            "2. PERTIMBANGAN LINGKUNGAN:\n"
            "Menggunakan Electric Arc Furnaces (EAF) untuk mendaur ulang besi bekas, meningkatkan efisiensi energi, "
            "mengurangi emisi, dan menekankan daur ulang limbah.\n\n"
            "3. KESELAMATAN YANG UTAMA:\n"
            "Prioritas tertinggi pada keselamatan dan kesehatan karyawan melalui pelatihan keselamatan rutin, "
            "penilaian risiko, dan praktik terbaik pencegahan kecelakaan.\n\n"
            "4. PENINGKATAN LINGKUNGAN KERJA:\n"
            "Menyediakan lingkungan kerja yang aman dan nyaman dengan edukasi dan pelatihan keselamatan rutin.\n\n"
            "5. INOVASI TEKNOLOGI:\n"
            "Terus mengejar peningkatan produk dan proses melalui R&D dan pengenalan teknologi baru.\n\n"
            "6. KONTRIBUSI SOSIAL:\n"
            "Hidup berdampingan dengan masyarakat setempat, berpartisipasi dalam perlindungan lingkungan "
            "dan program dukungan pendidikan lokal.\n\n"
            "7. ETIKA DAN KEPATUHAN:\n"
            "Menjunjung tinggi standar etika, mematuhi hukum dan peraturan, melakukan kegiatan perusahaan "
            "yang adil dan transparan."
        ),
        "department": None,
        "category": "Policy",
    },
    {
        "title": "Informasi Kontak dan Lokasi PT Garuda Yamato Steel",
        "content": (
            "PT Garuda Yamato Steel\n"
            "Alamat: Jl. Perjuangan No.8, Sukadanau, Kec. Cikarang Bar., Kabupaten Bekasi, Jawa Barat 17530\n\n"
            "Jam Operasional: Senin - Jumat, 08:00 - 17:00 WIB\n\n"
            "Media Sosial:\n"
            "- LinkedIn: https://www.linkedin.com/company/pt-garuda-yamato-steel/\n"
            "- Instagram: https://www.instagram.com/garudayamatosteel/\n"
            "- TikTok: https://www.tiktok.com/@garudayamatosteel\n\n"
            "Website: https://www.garudayamatosteel.com\n"
            "Karir: https://gys.darwinbox.com/ms/candidate/careers\n"
            "Loyalty Program: GYS Point — https://rewards.gyssteel.com/\n\n"
            "Tata Kelola Perusahaan:\n"
            "- Sistem Whistleblowing tersedia untuk pelaporan pelanggaran etika\n"
            "- Panduan Anti-Bribery & Corruption (ABC) berlaku untuk seluruh karyawan dan mitra bisnis"
        ),
        "department": None,
        "category": "Company",
    },
    {
        "title": "Referensi Proyek PT Garuda Yamato Steel",
        "content": (
            "PT Garuda Yamato Steel telah berkontribusi pada berbagai proyek besar di Indonesia dan internasional:\n\n"
            "PROYEK UNGGULAN:\n"
            "1. RMDP Balikpapan — Proyek infrastruktur di Balikpapan, Kalimantan\n"
            "2. Park Hyatt Project — Proyek hotel mewah di New Zealand (ekspor internasional)\n"
            "3. PLTS Kalimantan — Pembangkit Listrik Tenaga Surya di Kalimantan\n"
            "4. Harco Glodok Jakarta — Proyek komersial di pusat bisnis Jakarta\n"
            "5. Hankook Bekasi — Proyek industri otomotif\n\n"
            "GYS merupakan penyedia baja struktural rol panas terkemuka di Asia Tenggara. "
            "Produk GYS digunakan untuk bangunan tempat tinggal, hotel, gedung pencakar langit, "
            "infrastruktur energi, dan proyek industri.\n\n"
            "INISIATIF TERBARU:\n"
            "- Peluncuran High Tensile Steel / Baja Tahan Gempa PLUS berkekuatan tinggi\n"
            "- Instalasi Tenaga Surya berkapasitas 6,5 MWp untuk manufaktur baja ramah lingkungan\n"
            "- Transformasi Digital berbasis AI (dipresentasikan di Intelligence Tour 2025)\n"
            "- Program GYS Point: loyalty program untuk profesional industri baja"
        ),
        "department": "Sales",
        "category": "Project",
    },
    {
        "title": "Standar Manufaktur dan Proses Produksi GYS",
        "content": (
            "PT Garuda Yamato Steel memproduksi baja menggunakan proses canai panas (Hot Rolling) "
            "dengan standar manufaktur yang ketat.\n\n"
            "PROSES PRODUKSI:\n"
            "1. Electric Arc Furnace (EAF) — Peleburan besi bekas (scrap) menggunakan busur listrik\n"
            "   - Proses daur ulang yang ramah lingkungan\n"
            "   - Efisiensi energi lebih tinggi dibanding blast furnace\n\n"
            "2. Continuous Casting — Pencetakan billet baja secara kontinu\n\n"
            "3. Hot Rolling Mill — Pengerolan panas untuk membentuk profil baja\n"
            "   - H-Beam, IWF, Channel, Equal Angle\n\n"
            "STANDAR KUALITAS:\n"
            "- Semua produk diproduksi dari bahan baku berkualitas tinggi\n"
            "- Bebas radioaktivitas\n"
            "- Kontrol kualitas ketat sepanjang proses produksi\n"
            "- Pengujian di laboratorium terakreditasi ISO/IEC 17025:2017\n\n"
            "SERTIFIKASI PRODUK:\n"
            "- SNI 9150:2023 — Baja Profil Canai Panas (standar terbaru)\n"
            "- SNI untuk setiap tipe produk (H-Beam, IWF, Channel, Equal Angle)\n"
            "- TKDN > 90% untuk semua produk utama"
        ),
        "department": "Production",
        "category": "Manufacturing",
    },
]


def seed_company_knowledge(db: Session) -> dict:
    """
    Seed the database with company knowledge entries.
    Idempotent — skips entries that already exist (matched by title + source='company').
    Returns stats dict.
    """
    stats = {"created": 0, "skipped": 0, "errors": 0}

    for entry_data in COMPANY_KNOWLEDGE:
        try:
            # Check if already exists
            existing = db.query(KnowledgeEntry).filter(
                KnowledgeEntry.title == entry_data["title"],
                KnowledgeEntry.source == "company",
            ).first()

            if existing:
                stats["skipped"] += 1
                logger.debug(f"Skipping existing: {entry_data['title']}")
                continue

            # Generate embedding
            embedding = generate_embedding(entry_data["title"] + " " + entry_data["content"])

            entry = KnowledgeEntry(
                title=entry_data["title"],
                content=entry_data["content"],
                department=entry_data.get("department"),
                category=entry_data.get("category"),
                author_id=None,
                confidence_score=1.0,
                source="company",
                source_file_id=None,
                source_file_name="garudayamatosteel.com",
                source_url="https://www.garudayamatosteel.com",
                embedding=embedding,
            )
            db.add(entry)
            db.commit()
            stats["created"] += 1
            logger.info(f"Seeded: {entry_data['title']}")

        except Exception as e:
            db.rollback()
            stats["errors"] += 1
            logger.error(f"Error seeding '{entry_data['title']}': {e}")

    logger.info(f"Company knowledge seed complete: {stats}")
    return stats
