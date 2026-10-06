# RT.Digital — Frontend (GitHub Pages)

Portal warga dan pengurus RT: transparansi kas, pengumuman, aturan, aduan & saran, aset & peminjaman, rekap laporan.

**Arsitektur:** frontend statis (HTML/CSS/JS murni, tanpa build) ⇄ `fetch()` ⇄ Google Apps Script sebagai REST API ⇄ Google Sheets & Drive.

```
index.html          ← halaman utama (di root repo — wajib agar GitHub Pages menemukannya)
css/style.css       ← seluruh gaya (tema terang/gelap, warna & logo dapat diatur dari aplikasi)
js/config.js        ← SATU-SATUNYA berkas yang diedit: GAS_URL (alamat backend /exec)
js/api.js           ← komunikasi ke backend (GET publik, POST text/plain, batas waktu)
js/app.js           ← logika aplikasi (SPA)
assets/logo.webp    ← logo bawaan & ikon tab
.nojekyll           ← memberi tahu GitHub Pages agar tidak memproses dengan Jekyll
PANDUAN-INSTALASI.md← langkah lengkap backend + GitHub Pages + pemecahan masalah
```

## Menjalankan di komputer sendiri
Jangan buka lewat `file://`. Jalankan server statis dari folder ini:
```bash
python -m http.server 8080
```
lalu buka <http://localhost:8080>. Pastikan `GAS_URL` di `js/config.js` sudah diisi.

## Kontrak API (ringkas)
| Metode | Isi | Keterangan |
|---|---|---|
| `GET /exec` | — | ping status |
| `GET /exec?action=getPublik&args=["6bulan"]` | — | hanya 4 fungsi publik baca-saja (tanpa token) |
| `POST /exec` | teks JSON `{"action":"...","args":[...]}` | semua fungsi lain; `Content-Type: text/plain;charset=utf-8` |

Balasan selalu `{"success":true,"data":...}` atau `{"success":false,"message":"..."}`. Token sesi hanya lewat body POST.

## Hak akses (ditegakkan di server)
Semua pengurus dapat **melihat** semua menu. Yang dapat **mengubah**: lihat matriks di komentar `Kode.gs` (Warga/Info/Aturan: Ketua RT & Sekretaris; Kas: sesuai kas + Ketua RT; Aset: tambah Ketua RT/Sie Sapras/Sie Pembangunan, ubah Ketua RT; Pengaturan: Ketua RT).

## Memperbarui
```bash
git add .
git commit -m "Deskripsi perubahan"
git push
```
