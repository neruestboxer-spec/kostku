/* ============================================================
   KOSTKU — Inti aplikasi: sesi, state, router, kerangka tampilan
   ============================================================ */

const Pages = {};   // diisi oleh pages-*.js  → Pages[nama](args, query)
const Act = {};     // aksi klik global      → <button data-act="nama">

const NAV = [
  { id: 'beranda', label: 'Beranda', icon: 'grid' },
  { id: 'kamar', label: 'Kamar', icon: 'bed' },
  { id: 'penghuni', label: 'Penghuni', icon: 'users' },
  { id: 'bayar', label: 'Bayar', icon: 'wallet' },
  { id: 'wa', label: 'WhatsApp', icon: 'wa' },
  { id: 'surat', label: 'Surat Sewa', icon: 'file' },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: 'receipt', owner: true },
  { id: 'laporan', label: 'Laporan', icon: 'chart', owner: true },
  { id: 'pengaturan', label: 'Pengaturan', icon: 'settings', owner: true },
  { id: 'akun', label: 'Akun Saya', icon: 'user' }
];
const OWNER_PAGES = ['pengeluaran', 'laporan', 'pengaturan'];

/* ---------- Helper data (dibaca dari App.S) ---------- */
const D = {
  get S() { return App.S || {}; },
  owner() { return D.S.me && D.S.me.role === 'Owner'; },
  set() { return D.S.pengaturan || {}; },
  kamar(id) { return (D.S.kamar || []).find(k => k.id_kamar === id); },
  penghuni(id) { return (D.S.penghuni || []).find(p => p.id_penghuni === id); },
  kontrak(id) { return (D.S.kontrak || []).find(k => k.id_kontrak === id); },
  kontrakAktifPenghuni(id) { return (D.S.kontrak || []).find(k => k.id_penghuni === id && k.status === 'Aktif'); },
  kontrakTerakhirPenghuni(id) {
    return (D.S.kontrak || []).filter(k => k.id_penghuni === id).sort((a, b) => String(b.tanggal_masuk).localeCompare(a.tanggal_masuk))[0];
  },
  kontrakAktifKamar(id) { return (D.S.kontrak || []).find(k => k.id_kamar === id && k.status === 'Aktif'); },
  tagihanOutstanding(idP) {
    return (D.S.tagihan || []).filter(t => t.id_penghuni === idP && t.status_kontrak === 'Aktif' && t.sisa > 0 && t.kategori !== 'Belum Jatuh Tempo');
  },
  /** Status pembayaran ringkas seorang penghuni. */
  status(p) {
    if (!p || p.status !== 'Aktif') return { label: 'Keluar', cls: 'chip-vacant', kind: 'keluar', items: [], total: 0 };
    const items = D.tagihanOutstanding(p.id_penghuni);
    const total = items.reduce((a, t) => a + t.sisa, 0);
    const tg = items.filter(t => t.kategori === 'Menunggak');
    if (tg.length) {
      const hari = Math.max.apply(null, tg.map(t => -t.selisih));
      return { label: 'Menunggak ' + hari + ' Hari', short: 'Telat ' + hari + ' Hari', cls: 'chip-danger', kind: 'menunggak', items: items, total: total, hari: hari };
    }
    if (items.some(t => t.kategori === 'Hari Ini')) return { label: 'Jatuh Tempo Hari Ini', short: 'Hari Ini', cls: 'chip-amber', kind: 'jatuh', items: items, total: total };
    const sg = items.find(t => t.kategori === 'Segera');
    if (sg) return { label: sg.selisih + ' Hari Lagi', short: 'H-' + sg.selisih, cls: 'chip-amber', kind: 'segera', items: items, total: total };
    return { label: 'Lunas', short: 'Lunas', cls: 'chip-success', kind: 'lunas', items: [], total: 0 };
  },
  urgent() {
    return (D.S.tagihan || []).filter(t => t.status_kontrak === 'Aktif' && t.sisa > 0 && ['Menunggak', 'Hari Ini', 'Segera'].includes(t.kategori));
  }
};

