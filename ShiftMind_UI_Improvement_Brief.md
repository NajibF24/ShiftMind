# ShiftMind UI/UX Improvement Brief

> **Scope:** Full audit setiap halaman (page) berdasarkan kode yang ada. Fokus pada konsistensi visual, usability, dan industrial-grade UX yang sesuai konteks pabrik baja PT GYS.

---

## 🔴 Prioritas Tinggi

### 1. Approvals (`/approvals`)

**Masalah yang ditemukan:**
- Form submit menggunakan query parameter (`?action=approved`) — rawan bug dan tidak standar REST.
- Tombol "Approve" dan "Reject" tampil berdempetan tanpa visual hierarchy, berpotensi salah klik di mobile.
- AI Assessment ditampilkan sebagai plain `pre-wrap` text tanpa struktur — sulit dibaca untuk teks panjang.
- Tidak ada status timeline (kapan disubmit, kapan direview).
- Upload contract review dan form request baru berada di satu halaman tanpa pemisah tab yang jelas — overwhelming.
- Kolom `request_type` hanya text, tidak ada icon/badge yang membedakan tipe (contract / purchase / workflow) secara visual.
- Tidak ada konfirmasi modal sebelum aksi Approve/Reject — bahaya untuk aksi irreversible.

**Rekomendasi perbaikan:**
```
┌─────────────────────────────────────────────┐
│  TABS: [ Pending (3) | Approved | Rejected ] │
├─────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐   │
│  │ 📄 CONTRACT  |  "Vendor ABC Q3"      │   │
│  │ by Budi Santoso  ·  2 jam lalu       │   │
│  │ ─────────────────────────────────── │   │
│  │ 🔴 AI Risk: HIGH                     │   │
│  │ [Detail summary accordion...]        │   │
│  │ ─────────────────────────────────── │   │
│  │  [✓ Approve]  [✗ Reject]  [💬 Chat] │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```
- Pisahkan halaman menjadi **2 tab**: "Request List" & "AI Contract Review".
- Tambah **confirmation modal** (Dialog) sebelum Approve/Reject dengan field opsional untuk komentar.
- Badge visual berbeda untuk tiap `request_type`.
- AI Assessment ditampilkan dengan `<ReactMarkdown>` bukan plain text.
- Tambahkan **status timeline** (submitted → under review → decided).

---

### 2. Daily Checklists (`/checklists`)

**Masalah yang ditemukan:**
- Form tambah checklist tidak mendukung **load dari template** meski backend sudah ada endpoint `/templates`.
- Status items (OK/FAIL/N/A) menggunakan `<select>` kecil yang sulit di-tap di mobile/tablet industri.
- Tidak ada filter/sort berdasarkan tanggal, shift, atau area — daftar semua checklist bercampur.
- AI Analysis hanya muncul jika ada FAIL, tapi tidak ada indikator visual "berapa item FAIL" di card list.
- Tidak ada fitur **export PDF** atau **share** checklist yang sudah selesai.
- Tombol delete tidak ada di tampilan list (hanya ada di kode, namun tidak di-render di UI saat ini).

**Rekomendasi perbaikan:**
```
┌─────────────────────────────────────────────┐
│ [ + New Checklist ] [ 📋 Load Template ]    │
├─────────────────────────────────────────────┤
│ Filter: [Area ▼] [Tanggal ▼] [Status ▼]    │
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐   │
│ │ EAF Morning Inspection               │   │
│ │ Hari ini 07:30 · oleh Dian K.        │   │
│ │ ████████░░  8/10 OK  ⚠️ 2 FAIL      │   │
│ │ [Detail] [Export PDF] [Delete]       │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```
- Status toggle menggunakan **3 tombol besar** (OK / FAIL / N/A) bukan dropdown.
- Progress bar visual di list card (berapa % item OK).
- Integrasi **template picker** saat membuat checklist baru.
- Filter berdasarkan area dan tanggal.

---

## 🟡 Prioritas Menengah

### 3. Work Journal (`/journal`)

**Masalah yang ditemukan:**
- Tombol Edit dan Delete tersembunyi di dalam accordion "expanded view" — tidak discoverable.
- Form baru dan form edit menggunakan state yang sama (`editId`) tapi tidak ada visual perbedaan antara "tambah baru" vs "edit" (judul form sama).
- Kolom `is_public` menggunakan checkbox biasa — tidak intuitif, sebaiknya toggle switch.
- `Semantic search` placeholder ada namun tidak ada indikasi loading saat query dikirim.
- Tidak ada empty state gambar/ilustrasi yang mengarahkan aksi pertama.

