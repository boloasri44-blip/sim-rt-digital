/* RT.Digital — logika aplikasi (SPA). Komunikasi ke backend ada di js/api.js; alamat backend di js/config.js. */
/** RT.Digital — Frontend (SPA murni: URL tidak pernah berubah, token hanya di memori) */
const S = { t: null, u: null, kas: null, tab: {} };
const JENIS = ['Utama', 'Sosial', 'Pembangunan'];
const $ = i => document.getElementById(i);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const BD = { Tetap: 'ok', Kontrak: 'wa', Aktif: 'ok', Arsip: 'mu', Baru: 'no', Diproses: 'wa', Selesai: 'ok', Pemasukan: 'ok', Pengeluaran: 'no', Saran: 'in', Aduan: 'no', 'Baik': 'ok', 'Rusak Ringan': 'wa', 'Rusak Berat': 'no', 'Hilang': 'mu', Menunggu: 'wa', Disetujui: 'ok', Dipinjam: 'in', Dikembalikan: 'mu', Ditolak: 'no', 'Pengembalian Diajukan': 'wa', Rusak: 'no', Dijual: 'in', Dihibahkan: 'in', 'Habis Terpakai': 'wa' };
const badge = v => `<span class="bdg bdg-${BD[v] || 'mu'}">${esc(v)}</span>`;
const hariIni = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const skel = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';

/* ── Tema ── */
function setTema(n) { document.documentElement.dataset.theme = n; document.documentElement.dataset.bsTheme = n; }
function tema() {
  const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTema(n);
  try { localStorage.setItem('tema', n); } catch (e) {}
  Object.keys(LAST).forEach(id => { if ($(id)) grafik(id, ...LAST[id]); });
}

/* ── Panggilan server (loading + galat ramah) ── */
const kartuGalat = m => `<div class="card-x p-4 text-center"><i class="bi bi-exclamation-triangle fs-2 text-danger"></i><p class="mt-2 mb-3">${esc(m)}</p><button class="btn btn-pri" onclick="buka(S.mod)">Coba lagi</button></div>`;
function toast(m, tipe) {
  const e = $('toast'); $('tBody').textContent = m;
  e.className = 'toast align-items-center border-0 text-bg-' + (tipe || 'success');
  bootstrap.Toast.getOrCreateInstance(e, { delay: 3500 }).show();
}