/* ---------- Aplikasi ---------- */
const App = {
  token: null,
  S: null,
  route: { page: '', args: [], query: {} },
  files: new Map(),
  lastAct: Date.now(),
  booted: false,

  init() {
    try { this.token = localStorage.getItem('kostku_token'); } catch (e) { this.token = null; }
    document.addEventListener('click', e => this.onClick(e));
    ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, () => { this.lastAct = Date.now(); }, { passive: true }));
    setInterval(() => this.cekIdle(), 60000);
    window.addEventListener('hashchange', () => this.render());
    document.getElementById('login-form').addEventListener('submit', e => this.login(e));
    document.getElementById('toggle-pw').addEventListener('click', () => {
      const i = document.getElementById('login-pw');
      i.type = i.type === 'password' ? 'text' : 'password';
    });
    const cfgOk = /\/exec$/.test((window.KOSTKU_CONFIG || {}).GAS_URL || '');
    if (!cfgOk) document.getElementById('login-warn').classList.remove('hidden');
    if (this.token && cfgOk) this.muat(); else this.tampilLogin();
  },

  async muat() {
    try {
      await Api.call('state');
      this.tampilShell();
    } catch (e) {
      if (e.code !== 'AUTH') {
        document.getElementById('boot').innerHTML = '<div class="boot-inner" style="max-width:320px;padding:16px">' +
          '<div class="logo-mark">' + ic('alert') + '</div><div class="h-sm">Gagal memuat data</div>' +
          '<p class="muted">' + U.esc(e.message) + '</p><button class="btn btn-primary" onclick="location.reload()">' + ic('refresh') + 'Coba Lagi</button> ' +
          '<button class="btn btn-ghost" onclick="App.logout(true)">Keluar</button></div>';
      }
    }
  },

  tampilLogin(pesan) {
    document.getElementById('boot').classList.add('hidden');
    document.getElementById('shell').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
    document.getElementById('login-err').textContent = pesan || '';
    document.getElementById('login-err').classList.toggle('hidden', !pesan);
    setTimeout(() => { const u = document.getElementById('login-user'); if (u) u.focus(); }, 50);
  },

  tampilShell() {
    document.getElementById('boot').classList.add('hidden');
    document.getElementById('login').classList.add('hidden');
    document.getElementById('shell').classList.remove('hidden');
    this.booted = true;
    this.renderChrome();
    if (!location.hash || location.hash === '#/' || location.hash === '#') location.hash = '#/beranda';
    else this.render();
  },

  async login(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-err');
    err.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = ic('loader', 'spin') + ' Memeriksa...';
    try {
      const r = await Api.call('login', { username: document.getElementById('login-user').value, password: document.getElementById('login-pw').value });
      this.token = r.token;
      try { localStorage.setItem('kostku_token', r.token); } catch (x) { /* mode privat */ }
      document.getElementById('login-pw').value = '';
      btn.innerHTML = ic('loader', 'spin') + ' Memuat data...';
      await Api.call('state');
      this.lastAct = Date.now();
      location.hash = '#/beranda';
      this.tampilShell();
    } catch (x) {
      err.textContent = x.message;
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Masuk ' + ic('arrowRight');
    }
  },

  async logout(diam) {
    const tok = this.token;
    this.token = null;
    this.S = null;
    this.files.forEach(u => URL.revokeObjectURL(u));
    this.files.clear();
    try { localStorage.removeItem('kostku_token'); } catch (e) { /* abaikan */ }
    if (tok && !diam) { App.token = tok; Api.call('logout').catch(() => {}); App.token = null; }
    document.getElementById('sheet-root').innerHTML = '';
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname);
    this.tampilLogin();
  },

  sesiHabis(pesan) {
    if (!this.token) return;
    this.token = null;
    try { localStorage.removeItem('kostku_token'); } catch (e) { /* abaikan */ }
    document.getElementById('sheet-root').innerHTML = '';
    document.body.style.overflow = '';
    U.busy(false);
    this.tampilLogin(pesan || 'Sesi berakhir. Silakan login kembali.');
  },

  cekIdle() {
    const menit = (window.KOSTKU_CONFIG || {}).IDLE_MENIT || 60;
    if (this.token && Date.now() - this.lastAct > menit * 60000) {
      this.logout(false).then(() => this.tampilLogin('Anda keluar otomatis karena tidak aktif selama ' + menit + ' menit.'));
    }
  },

  setState(s) {
    this.S = s;
    if (this.booted) this.renderChrome();
  },

  /** Jalankan aksi server dengan overlay loading + toast. */
  async run(action, data, opt) {
    opt = opt || {};
    U.busy(true, opt.busy || 'Menyimpan...');
    try {
      const r = await Api.call(action, data, opt);
      if (opt.toast !== false && (r.message || opt.ok)) U.toast(opt.ok || r.message, 'success');
      if (r.info && r.info.length) r.info.forEach(t => U.toast(t, /gagal/i.test(t) ? 'warn' : 'success'));
      return r;
    } catch (e) {
      if (e.code !== 'AUTH') U.toast(e.message, 'error');
      if (opt.throw) throw e;
      return null;
    } finally {
      U.busy(false);
    }
  },

  go(hash) { if (location.hash === hash) this.render(); else location.hash = hash; },

  onClick(e) {
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); this.go(go.getAttribute('data-go')); return; }
    const a = e.target.closest('[data-act]');
    if (a && Act[a.dataset.act]) { e.preventDefault(); Act[a.dataset.act](a, e); }
  },

  /* ---------- Router ---------- */
  render() {
    if (!this.S) return;
    const raw = (location.hash || '#/beranda').replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const page = parts[0] || 'beranda';
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
    if (OWNER_PAGES.includes(page) && !D.owner()) {
      U.toast('Halaman ini khusus Owner.', 'warn');
      location.replace('#/beranda');
      return;
    }
    const fn = Pages[page];
    if (!fn) { location.replace('#/beranda'); return; }
    this.route = { page: page, args: parts.slice(1), query: query };
    document.getElementById('sheet-root').innerHTML = '';
    document.body.style.overflow = '';
    const view = document.getElementById('view');
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    this.renderChrome();
    try { fn(parts.slice(1), query); }
    catch (err) { console.error(err); view.innerHTML = '<div class="empty">' + ic('alert') + '<div class="t">Terjadi kesalahan tampilan</div><div>' + U.esc(err.message) + '</div></div>'; }
    this.hydrate(view);
  },

  /** Muat ulang halaman aktif tanpa mengubah scroll. */
  refresh() {
    const y = window.scrollY;
    const r = this.route;
    if (Pages[r.page]) { Pages[r.page](r.args, r.query); this.hydrate(document.getElementById('view')); }
    window.scrollTo(0, y);
  },

  /* ---------- Kerangka (sidebar, topbar, bottom nav) ---------- */
  renderChrome() {
    if (!this.S) return;
    const S = this.S, me = S.me, set = S.pengaturan || {};
    const owner = D.owner();
    const page = this.route.page || 'beranda';
    const navId = { 'surat-template': 'surat' }[page] || page;
    const items = NAV.filter(n => !n.owner || owner);
    const urgent = (S.ringkasan && S.ringkasan.tagihan_pending) || 0;
    const titleMap = { beranda: 'Beranda', kamar: 'Kamar', penghuni: 'Penghuni', bayar: 'Bayar', wa: 'WhatsApp', surat: 'Surat Sewa', pengeluaran: 'Pengeluaran', laporan: 'Laporan Keuangan', pengaturan: 'Pengaturan', akun: 'Akun Saya' };
    const logo = set.logo_url ? '<img data-img="' + U.esc(set.logo_url) + '" alt="">' : ic('building');

    document.getElementById('sidebar').innerHTML =
      '<div class="side-brand"><div class="brand-logo">' + logo + '</div><div class="grow"><div class="t">' + U.esc(set.nama_aplikasi || 'Kostku') + '</div><div class="s ellipsis">' + U.esc(set.nama_kost || '') + '</div></div></div>' +
      items.map((n, i) => (n.id === 'pengeluaran' ? '<div class="side-sep"></div>' : '') +
        '<button class="side-link ' + (navId === n.id ? 'active' : '') + '" data-go="#/' + n.id + '">' + ic(n.icon) + '<span>' + n.label + '</span>' +
        (n.id === 'bayar' && urgent ? '<span class="badge-n">' + urgent + '</span>' : '') + '</button>').join('') +
      '<div class="side-foot"><div class="side-sep"></div><button class="side-link" data-act="logout">' + ic('logout') + '<span>Keluar</span></button></div>';

    document.getElementById('topbar').innerHTML =
      '<div class="brand"><div class="brand-logo">' + logo + '</div><div class="grow"><div class="brand-label">KOSTKU ' + (owner ? 'OWNER' : 'ADMIN') + '</div>' +
      '<div class="brand-page ellipsis">' + (titleMap[navId] || '') + '</div></div></div>' +
      '<button class="icon-btn" data-act="notif" aria-label="Notifikasi">' + ic('bell') + (urgent ? '<span class="dot-badge">' + urgent + '</span>' : '') + '</button>' +
      '<button class="avatar-btn" data-go="#/akun" title="' + U.esc(me.nama) + '">' + U.esc(U.initials(me.nama)) + '</button>';

    const bottom = ['beranda', 'kamar', 'penghuni', 'bayar'];
    document.getElementById('bottomnav').innerHTML = bottom.map(id => {
      const n = NAV.find(x => x.id === id);
      return '<button class="nav-item ' + (navId === id ? 'active' : '') + '" data-go="#/' + id + '" aria-label="' + n.label + '">' + ic(n.icon) + '<span class="lbl">' + n.label + '</span></button>';
    }).join('') +
      '<button class="nav-item ' + (bottom.includes(navId) ? '' : 'active') + '" data-act="menu" aria-label="Menu lainnya">' + ic('menu') + '<span class="lbl">' + (bottom.includes(navId) ? 'Lainnya' : (titleMap[navId] || 'Lainnya').split(' ')[0]) + '</span></button>';
    this.hydrate(document.getElementById('topbar'));
    this.hydrate(document.getElementById('sidebar'));
  },

  /* ---------- Berkas privat dari Drive (via API, tanpa tautan publik) ---------- */
  async fileBlob(id) {
    const r = await Api.call('getFile', { id: id });
    return { blob: U.b64Blob(r.file.data, r.file.mime), nama: r.file.nama, mime: r.file.mime };
  },

  async fileUrl(id) {
    if (this.files.has(id)) return this.files.get(id);
    const p = this.fileBlob(id).then(f => { const u = URL.createObjectURL(f.blob); this.files.set(id, u); return u; });
    this.files.set(id, p);
    try { return await p; } catch (e) { this.files.delete(id); throw e; }
  },

  /** Isi semua <img data-img="ID"> secara bertahap (maks 3 paralel). */
  hydrate(root) {
    const els = Array.from((root || document).querySelectorAll('img[data-img]:not([data-loaded])'));
    let i = 0;
    const next = () => {
      if (i >= els.length) return;
      const el = els[i++];
      el.setAttribute('data-loaded', '1');
      const id = el.getAttribute('data-img');
      Promise.resolve(this.fileUrl(id)).then(u => { el.src = u; el.classList.remove('hidden'); }).catch(() => { el.remove(); }).finally(next);
    };
    for (let k = 0; k < 3; k++) next();
  },

  async lihatBerkas(id, judul) {
    U.busy(true, 'Memuat berkas...');
    let f;
    try { f = await this.fileBlob(id); }
    catch (e) { U.toast(e.message, 'error'); return; }
    finally { U.busy(false); }
    const url = URL.createObjectURL(f.blob);
    const isImg = /^image\//.test(f.mime);
    const s = U.sheet({
      title: U.esc(judul || 'Berkas'), sub: U.esc(f.nama),
      body: '<div class="viewer">' + (isImg ? '<img src="' + url + '" alt="">' : '<iframe src="' + url + '" title="Pratinjau"></iframe>') + '</div>',
      foot: '<a class="btn btn-ghost" href="' + url + '" target="_blank" rel="noopener">' + ic('external') + 'Buka</a><button class="btn btn-primary" data-dl>' + ic('download') + 'Unduh</button>',
      onClose: () => setTimeout(() => URL.revokeObjectURL(url), 60000)
    });
    s.q('[data-dl]').onclick = () => U.downloadBlob(f.blob, f.nama);
  }
};