**Rekomendasi:**
- Judul form berubah: "Catat Aktivitas Baru" vs "Edit Catatan".
- Toggle switch (`is_public`) yang lebih visible.
- Skeleton loader saat hasil pencarian sedang dimuat.
- Empty state dengan CTA yang jelas: "Belum ada catatan hari ini — mulai catat aktivitas pertamamu."
- Edit & Delete button di luar accordion, langsung terlihat di card.

---

### 4. Workflow Recorder (`/workflows`)

**Masalah yang ditemukan:**
- Modal SOP viewer (`viewingSOP`) tidak memiliki backdrop click yang terasa — overlay terlalu tipis.
- Tombol "Export DOCX" dan "Mark as Used" berada di modal tapi tidak ada shortcut dari list card.
- Steps form menggunakan `flex` row yang sempit — pada mobile `action` + `notes` + `duration` berdempetan.
- Versi workflow (v1, v2, dst.) tidak ditampilkan di list card — user tidak tahu mana yang terbaru.
- Tombol "Approve" hanya muncul untuk admin, tapi tidak ada penanda visual di card untuk status "menunggu review".

**Rekomendasi:**
- "Pending Review" badge di list card untuk workflow belum di-approve.
- Version chip (v2, v3) di card workflow.
- Steps form menjadi stacked layout (bukan row) di mobile.
- Quick action dari card: [👁 View SOP] [⬇️ DOCX] — tanpa harus buka modal terlebih dahulu.

---

### 5. Knowledge Manager (`/knowledge-manager`)

**Masalah yang ditemukan:**
- List entries di-render semuanya dengan `fadeInUp` animation yang delay `idx * 0.015s` — untuk 50 entry, delay terakhir ~0.75s, terasa lambat.
- Tidak ada **pagination indicator** — user tidak tahu sedang di halaman berapa dari total berapa.
- Delete per-entry tidak ada konfirmasi — langsung hapus.
- Tab "Pending Review" menampilkan badge count di tab button, tapi tidak ada notifikasi bila count berubah tanpa refresh.
- Kolom source badge (`manual`, `onedrive`, `company`) warnanya sudah berbeda, tapi tidak ada **legend** untuk user baru.

**Rekomendasi:**
- Pagination dengan `X dari Y entries`.
- Konfirmasi dialog sebelum delete entry.
- Animasi delay dibatasi maksimal `0.2s` total.
- Legend kecil di bagian atas tabel.

---

### 6. Expert Finder (`/experts`)

**Masalah yang ditemukan:**
- Halaman analytics menggunakan bar chart custom (div) padahal ada `recharts` tersedia — inkonsisten dan tidak accessible.
- Leaderboard card terlalu panjang row di mobile dengan 4 kolom statistik (J, W, K, score).
- "Find Expert" search tidak memberikan feedback bila result kosong — hanya menampilkan empty state biasa.

**Rekomendasi:**
- Ganti chart analytics dengan `<BarChart>` dari Recharts untuk konsistensi dan aksesibilitas.
- Responsive: pada mobile, tampilkan score besar + badge; sembunyikan detail J/W/K dalam tooltip atau accordion.

---

### 7. Ask AI (`/ask`)

**Masalah yang ditemukan:**
- Riwayat chat tersimpan di `localStorage` — jika storage penuh, catch hanya `silently fail` tanpa memberitahu user.
- Tombol clear chat tidak meminta konfirmasi.
- Suggested prompts (3 tombol) hilang setelah percakapan dimulai — tidak ada cara mudah kembali ke prompt suggestions.
- Loading state (3 dots) ada, tapi tidak ada **timeout warning** jika AI lambat >30 detik.

**Rekomendasi:**
- Toast warning bila localStorage hampir penuh.
- Konfirmasi modal sebelum clear chat.
- "Suggested topics" tetap tersedia di sidebar kecil atau di-collapse.
- Pesan status "AI sedang berpikir... (30 detik)" untuk respons lama.

---

## 🟢 Prioritas Rendah (Polish)

