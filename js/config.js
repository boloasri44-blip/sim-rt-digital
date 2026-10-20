/* ============================================================
   KONFIGURASI — satu-satunya berkas yang perlu Anda edit
   ============================================================
   Isi GAS_URL dengan URL Web App Google Apps Script (berakhiran /exec).
   Cara mendapatkannya: Apps Script → Deploy → Manage deployments → salin "Web app URL".

   ⚠️ Isi SEBELUM push pertama ke GitHub. Setelah diubah, push ulang:
        git add .
        git commit -m "isi GAS_URL"
        git push

   URL ini memang publik (tidak rahasia). Keamanan data dijaga oleh login pengurus
   dan pemeriksaan hak akses di sisi server, bukan oleh kerahasiaan URL.
   ============================================================ */
const GAS_URL = 'https://script.google.com/macros/s/AKfycby9-8CtfsFCNRBKS8TGutS2D9QPcFEFG7ZORJYIwesw5pYcQnBty4cds6ClU9kpQfVzRw/exec';