/* ---------- Aksi global ---------- */
Act.logout = async () => { if (await U.confirm({ title: 'Keluar dari aplikasi?', message: 'Anda perlu login kembali untuk mengakses data.', ok: 'Keluar' })) App.logout(); };

Act.menu = () => {
  const owner = D.owner();
  const items = NAV.filter(n => !['beranda', 'kamar', 'penghuni', 'bayar'].includes(n.id) && (!n.owner || owner));
  const s = U.sheet({
    title: 'Menu Lainnya', sub: U.esc(App.S.me.nama) + ' · ' + U.esc(App.S.me.role),
    body: '<div class="menu-list">' + items.map(n => '<button class="side-link" data-go="#/' + n.id + '">' + ic(n.icon) + '<span>' + n.label + '</span>' + ic('right', 'ic-sm') + '</button>').join('') +
      '<button class="side-link" data-act="logout" style="color:var(--danger-text)">' + ic('logout') + '<span>Keluar</span></button></div>'
  });
  s.qa('[data-go]').forEach(b => b.addEventListener('click', () => s.close()));
};

Act.notif = () => {
  const list = D.urgent();
  const r = App.S.ringkasan || {};
  const body = (r.wa_gagal ? '<div class="banner danger mb-12">' + ic('alert') + '<div><b>Pengiriman WhatsApp gagal</b><br>' + U.esc(r.wa_gagal.alasan) + '</div></div>' : '') +
    (r.kontrak_segera_berakhir ? '<div class="banner amber mb-12">' + ic('clock') + '<div><b>' + r.kontrak_segera_berakhir + ' kontrak</b> berakhir dalam 30 hari. <a href="#/surat?f=akhir" data-close-sheet>Lihat</a></div></div>' : '') +
    (list.length ? list.map(t => '<div class="list-item"><div class="avatar sm ' + U.avClass(t.nama) + '">' + U.esc(U.initials(t.nama)) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(t.nama) + '</div><div class="small muted">Kamar ' + U.esc(t.nomor_kamar) + ' · ' + U.bulan(t.periode) + '</div></div>' +
      '<div class="right"><div class="semi rp">' + U.rp(t.sisa) + '</div>' + kategoriChip(t) + '</div></div>').join('')
      : '<div class="empty"><div class="icon-box">' + ic('checkCircle') + '</div><div class="t">Tidak ada tagihan mendesak</div></div>');
  const s = U.sheet({ title: 'Notifikasi', sub: list.length + ' tagihan perlu perhatian', body: body, foot: list.length ? '<button class="btn btn-primary" data-go="#/wa">' + ic('send') + 'Kirim Pengingat</button>' : '' });
  s.qa('[data-go],[data-close-sheet]').forEach(b => b.addEventListener('click', () => s.close()));
};