### 8. Dashboard (`/dashboard`)

- **Market data error** ditampilkan dengan `ⓘ` tooltip kecil — perlu lebih eksplisit (banner kuning).
- KPI cards menggunakan `color-mix()` CSS yang belum semua browser support — tambahkan fallback.
- SSE streaming (live update) tidak memiliki indikator "sedang live" — user tidak tahu data auto-refresh.

**Rekomendasi:**
- Tambah badge kecil: 🟢 Live — refresh setiap 15 detik.
- Fallback CSS warna untuk `color-mix()`.

---

### 9. Settings (`/settings`)

- Hanya ada konfigurasi WhatsApp — halaman terasa kosong dan kurang konteks.
- Tidak ada bagian untuk konfigurasi LDAP, AI model, atau sync schedule (meski ini di backend `.env`).
- Nomor WA yang ditambahkan tidak divalidasi format internasional (+62xxx).

**Rekomendasi:**
- Tambah section "System Info" (versi backend, model AI aktif, last sync).
- Validasi format nomor: harus dimulai 62 atau 08.

---

### 10. Login (`/login`)

- Left panel (branding) hilang di mobile via `media query` inline — sebaiknya pakai kelas CSS.
- Tidak ada "lupa password" link (relevan untuk local user, bukan LDAP).
- Error state menggunakan `glitch` animation — efektif namun mungkin mengganggu pengguna aksesibilitas.

**Rekomendasi:**
- Pindahkan media query ke `index.css`.
- `prefers-reduced-motion` untuk disable glitch animation.

---

## 📐 Panduan Konsistensi Global

### Komponen yang Perlu Distandarkan

| Elemen | Kondisi Saat Ini | Standar yang Disarankan |
|---|---|---|
| Konfirmasi hapus | Hanya `window.confirm()` di beberapa tempat | Modal custom dengan `btn-danger` |
| Status badge | Inconsistent: kadang `badge--green`, kadang inline style | Selalu pakai class `.badge--*` |
| Empty state | Ada yang pakai icon + teks, ada yang hanya teks | Template konsisten: icon + judul + deskripsi + CTA |
| Form label | Campuran `form-label`, `label` biasa, dan inline style | Selalu `<label className="form-label">` |
| Loading state | Campuran `Loader2 spin`, text "Memuat...", dan skeleton | `Loader2` untuk aksi, skeleton untuk konten list |
| Pagination | Manual `page` state, tidak ada UI indicator | Komponen `Pagination` dengan info "halaman X dari Y" |

### Aksesibilitas (A11y) yang Perlu Diperhatikan

- Semua tombol ikon-only (mis. `<RefreshCw />`) perlu `aria-label`.
- Modal/overlay perlu `role="dialog"`, `aria-modal="true"`, dan focus trap.
- Warna teks `var(--text-muted)` (#94a3b8 di atas putih) mungkin tidak memenuhi WCAG AA — cek kontras.
- `<input type="file">` perlu label yang visible, bukan hanya placeholder.

---

## ✅ Ringkasan Prioritas Pekerjaan

| # | Halaman | Prioritas | Estimasi Effort |
|---|---|---|---|
| 1 | Approvals | 🔴 Tinggi | ~2–3 hari |
| 2 | Daily Checklists | 🔴 Tinggi | ~1–2 hari |
| 3 | Work Journal | 🟡 Menengah | ~1 hari |
| 4 | Workflow Recorder | 🟡 Menengah | ~1 hari |
| 5 | Knowledge Manager | 🟡 Menengah | ~1 hari |
| 6 | Expert Finder | 🟡 Menengah | ~0.5 hari |
| 7 | Ask AI | 🟡 Menengah | ~0.5 hari |
| 8 | Dashboard | 🟢 Rendah | ~0.5 hari |
| 9 | Settings | 🟢 Rendah | ~0.5 hari |
| 10 | Login | 🟢 Rendah | ~0.5 hari |
| — | Komponen Global | 🟡 Menengah | ~1–2 hari |

**Total estimasi:** ~10–13 hari kerja untuk full polish.

---

*Brief ini disusun berdasarkan analisis kode `frontend/src/pages/` dan `frontend/src/components/`. Semua rekomendasi mempertimbangkan design system yang sudah ada di `index.css` dan tidak memerlukan perubahan teknologi stack.*
