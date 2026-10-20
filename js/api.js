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


/* ═══════ Kecepatan: cache baca-saja "stale-while-revalidate" ═══════
   Menu yang pernah dibuka tampil SEKETIKA dari memori; di latar belakang data diambil ulang, dan layar hanya
   diperbarui bila isinya memang berubah. Cache privat hanya ada di memori (hilang saat tutup tab / keluar).
   Hanya data publik (portal warga) yang disimpan di localStorage agar kunjungan berikutnya langsung tampil. */
const BACA_PRIVAT = ['getDashboard', 'listWarga', 'listKas', 'listInfo', 'listAturan', 'listAduan', 'listAset', 'listPeminjaman', 'listPengeluaranAset', 'listKasMaster', 'listUser', 'getPengaturan', 'rekapKeuangan', 'rekapWarga', 'rekapAduan'];
const BACA_PUBLIK = ['getPublik', 'getAturanPublik', 'getAduanPublik', 'getAsetPublik'];
const SEGAR_MS = 8000;        // data yang lebih baru dari ini tidak diambil ulang
const _cache = new Map();     // kunci → { data, t }
const _terbang = new Map();   // kunci → Promise (permintaan yang sedang berjalan dibagi, tidak diulang)
let _gen = 0;                 // naik setiap ada tulisan: hasil baca yang berangkat sebelum tulisan dianggap basi
let _layar = 0;               // naik setiap pengguna pindah menu / tab; hasil yang telat tidak boleh menimpa layar baru
let _sibuk = 0;
function sibuk(d) { _sibuk = Math.max(0, _sibuk + d); const el = document.getElementById('pbar'); if (el) el.classList.toggle('on', _sibuk > 0); }
const kunciBaca = (fn, args) => BACA_PUBLIK.indexOf(fn) >= 0 ? fn + '|' + JSON.stringify(args) : fn + '|' + String(args[0] || '').slice(0, 10) + '|' + JSON.stringify(args.slice(1));
function cacheKosongkan() { _cache.clear(); _terbang.clear(); }
function cacheBasi() { _cache.forEach(e => { e.t = 0; }); }
function simpanLokal(k, d) { try { localStorage.setItem('rtd:' + k, JSON.stringify(d)); } catch (e) { /* penuh / diblokir: abaikan */ } }
function bacaLokal(k) { try { const j = localStorage.getItem('rtd:' + k); return j ? JSON.parse(j) : null; } catch (e) { return null; } }

function ambilBaca(k, fn, args, senyap) {
  if (_terbang.has(k)) return _terbang.get(k);
  const gen = _gen, ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const tm = ctl ? setTimeout(() => ctl.abort(), API_BATAS_WAKTU) : 0;
  if (!senyap) sibuk(1);
  const p = panggilApi(fn, args, ctl && ctl.signal).then(r => {
    clearTimeout(tm); if (!senyap) sibuk(-1); _terbang.delete(k);
    if (r && r.success) { _cache.set(k, { data: r.data, t: gen === _gen ? Date.now() : 0 }); if (BACA_PUBLIK.indexOf(fn) >= 0) simpanLokal(k, r.data); }
    return r;
  });
  _terbang.set(k, p);
  return p;
}
function gagalBaca(m, err) {
  m = m || 'Terjadi kesalahan.';
  if (err && err(m)) return;
  if (!$('v-admin').hidden && $('konten').querySelector('.skel')) $('konten').innerHTML = kartuGalat(m);
  toast(m, 'danger');
  if (/^Sesi/.test(m) && S.t) keluarLokal();
}
/** Sama dengan api() untuk fungsi baca-saja, tetapi: tampil dulu dari cache, lalu segarkan diam-diam. opsi.tanpaCache = selalu ambil baru (untuk formulir). */
function apiBaca(fn, args, ok, btn, err, opsi) {
  const k = kunciBaca(fn, args), layar = _layar, tanpaCache = !!(opsi && opsi.tanpaCache);
  let e = tanpaCache ? null : _cache.get(k);
  if (!e && !tanpaCache && BACA_PUBLIK.indexOf(fn) >= 0) { const d = bacaLokal(k); if (d !== null) e = { data: d, t: 0 }; }
  let tampil = null;
  const tunjuk = d => { try { ok(d); } catch (x) { console.error(x); toast('Galat tampilan: ' + x.message, 'danger'); } };
  if (e) { tampil = JSON.stringify(e.data); tunjuk(e.data); if (Date.now() - e.t < SEGAR_MS) return; }
  let lama; if (btn && !e) { lama = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...'; }
  const pulih = () => { if (btn && !e) { btn.disabled = false; btn.innerHTML = lama; } };
  ambilBaca(k, fn, args).then(r => {
    pulih();
    if (!r || !r.success) {
      const m = !r ? 'Server tidak mengirim data balik.' : r.message === '__BATAS_WAKTU__' ? 'Server terlalu lama merespons (lebih dari 40 detik). Periksa koneksi internet lalu coba lagi.' : r.message;
      if (/^Sesi/.test(m)) return gagalBaca(m, err);
      if (e || layar !== _layar) return;   // data lama sudah di layar / pengguna sudah pindah: kegagalan segar-ulang tidak perlu mengganggu
      return gagalBaca(m, err);
    }
    if (layar !== _layar) return;          // pengguna sudah pindah menu: hasil tetap tersimpan di cache, tidak menimpa layar baru
    if (JSON.stringify(r.data) !== tampil) tunjuk(r.data);
  });
}
/** Muat data menu lain lebih dulu (senyap, 2 sekaligus) supaya saat dibuka sudah tersedia. */
function prefetchBaca(daftar) {
  const antre = daftar.slice();
  const lanjut = () => {
    const x = antre.shift(); if (!x) return;
    const k = kunciBaca(x[0], x[1]), e = _cache.get(k);
    if (_terbang.has(k) || (e && Date.now() - e.t < SEGAR_MS * 4)) return lanjut();
    ambilBaca(k, x[0], x[1], true).then(() => setTimeout(lanjut, 120));
  };
  lanjut(); lanjut();
}

/** Pembungkus UI: tombol "Memproses…", penanganan galat, batas waktu, dan callback sukses.
    api(action, args, ok(data), tombol?, err(pesan)→true bila galat sudah ditangani sendiri) */
function api(fn, args, ok, btn, err, opsi) {
  if (BACA_PRIVAT.indexOf(fn) >= 0 || BACA_PUBLIK.indexOf(fn) >= 0) return apiBaca(fn, args || [], ok, btn, err, opsi);
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
    if (fn === 'masuk') cacheKosongkan(); else { _gen++; cacheBasi(); } // ada perubahan: semua data tersimpan wajib disegarkan saat dibuka lagi
    try { ok(r.data); } catch (x) { console.error(x); toast('Galat tampilan: ' + x.message, 'danger'); }
  });
}