Act.lihatBerkas = el => App.lihatBerkas(el.dataset.id, el.dataset.title);

/* ---------- Komponen kecil yang dipakai banyak halaman ---------- */
function kategoriChip(t) {
  if (t.sisa <= 0) return '<span class="chip chip-success">Lunas</span>';
  if (t.kategori === 'Menunggak') return '<span class="chip chip-danger">Telat ' + (-t.selisih) + ' hari</span>';
  if (t.kategori === 'Hari Ini') return '<span class="chip chip-amber">Jatuh tempo hari ini</span>';
  if (t.kategori === 'Segera') return '<span class="chip chip-amber">' + t.selisih + ' hari lagi</span>';
  return '<span class="chip">' + U.tgl(t.jatuh_tempo) + '</span>';
}

function kamarChip(status) {
  if (status === 'Terisi') return '<span class="chip chip-primary">' + ic('lock') + 'Terisi</span>';
  if (status === 'Perbaikan') return '<span class="chip chip-amber">' + ic('wrench') + 'Perbaikan</span>';
  return '<span class="chip chip-success">' + ic('checkCircle') + 'Tersedia</span>';
}

function emptyState(icon, title, text, action) {
  return '<div class="empty"><div class="icon-box">' + ic(icon) + '</div><div class="t">' + title + '</div><div>' + (text || '') + '</div>' + (action ? '<div class="mt-16">' + action + '</div>' : '') + '</div>';
}

