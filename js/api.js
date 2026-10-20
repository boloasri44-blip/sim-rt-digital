/* RT.Digital — lapisan komunikasi ke backend Google Apps Script (REST API JSON).
   - Fungsi publik baca-saja (daftar di API_GET) memakai GET; semua yang lain memakai POST.
   - POST WAJIB Content-Type text/plain agar browser tidak mengirim preflight CORS yang ditolak Apps Script.
   - Token sesi hanya dikirim di body POST, tidak pernah di URL.
   - Memakai pola .then() (bukan async/await) agar mudah diuji. */

const API_GET = ['getPublik', 'getAturanPublik', 'getAduanPublik', 'getAsetPublik'];
const API_BATAS_WAKTU = 40000; // ms

function urlBackendValid() {
  return typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(GAS_URL) && !/ISI_ID_DEPLOYMENT/.test(GAS_URL);
}

/** Satu panggilan ke backend. Selalu menghasilkan objek {success, data|message}; tidak pernah melempar galat. */
function panggilApi(action, args, sinyal) {
  if (!urlBackendValid()) return Promise.resolve({ success: false, message: 'Alamat backend belum diisi. Buka js/config.js lalu isi GAS_URL dengan URL Web App (berakhiran /exec).' });
  const get = API_GET.indexOf(action) >= 0;
  const url = get ? GAS_URL + '?action=' + encodeURIComponent(action) + '&args=' + encodeURIComponent(JSON.stringify(args || [])) : GAS_URL;
  const opsi = get ? { method: 'GET' } : { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: action, args: args || [] }) };
  opsi.credentials = 'omit'; opsi.redirect = 'follow'; if (sinyal) opsi.signal = sinyal;
  return fetch(url, opsi)
    .then(res => res.text())
    .then(txt => {
      try { return JSON.parse(txt); }
      catch (e) { return { success: false, message: 'Server tidak mengembalikan data yang valid. Pastikan Web App di-deploy dengan akses "Anyone" dan URL berakhiran /exec, lalu deploy ulang (New version).' }; }
    })
    .catch(e => ({ success: false, message: e && e.name === 'AbortError' ? '__BATAS_WAKTU__' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.' }));
}

/** Pembungkus UI: tombol "Memproses…", penanganan galat, batas waktu, dan callback sukses.
    api(action, args, ok(data), tombol?, err(pesan)→true bila galat sudah ditangani sendiri) */
function api(fn, args, ok, btn, err) {
  let lama, fin = false, tm;
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  if (btn) { lama = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...'; }
  const selesai = () => { clearTimeout(tm); if (btn) { btn.disabled = false; btn.innerHTML = lama; } };
  const gagal = m => {
    if (fin) return; fin = true; selesai();
    m = m || 'Terjadi kesalahan.';
    if (err && err(m)) return;
    if (!$('v-admin').hidden && $('konten').querySelector('.skel')) $('konten').innerHTML = kartuGalat(m);
    toast(m, 'danger');
    if (/^Sesi/.test(m) && S.t) keluarLokal();
  };
  tm = setTimeout(() => { if (ctl) ctl.abort(); gagal('Server terlalu lama merespons (lebih dari 40 detik). Periksa koneksi internet lalu coba lagi.'); }, API_BATAS_WAKTU);
  panggilApi(fn, args, ctl && ctl.signal).then(r => {
    if (fin) return;
    if (!r) return gagal('Server tidak mengirim data balik.');
    if (r.message === '__BATAS_WAKTU__') return gagal('Server terlalu lama merespons. Coba lagi.');
    if (!r.success) return gagal(r.message);
    fin = true; selesai();
    try { ok(r.data); } catch (x) { console.error(x); toast('Galat tampilan: ' + x.message, 'danger'); }
  });
}
