# Panduan Instalasi — RT.Digital (Backend GAS + Frontend GitHub Pages)

Panduan ini memindahkan aplikasi RT dari **satu paket di Apps Script** menjadi **dua bagian terpisah**:

| Bagian | Isinya | Tempatnya |
|---|---|---|
| **Backend** | `Kode.gs` — REST API (JSON), data tetap di Google Sheets & Drive | Google Apps Script (proyek yang sudah ada) |
| **Frontend** | `index.html`, `css/`, `js/`, `assets/` — tampilan aplikasi | GitHub Pages (`https://USERNAME.github.io/NAMA-REPO/`) |

**Data Anda tidak berubah.** Spreadsheet, akun pengurus, transaksi kas, aset, dan lampiran tetap sama. Yang berubah hanya cara aplikasi ditampilkan. Karena aplikasi sekarang dibuka langsung dari alamat GitHub Pages (bukan di dalam iframe Blogger), masalah "tidak langsung login di HP" ikut hilang.

> ⏱️ Perkiraan waktu: bagian A (backend) ±10 menit, bagian B (GitHub) ±30 menit untuk pemula.

---

## Sebelum mulai — cadangkan data (2 menit)

1. Buka spreadsheet **DB_Aplikasi_RT** di Google Drive (folder *Aplikasi RT*).
2. Klik kanan → **Buat salinan** (*Make a copy*). Simpan salinannya sebagai cadangan.

---

## BAGIAN A — Perbarui backend (Google Apps Script)

1. Buka <https://script.google.com> → buka **proyek aplikasi RT yang sudah ada** (jangan buat proyek baru).
2. Di berkas **Kode**: hapus seluruh isinya, lalu tempel seluruh isi berkas **`Kode.gs`** terbaru yang dikirim terpisah dari panduan ini. Klik **Simpan** (ikon disket).
3. Hapus berkas HTML lama di proyek (di panel kiri): **Index**, **Stylesheet**, **JavaScript** → titik tiga di samping nama → **Hapus**. Berkas ini tidak dipakai lagi (arsipnya tetap ada di folder `arsip-versi-gas-html`).
4. Terapkan versi baru **tanpa mengganti alamat**:
   - Klik **Deploy** → **Manage deployments**
   - Klik ikon **pensil** pada deployment yang aktif
   - **Version:** pilih **New version** → klik **Deploy**
   - Pastikan **Execute as: Me** dan **Who has access: Anyone**
5. Salin **Web app URL** (berakhiran `/exec`). Simpan di Notepad — dipakai di Bagian B.
6. **Uji backend:** tempel URL itu di tab baru browser. Harus tampil teks seperti:
   ```
   {"success":true,"data":{"aplikasi":"RT.Digital API","versi":"2.0","status":"aktif"}}
   ```
   - Muncul halaman login Google / "Anda memerlukan akses" → akses belum **Anyone**. Ulangi langkah 4.
   - Muncul tampilan aplikasi lama → belum memilih **New version**. Ulangi langkah 4.

✅ Backend siap. Link lama di Blogger akan berhenti menampilkan aplikasi — itu wajar, kita ganti di Bagian C.

---

## BAGIAN B — Pasang frontend di GitHub Pages

> **Aturan penting:** jalankan perintah Git **hanya dari terminal**. **Jangan** pakai tombol "Upload files" di situs GitHub — cara itu meratakan struktur folder sehingga CSS/JS tidak ditemukan (halaman tampil polos).

### B1. Pasang Git
- **Windows:** unduh dari <https://git-scm.com/download/win>, pasang dengan pengaturan bawaan. Lalu buka **PowerShell** dari Start Menu.
- **Mac:** buka Terminal, ketik `git --version` (macOS akan menawarkan pemasangan otomatis bila belum ada).

Cek:
```bash
git --version
```
Harus muncul nomor versi, misalnya `git version 2.45.0`.

### B2. Buat akun GitHub
Daftar di <https://github.com>. **Username** Anda akan menjadi bagian alamat situs (`USERNAME.github.io`), jadi pilih dengan sadar.