function filterChips(items, active, act) {
  return '<div class="filters">' + items.map(f => '<button class="filter ' + (f.id === active ? 'active' : '') + '" data-act="' + act + '" data-f="' + f.id + '">' +
    (f.dot ? '<span class="dot" style="background:' + f.dot + '"></span>' : '') + U.esc(f.label) + (f.n !== undefined ? ' <span class="n">' + f.n + '</span>' : '') + '</button>').join('') + '</div>';
}

function monthNav(ym, act) {
  return '<div class="card row-between" style="padding:8px">' +
    '<button class="icon-btn" data-act="' + act + '" data-m="' + U.addMonths(ym, -1) + '" aria-label="Bulan sebelumnya">' + ic('left') + '</button>' +
    '<div class="row semi c-primary">' + ic('calendar', 'ic-sm') + U.bulan(ym) + '</div>' +
    '<button class="icon-btn" data-act="' + act + '" data-m="' + U.addMonths(ym, 1) + '" aria-label="Bulan berikutnya">' + ic('right') + '</button></div>';
}

/** Input berkas tersembunyi → Promise dataURL (gambar dikompres). */
function pilihBerkas(accept, capture) {
  return new Promise(resolve => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = accept || 'image/*';
    if (capture) inp.setAttribute('capture', 'environment');
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return resolve(null);
      U.busy(true, 'Mengompres berkas...');
      try { resolve({ data: await U.prepareFile(f), nama: f.name, mime: f.type }); }
      catch (e) { U.toast(e.message, 'error'); resolve(null); }
      finally { U.busy(false); }
    };
    inp.click();
  });
}