/* ── Modal serbaguna ── */
let SIMPAN = null;
function modalX(judul, html, label, fn, bahaya, lebar) {
  $('mJ').textContent = judul; $('mB').innerHTML = html;
  $('modalX').querySelector('.modal-dialog').classList.toggle('modal-lg', !!lebar);
  const b = $('mS'); b.textContent = label; b.className = 'btn ' + (bahaya ? 'btn-no' : 'btn-pri'); b.disabled = false;
  SIMPAN = fn; bootstrap.Modal.getOrCreateInstance($('modalX')).show();
}
function mHide() { bootstrap.Modal.getOrCreateInstance($('modalX')).hide(); }
function tanya(p, ya, label) { modalX('Konfirmasi', `<p class="m-0">${esc(p)}</p>`, label || 'Ya, lanjutkan', ya, 1); }
function ambil() {
  if (!$('mF').reportValidity()) return null;
  const d = {}; new FormData($('mF')).forEach((v, k) => d[k] = v); return d;
}
function F(k, l, t, v, o = {}) {
  const a = `name="${k}" id="f_${k}" ${o.req ? 'required' : ''} ${o.pattern ? `pattern="${o.pattern}"` : ''} ${o.min ? `min="${o.min}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.minlen ? `minlength="${o.minlen}"` : ''} ${o.ac ? `autocomplete="${o.ac}"` : ''} ${o.attr || ''}`;
  const i = t === 'select' ? `<select class="form-select" ${a}>${o.opsi.map(x => `<option ${x == v ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`
    : t === 'textarea' ? `<textarea class="form-control" rows="4" ${a}>${esc(v)}</textarea>`
    : `<input class="form-control" type="${t}" value="${esc(v)}" ${a}>`;
  return `<div class="mb-3"><label class="form-label" for="f_${k}">${l}${o.req ? ' *' : ''}</label>${i}</div>`;
}

/* ── Grafik (Chart.js) ── */
const CH = {}, LAST = {};
function grafik(id, masuk, keluar, keys, awalan) {
  LAST[id] = [masuk, keluar, keys, awalan];
  if (CH[id]) CH[id].destroy();
  const g = document.documentElement.dataset.theme === 'dark', tx = g ? '#CBD5E1' : '#475569';
  CH[id] = new Chart($(id), {
    type: 'bar',
    data: { labels: keys.map(k => (awalan === undefined ? 'Kas ' : awalan) + k), datasets: [
      { label: 'Pemasukan', data: keys.map(k => masuk[k]), backgroundColor: '#10B981', borderRadius: 6 },
      { label: 'Pengeluaran', data: keys.map(k => keluar[k]), backgroundColor: '#EF4444', borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tx } }, tooltip: { callbacks: { label: c => c.dataset.label + ': ' + rp(c.parsed.y) } } },
      scales: { x: { ticks: { color: tx }, grid: { display: false } }, y: { ticks: { color: tx, callback: v => v >= 1e6 ? (v / 1e6) + ' jt' : v }, grid: { color: g ? '#334155' : '#E2E8F0' } } } }
  });
}
let KASINFO = {}, APPCFG = {};
const setKasInfo = l => { KASINFO = {}; (l || []).forEach(k => KASINFO[k.Nama] = k); };
const warnaKas = j => (KASINFO[j] && KASINFO[j].Warna) || '#F97316';
const kartuSaldo = (j, n) => `<div class="col-12 col-md-4"><div class="card-x saldo k-${j}" style="--c:${warnaKas(j)}"><span class="pill">Kas ${esc(j)}</span><div class="nilai mt-2">${rp(n)}</div><small>Saldo terkini</small></div></div>`;

/* ── Pengaturan tampilan aplikasi (nama, wilayah, teks beranda) ── */
/* ── Warna & logo aplikasi (dari Pengaturan Aplikasi) ── */
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const rgbHex = r => '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const campur = (h, ke, p) => rgbHex(hexRgb(h).map((v, i) => v + (ke[i] - v) * p));
const lumin = h => { const c = hexRgb(h).map(v => v / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const kontras = (a, b) => (Math.max(lumin(a), lumin(b)) + 0.05) / (Math.min(lumin(a), lumin(b)) + 0.05);
const gelapkanHingga = h => { let x = h, p = 0; while (kontras(x, '#FFFFFF') < 4.5 && p < 0.9) { p += 0.05; x = campur(h, [0, 0, 0], p); } return x; };
function terapkanTema(a) {
  if (!a) return;
  const el = document.documentElement, st = el.style;
  const u = String(a.warna_utama || '#F97316').toUpperCase(), sb = String(a.warna_sidebar || '#312E81').toUpperCase();
  if (u === '#F97316') ['--pri', '--btn', '--btn-h'].forEach(p => st.removeProperty(p));
  else { const b = gelapkanHingga(u); st.setProperty('--pri', u); st.setProperty('--btn', b); st.setProperty('--btn-h', campur(b, [0, 0, 0], 0.18)); }
  if (sb === '#312E81') ['--sb', '--sb-h', '--hero1', '--hero2'].forEach(p => st.removeProperty(p));
  else { st.setProperty('--sb', sb); st.setProperty('--sb-h', campur(sb, [255, 255, 255], 0.1)); st.setProperty('--hero1', sb); st.setProperty('--hero2', campur(sb, [255, 255, 255], 0.25)); }
  if (a.logo) { st.setProperty('--logo', `url("${a.logo}")`); el.dataset.logo = 'kustom'; } else { st.removeProperty('--logo'); delete el.dataset.logo; }
  const ik = document.querySelector('link[rel=icon]'); if (ik) ik.href = a.logo || 'assets/logo.webp'; // ikon tab browser
}
function terapkanApp(a) {
  if (!a) return;
  APPCFG = a;
  terapkanTema(a);
  document.title = a.nama_app;
  document.querySelectorAll('.app-nama').forEach(e => e.textContent = a.nama_app);
  document.querySelectorAll('.app-wil').forEach(e => e.textContent = a.wilayah);
  if ($('heroJudul')) $('heroJudul').textContent = a.hero_judul;
  if ($('heroDesk')) $('heroDesk').textContent = a.hero_deskripsi;
  if ($('footTeks')) $('footTeks').textContent = a.footer_teks;
}

/* ── Portal warga ── */
function muatPublik() {
  api('getPublik', [$('periode').value], d => {
    terapkanApp(d.app); setKasInfo(d.kas);
    const nm = d.kas.map(k => k.Nama);
    $('pSaldo').innerHTML = nm.map(j => kartuSaldo(j, d.saldo[j])).join('');
    grafik('cPublik', d.masuk, d.keluar, nm);
    $('pWaktu').textContent = 'Diperbarui ' + d.waktu + ' WIB';
    $('pInfo').innerHTML = d.info.length ? d.info.map(i => `<div class="info"><b>${esc(i.Judul)}</b><small>${esc(i.Tanggal)}</small><p>${esc(i.Isi)}</p></div>`).join('') : '<p class="text-muted m-0">Belum ada pengumuman.</p>';
    $('muat').hidden = true;
  }, null, m => {
    $('muat').hidden = true; toast(m, 'danger');
    $('pSaldo').innerHTML = `<div class="col-12"><div class="card-x p-3 text-center"><p class="mb-2">${esc(m)}</p><button class="btn btn-pri btn-sm" onclick="muatPublik()">Muat ulang</button></div></div>`;
    return true;
  });
}
function submitAduan(e) {
  e.preventDefault();
  const f = $('fAduan'), file = f.berkas.files[0], btn = f.querySelector('[type=submit]');
  const kirim = berkas => api('kirimAduan', [{ jenis: f.jenis.value, kategori: f.kategori.value, isi: f.isi.value, nama: f.nama.value, kontak: f.kontak.value, file: berkas }],
    () => { toast('Terima kasih! Aduan/saran Anda sudah terkirim.'); f.reset(); }, btn);
  if (!file) return kirim(null);
  if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) return toast('Hanya JPG, PNG, atau PDF.', 'warning');
  if (file.size > 5 * 1024 * 1024) return toast('Ukuran berkas maksimal 5 MB.', 'warning');
  const r = new FileReader();
  r.onload = () => kirim({ data: r.result.split(',')[1], type: file.type });
  r.readAsDataURL(file);
}

/* ── Login / logout ── */
function bukaLogin() {
  modalX('Login Pengurus', '<span class="logo logo-lg" role="img" aria-label="Logo"></span>' +
    F('u', 'Username', 'text', '', { req: 1, ac: 'username', attr: 'autocapitalize="none" autocorrect="off" spellcheck="false"' }) + F('p', 'Password', 'password', '', { req: 1, ac: 'current-password' }), 'Masuk', prosesLogin);
}
function prosesLogin() {
  const d = ambil(); if (!d) return;
  api('masuk', [d.u, d.p], r => {
    S.t = r.token; S.u = r; setKasInfo(r.kasInfo); mHide();
    $('v-publik').hidden = true; $('v-admin').hidden = false;
    semaiCacheLogin(r); bangunNav(); buka('dashboard'); toast('Selamat datang, ' + r.nama + '!'); setTimeout(prefetchAwal, 700);
  }, $('mS'));
}
function keluar() { api('keluar', [S.t], keluarLokal, null, () => { keluarLokal(); return true; }); }
function keluarLokal() {
  cacheKosongkan(); S.t = S.u = null; S.tab = {}; S.kas = S.as = S.rk = S.pg = S.atr = null; // jangan bawa posisi menu pengguna sebelumnya
  $('v-admin').hidden = true; $('v-publik').hidden = false; muatPublik(); muatPublikTambahan();
}

/* ── Navigasi SPA pengurus ── */
function bangunNav() {
  const p = S.u.peran;
  const m = [['dashboard', 'speedometer2', 'Dashboard', 1], ['warga', 'people', 'Data Warga', 1], ['kas', 'wallet2', 'Keuangan Kas', 1], ['info', 'megaphone', 'Info &amp; Pengumuman', 1], ['aturan', 'journal-text', 'Aturan', 1],
    ['aduan', 'chat-square-text', 'Aduan &amp; Saran', 1], ['aset', 'box-seam', 'Aset &amp; Inventaris', 1], ['rekap', 'file-earmark-bar-graph', 'Rekap Laporan', REKAP.some(x => x.ada())], ['pengaturan', 'gear', 'Pengaturan', 1]].filter(x => x[3]); // semua menu tampil; hak ubah diatur per modul
  $('nav').innerHTML = m.map(x => `<a href="javascript:void(0)" data-m="${x[0]}" onclick="buka('${x[0]}')"><i class="bi bi-${x[1]}"></i> ${x[2]}</a>`).join('');
  $('sbUser').innerHTML = `<b>${esc(S.u.nama)}</b><span>${esc(p)}</span>`;
}
function buka(m) {
  terapkanTema(APPCFG);
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.m === m));
  $('judul').textContent = document.querySelector(`#nav a[data-m=${m}]`).textContent.trim();
  S.mod = m; sbTutup(); $('konten').innerHTML = skel; R[m]();
}
function sbBuka() { $('sb').classList.add('buka'); $('ov').classList.add('buka'); }
function sbTutup() { $('sb').classList.remove('buka'); $('ov').classList.remove('buka'); }

/* ── Tabel generik: cari, saring, urut, halaman ── */
const T = {};
function tabel(id, kolom, baris, opt = {}) {
  T[id] = { kolom, baris, q: '', hal: 1, sort: null, arah: 1, fk: opt.saring && opt.saring[0], fv: '' };
  const sar = opt.saring ? `<select class="form-select w-auto" aria-label="Saring" onchange="T['${id}'].fv=this.value;T['${id}'].hal=1;isiTabel('${id}')"><option value="">Semua ${opt.saring[0]}</option>${opt.saring[1].map(x => `<option>${x}</option>`).join('')}</select>` : '';
  $(id).innerHTML = `<div class="d-flex gap-2 mb-3 flex-wrap"><input class="form-control" style="max-width:300px" placeholder="Cari..." aria-label="Cari" oninput="T['${id}'].q=this.value.toLowerCase();T['${id}'].hal=1;isiTabel('${id}')">${sar}</div>
  <div class="card-x"><div class="table-responsive"><table class="table m-0"><thead></thead><tbody></tbody></table></div></div><div class="d-flex justify-content-between align-items-center py-2 small" id="${id}-pg"></div>`;
  isiTabel(id);
}
function urut(id, i) { const t = T[id]; t.arah = t.sort === i ? -t.arah : 1; t.sort = i; isiTabel(id); }
function hal(id, d) { T[id].hal += d; isiTabel(id); }
function isiTabel(id) {
  const t = T[id];
  let b = t.baris.filter(r => (!t.q || JSON.stringify(Object.values(r)).toLowerCase().includes(t.q)) && (!t.fv || r[t.fk] === t.fv));
  if (t.sort !== null) { const k = t.kolom[t.sort].k; b = [...b].sort((x, y) => String(x[k]).localeCompare(String(y[k]), 'id', { numeric: true }) * t.arah); }
  const n = Math.max(1, Math.ceil(b.length / 10)); t.hal = Math.max(1, Math.min(t.hal, n));
  const h = b.slice((t.hal - 1) * 10, t.hal * 10), el = $(id);
  el.querySelector('thead').innerHTML = '<tr>' + t.kolom.map((c, i) => `<th ${c.k ? `class="srt" onclick="urut('${id}',${i})"` : ''}>${c.h}${c.k && t.sort === i ? (t.arah > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
  el.querySelector('tbody').innerHTML = h.length ? h.map(r => '<tr>' + t.kolom.map(c => `<td>${c.f ? c.f(r) : esc(r[c.k])}</td>`).join('') + '</tr>').join('') : `<tr><td colspan="${t.kolom.length}" class="text-center text-muted py-4">Tidak ada data.</td></tr>`;
  $(id + '-pg').innerHTML = `<span>${b.length} data</span><span><button class="btn btn-sm btn-ghost" ${t.hal <= 1 ? 'disabled' : ''} onclick="hal('${id}',-1)" aria-label="Sebelumnya">‹</button> ${t.hal}/${n} <button class="btn btn-sm btn-ghost" ${t.hal >= n ? 'disabled' : ''} onclick="hal('${id}',1)" aria-label="Berikutnya">›</button></span>`;
}
const isKetua = () => S.u.peran === 'Ketua RT';
const btnEdit = fn => `<button class="btn btn-sm btn-soft" onclick="${fn}" aria-label="Ubah"><i class="bi bi-pencil"></i></button>`;
const btnDel = (tab, id, m) => isKetua() ? ` <button class="btn btn-sm btn-ghost text-danger" onclick="hapusData('${tab}','${id}','${m}')" aria-label="Hapus"><i class="bi bi-trash"></i></button>` : '';
function hapusData(tab, id, m) {
  tanya('Hapus data ini? Tindakan tidak dapat dibatalkan.', () => api('hapus', [S.t, tab, id], () => { mHide(); toast('Data dihapus.'); R[m](); }, $('mS')), 'Hapus');
}
const kepala = (judul, tombol) => `<div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><h2 class="h5 m-0">${judul}</h2>${tombol || ''}</div>`;

/* ── Halaman pengurus ── */
const R = {
  dashboard() {
    api('getDashboard', [S.t], d => {
      setKasInfo(d.kasInfo);
      const stat = (l, n) => `<div class="col-6 col-md-4"><div class="card-x p-3"><small>${l}</small><div class="nilai">${n}</div></div></div>`;
      $('konten').innerHTML = `<div class="hero mt-0"><h1>Selamat datang, ${esc(d.nama)}</h1><p class="m-0">${esc(d.peran)}</p></div>
        <div class="row g-3 mb-4">${d.kas.map(j => kartuSaldo(j, d.saldo[j])).join('')}${d.aduanBaru !== null ? stat('Aduan baru', d.aduanBaru) : ''}${d.warga !== null ? stat('Kepala keluarga', d.warga) : ''}</div>
        ${d.kas.length ? '<div class="card-x p-3"><h2 class="h6">Pemasukan vs Pengeluaran (6 bulan)</h2><div style="height:260px"><canvas id="cAdm"></canvas></div></div>' : ''}`;
      if (d.kas.length) grafik('cAdm', d.masuk, d.keluar, d.kas);
    });
  },
  warga() {
    api('listWarga', [S.t], rows => {
      S.tab.warga = rows;
      $('konten').innerHTML = kepala('Basis Data Warga', adaHak(PERAN_DATA) ? '<button class="btn btn-pri rounded-pill" onclick="formWarga()"><i class="bi bi-person-plus"></i> Tambah Warga</button>' : '') + catatanLihat(adaHak(PERAN_DATA), 'Ketua RT dan Sekretaris') + '<div id="tW"></div>';
      tabel('tW', [{ h: 'Nama', k: 'Nama', f: r => `<b>${esc(r.Nama)}</b>` }, { h: 'NIK', k: 'NIK', f: r => `<code>${esc(r.NIK)}</code>` }, { h: 'No. KK', k: 'No_KK', f: r => `<code>${esc(r.No_KK)}</code>` },
        { h: 'Alamat', k: 'Alamat' }, { h: 'No. HP', k: 'No_HP' }, { h: 'Status', k: 'Status', f: r => badge(r.Status) }, { h: 'Jiwa', k: 'Jumlah_Anggota_Keluarga', f: r => `${esc(r.Jumlah_Anggota_Keluarga)} jiwa` },
        { h: '', f: r => (adaHak(PERAN_DATA) ? btnEdit(`formWarga('${r.ID_Warga}')`) : '') + ` <button class="btn btn-sm btn-ghost" onclick="lihatKeluarga('${r.ID_Warga}')" aria-label="Lihat anggota keluarga"><i class="bi bi-people"></i></button>` + btnDel('Warga', r.ID_Warga, 'warga') }], rows, { saring: ['Status', ['Tetap', 'Kontrak']] });
    });
  },
  kas() {
    if (!S.u.kas.length) { $('konten').innerHTML = '<p class="text-muted">Belum ada kas aktif.</p>'; return; }
    kasDetail();
  },
  info() {
    api('listInfo', [S.t], rows => {
      S.tab.info = rows;
      $('konten').innerHTML = kepala('Info &amp; Pengumuman', adaHak(PERAN_DATA) ? '<button class="btn btn-pri rounded-pill" onclick="formInfo()"><i class="bi bi-plus-lg"></i> Tambah Info</button>' : '') + catatanLihat(adaHak(PERAN_DATA), 'Ketua RT dan Sekretaris') + '<div id="tI"></div>';
      tabel('tI', [{ h: 'Judul', k: 'Judul', f: r => `<b>${esc(r.Judul)}</b>` }, { h: 'Terbit', k: 'Tanggal_Terbit' }, { h: 'Status', k: 'Status', f: r => badge(r.Status) }, { h: 'Oleh', k: 'Dibuat_Oleh' },
        { h: '', f: r => (adaHak(PERAN_DATA) ? btnEdit(`formInfo('${r.ID_Info}')`) : '') + btnDel('Info', r.ID_Info, 'info') }], rows, { saring: ['Status', ['Aktif', 'Arsip']] });
    });
  },
  aduan() {
    api('listAduan', [S.t], rows => {
      S.tab.aduan = rows;
      $('konten').innerHTML = kepala('Aduan &amp; Saran Warga') + catatanLihat(S.u.aduanKat.length > 0, 'Ketua RT dan Sekretaris (semua kategori), Sie Sosial (kategori Sosial), Sie Pembangunan (kategori Pembangunan)') + (S.u.aduanKat.length && S.u.aduanKat.length < 3 ? `<div class="small text-muted mb-2"><i class="bi bi-info-circle"></i> Anda dapat mengubah aduan kategori: ${S.u.aduanKat.join(', ')}.</div>` : '') + '<div id="tA"></div>';
      tabel('tA', [{ h: 'Tanggal', k: 'Tanggal' }, { h: 'Jenis', k: 'Jenis', f: r => badge(r.Jenis) }, { h: 'Kategori', k: 'Kategori' },
        { h: 'Isi', f: r => esc(String(r.Isi).slice(0, 60)) + (r.Isi.length > 60 ? '…' : '') }, { h: 'Status', k: 'Status', f: r => badge(r.Status) },
        { h: 'Portal', k: 'Tampil', f: r => `${r.Tampil ? '<span class="bdg bdg-ok">Tampil</span>' : '<span class="bdg bdg-mu">Tersembunyi</span>'} ${S.u.aduanKat.includes(r.Kategori) ? `<button class="btn btn-sm btn-ghost" onclick="aturTampil('${r.ID_Aduan}', ${r.Tampil ? 'false' : 'true'})" title="${r.Tampil ? 'Sembunyikan dari portal warga' : 'Tampilkan di portal warga'}" aria-label="${r.Tampil ? 'Sembunyikan dari portal warga' : 'Tampilkan di portal warga'}"><i class="bi bi-eye${r.Tampil ? '-slash' : ''}"></i></button>` : ''}` },
        { h: '', f: r => `<button class="btn btn-sm btn-soft" onclick="detailAduan('${r.ID_Aduan}')">Detail</button>` }], rows, { saring: ['Status', ['Baru', 'Diproses', 'Selesai']] });
    });
  },
  aturan() {
    const kelola = adaHak(PERAN_DATA);
    if (!ATURAN_TAB.some(x => x[0] === S.atr)) S.atr = 'Warga';
    api('listAturan', [S.t], rows => {
      S.tab.aturan = rows;
      $('konten').innerHTML = `<div class="d-flex flex-wrap gap-2 mb-3">${ATURAN_TAB.map(x => `<button class="pill-tab ${x[0] === S.atr ? 'on' : ''}" onclick="S.atr='${x[0]}';R.aturan()"><i class="bi bi-${x[2]}"></i> ${x[1]}</button>`).join('')}</div>` +
        kepala('Aturan ' + S.atr, kelola ? '<button class="btn btn-pri rounded-pill" onclick="formAturan()"><i class="bi bi-plus-lg"></i> Tambah Aturan</button>' : '') + catatanLihat(kelola, 'Ketua RT dan Sekretaris') + '<p class="small text-muted">Aturan berstatus Aktif tampil di portal warga.</p><div id="tAt"></div>';
      tabel('tAt', [{ h: 'No', k: 'Urutan' }, { h: 'Judul', k: 'Judul', f: r => `<b>${esc(r.Judul)}</b>` },
        { h: 'Isi', f: r => `<span style="white-space:normal;display:inline-block;min-width:240px">${esc(String(r.Isi).slice(0, 120))}${String(r.Isi).length > 120 ? '…' : ''}</span>` },
        { h: 'Status', k: 'Status', f: r => badge(r.Status) }, { h: '', f: r => (kelola ? btnEdit(`formAturan('${r.ID_Aturan}')`) : '') + btnDel('Aturan', r.ID_Aturan, 'aturan') }],
        rows.filter(r => r.Kategori === S.atr), { saring: ['Status', ['Aktif', 'Arsip']] });
    });
  },
  aset() {
    const proses = true; // semua pengurus melihat Daftar Aset dan Peminjaman
    if (!['daftar', 'pinjam', 'keluar'].includes(S.as)) S.as = 'daftar';
    $('konten').innerHTML = (proses ? `<div class="d-flex flex-wrap gap-2 mb-3 no-print"><button class="pill-tab ${S.as === 'daftar' ? 'on' : ''}" onclick="S.as='daftar';R.aset()"><i class="bi bi-box-seam"></i> Daftar Aset</button><button class="pill-tab ${S.as === 'pinjam' ? 'on' : ''}" onclick="S.as='pinjam';R.aset()"><i class="bi bi-arrow-left-right"></i> Peminjaman</button><button class="pill-tab ${S.as === 'keluar' ? 'on' : ''}" onclick="S.as='keluar';R.aset()"><i class="bi bi-box-arrow-up"></i> Pengeluaran</button></div>` : '') + `<div id="asIsi">${skel}</div>`;
    if (S.as === 'pinjam') asPinjam(); else if (S.as === 'keluar') asKeluar(); else asDaftar();
  },
  rekap() {
    const m = REKAP.filter(x => x.ada());
    if (!m.some(x => x.id === S.rk)) S.rk = m[0].id;
    $('konten').innerHTML = `<div class="d-flex flex-wrap gap-2 mb-3 no-print">${m.map(x => `<button class="pill-tab ${x.id === S.rk ? 'on' : ''}" onclick="S.rk='${x.id}';R.rekap()"><i class="bi bi-${x.icon}"></i> ${x.label}</button>`).join('')}</div><div id="rkIsi">${skel}</div>`;
    m.find(x => x.id === S.rk).render();
  },
  pengaturan() {
    terapkanTema(APPCFG);
    const p = S.u.peran, m = PENGATURAN.filter(x => !x.peran || x.peran.includes(p));
    if (!m.some(x => x.id === S.pg)) S.pg = m[0].id;
    $('konten').innerHTML = `<div class="d-flex flex-wrap gap-2 mb-3">${m.map(x => `<button class="pill-tab ${x.id === S.pg ? 'on' : ''}" onclick="S.pg='${x.id}';R.pengaturan()"><i class="bi bi-${x.icon}"></i> ${x.label}</button>`).join('')}</div><div id="pgIsi">${skel}</div>`;
    m.find(x => x.id === S.pg).render();
  }
};
Object.keys(R).forEach(n => { const f = R[n]; R[n] = function () { _layar++; return f.apply(this, arguments); }; }); // penanda 'pindah layar' untuk api.js

/* ── Form-form ── */
const HUB = ['Istri', 'Suami', 'Anak', 'Orang Tua', 'Mertua', 'Cucu', 'Famili Lain', 'Lainnya'];
const opsi = (l, v) => l.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('');
function barisAng(a = {}) {
  return `<div class="ang card-x p-2 mb-2"><div class="row g-2">
    <div class="col-12 col-md-6"><label class="form-label small">Nama *</label><input class="form-control a-nama" required maxlength="100" value="${esc(a.Nama)}"></div>
    <div class="col-12 col-md-6"><label class="form-label small">NIK (16 digit) *</label><input class="form-control a-nik" required pattern="\\d{16}" maxlength="16" inputmode="numeric" value="${esc(a.NIK)}"></div>
    <div class="col-6 col-md-3"><label class="form-label small">Hubungan</label><select class="form-select a-hub">${opsi(HUB, a.Hubungan)}</select></div>
    <div class="col-6 col-md-3"><label class="form-label small">Jenis kelamin</label><select class="form-select a-jk">${opsi(['Laki-laki', 'Perempuan'], a.Jenis_Kelamin)}</select></div>
    <div class="col-6 col-md-3"><label class="form-label small">Tgl lahir</label><input type="date" class="form-control a-tgl" value="${esc(a.Tgl_Lahir)}"></div>
    <div class="col-6 col-md-3"><label class="form-label small">Pekerjaan</label><input class="form-control a-kerja" maxlength="60" value="${esc(a.Pekerjaan)}"></div>
    <div class="col-12 text-end"><button type="button" class="btn btn-sm btn-ghost text-danger" onclick="this.closest('.ang').remove()"><i class="bi bi-trash"></i> Hapus anggota</button></div></div></div>`;
}
function tambahAng() { $('angList').insertAdjacentHTML('beforeend', barisAng()); }
function kumpulAng() {
  return [...document.querySelectorAll('#mF .ang')].map(r => ({ Nama: r.querySelector('.a-nama').value, NIK: r.querySelector('.a-nik').value, Hubungan: r.querySelector('.a-hub').value,
    Jenis_Kelamin: r.querySelector('.a-jk').value, Tgl_Lahir: r.querySelector('.a-tgl').value, Pekerjaan: r.querySelector('.a-kerja').value }));
}
function formWarga(id) {
  const w = (S.tab.warga || []).find(x => x.ID_Warga === id) || { Status: 'Tetap', Anggota: [] }, ang = w.Anggota || [];
  const catatan = id && w.Jumlah_Anggota_Keluarga > 1 + ang.length ? `<div class="alert alert-warning py-2 small">Tercatat ${w.Jumlah_Anggota_Keluarga} jiwa, baru ${1 + ang.length} yang terdata. Lengkapi anggota di bawah, jumlah jiwa dihitung otomatis.</div>` : '';
  modalX(id ? 'Ubah Data Warga' : 'Tambah Warga',
    F('Nama', 'Nama kepala keluarga', 'text', w.Nama, { req: 1, max: 100 }) + F('NIK', 'NIK kepala keluarga (16 digit)', 'text', w.NIK, { req: 1, pattern: '\\d{16}', max: 16 }) +
    F('No_KK', 'No. KK (16 digit)', 'text', w.No_KK, { req: 1, pattern: '\\d{16}', max: 16 }) + F('Alamat', 'Alamat / No. rumah', 'text', w.Alamat, { max: 200 }) +
    F('No_HP', 'No. HP', 'tel', w.No_HP, { max: 20 }) + F('Status', 'Status hunian', 'select', w.Status, { opsi: ['Tetap', 'Kontrak'] }) +
    `<hr><div class="d-flex justify-content-between align-items-center mb-2"><h3 class="h6 m-0">Anggota Keluarga</h3><button type="button" class="btn btn-sm btn-soft" onclick="tambahAng()"><i class="bi bi-person-plus"></i> Tambah Anggota</button></div>
     <small class="text-muted d-block mb-2">Kepala keluarga sudah dihitung otomatis. Isi anggota lain (istri/suami, anak, dll).</small>${catatan}<div id="angList">${ang.map(barisAng).join('')}</div>`,
    'Simpan', () => {
      const d = ambil(); if (!d) return; if (id) d.ID_Warga = id;
      d.Anggota = kumpulAng();
      api('simpanWarga', [S.t, d], () => { mHide(); toast('Data warga tersimpan.'); R.warga(); }, $('mS'));
    }, false, true);
}
function lihatKeluarga(id) {
  const w = S.tab.warga.find(x => x.ID_Warga === id), a = w.Anggota || [];
  modalX('Keluarga ' + w.Nama, `<p class="small text-muted">Kepala keluarga: <b>${esc(w.Nama)}</b> · NIK ${esc(w.NIK)} · ${esc(w.Jumlah_Anggota_Keluarga)} jiwa</p>` +
    (a.length ? `<div class="table-responsive"><table class="table table-sm"><thead><tr><th>Nama</th><th>NIK</th><th>Hubungan</th><th>JK</th><th>Lahir</th><th>Pekerjaan</th></tr></thead><tbody>${a.map(x => `<tr><td>${esc(x.Nama)}</td><td><code>${esc(x.NIK)}</code></td><td>${esc(x.Hubungan)}</td><td>${esc(x.Jenis_Kelamin)}</td><td>${esc(x.Tgl_Lahir)}</td><td>${esc(x.Pekerjaan)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="text-muted">Belum ada anggota keluarga lain yang diinput.</p>'),
    'Tutup', mHide, false, true);
}

function formKas(tipe) {
  modalX(`Tambah ${tipe} · Kas ${S.kas}`,
    F('tanggal', 'Tanggal', 'date', hariIni(), { req: 1 }) + F('kategori', 'Kategori', 'text', '', { req: 1, max: 60 }) + F('nominal', 'Nominal (Rp)', 'number', '', { req: 1, min: 1 }) + F('keterangan', 'Keterangan', 'textarea', '', { req: 1, max: 300 }),
    'Simpan', () => {
      const d = ambil(); if (!d) return; d.jenis = S.kas; d.tipe = tipe;
      const kirim = paksa => api('simpanKas', [S.t, Object.assign({}, d, { paksa })], () => { mHide(); toast('Transaksi tersimpan.'); kasDetail(); }, $('mS'),
        m => { if (m === 'SALDO_NEGATIF') { tanya('Pengeluaran ini membuat saldo kas menjadi negatif. Tetap simpan?', () => kirim(true)); return true; } });
      kirim(false);
    });
}
function formInfo(id) {
  const i = (S.tab.info || []).find(x => x.ID_Info === id) || { Status: 'Aktif' };
  modalX(id ? 'Ubah Info' : 'Tambah Info', F('Judul', 'Judul', 'text', i.Judul, { req: 1, max: 120 }) + F('Isi', 'Isi pengumuman', 'textarea', i.Isi, { req: 1, max: 2000 }) + F('Status', 'Status', 'select', i.Status, { opsi: ['Aktif', 'Arsip'] }),
    'Simpan', () => {
      const d = ambil(); if (!d) return; if (id) d.ID_Info = id;
      api('simpanInfo', [S.t, d], () => { mHide(); toast('Info tersimpan.'); R.info(); }, $('mS'));
    });
}
function detailAduan(id) {
  const a = S.tab.aduan.find(x => x.ID_Aduan === id), bisa = S.u.aduanKat.includes(a.Kategori);
  const isi = `<p class="mb-1"><small>${esc(a.Tanggal)} · ${esc(a.Kategori)} · ${esc(a.Nama_Pengirim || 'Anonim')} ${esc(a.Kontak)}</small></p><p style="white-space:pre-line">${esc(a.Isi)}</p>
    ${a.Ada_Lampiran ? `<button type="button" class="btn btn-soft btn-sm mb-3" onclick="lihatLampiran('${id}',this)"><i class="bi bi-paperclip"></i> Lihat lampiran</button><div id="lamp" class="mb-3"></div>` : ''}`;
  if (!bisa) return modalX(`Detail ${a.Jenis}`, isi + `<p class="mb-1">Status: ${badge(a.Status)}</p>${a.Catatan_Tindak_Lanjut ? `<p class="small text-muted">Tindak lanjut: ${esc(a.Catatan_Tindak_Lanjut)}</p>` : ''}<p class="small text-muted"><i class="bi bi-eye"></i> Anda hanya dapat melihat aduan kategori ${esc(a.Kategori)}.</p>`, 'Tutup', mHide);
  modalX(`Detail ${a.Jenis}`, isi + F('Status', 'Status penanganan', 'select', a.Status, { opsi: ['Baru', 'Diproses', 'Selesai'] }) + F('Catatan', 'Catatan tindak lanjut', 'textarea', a.Catatan_Tindak_Lanjut, { max: 500 }),
    'Simpan', () => { const d = ambil(); if (!d) return; api('updateAduan', [S.t, id, d.Status, d.Catatan], () => { mHide(); toast('Aduan diperbarui.'); R.aduan(); }, $('mS')); });
}
function lihatLampiran(id, btn) {
  api('getLampiran', [S.t, id], d => {
    const bin = atob(d.data), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u], { type: d.tipe }));
    $('lamp').innerHTML = (d.tipe.startsWith('image/') ? `<img src="${url}" class="img-fluid rounded" alt="Lampiran">` : `<iframe src="${url}" style="width:100%;height:60vh;border:0" title="Lampiran"></iframe>`) +
      `<a class="btn btn-ghost btn-sm mt-2" href="${url}" download="${esc(d.nama)}"><i class="bi bi-download"></i> Unduh</a>`;
  }, btn);
}
function gantiPw(e) {
  e.preventDefault();
  api('gantiPassword', [S.t, $('pw1').value, $('pw2').value], () => { toast('Password berhasil diganti.'); e.target.reset(); }, e.target.querySelector('[type=submit]'));
}

/* ── Keuangan: data kas selalu tampil; simpan/ubah/hapus wajib konfirmasi username + password ── */
const bagianKonfirm = () => `<hr><p class="small text-muted mb-2"><i class="bi bi-shield-lock"></i> Konfirmasi dengan akun Anda</p>
  <div class="mb-3"><label class="form-label" for="f_vu">Username</label><input class="form-control" id="f_vu" name="vu" value="${esc(S.u.username)}" readonly></div>
  <div class="mb-3"><label class="form-label" for="f_vp">Password *</label><input class="form-control" id="f_vp" name="vp" type="password" required autocomplete="new-password"></div>`;
function pilihKas(j) { S.kas = j; $('konten').innerHTML = skel; kasDetail(); }
function kasDetail() {
  const ks = S.u.kas;
  if (!ks.includes(S.kas)) S.kas = (S.u.kasTambah || []).find(x => ks.includes(x)) || ks[0]; // buka kas milik peran ini lebih dulu
  api('listKas', [S.t, S.kas], d => {
    S.tab.kas = d.rows;
    const bolehTambah = (S.u.kasTambah || []).includes(S.kas), penambah = String((KASINFO[S.kas] || {}).Peran_Akses || '').split(',').filter(Boolean);
    const catatanKas = `<div class="small text-muted mb-2"><i class="bi bi-${bolehTambah ? 'info-circle' : 'eye'}"></i> ${bolehTambah ? 'Anda dapat menambah transaksi pada kas ini.' : 'Anda hanya dapat melihat kas ini.'} Penambah transaksi: ${esc(['Ketua RT'].concat(penambah).join(', '))}. Ubah/hapus transaksi: Ketua RT.</div>`;
    $('konten').innerHTML = `<div class="d-flex flex-wrap gap-2 mb-3">${ks.map(j => `<button class="pill-tab ${j === S.kas ? 'on' : ''}" onclick="pilihKas('${j}')"><i class="bi bi-wallet2"></i> Kas ${esc(j)}</button>`).join('')}</div>
      <div class="card-x saldo mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2" style="--c:${warnaKas(S.kas)}"><div><small>Saldo Kas ${esc(S.kas)}</small><div class="nilai">${rp(d.saldo)}</div></div>
      ${bolehTambah ? '<div class="d-flex gap-2"><button class="btn btn-ok rounded-pill" onclick="formKas(\'Pemasukan\')"><i class="bi bi-plus-circle"></i> Pemasukan</button><button class="btn btn-no rounded-pill" onclick="formKas(\'Pengeluaran\')"><i class="bi bi-dash-circle"></i> Pengeluaran</button></div>' : ''}</div>${catatanKas}<div id="tK"></div>`;
    tabel('tK', [{ h: 'Tanggal', k: 'Tanggal' }, { h: 'Kategori', k: 'Kategori' }, { h: 'Keterangan', k: 'Keterangan', f: r => `<span style="white-space:normal;display:inline-block;min-width:200px">${esc(r.Keterangan)}</span>` },
      { h: 'Tipe', k: 'Tipe', f: r => badge(r.Tipe) }, { h: 'Nominal', k: 'Nominal', f: r => `<span class="${r.Tipe === 'Pemasukan' ? 'up' : 'down'}">${r.Tipe === 'Pemasukan' ? '+' : '−'}${rp(r.Nominal)}</span>` },
      { h: 'Dicatat', k: 'Dicatat_Oleh' },
      { h: '', f: r => (isKetua() ? btnEdit(`formEditKas('${r.ID_Transaksi}')`) : '') + (isKetua() ? ` <button class="btn btn-sm btn-ghost text-danger" onclick="hapusKas('${r.ID_Transaksi}')" aria-label="Hapus"><i class="bi bi-trash"></i></button>` : '') }],
      d.rows, { saring: ['Tipe', ['Pemasukan', 'Pengeluaran']] });
  });
}
function formEditKas(id) {
  const r = (S.tab.kas || []).find(x => x.ID_Transaksi === id); if (!r) return;
  modalX('Ubah Transaksi · Kas ' + S.kas,
    F('tipe', 'Tipe', 'select', r.Tipe, { opsi: ['Pemasukan', 'Pengeluaran'] }) + F('tanggal', 'Tanggal', 'date', String(r.Tanggal).slice(0, 10), { req: 1 }) + F('kategori', 'Kategori', 'text', r.Kategori, { req: 1, max: 60 }) +
    F('nominal', 'Nominal (Rp)', 'number', r.Nominal, { req: 1, min: 1 }) + F('keterangan', 'Keterangan', 'textarea', r.Keterangan, { req: 1, max: 300 }) + bagianKonfirm(),
    'Simpan Perubahan', () => {
      const d = ambil(); if (!d) return; d.ID_Transaksi = id;
      const kirim = paksa => api('ubahKas', [S.t, Object.assign({}, d, { paksa })], () => { mHide(); toast('Transaksi diperbarui.'); kasDetail(); }, $('mS'),
        m => { if (m === 'SALDO_NEGATIF') { tanya('Perubahan ini membuat saldo kas menjadi negatif. Tetap simpan?', () => kirim(true)); return true; } });
      kirim(false);
    });
}
function hapusKas(id) {
  modalX('Hapus Transaksi', '<p>Hapus transaksi ini? Saldo kas dihitung ulang dan tindakan ini tidak dapat dibatalkan.</p>' + bagianKonfirm(), 'Hapus', () => {
    const d = ambil(); if (!d) return;
    api('hapus', [S.t, 'Kas_Transaksi', id, { vu: d.vu, vp: d.vp }], () => { mHide(); toast('Transaksi dihapus.'); kasDetail(); }, $('mS'));
  }, true);
}

/* ── Modul Pengaturan ──
   Menambah submenu baru = cukup tambah satu baris di PENGATURAN (id, label, icon, peran yang boleh, fungsi render).
   peran: null = semua pengurus. */
const PENGATURAN = [
  { id: 'user', label: 'Pengaturan User', icon: 'people-fill', peran: null, render: () => pgUser() },
  { id: 'aplikasi', label: 'Pengaturan Aplikasi', icon: 'sliders', peran: null, render: () => pgAplikasi() },
  { id: 'kas', label: 'Pengaturan Kas', icon: 'wallet2', peran: null, render: () => pgKas() }
];
const PERAN_LIST = ['Ketua RT', 'Sekretaris', 'Bendahara', 'Sie Sosial', 'Sie Pembangunan', 'Sie Sapras'];
function formGantiPw() {
  return `<div class="card-x p-3" style="max-width:440px"><h2 class="h6">Ganti Password Saya</h2><form id="fPw" onsubmit="gantiPw(event)">
    <label class="form-label" for="pw1">Password lama *</label><input class="form-control mb-3" id="pw1" type="password" required autocomplete="current-password">
    <label class="form-label" for="pw2">Password baru (min. 8 karakter) *</label><input class="form-control mb-3" id="pw2" type="password" required minlength="8" autocomplete="new-password">
    <button class="btn btn-pri" type="submit">Simpan Password</button></form></div>`;
}
function pgUser() {
  api('listUser', [S.t], rows => {
    S.tab.users = rows; const ket = isKetua();
    $('pgIsi').innerHTML = kepala(ket ? 'Daftar User Pengurus' : 'Susunan Pengurus', ket ? '<button class="btn btn-pri rounded-pill" onclick="formTambahUser()"><i class="bi bi-person-plus"></i> Tambah User</button>' : '') + catatanLihat(ket, 'Ketua RT (tambah, hapus, reset password user)') + '<div id="tU" class="mb-4"></div>' + formGantiPw();
    tabel('tU', ket ? [{ h: 'Username', k: 'Username', f: r => `<code>${esc(r.Username)}</code>` }, { h: 'Nama', k: 'Nama_Lengkap' }, { h: 'Peran', k: 'Peran' },
      { h: 'Terakhir login', k: 'Terakhir_Login', f: r => esc(r.Terakhir_Login || '-') },
      { h: '', f: r => `<button class="btn btn-sm btn-soft" onclick="formResetPw('${esc(r.Username)}')" aria-label="Reset password"><i class="bi bi-key"></i></button>` +
        (r.Username === S.u.username ? '' : ` <button class="btn btn-sm btn-ghost text-danger" onclick="formHapusUser('${esc(r.Username)}')" aria-label="Hapus user"><i class="bi bi-trash"></i></button>`) }]
      : [{ h: 'Nama', k: 'Nama_Lengkap' }, { h: 'Peran', k: 'Peran' }], rows);
  });
}
function formTambahUser() {
  modalX('Tambah User Pengurus',
    F('Username', 'Username (huruf kecil, angka, titik, _ atau -)', 'text', '', { req: 1, max: 30, pattern: '[a-z0-9._\\-]{3,30}' }) + F('Nama_Lengkap', 'Nama lengkap', 'text', '', { req: 1, max: 80 }) +
    F('Peran', 'Peran', 'select', 'Sekretaris', { opsi: PERAN_LIST }) + F('Password', 'Password awal (min. 8 karakter)', 'password', '', { req: 1, minlen: 8, ac: 'new-password' }) + bagianKonfirm(),
    'Tambah User', () => {
      const d = ambil(); if (!d) return;
      api('tambahUser', [S.t, d], () => { mHide(); toast('User ditambahkan.'); pgUser(); }, $('mS'));
    });
}
function formResetPw(u) {
  modalX('Reset Password · ' + u, `<p class="small text-muted">Password baru langsung berlaku dan user tersebut otomatis keluar dari sesi yang sedang aktif.</p>` + F('Password', 'Password baru (min. 8 karakter)', 'password', '', { req: 1, minlen: 8, ac: 'new-password' }) + bagianKonfirm(), 'Reset Password', () => {
    const d = ambil(); if (!d) return; d.Username = u;
    api('resetPasswordUser', [S.t, d], () => { mHide(); toast('Password ' + u + ' diganti.'); if (u === S.u.username) keluarLokal(); else pgUser(); }, $('mS'));
  });
}
function formHapusUser(u) {
  modalX('Hapus User', `<p>Hapus user <b>${esc(u)}</b>? Akun ini tidak bisa lagi masuk dan tindakan ini tidak dapat dibatalkan.</p>` + bagianKonfirm(), 'Hapus User', () => {
    const d = ambil(); if (!d) return; d.Username = u;
    api('hapusUser', [S.t, d], () => { mHide(); toast('User ' + u + ' dihapus.'); pgUser(); }, $('mS'));
  }, true);
}

/* Pengaturan Aplikasi: teks, logo, warna */
const PRESET_WARNA = [['Oranye (bawaan)', '#F97316', '#312E81'], ['Biru', '#2563EB', '#1E3A8A'], ['Hijau', '#16A34A', '#14532D'], ['Ungu', '#7C3AED', '#4C1D95'], ['Merah', '#DC2626', '#7F1D1D'], ['Teal', '#0D9488', '#134E4A']];
function tampilLogo(uri) {
  const e = $('logoPrev'); if (!e) return;
  if (uri) { e.style.setProperty('--logo', `url("${uri}")`); e.classList.add('logo-k'); } else { e.style.removeProperty('--logo'); e.classList.remove('logo-k'); }
}
function lihatTema() {
  const u = $('f_warna_utama').value, sb = $('f_warna_sidebar').value;
  if (lumin(sb.toUpperCase()) > 0.12) toast('Warna sidebar terlalu terang, pilih yang lebih gelap agar menu terbaca.', 'warning');
  terapkanTema({ warna_utama: u, warna_sidebar: sb, logo: S.logoBaru !== undefined ? S.logoBaru : APPCFG.logo });
}
function pakaiPreset(i) { $('f_warna_utama').value = PRESET_WARNA[i][1]; $('f_warna_sidebar').value = PRESET_WARNA[i][2]; lihatTema(); }
function resetLogo() { S.logoBaru = ''; if ($('f_logo')) $('f_logo').value = ''; tampilLogo(''); lihatTema(); }
/** Logo diperkecil di browser (maks. 192 px, WebP) agar muat di satu sel Google Sheets. */
function pilihLogo(inp) {
  const f = inp.files[0]; if (!f) return;
  if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { inp.value = ''; return toast('Gunakan gambar PNG, JPG, atau WebP.', 'warning'); }
  if (f.size > 5 * 1024 * 1024) { inp.value = ''; return toast('Ukuran gambar maksimal 5 MB.', 'warning'); }
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    URL.revokeObjectURL(url);
    let uri = '';
    [[192, 0.88], [192, 0.72], [160, 0.7], [128, 0.7]].some(p => {
      const c = document.createElement('canvas'); c.width = c.height = p[0];
      const g = c.getContext('2d'), sk = Math.min(p[0] / img.width, p[0] / img.height), w = img.width * sk, h = img.height * sk;
      g.drawImage(img, (p[0] - w) / 2, (p[0] - h) / 2, w, h);
      uri = c.toDataURL('image/webp', p[1]);
      if (!/^data:image\/webp/.test(uri)) uri = c.toDataURL('image/png');
      return uri.length <= 44000;
    });
    if (uri.length > 44000) { inp.value = ''; return toast('Gambar terlalu detail untuk disimpan. Gunakan logo yang lebih sederhana.', 'warning'); }
    S.logoBaru = uri; tampilLogo(uri); lihatTema();
  };
  img.onerror = () => { URL.revokeObjectURL(url); inp.value = ''; toast('Gambar tidak dapat dibaca.', 'danger'); };
  img.src = url;
}
function pgAplikasi() {
  api('getPengaturan', [S.t], a => {
    S.logoBaru = undefined;
    $('pgIsi').innerHTML = `<div class="card-x p-3" style="max-width:640px"><h2 class="h6">Pengaturan Aplikasi</h2><p class="small text-muted">Tampil di portal warga dan portal pengurus.</p>${catatanLihat(isKetua(), 'Ketua RT')}<form id="fApp" onsubmit="simpanApp(event)"><fieldset ${isKetua() ? '' : 'disabled'}>` +
      F('nama_app', 'Nama aplikasi', 'text', a.nama_app, { req: 1, max: 40 }) + F('wilayah', 'Wilayah (RT / RW / perumahan)', 'text', a.wilayah, { max: 40 }) +
      F('hero_judul', 'Judul beranda portal warga', 'text', a.hero_judul, { max: 100 }) + F('hero_deskripsi', 'Deskripsi beranda', 'textarea', a.hero_deskripsi, { max: 250 }) +
      F('footer_teks', 'Teks footer', 'text', a.footer_teks, { max: 120 }) +
      `<hr><h3 class="h6">Logo</h3><div class="d-flex align-items-center gap-3 mb-3"><span id="logoPrev" class="logo logo-lg m-0" role="img" aria-label="Pratinjau logo"></span>
        <div><input type="file" id="f_logo" class="form-control mb-2" accept="image/png,image/jpeg,image/webp" onchange="pilihLogo(this)"><button type="button" class="btn btn-sm btn-ghost" onclick="resetLogo()">Kembali ke logo bawaan</button>
        <div class="small text-muted mt-1">PNG, JPG, atau WebP. Otomatis diperkecil; logo tampil di portal warga, login, dan sidebar.</div></div></div>
       <hr><h3 class="h6">Warna aplikasi</h3><div class="d-flex flex-wrap gap-2 mb-3">${PRESET_WARNA.map((p, i) => `<button type="button" class="pill-tab" onclick="pakaiPreset(${i})"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${p[1]};vertical-align:middle"></span> ${p[0]}</button>`).join('')}</div>
       <div class="row g-3 mb-3"><div class="col-6"><label class="form-label" for="f_warna_utama">Warna utama (tombol &amp; menu aktif)</label><input type="color" class="form-control form-control-color" id="f_warna_utama" name="warna_utama" value="${esc(a.warna_utama)}" oninput="lihatTema()"></div>
       <div class="col-6"><label class="form-label" for="f_warna_sidebar">Warna sidebar &amp; banner (gelap)</label><input type="color" class="form-control form-control-color" id="f_warna_sidebar" name="warna_sidebar" value="${esc(a.warna_sidebar)}" oninput="lihatTema()"></div></div>
       ${isKetua() ? '<button class="btn btn-pri" type="submit">Simpan Pengaturan</button>' : ''}</fieldset></form></div>`;
    tampilLogo(a.logo);
  });
}
function simpanApp(e) {
  e.preventDefault();
  const d = {}; new FormData(e.target).forEach((v, k) => d[k] = v);
  if (S.logoBaru !== undefined) d.logo = S.logoBaru;
  api('simpanPengaturan', [S.t, d], a => { S.logoBaru = undefined; terapkanApp(a); toast('Pengaturan aplikasi tersimpan.'); }, e.target.querySelector('[type=submit]'));
}
function pgKas() {
  api('listKasMaster', [S.t], rows => {
    S.tab.km = rows;
    $('pgIsi').innerHTML = kepala('Pengaturan Kas Keuangan', isKetua() ? '<button class="btn btn-pri rounded-pill" onclick="formKasMaster()"><i class="bi bi-plus-lg"></i> Tambah Kas</button>' : '') + catatanLihat(isKetua(), 'Ketua RT') + '<div id="tKM"></div><small class="text-muted d-block mt-2">Ketua RT selalu punya akses ke semua kas aktif. Nama kas tidak dapat diubah setelah dibuat; gunakan status Nonaktif bila kas tidak dipakai lagi. Pengurus lain perlu login ulang agar perubahan akses berlaku.</small>';
    tabel('tKM', [{ h: 'Kas', k: 'Nama', f: r => `<span class="pill" style="--c:${esc(r.Warna)}">Kas ${esc(r.Nama)}</span>` }, { h: 'Deskripsi', k: 'Deskripsi' },
      { h: 'Penambah transaksi', f: r => esc(['Ketua RT'].concat(String(r.Peran_Akses).split(',').filter(Boolean)).join(', ')) }, { h: 'Saldo', k: 'Saldo', f: r => rp(r.Saldo) },
      { h: 'Status', k: 'Status', f: r => badge(r.Status) }, { h: '', f: r => isKetua() ? btnEdit(`formKasMaster('${r.Nama}')`) : '' }], rows);
  });
}
function formKasMaster(nama) {
  const k = nama ? S.tab.km.find(x => x.Nama === nama) : { Nama: '', Deskripsi: '', Warna: '#0EA5E9', Peran_Akses: '', Status: 'Aktif' };
  const ak = String(k.Peran_Akses || '').split(',').map(x => x.trim());
  const cek = ['Sekretaris', 'Bendahara', 'Sie Sosial', 'Sie Pembangunan', 'Sie Sapras'].map((p, i) => `<div class="form-check"><input class="form-check-input akses" type="checkbox" id="ak${i}" value="${p}" ${ak.includes(p) ? 'checked' : ''}><label class="form-check-label" for="ak${i}">${p}</label></div>`).join('');
  modalX(nama ? 'Ubah Kas ' + nama : 'Tambah Kas Baru',
    (nama ? '' : F('Nama', 'Nama kas (contoh: Pendidikan)', 'text', '', { req: 1, max: 30, pattern: '[A-Za-z0-9 \\-]{2,30}' })) + F('Deskripsi', 'Deskripsi singkat', 'text', k.Deskripsi, { max: 120 }) +
    `<div class="mb-3"><label class="form-label" for="f_Warna">Warna kartu</label><input type="color" class="form-control form-control-color" id="f_Warna" name="Warna" value="${esc(k.Warna)}"></div>` +
    `<div class="mb-3"><label class="form-label">Boleh menambah transaksi (selain Ketua RT)</label>${cek}</div>` + F('Status', 'Status', 'select', k.Status, { opsi: ['Aktif', 'Nonaktif'] }),
    'Simpan', () => {
      const d = ambil(); if (!d) return;
      d.baru = !nama; if (nama) d.Nama = nama;
      d.Peran_Akses = [...document.querySelectorAll('#mF .akses:checked')].map(x => x.value);
      api('simpanKasMaster', [S.t, d], r => { S.u.kas = r.kas; S.u.kasTambah = r.kasTambah; setKasInfo(r.kasInfo); mHide(); toast('Pengaturan kas tersimpan.'); pgKas(); }, $('mS'));
    });
}

/* ── Aset & Inventaris milik bersama ── */
const KAT_ASET = ['Perabot', 'Elektronik', 'Perlengkapan Acara', 'Keamanan', 'Kebersihan', 'Kendaraan', 'Bangunan & Fasum', 'Lainnya'];
const KONDISI_ASET = ['Baik', 'Rusak Ringan', 'Rusak Berat', 'Hilang'];
const SUMBER_ASET = ['Pembelian Kas', 'Donasi/Hibah', 'Swadaya Warga', 'Lainnya'];
/* ── Hak ubah di tampilan (semua pengurus MELIHAT semua modul; server tetap memeriksa ulang setiap perubahan) ── */
const PERAN_DATA = ['Ketua RT', 'Sekretaris'];                      // Warga, Info, Aturan: tambah/ubah
const PERAN_ASET_TAMBAH = ['Ketua RT', 'Sie Sapras', 'Sie Pembangunan'];
const PERAN_ASET_UBAH = ['Ketua RT'];                               // ubah/update & hapus aset
const PERAN_ASET_RESPON = ['Ketua RT', 'Sie Sapras', 'Sie Pembangunan']; // merespon peminjaman & menerima pengembalian
const adaHak = daftar => daftar.includes(S.u.peran);
const catatanLihat = (boleh, siapa) => boleh ? '' : `<div class="small text-muted mb-2 no-print"><i class="bi bi-eye"></i> Anda hanya dapat melihat modul ini. Yang berwenang mengubah: ${siapa}.</div>`;
function formAset(id) {
  const a = (S.tab.aset || []).find(x => x.ID_Aset === id) || { Kategori: 'Perabot', Kondisi: 'Baik', Satuan: 'unit', Jumlah_Unit: 1, Sumber: 'Pembelian Kas', Bisa_Dipinjam: 'Ya' };
  modalX(id ? 'Ubah Aset ' + a.Kode : 'Tambah Aset',
    F('Nama', 'Nama aset', 'text', a.Nama, { req: 1, max: 100 }) + F('Kategori', 'Kategori', 'select', a.Kategori, { opsi: KAT_ASET }) +
    `<div class="row g-2"><div class="col-6">${F('Jumlah_Unit', 'Jumlah', 'number', a.Jumlah_Unit, { req: 1, min: 0 })}</div><div class="col-6">${F('Satuan', 'Satuan (unit, buah, set)', 'text', a.Satuan, { max: 20 })}</div></div>` +
    F('Kondisi', 'Kondisi', 'select', a.Kondisi, { opsi: KONDISI_ASET }) + F('Lokasi', 'Lokasi penyimpanan', 'text', a.Lokasi, { max: 100 }) + F('Penanggung_Jawab', 'Penanggung jawab', 'text', a.Penanggung_Jawab, { max: 80 }) +
    `<div class="row g-2"><div class="col-6">${F('Tgl_Perolehan', 'Tanggal perolehan', 'date', a.Tgl_Perolehan, {})}</div><div class="col-6">${F('Nilai_Perolehan', 'Nilai perolehan total (Rp)', 'number', a.Nilai_Perolehan, {})}</div></div>` +
    F('Sumber', 'Sumber perolehan', 'select', a.Sumber, { opsi: SUMBER_ASET }) + F('Bisa_Dipinjam', 'Boleh dipinjam warga? (pilih Tidak untuk aset tetap seperti CCTV atau pos kamling)', 'select', a.Bisa_Dipinjam || 'Ya', { opsi: ['Ya', 'Tidak'] }) + F('Keterangan', 'Keterangan', 'textarea', a.Keterangan, { max: 300 }),
    'Simpan', () => {
      const d = ambil(); if (!d) return; if (id) d.ID_Aset = id;
      api('simpanAset', [S.t, d], () => { mHide(); toast('Aset tersimpan.'); R.aset(); }, $('mS'));
    }, false, true);
}
function unduhAset() {
  const rows = S.tab.aset || [];
  unduhCSV('inventaris-aset_' + tglStr(new Date()) + '.csv', [['Kode', 'Nama', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Lokasi', 'Tgl Perolehan', 'Nilai Perolehan (Rp)', 'Sumber', 'Penanggung Jawab', 'Boleh Dipinjam', 'Keterangan']]
    .concat(rows.map(r => [r.Kode, r.Nama, r.Kategori, r.Jumlah_Unit, r.Satuan, r.Kondisi, r.Lokasi, r.Tgl_Perolehan, r.Nilai_Perolehan, r.Sumber, r.Penanggung_Jawab, r.Bisa_Dipinjam || 'Tidak', r.Keterangan])));
}

function asDaftar() {
    api('listAset', [S.t], rows => {
      S.tab.aset = rows;
      const unit = rows.reduce((a, r) => a + (Number(r.Jumlah_Unit) || 0), 0), nilai = rows.reduce((a, r) => a + (Number(r.Nilai_Perolehan) || 0), 0), baik = rows.filter(r => r.Kondisi === 'Baik').length;
      const ubah = adaHak(PERAN_ASET_UBAH), tambah = adaHak(PERAN_ASET_TAMBAH), cetak = rows.slice(0, 500);
      $('asIsi').innerHTML = judulCetak('Daftar Inventaris Aset', 'Per ' + tglStr(new Date())) +
        kepala('Aset &amp; Inventaris Milik Bersama', `<div class="d-flex gap-2 flex-wrap no-print"><button class="btn btn-ghost btn-sm" onclick="unduhAset()"><i class="bi bi-filetype-csv"></i> CSV</button><button class="btn btn-ghost btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> Cetak</button>${tambah ? '<button class="btn btn-pri rounded-pill" onclick="formAset()"><i class="bi bi-plus-lg"></i> Tambah Aset</button>' : ''}</div>`) + `<div class="small text-muted mb-2 no-print"><i class="bi bi-${tambah ? 'info-circle' : 'eye'}"></i> ${tambah ? 'Anda dapat menambah aset.' : 'Anda hanya dapat melihat aset.'} Menambah aset: Ketua RT, Sie Sapras, Sie Pembangunan. Mengubah/menghapus: Ketua RT.</div>` +
        `<div class="row g-3 mb-3">${kartuStat('Jenis aset', rows.length)}${kartuStat('Total unit', unit.toLocaleString('id-ID'))}${kartuStat('Kondisi baik', rows.length ? Math.round(baik / rows.length * 100) + '%' : '-')}${kartuStat('Nilai perolehan', rp(nilai))}</div>
        <div class="no-print" id="tAs"></div>
        <table class="table table-sm only-print"><thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Jumlah</th><th>Kondisi</th><th>Lokasi</th><th>Penanggung jawab</th></tr></thead><tbody>${cetak.map(r => `<tr><td>${esc(r.Kode)}</td><td>${esc(r.Nama)}</td><td>${esc(r.Kategori)}</td><td>${esc(r.Jumlah_Unit)} ${esc(r.Satuan)}</td><td>${esc(r.Kondisi)}</td><td>${esc(r.Lokasi)}</td><td>${esc(r.Penanggung_Jawab)}</td></tr>`).join('')}</tbody></table>${rows.length > 500 ? `<p class="only-print small">Menampilkan 500 dari ${rows.length} aset. Gunakan unduhan CSV untuk data lengkap.</p>` : ''}`;
      tabel('tAs', [{ h: 'Kode', k: 'Kode', f: r => `<code>${esc(r.Kode)}</code>` }, { h: 'Nama', k: 'Nama', f: r => `<b>${esc(r.Nama)}</b>` }, { h: 'Kategori', k: 'Kategori' },
        { h: 'Jumlah', k: 'Jumlah_Unit', f: r => `${esc(r.Jumlah_Unit)} ${esc(r.Satuan)}` }, { h: 'Kondisi', k: 'Kondisi', f: r => badge(r.Kondisi) }, { h: 'Lokasi', k: 'Lokasi' },
        { h: 'Penanggung jawab', k: 'Penanggung_Jawab' }, { h: 'Dipinjamkan', k: 'Bisa_Dipinjam', f: r => r.Bisa_Dipinjam === 'Tidak' ? '<span class="bdg bdg-mu">Tidak</span>' : '<span class="bdg bdg-in">Ya</span>' }, { h: 'Nilai', k: 'Nilai_Perolehan', f: r => Number(r.Nilai_Perolehan) ? rp(r.Nilai_Perolehan) : '-' },
        { h: '', f: r => (ubah ? btnEdit(`formAset('${r.ID_Aset}')`) : '') + (adaHak(PERAN_ASET_KELUAR) && Number(r.Jumlah_Unit) > 0 ? ` <button class="btn btn-sm btn-ghost" onclick="formKeluar('${r.ID_Aset}')" aria-label="Catat pengeluaran" title="Catat pengeluaran"><i class="bi bi-box-arrow-up"></i></button>` : '') + btnDel('Aset', r.ID_Aset, 'aset') }], rows, { saring: ['Kategori', KAT_ASET] });
    });
}
const waLink = k => { let n = String(k || '').replace(/\D/g, ''); if (n.startsWith('0')) n = '62' + n.slice(1); return n ? `<a href="https://wa.me/${n}" target="_blank" rel="noopener" aria-label="Hubungi lewat WhatsApp"><i class="bi bi-whatsapp"></i></a>` : ''; };
const AKSI_PINJAM = { Menunggu: [['Disetujui', 'Setujui', 'btn-ok'], ['Ditolak', 'Tolak', 'btn-no']], Disetujui: [['Dipinjam', 'Serahkan', 'btn-soft'], ['Ditolak', 'Batalkan', 'btn-ghost']], Dipinjam: [['Dikembalikan', 'Terima pengembalian', 'btn-ok']], 'Pengembalian Diajukan': [['Dikembalikan', 'Terima pengembalian', 'btn-ok'], ['Dipinjam', 'Belum diterima', 'btn-ghost']] };
const aksiPinjam = r => !adaHak(PERAN_ASET_RESPON) ? '' : (AKSI_PINJAM[r.Status] || []).map(a => `<button class="btn btn-sm ${a[2]}" onclick="ubahPinjam('${r.ID_Pinjam}','${a[0]}','${a[1]}')">${a[1]}</button>`).join(' ');
const infoKembali = r => r.Tgl_Dikembalikan ? `<br><small>Kembali ${esc(r.Tgl_Dikembalikan)}${r.Pengembali ? ' oleh ' + esc(r.Pengembali) : ''}${r.Kondisi_Kembali ? ' · kondisi ' + esc(r.Kondisi_Kembali) : ''}${r.Catatan_Kembali ? ' · ' + esc(r.Catatan_Kembali) : ''}${r.Diterima_Oleh ? '<br>Diterima oleh <b>' + esc(r.Diterima_Oleh) + '</b> (' + esc(String(r.Tgl_Diterima).slice(0, 16)) + ')' : ''}</small>` : '';
function asPinjam() {
  api('listPeminjaman', [S.t], rows => {
    S.tab.pjm = rows;
    const menunggu = rows.filter(r => r.Status === 'Menunggu').length, kembali = rows.filter(r => r.Status === 'Pengembalian Diajukan').length;
    $('asIsi').innerHTML = kepala('Pengajuan Peminjaman Aset', `<span>${menunggu ? `<span class="bdg bdg-wa">${menunggu} menunggu persetujuan</span> ` : ''}${kembali ? `<span class="bdg bdg-wa">${kembali} pengembalian menunggu diterima</span>` : ''}</span>`) + '<p class="small text-muted">Pengajuan masuk dari formulir di portal warga. Aset yang boleh dipinjam diatur di Daftar Aset.</p>' + catatanLihat(adaHak(PERAN_ASET_RESPON), 'Ketua RT, Sie Sapras, dan Sie Pembangunan (merespon pengajuan & menerima pengembalian)') + '<div id="tPj"></div>';
    tabel('tPj', [{ h: 'Diajukan', k: 'Tgl_Ajuan', f: r => esc(String(r.Tgl_Ajuan).slice(0, 10)) },
      { h: 'Peminjam', k: 'Nama_Peminjam', f: r => `<b>${esc(r.Nama_Peminjam)}</b> ${waLink(r.Kontak)}<br><small>${esc(r.Alamat || '')} ${esc(r.Kontak)}</small>` },
      { h: 'Aset', k: 'Nama_Aset', f: r => `${esc(r.Nama_Aset)} <small>× ${esc(r.Jumlah)} ${esc(r.Satuan)}</small>` },
      { h: 'Tgl pinjam', k: 'Tgl_Pinjam', f: r => esc(r.Tgl_Pinjam) + (r.Tgl_Kembali ? ' → ' + esc(r.Tgl_Kembali) : '') },
      { h: 'Keperluan', k: 'Keperluan', f: r => `<span style="white-space:normal;display:inline-block;min-width:180px">${esc(r.Keperluan)}</span>` },
      { h: 'Status', k: 'Status', f: r => badge(r.Status) + (r.Catatan ? `<br><small>${esc(r.Catatan)}</small>` : '') + infoKembali(r) }, { h: '', f: r => aksiPinjam(r) }],
      rows, { saring: ['Status', ['Menunggu', 'Disetujui', 'Dipinjam', 'Pengembalian Diajukan', 'Dikembalikan', 'Ditolak']] });
  });
}
function ubahPinjam(id, status, label) {
  const r = (S.tab.pjm || []).find(x => x.ID_Pinjam === id) || {};
  const ringkas = status === 'Dikembalikan' ? `<div class="card-x p-2 mb-3 small"><b>${esc(r.Nama_Aset)}</b> × ${esc(r.Jumlah)} ${esc(r.Satuan)} · ${esc(r.Nama_Peminjam)}${r.Pengembali ? '<br>Diserahkan oleh: <b>' + esc(r.Pengembali) + '</b>' : ''}${r.Kondisi_Kembali ? '<br>Kondisi dilaporkan: ' + esc(r.Kondisi_Kembali) : ''}${r.Catatan_Kembali ? ' · ' + esc(r.Catatan_Kembali) : ''}<br>Diterima oleh: <b>${esc(S.u.nama)}</b></div>` : '';
  modalX(label + ' peminjaman', `<p class="small text-muted">Status akan menjadi <b>${esc(status)}</b>.</p>` + ringkas +
    (status === 'Dikembalikan' ? F('tglKembali', 'Tanggal pengembalian', 'date', r.Tgl_Dikembalikan || hariIni(), { req: 1 }) : '') + F('Catatan', 'Catatan (opsional)', 'textarea', '', { max: 300 }), label, () => {
    const d = ambil(); if (!d) return;
    api('updatePeminjaman', [S.t, id, status, d.Catatan, d.tglKembali || ''], () => { mHide(); toast(status === 'Dikembalikan' ? 'Pengembalian diterima dan dicatat.' : 'Status peminjaman diperbarui.'); asPinjam(); }, $('mS'));
  }, status === 'Ditolak');
}

/* ── Aturan (menu pengurus) ── */
const ATURAN_TAB = [['Warga', 'Aturan Warga', 'people'], ['Arisan', 'Aturan Arisan', 'piggy-bank']];
function formAturan(id) {
  const a = (S.tab.aturan || []).find(x => x.ID_Aturan === id) || { Kategori: S.atr || 'Warga', Status: 'Aktif' };
  modalX(id ? 'Ubah Aturan' : 'Tambah Aturan', F('Kategori', 'Kategori', 'select', a.Kategori, { opsi: ['Warga', 'Arisan'] }) + F('Judul', 'Judul aturan', 'text', a.Judul, { req: 1, max: 120 }) +
    F('Isi', 'Isi aturan', 'textarea', a.Isi, { req: 1, max: 2000 }) + F('Urutan', 'Nomor urut (kosongkan = otomatis)', 'number', a.Urutan, { min: 1 }) + F('Status', 'Status (Aktif = tampil di portal warga)', 'select', a.Status, { opsi: ['Aktif', 'Arsip'] }),
    'Simpan', () => {
      const d = ambil(); if (!d) return; if (id) d.ID_Aturan = id;
      api('simpanAturan', [S.t, d], () => { mHide(); toast('Aturan tersimpan.'); S.atr = d.Kategori; R.aturan(); }, $('mS'));
    }, false, true);
}
function aturTampil(id, tampil) {
  api('aturTampilAduan', [S.t, id, tampil], () => { toast(tampil ? 'Aduan ditampilkan di portal warga.' : 'Aduan disembunyikan dari portal warga.'); R.aduan(); });
}

/* ── Pengeluaran aset: mengurangi stok (dan kondisi) aset pada saat itu; riwayat tersimpan di sheet Aset_Keluar ── */
const PERAN_ASET_KELUAR = ['Ketua RT', 'Sie Sapras', 'Sie Pembangunan'];
const ALASAN_KELUAR = ['Rusak', 'Hilang', 'Dijual', 'Dihibahkan', 'Habis Terpakai', 'Lainnya'];
function asKeluar() {
  api('listPengeluaranAset', [S.t], rows => {
    S.tab.klr = rows;
    const boleh = adaHak(PERAN_ASET_KELUAR), bln = hariIni().slice(0, 7);
    const unitBln = rows.filter(r => String(r.Tanggal).slice(0, 7) === bln).reduce((a, r) => a + (Number(r.Jumlah) || 0), 0);
    $('asIsi').innerHTML = kepala('Pengeluaran Aset', boleh ? '<button class="btn btn-pri rounded-pill" onclick="formKeluar()"><i class="bi bi-plus-lg"></i> Catat Pengeluaran</button>' : '') +
      '<p class="small text-muted">Catat aset yang keluar (rusak, hilang, dijual, dihibahkan, habis terpakai). Stok di Daftar Aset otomatis berkurang dan riwayatnya tersimpan di sini.</p>' +
      catatanLihat(boleh, 'Ketua RT, Sie Sapras, dan Sie Pembangunan (mencatat pengeluaran aset)') +
      `<div class="row g-3 mb-3">${kartuStat('Kejadian pengeluaran', rows.length)}${kartuStat('Unit keluar bulan ini', unitBln.toLocaleString('id-ID'))}</div><div id="tKlr"></div>`;
    tabel('tKlr', [{ h: 'Tanggal', k: 'Tanggal', f: r => esc(String(r.Tanggal).slice(0, 10)) },
      { h: 'Aset', k: 'Nama_Aset', f: r => `<b>${esc(r.Nama_Aset)}</b><br><small><code>${esc(r.Kode_Aset)}</code></small>` },
      { h: 'Jumlah', k: 'Jumlah', f: r => `− ${esc(r.Jumlah)} ${esc(r.Satuan)}` },
      { h: 'Alasan', k: 'Alasan', f: r => badge(r.Alasan) },
      { h: 'Stok', k: 'Stok_Sesudah', f: r => `${esc(r.Stok_Sebelum)} → <b>${esc(r.Stok_Sesudah)}</b>` },
      { h: 'Kondisi', k: 'Kondisi_Sesudah', f: r => r.Kondisi_Sebelum === r.Kondisi_Sesudah ? badge(r.Kondisi_Sesudah) : `${badge(r.Kondisi_Sebelum)} → ${badge(r.Kondisi_Sesudah)}` },
      { h: 'Keterangan', k: 'Keterangan', f: r => `<span style="white-space:normal;display:inline-block;min-width:180px">${esc(r.Keterangan)}</span>` },
      { h: 'Dicatat oleh', k: 'Dicatat_Oleh', f: r => `${esc(r.Dicatat_Oleh)}<br><small>${esc(String(r.Tgl_Input).slice(0, 16))}</small>` }],
      rows, { saring: ['Alasan', ALASAN_KELUAR] });
  });
}
function formKeluar(id) {
  api('listAset', [S.t], rows => { // stok diambil terbaru agar pilihan akurat
    S.tab.aset = rows;
    const ada = rows.filter(a => Number(a.Jumlah_Unit) > 0);
    if (!ada.length) return toast('Belum ada aset dengan stok yang bisa dikeluarkan.');
    const pilih = id && ada.some(a => a.ID_Aset === id) ? id : ada[0].ID_Aset, t = hariIni();
    modalX('Catat Pengeluaran Aset',
      `<div class="mb-3"><label class="form-label" for="f_idAset">Aset *</label><select class="form-select" name="idAset" id="f_idAset" required>${ada.map(a => `<option value="${esc(a.ID_Aset)}" ${a.ID_Aset === pilih ? 'selected' : ''}>${esc(a.Kode)} · ${esc(a.Nama)} (stok ${esc(a.Jumlah_Unit)} ${esc(a.Satuan)} · ${esc(a.Kondisi)})</option>`).join('')}</select><div class="form-text">Unit yang sedang dipinjam warga tidak bisa dikeluarkan; sistem memeriksanya otomatis.</div></div>` +
      F('jumlah', 'Jumlah yang keluar', 'number', 1, { req: 1, min: 1, attr: 'step="1" inputmode="numeric"' }) + F('alasan', 'Alasan pengeluaran', 'select', 'Rusak', { opsi: ALASAN_KELUAR }) +
      F('tanggal', 'Tanggal kejadian', 'date', t, { req: 1, attr: `max="${t}"` }) +
      `<div class="mb-3"><label class="form-label" for="f_kondisi">Kondisi aset sesudahnya</label><select class="form-select" name="kondisi" id="f_kondisi"><option value="">Tidak diubah</option>${KONDISI_ASET.map(k => `<option>${esc(k)}</option>`).join('')}</select><div class="form-text">Isi bila kondisi unit yang tersisa ikut berubah (mis. sisa unit menjadi Rusak Ringan).</div></div>` +
      F('keterangan', 'Keterangan', 'textarea', '', { req: 1, max: 300, minlen: 5 }), 'Catat', () => {
        const d = ambil(); if (!d) return;
        api('catatPengeluaranAset', [S.t, d], () => { mHide(); toast('Pengeluaran dicatat. Stok aset berkurang.'); R.aset(); }, $('mS'));
      });
  }, null, null, { tanpaCache: true }); // stok selalu diambil baru & formulir tidak boleh dirender ulang saat sedang diisi
}

/* ── Portal warga: aturan, daftar aduan & saran (hide/unhide), peminjaman aset ── */
function muatPublikTambahan() {
  api('getAturanPublik', [], d => { S.aturanPub = d; renderAturanPublik(); }, null, () => { $('pAturan').innerHTML = '<p class="text-muted m-0">Aturan belum dapat dimuat.</p>'; return true; });
  api('getAduanPublik', [], d => renderAduanPublik(d), null, () => { $('pAduanList').innerHTML = '<p class="text-muted m-0">Daftar belum dapat dimuat.</p>'; return true; });
  api('getAsetPublik', [], d => renderPilihAset(d), null, () => true);
}
function renderAturanPublik() {
  const d = S.aturanPub || { Warga: [], Arisan: [] }, k = S.atp || 'Warga', daftar = d[k] || [];
  $('pAturan').innerHTML = `<div class="d-flex gap-2 flex-wrap mb-3">${[['Warga', 'Aturan Warga'], ['Arisan', 'Aturan Arisan']].map(p => `<button type="button" class="pill-tab ${k === p[0] ? 'on' : ''}" onclick="S.atp='${p[0]}';renderAturanPublik()">${p[1]}</button>`).join('')}</div>` +
    (daftar.length ? daftar.map((a, i) => `<details class="aturan" ${i === 0 ? 'open' : ''}><summary><b>${i + 1}. ${esc(a.Judul)}</b></summary><p>${esc(a.Isi)}</p></details>`).join('') : '<p class="text-muted m-0">Belum ada aturan yang dipublikasikan.</p>');
}
function aduanToggleUI() {
  const el = $('pAduanList'), b = $('btnAduanToggle'); if (!el || !b) return;
  b.querySelector('span').textContent = el.hidden ? 'Tampilkan' : 'Sembunyikan';
  b.querySelector('i').className = 'bi bi-eye' + (el.hidden ? '' : '-slash');
  b.setAttribute('aria-expanded', String(!el.hidden));
}
function aduanToggle() {
  const el = $('pAduanList'); el.hidden = !el.hidden;
  try { localStorage.setItem('aduanSembunyi', el.hidden ? '1' : '0'); } catch (e) {}
  aduanToggleUI();
}
function renderAduanPublik(d) {
  $('pAduanList').innerHTML = d.length ? d.map(a => `<div class="info"><div class="d-flex flex-wrap gap-2 align-items-center">${badge(a.Jenis)} <span class="bdg bdg-mu">${esc(a.Kategori)}</span> ${badge(a.Status)}<small class="ms-auto">${esc(a.Tanggal)}</small></div>
    <p class="mb-1 mt-2" style="color:var(--tx)">${esc(a.Isi)}</p>${a.Tanggapan ? `<div class="small" style="border-left:3px solid var(--pri);padding-left:.6rem;color:var(--mu)"><b>Tanggapan pengurus:</b> ${esc(a.Tanggapan)}</div>` : ''}</div>`).join('') : '<p class="text-muted m-0">Belum ada aduan atau saran yang ditampilkan.</p>';
  try { $('pAduanList').hidden = localStorage.getItem('aduanSembunyi') === '1'; } catch (e) {}
  aduanToggleUI();
}
function renderPilihAset(d) {
  S.asetPub = d; const sel = $('p_aset'); if (!sel) return;
  sel.innerHTML = d.length ? '<option value="">— pilih aset —</option>' + d.map(a => `<option value="${esc(a.ID_Aset)}">${esc(a.Nama)} (stok ${a.Jumlah_Unit} ${esc(a.Satuan)}${a.Kondisi && a.Kondisi !== 'Baik' ? ', kondisi ' + esc(a.Kondisi) : ''})</option>`).join('') : '<option value="">Belum ada aset yang bisa dipinjam</option>';
  const t = tglStr(new Date()); $('p_tgl1').min = t;
}
function formTab(k) {
  $('fAduan').hidden = k !== 'aduan'; $('fPinjam').hidden = k !== 'pinjam'; $('fKembali').hidden = k !== 'kembali';
  $('tabAduan').classList.toggle('on', k === 'aduan'); $('tabPinjam').classList.toggle('on', k === 'pinjam'); $('tabKembali').classList.toggle('on', k === 'kembali');
}
function kbReset() { S.kbPilih = null; $('kbList').innerHTML = ''; $('kbDetail').hidden = true; }
function cariPinjamanSaya() {
  const f = $('fKembali');
  if (!f.nama.value.trim() || !f.kontak.value.trim()) return toast('Isi nama peminjam dan nomor WhatsApp/HP terlebih dahulu.', 'warning');
  api('cariPeminjamanSaya', [{ nama: f.nama.value, kontak: f.kontak.value }], list => {
    S.kbData = list; S.kbPilih = null; $('kbDetail').hidden = true;
    $('kbList').innerHTML = list.length ? '<p class="small fw-semibold mb-2">Pilih peminjaman yang akan dikembalikan:</p>' + list.map(p => {
      const sudah = p.Status === 'Pengembalian Diajukan';
      return `<label class="card-x p-2 mb-2 d-flex gap-2 align-items-start" style="cursor:${sudah ? 'default' : 'pointer'}"><input type="radio" name="kb_pilih" class="mt-1" ${sudah ? 'disabled' : ''} onchange="pilihKembali('${esc(p.ID_Pinjam)}')">
        <span><b>${esc(p.Nama_Aset)}</b> × ${esc(p.Jumlah)} ${esc(p.Satuan)} ${badge(p.Status)}<br><small>Dipinjam ${esc(p.Tgl_Pinjam)}</small>${sudah ? '<br><small>Pengembalian sudah diajukan, menunggu diterima pengurus.</small>' : ''}</span></label>`;
    }).join('') : '<p class="text-muted small">Tidak ditemukan peminjaman yang masih berjalan untuk nama dan nomor tersebut. Pastikan sama dengan yang diisi saat mengajukan peminjaman.</p>';
  }, $('kbCari'));
}
function pilihKembali(id) {
  const p = (S.kbData || []).find(x => x.ID_Pinjam === id); if (!p) return;
  S.kbPilih = id; $('kbDetail').hidden = false;
  if (!$('kb_pengembali').value) $('kb_pengembali').value = $('fKembali').nama.value;
  const t = tglStr(new Date()); $('kb_tgl').value = t; $('kb_tgl').max = t; $('kb_tgl').min = p.Tgl_Pinjam;
}
function submitKembali(e) {
  e.preventDefault();
  if (!S.kbPilih) return cariPinjamanSaya(); // Enter di kolom nama/HP = cari
  const f = $('fKembali'), btn = f.querySelector('[type=submit]');
  api('ajukanPengembalian', [{ idPinjam: S.kbPilih, nama: f.nama.value, kontak: f.kontak.value, pengembali: $('kb_pengembali').value, tglKembali: $('kb_tgl').value, kondisi: $('kb_kondisi').value, catatan: $('kb_catatan').value }],
    () => { toast('Pengembalian diajukan. Silakan serahkan barang ke pengurus untuk diterima dan dicatat.'); f.reset(); kbReset(); $('kb_pengembali').value = ''; $('kb_catatan').value = ''; }, btn);
}
function submitPinjam(e) {
  e.preventDefault();
  const f = $('fPinjam'), btn = f.querySelector('[type=submit]');
  api('kirimPeminjaman', [{ nama: f.nama.value, kontak: f.kontak.value, alamat: f.alamat.value, idAset: f.idAset.value, jumlah: f.jumlah.value, tglPinjam: f.tglPinjam.value, keperluan: f.keperluan.value }],
    () => { toast('Pengajuan peminjaman terkirim. Pengurus akan menghubungi Anda lewat WhatsApp.'); f.reset(); }, btn);
}

/* ── Rekap & Laporan ──
   Tab baru = tambah satu baris di REKAP (id, label, icon, ada = siapa yang boleh, render). */
const REKAP = [
  { id: 'keuangan', label: 'Keuangan', icon: 'cash-coin', ada: () => S.u.kas.length > 0, render: () => rkKeuangan() },
  { id: 'warga', label: 'Warga', icon: 'people', ada: () => true, render: () => rkWarga() },
  { id: 'aduan', label: 'Aduan &amp; Saran', icon: 'chat-square-text', ada: () => true, render: () => rkAduan() }
];
const NAMA_BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const labelBln = b => NAMA_BLN[Number(b.slice(5, 7)) - 1] + ' ' + b.slice(2, 4);
const tglStr = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const awalBulan = (o = 0) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + o); return tglStr(d); };
const akhirBulan = (o = 0) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + o + 1); d.setDate(0); return tglStr(d); };
const kartuStat = (l, n) => `<div class="col-6 col-md-3"><div class="card-x p-3 h-100"><small>${l}</small><div class="nilai">${n}</div></div></div>`;
const tombolLaporan = (csv) => `<div class="d-flex justify-content-end gap-2 mb-3 no-print">${csv ? `<button class="btn btn-ghost btn-sm" onclick="${csv}()"><i class="bi bi-filetype-csv"></i> Unduh CSV</button>` : ''}<button class="btn btn-ghost btn-sm" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / PDF</button></div>`;
const judulCetak = (judul, sub) => `<div class="only-print mb-3"><h2 class="h4 m-0">${esc(judul)}</h2><div>${esc(APPCFG.nama_app || '')}${APPCFG.wilayah ? ' · ' + esc(APPCFG.wilayah) : ''}</div>${sub ? `<div>${esc(sub)}</div>` : ''}</div>`;
function daftarBar(pairs, warna, fmt) {
  const tot = pairs.reduce((s, p) => s + p[1], 0);
  return pairs.length ? pairs.map(p => `<div class="mb-2"><div class="d-flex justify-content-between small"><span>${esc(p[0])}</span><b>${fmt ? fmt(p[1]) : p[1]}</b></div><div class="bar"><span style="width:${tot ? Math.round(p[1] / tot * 100) : 0}%;background:${warna}"></span></div></div>`).join('') : '<p class="text-muted small m-0">Tidak ada data.</p>';
}
/** Unduh CSV (BOM agar Excel membaca UTF-8). Sel {t:'123'} ditulis sebagai teks; teks berawalan = + - @ diberi tanda kutip agar tak dibaca sebagai rumus. */
function unduhCSV(nama, baris) {
  const csv = '\ufeff' + baris.map(r => r.map(c => {
    if (c && typeof c === 'object') return '="' + String(c.t).replace(/[^0-9]/g, '') + '"';
    let s = String(c == null ? '' : c);
    if (typeof c === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/* Rekap Keuangan */
function rkKeuangan() { rkFormKeuangan(); }
function rkFormKeuangan() {
  $('rkIsi').innerHTML = `<div class="card-x p-3 mb-3 no-print"><div class="row g-2 align-items-end">
    <div class="col-6 col-md-3"><label class="form-label" for="rk_dari">Dari</label><input type="date" id="rk_dari" class="form-control" value="${awalBulan()}"></div>
    <div class="col-6 col-md-3"><label class="form-label" for="rk_sampai">Sampai</label><input type="date" id="rk_sampai" class="form-control" value="${akhirBulan()}"></div>
    <div class="col-12 col-md-3"><label class="form-label" for="rk_kas">Kas</label><select id="rk_kas" class="form-select"><option value="">Semua kas</option>${S.u.kas.map(j => `<option value="${esc(j)}">Kas ${esc(j)}</option>`).join('')}</select></div>
    <div class="col-12 col-md-3"><button class="btn btn-pri w-100" id="rk_go" onclick="muatRekapKeu()"><i class="bi bi-search"></i> Tampilkan</button></div></div>
    <div class="d-flex gap-2 flex-wrap mt-2">${[['bulan', 'Bulan ini'], ['lalu', 'Bulan lalu'], ['tahun', 'Tahun ini']].map(p => `<button class="pill-tab" onclick="setRentang('${p[0]}')">${p[1]}</button>`).join('')}</div></div><div id="rkHasil">${skel}</div>`;
  muatRekapKeu();
}
function setRentang(k) {
  const y = new Date().getFullYear();
  const r = k === 'lalu' ? [awalBulan(-1), akhirBulan(-1)] : k === 'tahun' ? [y + '-01-01', y + '-12-31'] : [awalBulan(), akhirBulan()];
  $('rk_dari').value = r[0]; $('rk_sampai').value = r[1]; muatRekapKeu();
}
function muatRekapKeu() {
  const dari = $('rk_dari').value, sampai = $('rk_sampai').value;
  if (!dari || !sampai) return toast('Isi tanggal awal dan akhir.', 'warning');
  $('rkHasil').innerHTML = skel;
  api('rekapKeuangan', [S.t, dari, sampai, $('rk_kas').value], rkTampilKeu, $('rk_go'), m => {
    $('rkHasil').innerHTML = '<div class="card-x p-3 text-center text-muted">Rekap tidak dapat ditampilkan.</div>'; toast(m, 'danger'); return true;
  });
}
function rkTampilKeu(d) {
  S.rkd = d;
  const tot = d.kas.reduce((a, k) => ({ Awal: a.Awal + k.Awal, Masuk: a.Masuk + k.Masuk, Keluar: a.Keluar + k.Keluar, Akhir: a.Akhir + k.Akhir }), { Awal: 0, Masuk: 0, Keluar: 0, Akhir: 0 });
  const kartu = (judul, k, warna) => `<div class="col-12 col-md-4"><div class="card-x saldo p-3 h-100" style="--c:${warna}"><span class="pill">${esc(judul)}</span><div class="row g-1 small mt-2">
    <div class="col-6 text-muted">Saldo awal</div><div class="col-6 text-end">${rp(k.Awal)}</div><div class="col-6 text-muted">Pemasukan</div><div class="col-6 text-end up">+${rp(k.Masuk)}</div>
    <div class="col-6 text-muted">Pengeluaran</div><div class="col-6 text-end down">−${rp(k.Keluar)}</div><div class="col-6 fw-bold">Saldo akhir</div><div class="col-6 text-end fw-bold">${rp(k.Akhir)}</div></div></div></div>`;
  const kat = tipe => d.kategori.filter(x => x.Tipe === tipe).sort((a, b) => b.Total - a.Total).map(x => [x.Kategori + ' (' + x.Jumlah + 'x)', x.Total]);
  const cetak = d.transaksi.slice(0, 500);
  $('rkHasil').innerHTML = judulCetak('Laporan Keuangan', `Periode ${d.dari} s.d. ${d.sampai}${d.kas.length === 1 ? ' · Kas ' + d.kas[0].Kas : ''}`) + tombolLaporan('unduhRekapKeu') + `
    <div class="row g-3 mb-3">${d.kas.length > 1 ? kartu('Total Semua Kas', tot, '#4F46E5') : ''}${d.kas.map(k => kartu('Kas ' + k.Kas, k, warnaKas(k.Kas))).join('')}</div>
    <div class="card-x p-3 mb-3"><h2 class="h6">Pemasukan vs Pengeluaran per Bulan</h2><div style="height:240px"><canvas id="cRk"></canvas></div></div>
    <div class="row g-3 mb-3"><div class="col-12 col-md-6"><div class="card-x p-3 h-100"><h2 class="h6">Pemasukan per Kategori</h2>${daftarBar(kat('Pemasukan'), '#10B981', rp)}</div></div>
    <div class="col-12 col-md-6"><div class="card-x p-3 h-100"><h2 class="h6">Pengeluaran per Kategori</h2>${daftarBar(kat('Pengeluaran'), '#EF4444', rp)}</div></div></div>
    <div class="no-print"><h2 class="h6">Rincian Transaksi (${d.transaksi.length})${d.terpotong ? ' · 3.000 terbaru' : ''}</h2><div id="tRk"></div></div>
    <table class="table table-sm only-print"><thead><tr><th>Tanggal</th><th>Kas</th><th>Kategori</th><th>Keterangan</th><th>Tipe</th><th class="text-end">Nominal</th></tr></thead><tbody>${cetak.map(r => `<tr><td>${esc(r.Tanggal)}</td><td>${esc(r.Jenis_Kas)}</td><td>${esc(r.Kategori)}</td><td style="white-space:normal">${esc(r.Keterangan)}</td><td>${esc(r.Tipe)}</td><td class="text-end">${r.Tipe === 'Pemasukan' ? '+' : '−'}${rp(r.Nominal)}</td></tr>`).join('')}</tbody></table>${d.transaksi.length > 500 ? `<p class="only-print small">Menampilkan 500 dari ${d.transaksi.length} transaksi. Gunakan unduhan CSV untuk data lengkap.</p>` : ''}`;
  const lb = d.bulanan.map(b => labelBln(b.Bulan)), mm = {}, kk = {};
  d.bulanan.forEach(b => { mm[labelBln(b.Bulan)] = b.Masuk; kk[labelBln(b.Bulan)] = b.Keluar; });
  grafik('cRk', mm, kk, lb, '');
  tabel('tRk', [{ h: 'Tanggal', k: 'Tanggal' }, { h: 'Kas', k: 'Jenis_Kas' }, { h: 'Kategori', k: 'Kategori' }, { h: 'Keterangan', k: 'Keterangan', f: r => `<span style="white-space:normal;display:inline-block;min-width:200px">${esc(r.Keterangan)}</span>` },
    { h: 'Tipe', k: 'Tipe', f: r => badge(r.Tipe) }, { h: 'Nominal', k: 'Nominal', f: r => `<span class="${r.Tipe === 'Pemasukan' ? 'up' : 'down'}">${r.Tipe === 'Pemasukan' ? '+' : '−'}${rp(r.Nominal)}</span>` }, { h: 'Dicatat', k: 'Dicatat_Oleh' }],
    d.transaksi, { saring: ['Tipe', ['Pemasukan', 'Pengeluaran']] });
}
function unduhRekapKeu() {
  const d = S.rkd; if (!d) return;
  unduhCSV(`rekap-kas_${d.dari}_${d.sampai}.csv`, [['Tanggal', 'Kas', 'Tipe', 'Kategori', 'Keterangan', 'Nominal (+masuk / -keluar)', 'Dicatat Oleh']]
    .concat(d.transaksi.map(r => [r.Tanggal, r.Jenis_Kas, r.Tipe, r.Kategori, r.Keterangan, r.Tipe === 'Pemasukan' ? r.Nominal : -r.Nominal, r.Dicatat_Oleh])));
}

/* Rekap Warga */
function rkWarga() {
  api('rekapWarga', [S.t], d => {
    S.rkw = d;
    const ur = o => Object.keys(o).map(k => [k, o[k]]).filter(p => p[1] > 0);
    $('rkIsi').innerHTML = judulCetak('Rekap Data Warga', '') + tombolLaporan('unduhRekapWarga') + `
      <div class="row g-3 mb-3">${kartuStat('Kepala keluarga', d.kk)}${kartuStat('Total jiwa', d.jiwa)}${kartuStat('Warga tetap', d.tetap)}${kartuStat('Warga kontrak', d.kontrak)}</div>
      <div class="row g-3"><div class="col-12 col-md-4"><div class="card-x p-3 h-100"><h2 class="h6">Kelompok Usia</h2>${daftarBar(ur(d.usia), '#F97316')}</div></div>
      <div class="col-12 col-md-4"><div class="card-x p-3 h-100"><h2 class="h6">Jenis Kelamin</h2>${daftarBar(ur(d.gender), '#6366F1')}</div></div>
      <div class="col-12 col-md-4"><div class="card-x p-3 h-100"><h2 class="h6">Hubungan dalam Keluarga</h2>${daftarBar(ur(d.hubungan), '#14B8A6')}</div></div></div>
      <p class="small text-muted mt-3">Komposisi usia, jenis kelamin, dan hubungan dihitung dari ${d.anggotaTerdata} anggota keluarga yang sudah diinput. Kepala keluarga belum dicatat usia dan jenis kelaminnya.</p>`;
  });
}
function unduhRekapWarga() {
  const d = S.rkw; if (!d) return;
  const b = [['No KK', 'Kepala Keluarga', 'Alamat', 'Status Hunian', 'Nama', 'NIK', 'Hubungan', 'Jenis Kelamin', 'Tgl Lahir', 'Pekerjaan']];
  d.keluarga.forEach(w => {
    b.push([{ t: w.No_KK }, w.Nama, w.Alamat, w.Status, w.Nama, { t: w.NIK }, 'Kepala Keluarga', '', '', '']);
    (w.Anggota || []).forEach(a => b.push([{ t: w.No_KK }, w.Nama, w.Alamat, w.Status, a.Nama, { t: a.NIK }, a.Hubungan, a.Jenis_Kelamin, a.Tgl_Lahir, a.Pekerjaan]));
  });
  unduhCSV('data-warga.csv', b);
}

/* Rekap Aduan & Saran */
function rkAduan() {
  api('rekapAduan', [S.t], d => {
    const resp = d.rataJam === null ? '-' : d.rataJam < 48 ? d.rataJam.toFixed(1) + ' jam' : (d.rataJam / 24).toFixed(1) + ' hari';
    const ur = o => Object.keys(o).map(k => [k, o[k]]).filter(p => p[1] > 0);
    $('rkIsi').innerHTML = judulCetak('Rekap Aduan & Saran', '') + tombolLaporan('') + `
      <div class="row g-3 mb-3">${kartuStat('Total masuk', d.total)}${kartuStat('Baru', d.status.Baru)}${kartuStat('Diproses', d.status.Diproses)}${kartuStat('Selesai', d.status.Selesai)}</div>
      <p class="small text-muted">Rata-rata waktu sampai ditangani: <b>${resp}</b></p>
      <div class="row g-3"><div class="col-12 col-md-4"><div class="card-x p-3 h-100"><h2 class="h6">Per Kategori</h2>${daftarBar(ur(d.kategori), '#8B5CF6')}</div></div>
      <div class="col-12 col-md-4"><div class="card-x p-3 h-100"><h2 class="h6">Aduan vs Saran</h2>${daftarBar(ur(d.jenis), '#F97316')}</div></div>
      <div class="col-12 col-md-4"><div class="card-x p-3 h-100"><h2 class="h6">6 Bulan Terakhir</h2>${daftarBar(d.bulanan.map(b => [labelBln(b.Bulan), b.Jumlah]), '#14B8A6')}</div></div></div>`;
  });
}


/* ── Kecepatan: benih cache dari respons login + muat menu lain lebih dulu ── */
function semaiCacheLogin(r) {
  if (r.dash) _cache.set(kunciBaca('getDashboard', [r.token]), { data: r.dash, t: Date.now() }); // dashboard ikut dalam respons login
  delete r.dash;
}
function prefetchAwal() {
  if (!S.t || !S.u) return;
  const t = S.t, u = S.u, ks = u.kas || [];
  const kasAwal = (u.kasTambah || []).find(x => ks.includes(x)) || ks[0]; // sama dengan kas yang dibuka pertama kali di menu Keuangan
  const q = [];
  if (kasAwal) q.push(['listKas', [t, kasAwal]]);
  q.push(['listWarga', [t]], ['listInfo', [t]], ['listAset', [t]], ['listAduan', [t]], ['listAturan', [t]], ['listPeminjaman', [t]], ['listPengeluaranAset', [t]], ['listKasMaster', [t]], ['getPengaturan', [t]]);
  if (u.peran === 'Ketua RT') q.push(['listUser', [t]]);
  prefetchBaca(q);
}

/* ── Inisialisasi ── */
document.addEventListener('DOMContentLoaded', () => {
  let t = 'light';
  try { t = localStorage.getItem('tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) {}
  setTema(t);
  $('mS').onclick = () => SIMPAN && SIMPAN();
  $('mB').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); $('mS').click(); } });
  muatPublik();
  muatPublikTambahan();
});