### B3. Atur identitas Git (sekali seumur komputer)
```bash
git config --global user.name "Nama Lengkap Anda"
git config --global user.email "email-akun-github@contoh.com"
```
(`user.name` bebas, hanya label di riwayat. `user.email` sebaiknya sama dengan email akun GitHub.)

### B4. Buat repository kosong di GitHub
1. Di github.com klik **+** (kanan atas) → **New repository**
2. **Repository name:** misalnya `rt-digital`
3. Pilih **Public** (wajib untuk GitHub Pages gratis — aman, frontend hanya berisi tampilan dan alamat API yang memang publik)
4. **JANGAN** centang *Add a README*, *.gitignore*, atau *license*
5. Klik **Create repository**. Biarkan halamannya terbuka.

### B5. Ekstrak ZIP dan masuk ke folder yang BENAR
1. Klik kanan **`rt-digital-frontend.zip`** → **Extract All…** → **Extract**.
2. Hasilnya folder **`rt-digital-frontend`**. **Inilah satu-satunya folder tempat `git init` dijalankan** — bukan folder di atasnya, bukan folder lain.
3. Buka folder itu di File Explorer, klik kolom alamat, ketik `powershell`, tekan Enter. PowerShell terbuka tepat di folder yang benar.
4. **Wajib cek isi folder sebelum lanjut:**
   ```powershell
   dir
   ```
   Yang harus terlihat di daftar paling atas: **`index.html`**, folder **`css`**, **`js`**, **`assets`**, serta `README.md` dan `PANDUAN-INSTALASI.md`.
   - Kalau yang terlihat hanya sebuah folder lain bernama `rt-digital-frontend` → masuk dulu: `cd rt-digital-frontend`, lalu `dir` lagi.
   - **Jangan lanjut** sebelum `index.html` terlihat. Git tidak akan memperingatkan Anda bila foldernya salah — situsnya baru 404.

### B6. Isi alamat backend (SEBELUM push pertama)
1. Buka berkas **`js/config.js`** dengan Notepad.
2. Ganti seluruh URL pada baris `GAS_URL` dengan **Web app URL** dari langkah A5:
   ```js
   const GAS_URL = 'https://script.google.com/macros/s/AKfycb.......XXXX/exec';
   ```
3. Simpan. URL harus diawali `https://script.google.com/macros/s/` dan berakhiran `/exec`.

### B7. Kirim ke GitHub (satu perintah satu kali — kirim screenshot bila ada yang aneh)
```bash
git init
```
Hasil normal: `Initialized empty Git repository in ...`
```bash
git add .
```
⚠️ Ada **titik** di akhir. Hasil normal: tidak ada pesan (diam = berhasil).
```bash
git commit -m "Upload pertama"
```
Hasil normal: daftar `create mode 100644 index.html` dan seterusnya.
```bash
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
```
Ganti `USERNAME` dan `NAMA-REPO` dengan yang sebenarnya (salin dari halaman repo yang tadi dibuka).
```bash
git push -u origin main
```
Diminta **Username** (username GitHub) dan **Password**. Di kolom *Password*, tempel **Personal Access Token** (bukan password akun).

> 💡 Saat mengetik/menempel token, layar **tampak kosong** — tidak ada huruf atau bintang. Itu normal. Di PowerShell: klik kanan untuk menempel, lalu Enter.

Sukses bila muncul `Writing objects: 100%` dan `* [new branch]  main -> main`.

#### Membuat Personal Access Token (bila diminta)
Kalau muncul *"Password authentication is not supported"*, itu sinyal untuk membuat token:
1. Buka <https://github.com/settings/tokens> → **Generate new token** → **Generate new token (classic)**
2. **Note:** `git-push-token` · **Expiration:** 90 days · centang **repo**
3. **Generate token** → **salin token (`ghp_...`)** — hanya tampil sekali, simpan di Notepad.
4. Ulangi `git push -u origin main`, tempel token sebagai password.

