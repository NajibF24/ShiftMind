import os
import sys
from sqlalchemy.orm import Session
from db import SessionLocal, engine, Base
from models.user import User
from models.knowledge import KnowledgeEntry
from services.ai_service import generate_embedding

# Base knowledge articles
MANUAL_KNOWLEDGE = [
    {
        "title": "Dasar-Dasar DevSecOps (Development, Security, and Operations)",
        "content": "DevSecOps adalah praktik mengintegrasikan keamanan (security) di setiap tahap siklus hidup pengembangan perangkat lunak (SDLC), dari desain hingga penerapan (deployment). Tujuannya adalah \"Shift-Left Security\", yaitu mendeteksi celah keamanan sedini mungkin. Praktik utama DevSecOps meliputi:\n1. SAST (Static Application Security Testing): Memeriksa kode sumber untuk mencari kerentanan keamanan sebelum kode dijalankan.\n2. DAST (Dynamic Application Security Testing): Memeriksa aplikasi yang sedang berjalan untuk mencari celah yang bisa dieksploitasi dari luar.\n3. Secret Management: Menyimpan password, API keys, dan token secara aman (misalnya menggunakan HashiCorp Vault atau AWS Secrets Manager) tanpa meletakkannya di source code (hardcoded).\n4. CI/CD Pipeline Automation: Menjalankan pemindaian keamanan (security scan) secara otomatis setiap kali kode baru di-push ke repository.",
        "category": "DevSecOps",
        "department": "IT"
    },
    {
        "title": "Konsep Dasar Infrastruktur IT & Jaringan",
        "content": "Infrastruktur IT modern bergeser dari server fisik lokal ke arsitektur Cloud-Native. Komponen utamanya meliputi:\n1. Load Balancing: Mendistribusikan trafik jaringan secara merata ke beberapa server untuk mencegah beban berlebih pada satu mesin tunggal (mencegah downtime).\n2. Containerization (Docker): Mengemas aplikasi beserta seluruh dependensinya menjadi satu unit standar (container) agar bisa dijalankan di mana saja dengan konsisten.\n3. Orchestration (Kubernetes): Mengelola, menyesuaikan skala (scaling), dan memastikan ribuan container berjalan tanpa henti (High Availability).\n4. Firewall & WAF: WAF (Web Application Firewall) melindungi aplikasi web dari serangan lapisan aplikasi (seperti SQL Injection dan XSS), sedangkan firewall standar melindungi port dan IP jaringan.",
        "category": "Infrastruktur IT",
        "department": "IT"
    },
    {
        "title": "Pengenalan Basis Data (Database) dan Optimasi",
        "content": "Database terbagi menjadi dua paradigma utama: Relasional (SQL) dan Non-Relasional (NoSQL).\n1. Database Relasional (contoh: PostgreSQL, MySQL): Menggunakan skema tabel yang ketat (baris dan kolom). Sangat cocok untuk transaksi keuangan dan data yang membutuhkan konsistensi tinggi (ACID compliance).\n2. Database NoSQL (contoh: MongoDB, Redis): Menyimpan data dalam format dokumen (JSON) atau Key-Value. Sangat fleksibel dan cepat, cocok untuk data berskala masif (Big Data) atau data yang tidak terstruktur.\n3. Optimasi Query: Untuk mempercepat pencarian data, database menggunakan 'Indexing' (seperti daftar isi buku). Tanpa indeks, database harus melakukan 'Full Table Scan' yang sangat lambat.\n4. Replikasi & Sharding: Replikasi menyalin data ke server lain untuk backup, sedangkan Sharding memecah data besar menjadi potongan kecil ke beberapa server agar lebih cepat diproses.",
        "category": "Database",
        "department": "IT"
    },
    {
        "title": "Pentingnya Keamanan Informasi Karyawan (Cyber Security 101)",
        "content": "Ancaman siber terbesar bagi perusahaan bukanlah kelemahan sistem, melainkan kelalaian manusia (Human Error). Semua karyawan wajib mengetahui:\n1. Phishing: Penipuan berkedok email resmi (misal dari bank atau IT internal) yang meminta password atau data sensitif. JANGAN pernah membagikan password Anda kepada siapa pun, termasuk admin IT.\n2. Password Hygiene: Gunakan password yang panjang (minimal 12 karakter) berupa frasa unik (passphrase). Jangan gunakan tanggal lahir atau nama anak.\n3. Multi-Factor Authentication (MFA): Lapisan keamanan kedua. Selain password, Anda membutuhkan kode unik dari HP Anda untuk login.\n4. Lapor Insiden: Jika Anda mengklik tautan mencurigakan atau merasa komputer Anda terkena virus/ransomware, segera cabut kabel internet dan lapor ke tim IT Helpdesk. Jangan matikan (shutdown) komputer agar bukti digital tidak hilang.",
        "category": "Cyber Security",
        "department": "All"
    }
]

def seed_manual_knowledge():
    db = SessionLocal()
    try:
        print("Mulai menyuntikkan (seeding) Manual Knowledge Base...")
        added_count = 0
        
        for item in MANUAL_KNOWLEDGE:
            # Periksa apakah sudah ada (mencegah duplikasi jika dijalankan ulang)
            existing = db.query(KnowledgeEntry).filter_by(title=item["title"], source="manual").first()
            if existing:
                print(f"Melewati: '{item['title']}' (Sudah ada di database)")
                continue
                
            print(f"Menghasilkan embedding (vektor) untuk: '{item['title']}'...")
            embedding = generate_embedding(item["content"])
            
            new_entry = KnowledgeEntry(
                title=item["title"],
                content=item["content"],
                category=item["category"],
                department=item["department"],
                source="manual",
                confidence_score=1.0,
                embedding=embedding
            )
            
            db.add(new_entry)
            added_count += 1
            
        db.commit()
        print(f"\nSelesai! {added_count} dokumen manual baru berhasil ditambahkan ke Knowledge Base.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding manual knowledge: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_manual_knowledge()