Alternatif tanpa mengetik token: **GitHub Desktop** (<https://desktop.github.com>) → *Add Local Repository* → pilih folder `rt-digital-frontend` → *Publish repository*.

### B8. Aktifkan GitHub Pages
1. Buka repo di github.com → tab **Settings** → **Pages** (menu kiri).
2. **Source:** *Deploy from a branch* · **Branch:** `main` · folder **/ (root)** → **Save**.
3. Centang **Enforce HTTPS**.
4. Tunggu 1–2 menit, muat ulang halaman. Muncul: *"Your site is live at https://USERNAME.github.io/NAMA-REPO/"*.

### B9. Cek struktur repo di GitHub
Buka `https://github.com/USERNAME/NAMA-REPO`. Pastikan: `index.html` ada **di root**, ada folder `css/`, `js/`, `assets/`, dan **tidak ada** berkas `.gs`.

---

## BAGIAN C — Ganti link yang sudah dibagikan

Alamat aplikasi sekarang: **`https://USERNAME.github.io/NAMA-REPO/`**. Bagikan alamat ini ke warga dan pengurus (grup WhatsApp, spanduk, dll).

- **Blogger:** hapus kode iframe lama, lalu ganti dengan tombol/tautan biasa ke alamat di atas. Bila ingin pengunjung otomatis dialihkan, di *Pages → HTML view* tempel:
  ```html
  <script>location.replace('https://USERNAME.github.io/NAMA-REPO/');</script>
  <p>Mengalihkan… <a href="https://USERNAME.github.io/NAMA-REPO/">klik di sini bila tidak berpindah</a></p>
  ```
- Pengurus bisa memasang pintasan ke layar utama HP lewat menu browser → *Tambahkan ke layar utama*.

---

## Uji menyeluruh (centang satu per satu)

- [ ] Alamat GitHub Pages terbuka dengan tampilan lengkap (warna, logo) — bukan teks polos
- [ ] Portal warga menampilkan saldo kas, grafik, pengumuman, aturan
- [ ] Login pengurus berhasil; menu dan hak akses sesuai peran
- [ ] Tambah transaksi kas oleh peran yang berwenang; saldo ikut berubah
- [ ] Kirim aduan dari portal warga; muncul di menu Aduan pengurus
- [ ] Ajukan peminjaman aset dan pengembalian dari portal warga
- [ ] Unduh CSV dan Cetak/PDF dari Rekap Laporan
- [ ] Buka dari HP (data seluler) — login langsung berhasil
- [ ] Buka F12 → tab **Network**: permintaan ke `script.google.com` berstatus 200, tidak ada error merah *CORS*

---

## Cara memperbarui di kemudian hari

**Mengubah tampilan/frontend** — ganti berkas, lalu dari folder `rt-digital-frontend`:
```bash
git add .
git commit -m "Deskripsi singkat perubahan"
git push
```
GitHub Pages memperbarui dalam 1–2 menit. Bila masih tampil versi lama: **Ctrl+Shift+R** atau buka jendela Incognito.

**Mengubah backend (`Kode.gs`)** — tempel kode baru → **Deploy → Manage deployments → pensil → New version → Deploy**. Alamat `/exec` tidak berubah, frontend tidak perlu diubah.

---

## Pemecahan masalah

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| Halaman 404 di GitHub Pages, semua perintah git sukses | `git init` dijalankan di folder yang salah (`index.html` tidak di root repo) | Buka repo di github.com: kalau `index.html` tidak terlihat di root → ulangi dari folder yang benar (lihat *Perbaikan salah folder*) |
| Halaman tampil polos tanpa warna, F12 → Console: 404 `style.css`/`app.js` | Struktur folder rata (diunggah via web GitHub) | Push ulang dari terminal sesuai Bagian B |
| Toast/pesan: **"Alamat backend belum diisi"** | `GAS_URL` masih contoh | Edit `js/config.js` (B6), simpan, lalu kirim ulang dengan tiga perintah di bagian *Cara memperbarui* |
| **"Server tidak mengembalikan data yang valid…"** | Web App belum **Anyone**, atau URL bukan `/exec`, atau lupa *New version* | Ulangi A4–A6; tes URL di tab baru harus menampilkan JSON |
| Error merah **CORS** di Console | Deployment bukan **Anyone**, atau URL `/dev` | Deploy ulang sebagai **Anyone** dengan URL `/exec` |
| **"Tidak dapat terhubung ke server"** | Internet putus / URL salah ketik | Cek koneksi; cocokkan `GAS_URL` dengan URL di Apps Script |
| Login selalu "Username atau password salah" | Akun/password salah, atau terkunci 15 menit setelah 5× salah | Tunggu 15 menit; atau jalankan `resetAkunKetua()` di editor Apps Script |
| Data lama tidak muncul | Backend belum diperbarui, atau salah proyek Apps Script | Pastikan A1: proyek yang sama dengan sebelumnya |
| Perubahan frontend tidak terlihat | Cache browser | **Ctrl+Shift+R** / Incognito |
| `fatal: not a git repository` | Belum `git init` / folder salah | Cek `dir` dulu: harus terlihat `index.html` |
| `remote origin already exists` | Perintah `remote add` sudah pernah dijalankan | Lewati; bila URL salah: `git remote set-url origin URL-BENAR` |
| `Password authentication is not supported` | GitHub tidak menerima password akun | Buat token (B7) |
| `Updates were rejected because the remote contains work` | Repo GitHub berisi berkas yang tidak ada di komputer | `git pull --rebase origin main` lalu `git push` |
| `LF will be replaced by CRLF` | Peringatan format baris Windows | Abaikan, bukan error |

### Perbaikan salah folder (404 padahal tidak ada error)
Terjadi bila `git init` dijalankan di folder induk. Jangan hapus repository — cukup kirim ulang dari folder yang benar dan **timpa** isinya:
```powershell
cd "C:\path\ke\rt-digital-frontend"
dir
```
Pastikan `index.html`, `css`, `js` terlihat. Lalu:
```powershell
git init
git add .
git commit -m "Fix: push dari folder frontend"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main --force
```
`--force` artinya *menimpa* isi repo dengan versi dari komputer. Aman di sini karena isi lama memang struktur yang salah.

---

## Kembali ke versi lama (bila diperlukan)

Versi lama (aplikasi dilayani langsung Apps Script) tersimpan di folder **`arsip-versi-gas-html`**: `Kode-v1.7-HtmlService.gs`, `Index.html`, `Stylesheet.html`, `JavaScript.html`. Untuk kembali: tempel `Kode-v1.7-HtmlService.gs` ke berkas **Kode**, buat kembali tiga berkas HTML dengan nama `Index`, `Stylesheet`, `JavaScript` (tanpa `.html`), lalu **New version**. Data tidak terpengaruh.

---

## Catatan keamanan

- Repository **publik**, tetapi isinya hanya tampilan dan alamat API. **Tidak ada** password, token, atau ID spreadsheet.
- Alamat `/exec` bersifat publik. Keamanan data dijaga oleh **login pengurus** dan **pemeriksaan hak akses di server**, bukan kerahasiaan alamat.
- Token sesi hanya dikirim lewat badan permintaan POST — tidak pernah muncul di alamat (URL).
- Backend hanya membuka fungsi yang dipakai aplikasi. Fungsi administratif (`setupAplikasi`, `buatAkun`, `resetAkunKetua`) hanya bisa dijalankan dari editor Apps Script.

---

## Glosarium singkat

- **Repository (repo)** — folder proyek di GitHub, seperti Google Drive-nya programmer
- **Commit** — menyimpan perubahan dengan catatan singkat (riwayatnya tercatat)
- **Push** — mengirim commit dari komputer ke GitHub (seperti "Upload")
- **Branch** — cabang/versi proyek; yang dipakai di sini: `main`
- **Personal Access Token** — "password khusus" dari GitHub untuk perintah Git di terminal
- **GitHub Pages** — layanan gratis GitHub untuk menayangkan situs statis
- **API / `/exec`** — alamat backend yang dipanggil tampilan untuk membaca dan menyimpan data
