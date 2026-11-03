/* ============================================================
   KOSTKU — Halaman: Beranda, Kamar, Penghuni
   ============================================================ */

const UI = { kamarF: 'semua', kamarQ: '', penghuniF: 'semua', penghuniQ: '' };
const FASILITAS = ['K. Mandi Dalam', 'AC', 'Kasur Springbed', 'Meja & Kursi', 'Lemari Pakaian', 'WiFi', 'Smart Door Lock', 'Water Heater', 'Jendela Luar', 'Balkon Pribadi', 'Listrik Token', 'Dapur Bersama', 'Parkir Motor', 'Kipas Angin'];
const FAS_ICON = { 'AC': 'zap', 'WiFi': 'wifi', 'K. Mandi Dalam': 'droplet', 'Kasur Springbed': 'bed', 'Water Heater': 'droplet', 'Listrik Token': 'zap', 'Balkon Pribadi': 'home', 'Smart Door Lock': 'lock' };

function view(html) { document.getElementById('view').innerHTML = html; }

/* ============================================================
   BERANDA
   ============================================================ */
Pages.beranda = () => {
  const S = App.S, r = S.ringkasan || {}, set = S.pengaturan || {}, owner = D.owner();
  const pct = r.total ? Math.round(r.terisi / r.total * 100) : 0;
  const circ = 2 * Math.PI * 22;
  const ringkasTag = r.tagihan_pending ? r.tagihan_pending + ' tagihan perlu tindakan' + (r.menunggak ? ' · ' + r.menunggak + ' menunggak' : '') : 'Semua tagihan aman terkendali';

  // Tagihan mendesak dikelompokkan per penghuni
  const urut = { menunggak: 0, jatuh: 1, segera: 2 };
  const mendesak = (S.penghuni || []).filter(p => p.status === 'Aktif').map(p => ({ p: p, st: D.status(p) }))
    .filter(x => x.st.kind in urut)
    .sort((a, b) => (urut[a.st.kind] - urut[b.st.kind]) || ((b.st.hari || 0) - (a.st.hari || 0)));

  const siap = (S.kamar || []).filter(k => k.status === 'Tersedia');

  let pemasukan = '';
  if (owner) {
    const ini = r.pemasukan_bulan_ini || 0, lalu = r.pemasukan_bulan_lalu || 0, pot = Math.max(r.potensi_bulan_ini || 0, ini);
    const ch = lalu ? Math.round((ini - lalu) / lalu * 1000) / 10 : null;
    pemasukan = '<div class="card mt-12">' +
      '<div class="row-between"><div class="row small semi muted">' + ic('wallet', 'ic-sm') + 'Pemasukan Bulan Ini</div>' +
      (ch !== null ? '<span class="chip ' + (ch >= 0 ? 'chip-success' : 'chip-danger') + '">' + ic(ch >= 0 ? 'trendUp' : 'trendDown') + (ch >= 0 ? '+' : '') + String(ch).replace('.', ',') + '% vs bln lalu</span>' : '') + '</div>' +
      '<div class="money-lg mt-8">' + U.rp(ini) + '</div>' +
      '<div class="row-between small mt-8"><span class="muted">Estimasi penerimaan penuh:</span><span class="bold rp">' + U.rp(pot) + '</span></div>' +
      '<div class="progress mt-8"><span style="width:' + (pot ? Math.min(100, ini / pot * 100) : 0) + '%"></span></div></div>';
  }

  const banners = [];
  if (r.wa_gagal) banners.push('<div class="banner danger mt-12">' + ic('alert') + '<div class="grow"><b>Pengiriman WhatsApp gagal.</b> ' + U.esc(r.wa_gagal.alasan) + '. Periksa koneksi nomor di Fonnte, lalu kirim ulang dari Riwayat.</div><button class="link-btn" data-go="#/wa?tab=riwayat">Lihat</button></div>');
  if (r.kontrak_segera_berakhir) banners.push('<div class="banner amber mt-12">' + ic('clock') + '<div class="grow"><b>' + r.kontrak_segera_berakhir + ' kontrak</b> akan berakhir dalam 30 hari ke depan.</div><button class="link-btn" data-go="#/surat?f=akhir">Tinjau</button></div>');
  if (owner && !set.wa_token_terpasang) banners.push('<div class="banner info mt-12">' + ic('info') + '<div class="grow">Token WhatsApp (Fonnte) belum diisi. Pengingat tagihan belum bisa dikirim.</div><button class="link-btn" data-go="#/pengaturan">Atur</button></div>');

  const quick = [
    ['userPlus', 'Tambah Penghuni', '#/penghuni/baru', ''],
    ['receipt', 'Catat Bayar', '', 'catatBayar'],
    ['wa', 'Kirim WhatsApp', '#/wa', ''],
    ['file', 'Surat Sewa', '#/surat', '']
  ];
  if (owner) quick.push(['cash', 'Catat Pengeluaran', '#/pengeluaran?baru=1', ''], ['chart', 'Laporan Keuangan', '#/laporan', '']);
  const tones = ['', 'amber', '', 'amber', 'info', ''];

  view(
    '<section class="hero">' +
      '<div class="hero-top"><div class="loc"><div class="pin">' + ic('pin', 'ic-sm') + '</div><div><div class="lbl">PROPERTI AKTIF</div><div class="nm">' + U.esc(set.nama_kost || 'Kost Saya') + '</div>' +
      '<div class="addr">' + U.esc(set.alamat || 'Alamat belum diatur') + '</div></div></div>' +
      '<span class="role-pill">' + ic(owner ? 'key' : 'shield', 'ic-xs') + (owner ? 'OWNER' : 'ADMIN') + '</span></div>' +
      '<div class="searchbar">' + ic('search') + '<input class="input" id="cari-global" placeholder="Cari penghuni, kamar, atau no. WA..." autocomplete="off" aria-label="Pencarian">' +
      '<div class="search-results hidden" id="cari-hasil"></div></div>' +
    '</section>' +

    '<div class="overview">' +
      '<span class="chip chip-amber">' + ic('bed') + r.tersedia + ' Kamar Kosong</span>' +
      '<div class="t">' + r.tersedia + ' dari ' + r.total + ' Kamar Tersedia</div>' +
      '<div class="s">' + U.esc(ringkasTag) + '</div>' +
      '<div class="row-between mt-16"><div class="row"><div class="ring"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="5"/>' +
      '<circle cx="26" cy="26" r="22" fill="none" stroke="#F2B544" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pct / 100)) + '"/></svg><div class="pct">' + pct + '%</div></div>' +
      '<div><div class="xs" style="opacity:.75">OKUPANSI</div><div class="semi">' + (pct >= 80 ? 'Tingkat Huni Baik' : pct >= 50 ? 'Tingkat Huni Sedang' : 'Perlu Promosi') + '</div></div></div>' +
      '<button class="btn btn-sm btn-pill" style="background:#fff;color:var(--primary)" data-go="#/kamar?f=Tersedia">Lihat Kamar ' + ic('arrowRight', 'ic-sm') + '</button></div>' +
    '</div>' +

    banners.join('') +

    '<div class="grid-2 mt-12">' +
      statTile('building', '', 'TOTAL', r.total, 'Pintu', '#/kamar') +
      statTile('user', '', 'TERISI', r.terisi, 'Kamar', '#/kamar?f=Terisi') +
      statTile('door', 'amber', 'KOSONG', r.tersedia, 'Siap Huni', '#/kamar?f=Tersedia', 'c-amber') +
      statTile('alert', 'danger', 'TAGIHAN', r.tagihan_pending, 'Pending', '#/bayar', 'c-danger') +
    '</div>' +
    pemasukan +

    '<div class="section"><div class="section-head"><div class="section-title">Menu Cepat</div><span class="xs c-primary">AKSI PRAKTIS</span></div>' +
    '<div class="grid-2">' + quick.map((q, i) => '<button class="quick" ' + (q[2] ? 'data-go="' + q[2] + '"' : 'data-act="' + q[3] + '"') + '><div class="icon-box sm ' + tones[i] + '">' + ic(q[0], 'ic-sm') + '</div><span class="grow">' + q[1] + '</span>' + ic('right', 'ic-sm') + '</button>').join('') + '</div></div>' +

    '<div class="section" id="mendesak"><div class="section-head"><div class="section-title">Tagihan Mendesak ' + (mendesak.length ? '<span class="chip chip-danger">' + mendesak.length + '</span>' : '') + '</div><button class="link-btn" data-go="#/bayar">Semua ' + ic('right', 'ic-xs') + '</button></div>' +
    (mendesak.length ? '<div class="grid-cards">' + mendesak.slice(0, 6).map(x => tagihanCard(x.p, x.st)).join('') + '</div>'
      : '<div class="card">' + emptyState('checkCircle', 'Tidak ada tagihan mendesak', 'Semua penghuni aktif sudah membayar atau belum jatuh tempo.') + '</div>') +
    '</div>' +

    '<div class="section"><div class="section-head"><div><div class="section-title">Kamar Siap Huni</div><div class="small muted">Unit bersih & siap disewakan</div></div><button class="link-btn" data-go="#/kamar?f=Tersedia">Kelola ' + ic('arrowRight', 'ic-xs') + '</button></div>' +
    (siap.length ? '<div class="hscroll">' + siap.map(k => '<div class="card" style="padding:10px">' +
      '<div class="room-photo">' + fotoKamar(k) + '<span class="floor">Kamar ' + U.esc(k.nomor_kamar) + '</span><span class="st">' + kamarChip(k.status) + '</span></div>' +
      '<div class="semi mt-12">' + U.esc(k.tipe_unit || k.tipe) + (k.lantai ? ' • Lantai ' + U.esc(k.lantai) : '') + '</div>' +
      '<div class="small muted ellipsis">' + U.esc(k.fasilitas || '-') + '</div>' +
      '<div class="row-between mt-8"><div><div class="xs muted">HARGA SEWA</div><div class="bold c-primary rp">' + U.rp(k.harga_sewa) + '<span class="small muted">/bln</span></div></div>' +
      '<button class="btn btn-secondary btn-sm btn-icon" data-act="bagikanKamar" data-id="' + k.id_kamar + '" aria-label="Bagikan">' + ic('external', 'ic-sm') + '</button></div></div>').join('') + '</div>'
      : '<div class="card">' + emptyState('bed', 'Semua kamar terisi', 'Tidak ada unit kosong saat ini.') + '</div>') +
    '</div>'
  );
  pasangPencarian();
};

function statTile(icon, tone, k, v, unit, go, vcls) {
  return '<div class="stat" data-go="' + go + '"><div class="top"><div class="icon-box sm ' + tone + '">' + ic(icon, 'ic-sm') + '</div><span class="k">' + k + '</span></div>' +
    '<div class="v ' + (vcls || '') + '">' + (v || 0) + '<small>' + unit + '</small></div></div>';
}

function tagihanCard(p, st) {
  const k = D.kamar(p.id_kamar) || {};
  return '<div class="card"><div class="row row-top"><div class="avatar ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div>' +
    '<div class="grow"><div class="row-between"><div class="semi ellipsis">' + U.esc(p.nama) + '</div><span class="chip ' + st.cls + '">' + U.esc(st.label) + '</span></div>' +
    '<div class="small muted">Kamar ' + U.esc(k.nomor_kamar || '-') + (k.lantai ? ' (Lt ' + U.esc(k.lantai) + ')' : '') + ' • ' + st.items.map(t => U.bulanPendek(t.periode)).join(', ') + '</div></div></div>' +
    '<div class="row-between mt-12"><span class="small muted">Nominal Tagihan</span><span class="money">' + U.rp(st.total) + '</span></div>' +
    '<div class="btn-row mt-12"><button class="btn btn-secondary btn-sm btn-pill" data-act="kirimPengingat" data-id="' + p.id_penghuni + '">' + ic('send', 'ic-sm') + 'Kirim Pengingat</button>' +
    '<button class="btn btn-primary btn-sm btn-pill" data-act="catatBayar" data-pid="' + p.id_penghuni + '">' + ic('checkCircle', 'ic-sm') + 'Catat Bayar</button></div></div>';
}

function fotoKamar(k) {
  return '<div class="ph">' + ic('bed') + '</div>' + (k.id_foto_kamar ? '<img class="hidden" data-img="' + U.esc(k.id_foto_kamar) + '" alt="Foto kamar ' + U.esc(k.nomor_kamar) + '">' : '');
}

function pasangPencarian() {
  const inp = document.getElementById('cari-global');
  const box = document.getElementById('cari-hasil');
  if (!inp) return;
  const run = () => {
    const q = U.norm(inp.value.trim());
    if (q.length < 1) { box.classList.add('hidden'); return; }
    const t0 = performance.now();
    const ph = (App.S.penghuni || []).filter(p => U.norm(p.nama).includes(q) || String(p.no_wa).includes(q.replace(/\D/g, '') || '§') || U.norm((D.kamar(p.id_kamar) || {}).nomor_kamar).includes(q)).slice(0, 8);
    const km = (App.S.kamar || []).filter(k => U.norm(k.nomor_kamar).includes(q) || U.norm(k.tipe_unit).includes(q)).slice(0, 6);
    const ms = Math.round(performance.now() - t0);
    let html = '';
    if (ph.length) html += '<div class="sr-group">PENGHUNI</div>' + ph.map(p => {
      const k = D.kamar(p.id_kamar) || {};
      return '<div class="sr-item" data-go="#/penghuni/' + encodeURIComponent(p.id_penghuni) + '"><div class="avatar sm ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(p.nama) + '</div><div class="small muted">Kamar ' + U.esc(k.nomor_kamar || '-') + ' · ' + U.waFmt(p.no_wa) + '</div></div>' + (p.status !== 'Aktif' ? '<span class="chip">Keluar</span>' : '') + '</div>';
    }).join('');
    if (km.length) html += '<div class="sr-group">KAMAR</div>' + km.map(k => '<div class="sr-item" data-go="#/kamar/edit/' + encodeURIComponent(k.id_kamar) + '"><div class="room-stamp">' + U.esc(k.nomor_kamar) + '</div><div class="grow"><div class="semi">Kamar ' + U.esc(k.nomor_kamar) + '</div><div class="small muted">' + U.esc(k.tipe_unit || k.tipe) + ' · ' + U.rp(k.harga_sewa) + '</div></div>' + kamarChip(k.status) + '</div>').join('');
    if (!html) html = '<div class="empty small">Tidak ditemukan hasil untuk "' + U.esc(inp.value) + '"</div>';
    box.innerHTML = html + '<div class="sr-group right">' + (ph.length + km.length) + ' hasil · ' + ms + ' ms</div>';
    box.classList.remove('hidden');
  };
  inp.addEventListener('input', U.debounce(run, 80));
  inp.addEventListener('focus', run);
  document.addEventListener('click', function tutup(e) {
    if (!document.body.contains(inp)) { document.removeEventListener('click', tutup); return; }
    if (!e.target.closest('.searchbar')) box.classList.add('hidden');
  });
}

Act.bagikanKamar = async el => {
  const k = D.kamar(el.dataset.id);
  const set = D.set();
  const teks = 'Kamar ' + k.nomor_kamar + ' di ' + set.nama_kost + ' tersedia!\n' + (k.tipe_unit ? k.tipe_unit + '\n' : '') + 'Fasilitas: ' + (k.fasilitas || '-') + '\nHarga: ' + U.rp(k.harga_sewa) + '/bulan\nHubungi: ' + (set.kontak || '-');
  try {
    if (navigator.share) await navigator.share({ title: 'Kamar ' + k.nomor_kamar, text: teks });
    else { await navigator.clipboard.writeText(teks); U.toast('Info kamar disalin ke clipboard.'); }
  } catch (e) { /* dibatalkan */ }
};

/* ============================================================
   KAMAR
   ============================================================ */
Pages.kamar = (args, q) => {
  if (args[0] === 'baru' || args[0] === 'edit') return kamarForm(args[1]);
  if (q.f) UI.kamarF = q.f;
  const all = App.S.kamar || [];
  const n = s => all.filter(k => k.status === s).length;
  const r = App.S.ringkasan || {};
  view(
    '<div class="page-head"><div><h1 class="h-xl">Manajemen Kamar</h1><p>' + all.length + ' Total Unit (' + r.terisi + ' Terisi, ' + r.tersedia + ' Tersedia)</p></div>' +
    '<button class="btn btn-primary btn-pill" data-go="#/kamar/baru">' + ic('plus') + '<span>Kamar Baru</span></button></div>' +
    '<div class="input-icon mb-12">' + ic('search') + '<input class="input" id="kamar-q" placeholder="Cari nomor kamar, lantai, tipe..." value="' + U.esc(UI.kamarQ) + '"></div>' +
    filterChips([
      { id: 'semua', label: 'Semua', n: all.length },
      { id: 'Tersedia', label: 'Tersedia', n: n('Tersedia'), dot: '#16A34A' },
      { id: 'Terisi', label: 'Terisi', n: n('Terisi'), dot: '#1B5E5A' },
      { id: 'Perbaikan', label: 'Perbaikan', n: n('Perbaikan'), dot: '#F2B544' }
    ], UI.kamarF, 'kamarFilter') +
    '<div id="kamar-list" class="grid-cards three"></div>'
  );
  const inp = document.getElementById('kamar-q');
  inp.addEventListener('input', U.debounce(() => { UI.kamarQ = inp.value; renderKamarList(); }, 120));
  renderKamarList();
};

Act.kamarFilter = el => { UI.kamarF = el.dataset.f; history.replaceState(null, '', '#/kamar'); Pages.kamar([], {}); App.hydrate(document.getElementById('view')); };

function renderKamarList() {
  const q = U.norm(UI.kamarQ);
  const list = (App.S.kamar || []).filter(k => (UI.kamarF === 'semua' || k.status === UI.kamarF) &&
    (!q || U.norm([k.nomor_kamar, 'lantai ' + k.lantai, k.tipe_unit, k.tipe, k.fasilitas].join(' ')).includes(q)))
    .sort((a, b) => String(a.nomor_kamar).localeCompare(String(b.nomor_kamar), 'id', { numeric: true }));
  const el = document.getElementById('kamar-list');
  el.innerHTML = list.length ? list.map(kamarCard).join('')
    : '<div class="card" style="grid-column:1/-1">' + emptyState('bed', (App.S.kamar || []).length ? 'Tidak ada kamar yang cocok' : 'Belum ada kamar', (App.S.kamar || []).length ? 'Ubah filter atau kata kunci pencarian.' : 'Tambahkan unit kamar pertama Anda.', (App.S.kamar || []).length ? '' : '<button class="btn btn-primary" data-go="#/kamar/baru">' + ic('plus') + 'Tambah Kamar</button>') + '</div>';
  App.hydrate(el);
}

function kamarCard(k) {
  const id = encodeURIComponent(k.id_kamar);
  if (k.status === 'Perbaikan') {
    return '<div class="card"><div class="row row-top"><div class="icon-box amber">' + ic('wrench') + '</div><div class="grow"><div class="row-between"><div class="room-name">Kamar ' + U.esc(k.nomor_kamar) + '</div><span class="chip chip-amber">Perbaikan</span></div>' +
      '<div class="small muted">Lantai ' + U.esc(k.lantai || '-') + ' • ' + U.esc(k.tipe_unit || k.tipe) + '</div></div></div>' +
      (k.catatan ? '<div class="repair-box mt-12">' + ic('info', 'ic-sm') + ' ' + U.esc(k.catatan) + '</div>' : '') +
      '<div class="row mt-12" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm btn-icon" data-go="#/kamar/edit/' + id + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button>' +
      '<button class="btn btn-secondary btn-sm" data-act="kamarSelesai" data-id="' + k.id_kamar + '">' + ic('check', 'ic-sm') + 'Tandai Selesai</button></div></div>';
  }
  let body = '';
  if (k.status === 'Terisi') {
    const kt = D.kontrakAktifKamar(k.id_kamar);
    const p = kt ? D.penghuni(kt.id_penghuni) : null;
    const st = p ? D.status(p) : null;
    body = p ? '<div class="tenant-strip mt-12"><div class="avatar sm ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(p.nama) + '</div>' +
      '<div class="small muted">Kontrak s/d ' + U.tgl(kt.tanggal_keluar) + '</div></div>' +
      (st.kind === 'lunas' ? '<span class="c-success">' + ic('checkCircle') + '</span>' : '<span class="chip ' + st.cls + '">' + U.esc(st.short) + '</span>') + '</div>' +
      '<div class="row mt-12"><button class="btn btn-ghost btn-sm" data-go="#/penghuni/' + encodeURIComponent(p.id_penghuni) + '">' + ic('info', 'ic-sm') + 'Detail</button><span class="grow"></span>' +
      (st.kind !== 'lunas' ? '<button class="btn btn-amber btn-sm" data-act="kirimPengingat" data-id="' + p.id_penghuni + '">' + ic('send', 'ic-sm') + 'Kirim Tagihan</button>' : '<button class="btn btn-ghost btn-sm btn-icon" data-go="#/kamar/edit/' + id + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button>') + '</div>'
      : '<div class="banner amber mt-12">' + ic('alert') + '<div>Status terisi tanpa kontrak aktif.</div></div>';
  } else {
    const fas = String(k.fasilitas || '').split(',').map(s => s.trim()).filter(Boolean);
    body = (fas.length ? '<div class="row wrap mt-12">' + fas.slice(0, 5).map(f => '<span class="tag">' + ic(FAS_ICON[f] || 'check', 'ic-xs') + U.esc(f) + '</span>').join('') + (fas.length > 5 ? '<span class="tag">+' + (fas.length - 5) + '</span>' : '') + '</div>' : '') +
      '<div class="row mt-16"><button class="btn btn-ghost btn-sm btn-icon" data-go="#/kamar/edit/' + id + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button>' +
      '<button class="btn btn-ghost btn-sm btn-icon" data-act="kamarMenu" data-id="' + k.id_kamar + '" aria-label="Lainnya">' + ic('more', 'ic-sm') + '</button><span class="grow"></span>' +
      '<button class="btn btn-primary btn-sm" data-go="#/penghuni/baru?kamar=' + id + '">' + ic('userPlus', 'ic-sm') + 'Detail & Sewakan</button></div>';
  }
  return '<div class="card" style="padding:12px"><div class="room-photo">' + fotoKamar(k) + (k.lantai ? '<span class="floor">Lantai ' + U.esc(k.lantai) + '</span>' : '') + '<span class="st">' + kamarChip(k.status) + '</span></div>' +
    '<div class="row-between row-top mt-12"><div class="grow"><div class="room-name">Kamar ' + U.esc(k.nomor_kamar) + '</div><div class="small muted ellipsis">' + U.esc(k.tipe_unit || k.tipe) + (k.luas ? ' (' + U.esc(k.luas) + ')' : '') + '</div></div>' +
    '<div class="room-price">' + U.rp(k.harga_sewa) + '<small>/ bulan</small></div></div>' + body + '</div>';
}

Act.kamarSelesai = async el => { await App.run('statusKamar', { id_kamar: el.dataset.id, status: 'Tersedia' }); App.refresh(); };

Act.kamarMenu = el => {
  const k = D.kamar(el.dataset.id);
  const s = U.sheet({
    title: 'Kamar ' + U.esc(k.nomor_kamar), size: 'sm',
    body: '<div class="menu-list">' +
      '<button class="side-link" data-a="edit">' + ic('pencil') + '<span>Ubah Data Kamar</span></button>' +
      '<button class="side-link" data-a="repair">' + ic('wrench') + '<span>Tandai Sedang Perbaikan</span></button>' +
      '<button class="side-link" data-a="share">' + ic('external') + '<span>Bagikan Info Kamar</span></button>' +
      (D.owner() ? '<button class="side-link" data-a="hapus" style="color:var(--danger-text)">' + ic('trash') + '<span>Hapus Kamar</span></button>' : '') + '</div>'
  });
  s.q('[data-a=edit]').onclick = () => { s.close(); App.go('#/kamar/edit/' + encodeURIComponent(k.id_kamar)); };
  s.q('[data-a=share]').onclick = () => { s.close(); Act.bagikanKamar({ dataset: { id: k.id_kamar } }); };
  s.q('[data-a=repair]').onclick = () => {
    s.close();
    const s2 = U.sheet({
      title: 'Tandai Perbaikan', sub: 'Kamar ' + U.esc(k.nomor_kamar), size: 'sm',
      body: '<div class="field"><label>Catatan perbaikan</label><textarea class="textarea" id="cat-perbaikan" placeholder="Contoh: Pengecatan ulang & servis AC, target 25 Mei">' + U.esc(k.catatan) + '</textarea></div>',
      foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    s2.q('.sheet-foot [data-close]').onclick = () => s2.close();
    s2.q('[data-ok]').onclick = async () => { const r = await App.run('statusKamar', { id_kamar: k.id_kamar, status: 'Perbaikan', catatan: s2.q('#cat-perbaikan').value }); if (r) { s2.close(); App.refresh(); } };
  };
  const h = s.q('[data-a=hapus]');
  if (h) h.onclick = async () => {
    s.close();
    if (await U.confirm({ title: 'Hapus Kamar ' + U.esc(k.nomor_kamar) + '?', message: 'Data kamar dan fotonya akan dihapus permanen.', ok: 'Hapus', danger: true })) {
      if (await App.run('hapusKamar', { id_kamar: k.id_kamar })) App.refresh();
    }
  };
};

function kamarForm(id) {
  const k = id ? D.kamar(id) : null;
  if (id && !k) { view(emptyState('alert', 'Kamar tidak ditemukan', '', '<button class="btn btn-primary" data-go="#/kamar">Kembali</button>')); return; }
  const F = { fas: k ? String(k.fasilitas || '').split(',').map(s => s.trim()).filter(Boolean) : ['AC', 'Kasur Springbed', 'Lemari Pakaian', 'WiFi'], foto: null, lantai: k ? k.lantai : '1', status: k && k.status === 'Perbaikan' ? 'Perbaikan' : 'Tersedia', tipe: k ? k.tipe : 'Kost' };
  const semuaFas = FASILITAS.concat(F.fas.filter(f => !FASILITAS.includes(f)));
  const terisi = k && k.status === 'Terisi';

  view(
    '<button class="link-btn mt-8" data-go="#/kamar">' + ic('arrowLeft', 'ic-sm') + 'Daftar Kamar</button>' +
    '<div class="page-head"><div><h1 class="h-xl">' + (k ? 'Ubah Kamar ' + U.esc(k.nomor_kamar) : 'Tambah Kamar Baru') + '</h1><p>Lengkapi detail unit, fasilitas, dan skema tarif sewa</p></div></div>' +
    '<form id="kamar-form" novalidate>' +
    '<div class="two-col"><div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('door', 'ic-sm') + '</div><div><div class="t">Informasi Dasar Kamar</div><div class="s">Identitas fisik dan penempatan unit</div></div></div>' +
      '<div class="field"><label>Nomor / Kode Kamar <span class="req">*</span><span class="opt">Unik</span></label><div class="input-icon">' + ic('hash') + '<input class="input" name="nomor_kamar" required maxlength="40" placeholder="Contoh: 202" value="' + U.esc(k ? k.nomor_kamar : '') + '"></div></div>' +
      '<div class="field"><label>Lantai Penempatan</label><div class="seg light" id="seg-lantai">' + ['1', '2', '3', '4'].map(l => '<button type="button" data-v="' + l + '" class="' + (F.lantai === l ? 'active' : '') + '">Lantai ' + l + '</button>').join('') + '</div></div>' +
      '<div class="form-grid two"><div class="field"><label>Jenis Properti</label><div class="seg light" id="seg-tipe"><button type="button" data-v="Kost" class="' + (F.tipe !== 'Kontrakan' ? 'active' : '') + '">Kost</button><button type="button" data-v="Kontrakan" class="' + (F.tipe === 'Kontrakan' ? 'active' : '') + '">Kontrakan</button></div></div>' +
      '<div class="field"><label>Tipe Unit</label><input class="input" name="tipe_unit" list="tipe-list" maxlength="60" placeholder="Contoh: Deluxe AC" value="' + U.esc(k ? k.tipe_unit : '') + '"><datalist id="tipe-list"><option>Standar</option><option>Standar AC</option><option>Deluxe AC</option><option>Balkon VIP</option><option>Kontrakan 2 Kamar</option></datalist></div></div>' +
      '<div class="field"><label>Dimensi / Luas Kamar <span class="opt">Opsional</span></label><div class="input-icon">' + ic('maximize') + '<input class="input" name="luas" maxlength="30" placeholder="3 x 4 Meter" value="' + U.esc(k ? k.luas : '') + '"></div></div>' +
    '</div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('camera', 'ic-sm') + '</div><div class="grow"><div class="t">Foto Kamar</div><div class="s">Dokumentasi visual daya tarik sewa</div></div></div>' +
      '<div id="foto-box" class="field"></div>' +
      '<div class="banner mb-16">' + ic('info', 'ic-sm') + '<div>Foto terang dengan pencahayaan alami mempercepat keputusan calon penghuni.</div></div>' +
    '</div>' +
    '</div><div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('layers', 'ic-sm') + '</div><div><div class="t">Fasilitas Tersedia</div><div class="s">Ketuk untuk mencentang kelengkapan kamar</div></div></div>' +
      '<div class="fac-grid" id="fac-grid"></div>' +
      '<div class="row mt-12 mb-16"><input class="input" id="fas-baru" placeholder="Fasilitas lain..." maxlength="40"><button type="button" class="btn btn-secondary btn-icon" id="fas-add" aria-label="Tambah fasilitas">' + ic('plus') + '</button></div>' +
    '</div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('cash', 'ic-sm') + '</div><div><div class="t">Tarif Sewa & Deposit</div><div class="s">Struktur penagihan sewa dan jaminan</div></div></div>' +
      '<div class="field"><label>Tarif Sewa Pokok (Bulanan) <span class="req">*</span></label><div class="input-group"><span class="prefix">Rp</span><input class="input rp" name="harga_sewa" inputmode="numeric" data-money required value="' + (k ? U.numFmt(k.harga_sewa) : '') + '" placeholder="1.500.000"><span class="suffix">/ bulan</span></div></div>' +
      '<div class="field"><label>Uang Jaminan (Deposit) <span class="opt">Dapat dikembalikan</span></label><div class="input-group"><span class="prefix">Rp</span><input class="input rp" name="deposit" inputmode="numeric" data-money value="' + (k ? U.numFmt(k.deposit) : '') + '" placeholder="500.000"></div></div>' +
    '</div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('list', 'ic-sm') + '</div><div><div class="t">Status & Inventaris</div><div class="s">Kondisi fisik unit</div></div></div>' +
      (terisi ? '<div class="banner mb-16">' + ic('lock', 'ic-sm') + '<div>Kamar sedang <b>Terisi</b>. Status berubah otomatis saat kontrak berakhir.</div></div>'
        : '<div class="grid-2 mb-16" id="status-pick">' +
          '<button type="button" class="fac ' + (F.status === 'Tersedia' ? 'on' : '') + '" data-v="Tersedia" style="flex-direction:column;align-items:flex-start;padding:12px;min-height:72px">' + ic('checkCircle', 'ic-sm') + '<span>Siap Huni<br><small style="font-weight:500;opacity:.8">Kosong & bersih</small></span></button>' +
          '<button type="button" class="fac ' + (F.status === 'Perbaikan' ? 'on' : '') + '" data-v="Perbaikan" style="flex-direction:column;align-items:flex-start;padding:12px;min-height:72px">' + ic('wrench', 'ic-sm') + '<span>Maintenance<br><small style="font-weight:500;opacity:.8">Perbaikan pending</small></span></button></div>') +
      '<div class="field"><label>Catatan Inventaris & Teknis <span class="opt">Opsional</span></label><textarea class="textarea" name="catatan" maxlength="500" placeholder="Contoh: Meteran awal PLN 3.420 kWh. Remot AC disimpan di laci meja.">' + U.esc(k ? k.catatan : '') + '</textarea></div>' +
    '</div>' +
    '</div></div>' +
    (k && D.owner() && !terisi ? '<button type="button" class="btn btn-danger btn-block mb-16" id="kamar-hapus">' + ic('trash') + 'Hapus Kamar Ini</button>' : '') +
    '<div class="form-actions"><button type="button" class="btn btn-ghost" data-go="#/kamar">Batal</button><button type="submit" class="btn btn-primary">' + ic('check') + 'Simpan Unit Kamar</button></div>' +
    '</form>'
  );

  const form = document.getElementById('kamar-form');
  pasangUangInput(form);
  segmen(document.getElementById('seg-lantai'), v => { F.lantai = v; });
  segmen(document.getElementById('seg-tipe'), v => { F.tipe = v; });
  const sp = document.getElementById('status-pick');
  if (sp) sp.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; F.status = b.dataset.v; sp.querySelectorAll('.fac').forEach(x => x.classList.toggle('on', x === b)); });

  const renderFas = () => {
    document.getElementById('fac-grid').innerHTML = semuaFas.map(f => '<button type="button" class="fac ' + (F.fas.includes(f) ? 'on' : '') + '" data-f="' + U.esc(f) + '">' + ic(F.fas.includes(f) ? 'check' : (FAS_ICON[f] || 'plus'), 'ic-sm') + '<span class="ellipsis">' + U.esc(f) + '</span></button>').join('');
  };
  renderFas();
  document.getElementById('fac-grid').addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const f = b.dataset.f;
    F.fas = F.fas.includes(f) ? F.fas.filter(x => x !== f) : F.fas.concat(f);
    renderFas();
  });
  document.getElementById('fas-add').onclick = () => {
    const i = document.getElementById('fas-baru'); const v = i.value.trim();
    if (!v) return;
    if (!semuaFas.includes(v)) semuaFas.push(v);
    if (!F.fas.includes(v)) F.fas.push(v);
    i.value = ''; renderFas();
  };

  const renderFoto = () => {
    const box = document.getElementById('foto-box');
    if (F.foto) box.innerHTML = '<div class="upload-preview"><img src="' + F.foto.data + '" alt=""><button type="button" class="btn btn-danger btn-sm btn-icon rm" id="foto-rm" aria-label="Hapus foto">' + ic('trash', 'ic-sm') + '</button></div>';
    else if (k && k.id_foto_kamar) box.innerHTML = '<div class="upload-preview"><img data-img="' + U.esc(k.id_foto_kamar) + '" alt=""><button type="button" class="btn btn-secondary btn-sm rm" id="foto-ganti">' + ic('camera', 'ic-sm') + 'Ganti</button></div>';
    else box.innerHTML = '<div class="upload" id="foto-pick">' + ic('camera') + '<b>+ Tambah Foto</b><span class="small">JPG/PNG, dikompres otomatis</span></div>';
    App.hydrate(box);
  };
  renderFoto();
  document.getElementById('foto-box').addEventListener('click', async e => {
    if (e.target.closest('#foto-rm')) { F.foto = null; renderFoto(); return; }
    if (e.target.closest('#foto-pick') || e.target.closest('#foto-ganti')) { const f = await pilihBerkas('image/*'); if (f) { F.foto = f; renderFoto(); } }
  });

  const hb = document.getElementById('kamar-hapus');
  if (hb) hb.onclick = async () => {
    if (await U.confirm({ title: 'Hapus Kamar ' + U.esc(k.nomor_kamar) + '?', message: 'Data kamar dan fotonya akan dihapus permanen.', ok: 'Hapus', danger: true })) {
      if (await App.run('hapusKamar', { id_kamar: k.id_kamar })) App.go('#/kamar');
    }
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!String(fd.get('nomor_kamar')).trim()) return U.toast('Nomor kamar wajib diisi.', 'error');
    if (!U.parseNum(fd.get('harga_sewa'))) return U.toast('Tarif sewa wajib diisi.', 'error');
    const r = await App.run('simpanKamar', {
      id_kamar: k ? k.id_kamar : '', nomor_kamar: fd.get('nomor_kamar'), lantai: F.lantai, tipe: F.tipe, tipe_unit: fd.get('tipe_unit'), luas: fd.get('luas'),
      fasilitas: F.fas, harga_sewa: U.parseNum(fd.get('harga_sewa')), deposit: U.parseNum(fd.get('deposit')), status: F.status, catatan: fd.get('catatan'),
      foto: F.foto ? F.foto.data : ''
    }, { busy: F.foto ? 'Mengunggah foto & menyimpan...' : 'Menyimpan...' });
    if (r) App.go('#/kamar');
  });
}

/* Helper form */
function segmen(el, onChange) {
  if (!el) return;
  el.addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    el.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
    onChange(b.dataset.v);
  });
}

function pasangUangInput(root) {
  root.querySelectorAll('[data-money]').forEach(inp => {
    inp.addEventListener('input', () => {
      const n = U.parseNum(inp.value);
      inp.value = n ? U.numFmt(n) : '';
    });
  });
}

/* ============================================================
   PENGHUNI
   ============================================================ */
Pages.penghuni = (args, q) => {
  if (args[0] === 'baru') return penghuniForm(null, q);
  if (args[0] === 'edit') return penghuniForm(args[1], q);
  if (args[0]) return penghuniDetail(args[0]);
  if (q.f) UI.penghuniF = q.f;

  const all = App.S.penghuni || [];
  const aktif = all.filter(p => p.status === 'Aktif');
  const sts = aktif.map(p => D.status(p));
  const cnt = k => sts.filter(s => s.kind === k).length;
  const ringkas = App.S.ringkasan || {};
  view(
    '<div class="page-head"><div class="row"><h1 class="h-xl">Data Penghuni</h1><span class="chip chip-primary">' + aktif.length + ' Aktif</span></div>' +
    '<button class="btn btn-primary btn-pill" data-go="#/penghuni/baru">' + ic('userPlus') + '<span>Tambah</span></button></div>' +
    '<div class="input-icon mb-12">' + ic('search') + '<input class="input" id="ph-q" placeholder="Cari nama, kamar, no. WA, atau no. KTP..." value="' + U.esc(UI.penghuniQ) + '"></div>' +
    filterChips([
      { id: 'semua', label: 'Aktif', n: aktif.length },
      { id: 'lunas', label: 'Lunas', n: cnt('lunas'), dot: '#16A34A' },
      { id: 'menunggak', label: 'Menunggak', n: cnt('menunggak'), dot: '#DC2626' },
      { id: 'jatuh', label: 'Jatuh Tempo', n: cnt('jatuh') + cnt('segera'), dot: '#F2B544' },
      { id: 'keluar', label: 'Riwayat Keluar', n: all.length - aktif.length }
    ], UI.penghuniF, 'penghuniFilter') +
    '<div id="ph-list" class="grid-cards three"></div>' +
    '<div class="card-flat mt-16" style="padding:16px"><div class="row-between mb-12"><div class="h-sm">Rekapitulasi Penghuni</div><span class="small muted">Update: Hari Ini</span></div>' +
    '<div class="grid-3"><div class="card center" style="padding:12px"><div class="h-lg c-primary">' + cnt('lunas') + '</div><div class="small semi">Lunas</div></div>' +
    '<div class="card center" style="padding:12px"><div class="h-lg c-danger">' + cnt('menunggak') + '</div><div class="small semi">Tunggakan</div></div>' +
    '<div class="card center" style="padding:12px"><div class="h-lg c-amber">' + (cnt('jatuh') + cnt('segera')) + '</div><div class="small semi">Jatuh Tempo</div></div></div>' +
    '<div class="small muted center mt-12">Kapasitas terisi ' + ringkas.terisi + ' dari ' + ringkas.total + ' unit (' + (ringkas.total ? Math.round(ringkas.terisi / ringkas.total * 100) : 0) + '% okupansi).</div></div>'
  );
  const inp = document.getElementById('ph-q');
  inp.addEventListener('input', U.debounce(() => { UI.penghuniQ = inp.value; renderPenghuniList(); }, 120));
  renderPenghuniList();
};

Act.penghuniFilter = el => { UI.penghuniF = el.dataset.f; history.replaceState(null, '', '#/penghuni'); Pages.penghuni([], {}); };

function renderPenghuniList() {
  const q = U.norm(UI.penghuniQ);
  const f = UI.penghuniF;
  const list = (App.S.penghuni || []).filter(p => {
    if (f === 'keluar') { if (p.status === 'Aktif') return false; }
    else {
      if (p.status !== 'Aktif') return false;
      const st = D.status(p);
      if (f === 'lunas' && st.kind !== 'lunas') return false;
      if (f === 'menunggak' && st.kind !== 'menunggak') return false;
      if (f === 'jatuh' && !['jatuh', 'segera'].includes(st.kind)) return false;
    }
    if (!q) return true;
    const k = D.kamar(p.id_kamar) || {};
    return U.norm([p.nama, p.no_wa, p.no_ktp, k.nomor_kamar, 'kamar ' + k.nomor_kamar].join(' ')).includes(q);
  }).sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  const el = document.getElementById('ph-list');
  el.innerHTML = list.length ? list.map(penghuniCard).join('')
    : '<div class="card" style="grid-column:1/-1">' + emptyState('users', 'Tidak ada penghuni', q ? 'Tidak ditemukan untuk kata kunci tersebut.' : 'Belum ada data di kategori ini.') + '</div>';
}

function penghuniCard(p) {
  const k = D.kamar(p.id_kamar) || {};
  const kt = D.kontrakAktifPenghuni(p.id_penghuni);
  const st = D.status(p);
  const id = encodeURIComponent(p.id_penghuni);
  const aksiBayar = st.kind === 'lunas'
    ? '<button class="btn btn-ghost btn-sm" data-go="#/penghuni/' + id + '">' + ic('history', 'ic-sm') + 'Riwayat</button>'
    : '<button class="btn btn-primary btn-sm" data-act="catatBayar" data-pid="' + p.id_penghuni + '">' + ic('receipt', 'ic-sm') + 'Catat Bayar</button>';
  return '<div class="card"><div class="row row-top"><div class="avatar ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow">' +
    '<div class="row-between row-top"><div class="h-sm ellipsis">' + U.esc(p.nama) + '</div><span class="chip ' + st.cls + '">' + ic(st.kind === 'lunas' ? 'checkCircle' : st.kind === 'menunggak' ? 'alert' : st.kind === 'keluar' ? 'logout' : 'clock') + U.esc(st.label) + '</span></div>' +
    '<span class="tag mt-8">' + ic('bed', 'ic-xs') + 'Kamar ' + U.esc(k.nomor_kamar || '-') + (k.lantai ? ' (Lt ' + U.esc(k.lantai) + ')' : '') + '</span></div></div>' +
    '<div class="card-flat mt-12"><div class="kv">' +
    '<div><div class="k">Nomor WhatsApp</div><div class="v num">' + U.waFmt(p.no_wa) + '</div></div>' +
    (st.kind === 'menunggak' || st.kind === 'jatuh' || st.kind === 'segera'
      ? '<div><div class="k">Tagihan Tertunda</div><div class="v rp ' + (st.kind === 'menunggak' ? 'c-danger' : 'c-amber') + '" style="font-size:16px">' + U.rp(st.total) + '</div></div>'
      : '<div><div class="k">Tarif Sewa</div><div class="v rp" style="font-size:16px">' + (kt ? U.rp(kt.harga_sewa) + '<span class="small muted">/bln</span>' : '-') + '</div></div>') +
    '<div><div class="k">Jatuh Tempo</div><div class="v">' + (kt ? 'Tgl ' + kt.tanggal_tagih + ' setiap bulan' : (p.status === 'Aktif' ? '-' : 'Kontrak selesai')) + '</div></div>' +
    '<div><div class="k">Identitas</div><div class="v small row ' + (p.id_file_ktp ? 'c-primary' : 'c-amber') + '">' + ic(p.id_file_ktp ? 'shield' : 'alert', 'ic-sm') + (p.id_file_ktp ? 'KTP Terunggah' : 'KTP Belum Ada') + '</div></div>' +
    '</div></div>' +
    '<div class="btn-row mt-12">' + (p.status === 'Aktif' && st.kind !== 'lunas' ? '<button class="btn btn-ghost btn-sm" data-act="kirimPengingat" data-id="' + p.id_penghuni + '">' + ic('wa', 'ic-sm') + 'Pengingat</button>' : '<a class="btn btn-ghost btn-sm" href="https://wa.me/' + U.esc(p.no_wa) + '" target="_blank" rel="noopener">' + ic('chat', 'ic-sm') + 'Chat WA</a>') +
    (p.status === 'Aktif' ? aksiBayar : '') + '<button class="btn btn-ghost btn-sm btn-icon" data-go="#/penghuni/' + id + '" aria-label="Detail">' + ic('right', 'ic-sm') + '</button></div></div>';
}

/* ---------- Detail penghuni ---------- */
function penghuniDetail(id) {
  const p = D.penghuni(id);
  if (!p) { view(emptyState('alert', 'Penghuni tidak ditemukan', '', '<button class="btn btn-primary" data-go="#/penghuni">Kembali</button>')); return; }
  const k = D.kamar(p.id_kamar) || {};
  const kt = D.kontrakAktifPenghuni(p.id_penghuni) || D.kontrakTerakhirPenghuni(p.id_penghuni);
  const st = D.status(p);
  const sisaHari = kt ? U.diff(U.today(), kt.tanggal_keluar) : 0;
  const owner = D.owner();

  view(
    '<button class="link-btn mt-8" data-go="#/penghuni">' + ic('arrowLeft', 'ic-sm') + 'Data Penghuni</button>' +
    '<div class="two-col mt-8"><div>' +
    '<div class="card"><div class="row"><div class="avatar lg ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow"><div class="h-lg">' + U.esc(p.nama) + '</div>' +
      '<div class="row wrap mt-8"><span class="chip ' + st.cls + '">' + U.esc(st.label) + '</span><span class="tag">' + ic('bed', 'ic-xs') + 'Kamar ' + U.esc(k.nomor_kamar || '-') + '</span></div></div></div>' +
      '<div class="kv mt-16">' +
      '<div><div class="k">WhatsApp</div><div class="v num">' + U.waFmt(p.no_wa) + '</div></div>' +
      '<div><div class="k">NIK</div><div class="v num">' + U.esc(p.no_ktp) + '</div></div>' +
      '<div><div class="k">Pekerjaan</div><div class="v">' + U.esc(p.pekerjaan || '-') + '</div></div>' +
      '<div><div class="k">Email</div><div class="v">' + U.esc(p.email || '-') + '</div></div>' +
      '<div style="grid-column:span 2"><div class="k">Alamat Asal</div><div class="v">' + U.esc(p.alamat_asal || '-') + '</div></div>' +
      '<div style="grid-column:span 2"><div class="k">Kontak Darurat</div><div class="v">' + U.esc(p.kontak_darurat_nama || '-') + (p.kontak_darurat_hubungan ? ' (' + U.esc(p.kontak_darurat_hubungan) + ')' : '') + (p.kontak_darurat_telp ? ' · ' + U.esc(p.kontak_darurat_telp) : '') + '</div></div>' +
      '</div>' +
      '<div class="btn-row mt-16"><a class="btn btn-secondary btn-sm" href="https://wa.me/' + U.esc(p.no_wa) + '" target="_blank" rel="noopener">' + ic('chat', 'ic-sm') + 'Chat WA</a>' +
      (p.id_file_ktp ? '<button class="btn btn-ghost btn-sm" data-act="lihatBerkas" data-id="' + U.esc(p.id_file_ktp) + '" data-title="Foto KTP">' + ic('idcard', 'ic-sm') + 'Lihat KTP</button>' : '<span class="btn btn-ghost btn-sm" style="opacity:.6">' + ic('alert', 'ic-sm') + 'KTP belum ada</span>') +
      '<button class="btn btn-ghost btn-sm btn-icon" data-go="#/penghuni/edit/' + encodeURIComponent(p.id_penghuni) + '" aria-label="Ubah">' + ic('pencil', 'ic-sm') + '</button></div>' +
    '</div>' +

    (kt ? '<div class="card accent-left ' + (kt.status !== 'Aktif' ? 'muted' : sisaHari <= 30 ? 'amber' : '') + '"><div class="row-between"><div class="eyebrow">' + ic('file', 'ic-sm') + 'Kontrak ' + (kt.status === 'Aktif' ? 'Aktif' : 'Selesai') + '</div>' +
      (kt.status === 'Aktif' ? '<span class="chip ' + (sisaHari <= 30 ? 'chip-amber' : 'chip-primary') + '">Sisa ' + Math.max(0, sisaHari) + ' hari</span>' : '<span class="chip">Selesai</span>') + '</div>' +
      '<div class="kv mt-12"><div><div class="k">Periode</div><div class="v">' + U.tgl(kt.tanggal_masuk) + ' – ' + U.tgl(kt.tanggal_keluar) + '</div></div>' +
      '<div><div class="k">Durasi</div><div class="v">' + kt.durasi_bulan + ' bulan</div></div>' +
      '<div><div class="k">Tarif</div><div class="v rp">' + U.rp(kt.harga_sewa) + '/bln</div></div>' +
      '<div><div class="k">Deposit</div><div class="v rp">' + U.rp(kt.deposit) + '</div></div>' +
      '<div><div class="k">Jatuh Tempo</div><div class="v">Tgl ' + kt.tanggal_tagih + ' tiap bulan</div></div>' +
      '<div><div class="k">Surat</div><div class="v small">' + (kt.id_file_surat_pdf ? U.esc(kt.nomor_surat || 'Tersedia') : 'Belum dibuat') + '</div></div></div>' +
      '<div class="btn-row wrap mt-16">' +
      (kt.id_file_surat_pdf ? '<button class="btn btn-ghost btn-sm" data-act="lihatBerkas" data-id="' + U.esc(kt.id_file_surat_pdf) + '" data-title="Surat Perjanjian">' + ic('eye', 'ic-sm') + 'Lihat Surat</button>' : '<button class="btn btn-secondary btn-sm" data-go="#/surat?kontrak=' + encodeURIComponent(kt.id_kontrak) + '">' + ic('filePlus', 'ic-sm') + 'Buat Surat</button>') +
      '<button class="btn btn-ghost btn-sm" data-act="perpanjang" data-id="' + kt.id_kontrak + '">' + ic('repeat', 'ic-sm') + 'Perpanjang</button>' +
      (kt.status === 'Aktif' ? '<button class="btn btn-danger btn-sm" data-act="akhiriKontrak" data-id="' + kt.id_kontrak + '">' + ic('logout', 'ic-sm') + 'Checkout</button>' : '') +
      '</div></div>' : '') +
    (owner && p.status !== 'Aktif' ? '<button class="btn btn-danger btn-block mt-12" data-act="hapusPenghuni" data-id="' + p.id_penghuni + '">' + ic('trash') + 'Hapus Data Penghuni</button>' : '') +
    '</div><div>' +

    (st.items.length ? '<div class="card"><div class="card-head"><div class="card-title">' + ic('alert') + 'Tagihan Tertunda</div><span class="money c-danger">' + U.rp(st.total) + '</span></div>' +
      st.items.map(t => '<div class="list-item"><div class="grow"><div class="semi">' + U.bulan(t.periode) + '</div><div class="small muted">Jatuh tempo ' + U.tgl(t.jatuh_tempo) + (t.dibayar ? ' · dibayar ' + U.rp(t.dibayar) : '') + '</div></div><div class="right"><div class="semi rp">' + U.rp(t.sisa) + '</div>' + kategoriChip(t) + '</div></div>').join('') +
      '<div class="btn-row mt-12"><button class="btn btn-secondary" data-act="kirimPengingat" data-id="' + p.id_penghuni + '">' + ic('send', 'ic-sm') + 'Pengingat</button><button class="btn btn-primary" data-act="catatBayar" data-pid="' + p.id_penghuni + '">' + ic('receipt', 'ic-sm') + 'Catat Bayar</button></div></div>' : '') +

    '<div class="card"><div class="card-head"><div class="card-title">' + ic('history') + 'Riwayat Pembayaran</div>' + (p.status === 'Aktif' && !st.items.length ? '<button class="btn btn-secondary btn-sm" data-act="catatBayar" data-pid="' + p.id_penghuni + '">' + ic('plus', 'ic-sm') + 'Catat</button>' : '') + '</div>' +
    '<div id="riwayat-bayar"><div class="skeleton" style="height:56px"></div><div class="skeleton mt-8" style="height:56px"></div></div></div>' +
    '</div></div>'
  );

  Api.call('detailPenghuni', { id_penghuni: p.id_penghuni }).then(r => {
    const el = document.getElementById('riwayat-bayar');
    if (!el) return;
    const list = r.detail.pembayaran;
    el.innerHTML = list.length ? list.map(b => '<div class="tx"><div class="icon-box sm">' + ic(b.metode === 'Tunai' ? 'cash' : 'bank', 'ic-sm') + '</div><div class="grow"><div class="semi">' + U.bulan(b.periode) + ' <span class="chip ' + (b.status === 'Lunas' ? 'chip-success' : 'chip-amber') + '">' + b.status + '</span></div>' +
      '<div class="small muted">' + U.tgl(b.tanggal_bayar) + ' · ' + U.esc(b.metode) + ' · oleh ' + U.esc(b.dicatat_oleh) + '</div></div><div class="right"><div class="amt in">' + U.rp(b.jumlah) + '</div>' +
      '<div class="row" style="justify-content:flex-end;gap:2px">' + (b.id_file_bukti ? '<button class="icon-btn" style="width:30px;height:30px" data-act="lihatBerkas" data-id="' + U.esc(b.id_file_bukti) + '" data-title="Bukti Pembayaran" aria-label="Lihat bukti">' + ic('eye', 'ic-sm') + '</button>' : '') +
      (owner ? '<button class="icon-btn" style="width:30px;height:30px;color:var(--danger-text)" data-act="hapusBayar" data-id="' + b.id_bayar + '" aria-label="Hapus">' + ic('trash', 'ic-sm') + '</button>' : '') + '</div></div></div>').join('')
      : emptyState('receipt', 'Belum ada pembayaran', 'Pembayaran yang dicatat akan muncul di sini.');
  }).catch(e => { const el = document.getElementById('riwayat-bayar'); if (el) el.innerHTML = '<div class="banner danger">' + ic('alert') + U.esc(e.message) + '</div>'; });
}

Act.perpanjang = el => {
  const kt = D.kontrak(el.dataset.id);
  let bulan = 6;
  const s = U.sheet({
    title: 'Perpanjang Kontrak', sub: 'Berakhir saat ini: ' + U.tglPanjang(kt.tanggal_keluar), size: 'sm',
    body: '<div class="field"><label>Tambah masa sewa</label><div class="seg light" id="seg-pp">' + [1, 3, 6, 12].map(b => '<button type="button" data-v="' + b + '" class="' + (b === 6 ? 'active' : '') + '">' + b + ' Bln</button>').join('') + '</div></div>' +
      '<div class="banner" id="pp-info"></div>',
    foot: '<button class="btn btn-ghost" data-x>Batal</button><button class="btn btn-primary" data-ok>' + ic('repeat', 'ic-sm') + 'Perpanjang</button>'
  });
  const info = () => { s.q('#pp-info').innerHTML = ic('calendar', 'ic-sm') + '<div>Kontrak baru berakhir <b>' + U.tglPanjang(U.addMonths(kt.tanggal_keluar, bulan)) + '</b>. Buat ulang surat bila perlu addendum.</div>'; };
  info();
  segmen(s.q('#seg-pp'), v => { bulan = Number(v); info(); });
  s.q('[data-x]').onclick = () => s.close();
  s.q('[data-ok]').onclick = async () => { const r = await App.run('perpanjangKontrak', { id_kontrak: kt.id_kontrak, bulan: bulan }); if (r) { s.close(); App.refresh(); } };
};

Act.akhiriKontrak = el => {
  const kt = D.kontrak(el.dataset.id);
  const p = D.penghuni(kt.id_penghuni) || {};
  const st = D.status(p);
  const s = U.sheet({
    title: 'Checkout Penghuni', sub: U.esc(p.nama) + ' · Kamar ' + U.esc((D.kamar(kt.id_kamar) || {}).nomor_kamar || '-'), size: 'sm',
    body: (st.total ? '<div class="banner danger mb-12">' + ic('alert') + '<div>Masih ada tagihan tertunda <b>' + U.rp(st.total) + '</b>. Tunggakan tetap tercatat di laporan.</div></div>' : '') +
      '<div class="field"><label>Tanggal keluar</label><input type="date" class="input" id="tgl-keluar" value="' + U.today() + '"></div>' +
      '<div class="banner">' + ic('info', 'ic-sm') + '<div>Kontrak menjadi <b>Selesai</b>, kamar kembali <b>Tersedia</b>, dan status penghuni menjadi <b>Keluar</b>. Kembalikan deposit ' + U.rp(kt.deposit) + ' sesuai kondisi kamar.</div></div>',
    foot: '<button class="btn btn-ghost" data-x>Batal</button><button class="btn btn-danger" data-ok>' + ic('logout', 'ic-sm') + 'Akhiri Kontrak</button>'
  });
  s.q('[data-x]').onclick = () => s.close();
  s.q('[data-ok]').onclick = async () => { const r = await App.run('akhiriKontrak', { id_kontrak: kt.id_kontrak, tanggal: s.q('#tgl-keluar').value }); if (r) { s.close(); App.refresh(); } };
};

Act.hapusPenghuni = async el => {
  const p = D.penghuni(el.dataset.id);
  if (await U.confirm({ title: 'Hapus ' + U.esc(p.nama) + '?', html: 'Data pribadi dan foto KTP akan dihapus permanen. <b>Riwayat pembayaran tetap tersimpan</b> untuk laporan keuangan.', ok: 'Hapus Permanen', danger: true })) {
    if (await App.run('hapusPenghuni', { id_penghuni: p.id_penghuni })) App.go('#/penghuni');
  }
};

Act.hapusBayar = async el => {
  if (await U.confirm({ title: 'Hapus catatan pembayaran?', message: 'Tagihan periode tersebut akan kembali tercatat belum lunas.', ok: 'Hapus', danger: true })) {
    if (await App.run('hapusBayar', { id_bayar: el.dataset.id })) App.refresh();
  }
};

/* ---------- Form penghuni (baru / ubah) ---------- */
function penghuniForm(id, q) {
  const p = id ? D.penghuni(id) : null;
  if (id && !p) { view(emptyState('alert', 'Penghuni tidak ditemukan', '')); return; }
  const tersedia = (App.S.kamar || []).filter(k => k.status === 'Tersedia');
  const F = { ktp: null, durasi: 1, kamar: q && q.kamar && D.kamar(q.kamar) && D.kamar(q.kamar).status === 'Tersedia' ? q.kamar : (tersedia[0] ? tersedia[0].id_kamar : '') };
  const v = f => U.esc(p ? p[f] : '');
  const today = U.today();

  const kontrakSection = p ? '' :
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('door', 'ic-sm') + '</div><div class="grow"><div class="t">Kamar & Kontrak Sewa</div><div class="s">Tentukan unit, tanggal masuk, dan biaya</div></div><span class="chip chip-primary">Langkah 2</span></div>' +
    (tersedia.length ? '' : '<div class="banner amber mb-16">' + ic('alert') + '<div>Tidak ada kamar tersedia. <a href="#/kamar/baru">Tambah kamar</a> atau tandai kamar selesai perbaikan.</div></div>') +
    '<div class="field"><label>Pilih Unit Kamar <span class="req">*</span></label><select class="select" name="id_kamar" id="f-kamar">' +
      (tersedia.length ? tersedia.map(k => '<option value="' + k.id_kamar + '" ' + (k.id_kamar === F.kamar ? 'selected' : '') + '>Kamar ' + U.esc(k.nomor_kamar) + (k.lantai ? ' (Lantai ' + U.esc(k.lantai) + ')' : '') + ' – ' + U.esc(k.tipe_unit || k.tipe) + ' • ' + U.rp(k.harga_sewa) + '</option>').join('') : '<option value="">— Tidak ada kamar tersedia —</option>') + '</select></div>' +
    '<div class="form-grid two"><div class="field"><label>Tanggal Mulai Masuk <span class="req">*</span></label><input type="date" class="input" name="tanggal_masuk" id="f-masuk" value="' + today + '" required></div>' +
    '<div class="field"><label>Jatuh Tempo Rutin</label><select class="select" name="tanggal_tagih" id="f-tagih">' + Array.from({ length: 28 }, (_, i) => i + 1).map(d => '<option value="' + d + '" ' + (d === Number(today.slice(8, 10)) || (Number(today.slice(8, 10)) > 28 && d === 28) ? 'selected' : '') + '>Tanggal ' + d + ' setiap bulan</option>').join('') + '</select></div></div>' +
    '<div class="field"><label>Periode Sewa</label><div class="seg" id="seg-durasi">' + [[1, 'Bulanan'], [3, '3 Bulan'], [6, '6 Bulan'], [12, '1 Tahun']].map(d => '<button type="button" data-v="' + d[0] + '" class="' + (d[0] === 1 ? 'active' : '') + '">' + d[1] + '</button>').join('') + '</div></div>' +
    '<div class="form-grid two"><div class="field"><label>Tarif Sewa / Bulan</label><div class="input-group"><span class="prefix">Rp</span><input class="input rp" name="harga_sewa" id="f-harga" data-money inputmode="numeric"></div></div>' +
    '<div class="field"><label>Uang Jaminan / Deposit</label><div class="input-group"><span class="prefix">Rp</span><input class="input rp" name="deposit" id="f-deposit" data-money inputmode="numeric"></div></div></div>' +
    '<div class="card-tint mb-16"><div class="row-between mb-8"><div class="row semi small">' + ic('receipt', 'ic-sm') + 'Kalkulasi Pembayaran Awal</div><span class="xs c-primary">AUTO</span></div>' +
    '<div class="row-between small"><span class="muted">Sewa kamar (bulan pertama)</span><span class="semi rp" id="calc-sewa">-</span></div>' +
    '<div class="row-between small mt-8"><span class="muted">Uang jaminan / deposit</span><span class="semi rp" id="calc-dep">-</span></div>' +
    '<div class="row-between mt-12" style="border-top:1px dashed var(--primary-soft);padding-top:10px"><span class="bold c-primary">Total Bayar Pertama</span><span class="money c-primary" id="calc-total">-</span></div>' +
    '<div class="small muted mt-8" id="calc-akhir"></div></div>' +
    '</div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('sign', 'ic-sm') + '</div><div><div class="t">Persetujuan & Integrasi</div><div class="s">Legalitas data & otomasi setelah disimpan</div></div></div>' +
      cek('persetujuan_data', true, 'Persetujuan Data Pribadi (UU PDP) <span class="req">*</span>', 'Calon penghuni menyetujui pengumpulan nama, NIK, foto KTP, dan kontak untuk keperluan administrasi sewa. Data tidak dibagikan ke pihak lain.') +
      cek('tata_tertib', true, 'Tata Tertib Hunian Disetujui', 'Penghuni telah membaca aturan kost (jam malam tamu ' + U.esc(D.set().jam_malam || '22:00') + ', larangan, keamanan).') +
      cek('bayar_pertama', false, 'Catat Pembayaran Bulan Pertama Sekarang', 'Tandai sewa bulan pertama sudah dibayar (tunai/transfer) saat check-in.') +
      cek('buat_surat', true, 'Buat Draf Surat Perjanjian Sewa (PDF)', 'Dibuat otomatis dari template aktif dan tersimpan di Drive.') +
      cek('kirim_welcome', !!D.set().wa_token_terpasang, 'Kirim Pesan Selamat Datang via WhatsApp', D.set().wa_token_terpasang ? 'Info kamar, tagihan, & rekening dikirim ke nomor penghuni.' : 'Token WhatsApp belum diatur Owner — opsi ini akan gagal.') +
      '<div class="mb-16"></div>' +
    '</div>';

  view(
    '<button class="link-btn mt-8" data-go="' + (p ? '#/penghuni/' + encodeURIComponent(p.id_penghuni) : '#/penghuni') + '">' + ic('arrowLeft', 'ic-sm') + 'Kembali</button>' +
    '<div class="page-head"><div><h1 class="h-xl">' + (p ? 'Ubah Data Penghuni' : 'Tambah Penghuni Baru') + '</h1><p>' + (p ? U.esc(p.nama) : 'Formulir pendaftaran, verifikasi NIK, & alokasi kamar kost') + '</p></div></div>' +
    (p ? '' : '<div class="steps"><div class="step on"><span class="n">1</span>Data Diri & KTP</div><div class="step-line"></div><div class="step on"><span class="n">2</span>Kamar & Biaya</div><div class="step-line"></div><div class="step on"><span class="n">3</span>Persetujuan</div></div>') +
    '<form id="ph-form" novalidate><div class="two-col"><div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('idcard', 'ic-sm') + '</div><div class="grow"><div class="t">Informasi Pribadi</div><div class="s">Data lengkap penghuni sesuai kartu identitas</div></div><span class="chip chip-success">Wajib</span></div>' +
      '<div class="field"><label>Nama Lengkap (Sesuai KTP) <span class="req">*</span></label><div class="input-icon">' + ic('user') + '<input class="input" name="nama" maxlength="100" required value="' + v('nama') + '" placeholder="Nama lengkap"></div></div>' +
      '<div class="field"><label>Nomor Induk Kependudukan (NIK) <span class="req">*</span><span id="nik-ok"></span></label><div class="input-icon">' + ic('hash') + '<input class="input num" name="no_ktp" id="f-nik" inputmode="numeric" maxlength="16" required value="' + v('no_ktp') + '" placeholder="16 digit angka"></div></div>' +
      '<div class="field"><label>Nomor WhatsApp Aktif <span class="req">*</span></label><div class="input-group"><span class="prefix">+62</span><input class="input num" name="no_wa" id="f-wa" inputmode="tel" required value="' + (p ? U.esc(String(p.no_wa).replace(/^62/, '')) : '') + '" placeholder="81234567890"></div>' +
      '<div class="hint">' + ic('info', 'ic-xs') + 'Notifikasi tagihan bulanan dikirim ke nomor ini.</div></div>' +
      '<div class="form-grid two"><div class="field"><label>Email <span class="opt">Opsional</span></label><input type="email" class="input" name="email" maxlength="100" value="' + v('email') + '" placeholder="nama@email.com"></div>' +
      '<div class="field"><label>Pekerjaan <span class="opt">Opsional</span></label><input class="input" name="pekerjaan" maxlength="80" value="' + v('pekerjaan') + '" placeholder="Mahasiswa / Karyawan"></div></div>' +
      '<div class="field"><label>Alamat Asal <span class="opt">Opsional</span></label><input class="input" name="alamat_asal" maxlength="300" value="' + v('alamat_asal') + '" placeholder="Alamat sesuai KTP"></div>' +
      '<div class="card-flat mb-16"><div class="row semi small mb-12">' + ic('alert', 'ic-sm') + 'Kontak Darurat (Keluarga / Kerabat)</div>' +
      '<div class="form-grid two"><div class="field"><label>Nama Kontak</label><input class="input" name="kontak_darurat_nama" maxlength="80" value="' + v('kontak_darurat_nama') + '"></div>' +
      '<div class="field"><label>Hubungan</label><select class="select" name="kontak_darurat_hubungan">' + ['', 'Ayah', 'Ibu', 'Saudara', 'Pasangan', 'Kerabat', 'Teman', 'Lainnya'].map(h => '<option ' + (p && p.kontak_darurat_hubungan === h ? 'selected' : '') + ' value="' + h + '">' + (h || '— Pilih —') + '</option>').join('') + '</select></div></div>' +
      '<div class="field" style="margin-bottom:0"><label>Nomor Telepon Darurat</label><input class="input num" name="kontak_darurat_telp" inputmode="tel" maxlength="16" value="' + v('kontak_darurat_telp') + '"></div></div>' +
    '</div>' +
    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('shield', 'ic-sm') + '</div><div class="grow"><div class="t">Verifikasi Identitas (KTP)</div><div class="s">Tersimpan privat di Google Drive pemilik</div></div></div>' +
      '<div id="ktp-box" class="field"></div>' +
      '<div class="grid-2 mb-12"><button type="button" class="btn btn-ghost" id="ktp-cam">' + ic('camera', 'ic-sm') + 'Kamera KTP</button><button type="button" class="btn btn-ghost" id="ktp-gal">' + ic('upload', 'ic-sm') + 'Pilih dari Galeri</button></div>' +
      '<div class="banner mb-16">' + ic('lock', 'ic-sm') + '<div>Foto KTP dikompres otomatis (maks 2 MB), hanya untuk legalitas sewa, dan tidak memiliki tautan publik.</div></div>' +
    '</div>' +
    '</div><div>' + kontrakSection + '</div></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-ghost" data-go="' + (p ? '#/penghuni/' + encodeURIComponent(p.id_penghuni) : '#/penghuni') + '">Batal</button><button type="submit" class="btn btn-primary">' + (p ? ic('check') + 'Simpan Perubahan' : 'Simpan Penghuni ' + ic('arrowRight')) + '</button></div>' +
    '</form>'
  );

  const form = document.getElementById('ph-form');
  pasangUangInput(form);
  const nik = document.getElementById('f-nik');
  const cekNik = () => {
    nik.value = nik.value.replace(/\D/g, '').slice(0, 16);
    document.getElementById('nik-ok').innerHTML = nik.value.length === 16 ? '<span class="chip chip-success">' + ic('checkCircle') + '16 Digit Valid</span>' : (nik.value ? '<span class="chip chip-amber">' + nik.value.length + '/16</span>' : '');
  };
  nik.addEventListener('input', cekNik); cekNik();

  const renderKtp = () => {
    const box = document.getElementById('ktp-box');
    if (F.ktp) box.innerHTML = '<div class="upload-preview"><img src="' + F.ktp.data + '" alt="Pratinjau KTP"><button type="button" class="btn btn-danger btn-sm btn-icon rm" id="ktp-rm" aria-label="Hapus">' + ic('trash', 'ic-sm') + '</button></div>';
    else if (p && p.id_file_ktp) box.innerHTML = '<div class="file-pill"><div class="thumb">' + ic('idcard') + '</div><div class="grow"><div class="semi">KTP sudah tersimpan</div><div class="small muted">Unggah baru untuk mengganti</div></div><button type="button" class="btn btn-ghost btn-sm" data-act="lihatBerkas" data-id="' + U.esc(p.id_file_ktp) + '" data-title="Foto KTP">' + ic('eye', 'ic-sm') + 'Lihat</button></div>';
    else box.innerHTML = '<div class="upload" id="ktp-pick">' + ic('idcard') + '<b>Unggah Foto KTP</b><span class="small">JPG/PNG • dikompres otomatis</span></div>';
  };
  renderKtp();
  const ambil = async capture => { const f = await pilihBerkas('image/*', capture); if (f) { F.ktp = f; renderKtp(); } };
  document.getElementById('ktp-cam').onclick = () => ambil(true);
  document.getElementById('ktp-gal').onclick = () => ambil(false);
  document.getElementById('ktp-box').addEventListener('click', e => {
    if (e.target.closest('#ktp-rm')) { F.ktp = null; renderKtp(); }
    if (e.target.closest('#ktp-pick')) ambil(false);
  });

  if (!p) {
    const selK = document.getElementById('f-kamar');
    const hargaI = document.getElementById('f-harga'), depI = document.getElementById('f-deposit'), masukI = document.getElementById('f-masuk');
    const isiDariKamar = () => { const k = D.kamar(selK.value); if (k) { hargaI.value = U.numFmt(k.harga_sewa); depI.value = k.deposit ? U.numFmt(k.deposit) : '0'; } hitung(); };
    const hitung = () => {
      const h = U.parseNum(hargaI.value), d = U.parseNum(depI.value);
      document.getElementById('calc-sewa').textContent = U.rp(h);
      document.getElementById('calc-dep').textContent = U.rp(d);
      document.getElementById('calc-total').textContent = U.rp(h + d);
      if (masukI.value) document.getElementById('calc-akhir').textContent = 'Kontrak ' + F.durasi + ' bulan: ' + U.tglPanjang(masukI.value) + ' s/d ' + U.tglPanjang(U.addMonths(masukI.value, F.durasi));
    };
    selK.addEventListener('change', isiDariKamar);
    [hargaI, depI, masukI].forEach(i => i.addEventListener('input', hitung));
    masukI.addEventListener('change', () => { const d = Number(masukI.value.slice(8, 10)); document.getElementById('f-tagih').value = String(Math.min(d, 28)); hitung(); });
    segmen(document.getElementById('seg-durasi'), x => { F.durasi = Number(x); hitung(); });
    isiDariKamar();
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const wa = U.waNorm('62' + String(fd.get('no_wa')).replace(/\D/g, '').replace(/^(62|0)/, ''));
    if (!String(fd.get('nama')).trim()) return U.toast('Nama lengkap wajib diisi.', 'error');
    if (String(fd.get('no_ktp')).length !== 16) return U.toast('NIK harus 16 digit.', 'error');
    if (!wa) return U.toast('Nomor WhatsApp tidak valid.', 'error');
    const data = {
      id_penghuni: p ? p.id_penghuni : '', nama: fd.get('nama'), no_ktp: fd.get('no_ktp'), no_wa: wa, email: fd.get('email'), pekerjaan: fd.get('pekerjaan'),
      alamat_asal: fd.get('alamat_asal'), kontak_darurat_nama: fd.get('kontak_darurat_nama'), kontak_darurat_hubungan: fd.get('kontak_darurat_hubungan'),
      kontak_darurat_telp: fd.get('kontak_darurat_telp'), ktp: F.ktp ? F.ktp.data : ''
    };
    if (!p) {
      if (!fd.get('id_kamar')) return U.toast('Pilih unit kamar terlebih dahulu.', 'error');
      if (!fd.get('persetujuan_data')) return U.toast('Persetujuan data pribadi (UU PDP) wajib dicentang.', 'error');
      if (!F.ktp && !(await U.confirm({ title: 'KTP belum diunggah', message: 'Lanjutkan tanpa foto KTP? Anda bisa mengunggahnya nanti lewat menu Ubah Data.', ok: 'Lanjutkan' }))) return;
      Object.assign(data, {
        persetujuan_data: true, bayar_pertama: !!fd.get('bayar_pertama'), buat_surat: !!fd.get('buat_surat'), kirim_welcome: !!fd.get('kirim_welcome'),
        kontrak: { id_kamar: fd.get('id_kamar'), tanggal_masuk: fd.get('tanggal_masuk'), durasi_bulan: F.durasi, tanggal_tagih: fd.get('tanggal_tagih'), harga_sewa: U.parseNum(fd.get('harga_sewa')), deposit: U.parseNum(fd.get('deposit')) }
      });
    }
    const r = await App.run('simpanPenghuni', data, { busy: p ? 'Menyimpan...' : 'Mendaftarkan penghuni' + (data.buat_surat ? ' & membuat surat' : '') + '...', timeout: 180000 });
    if (r) App.go('#/penghuni/' + encodeURIComponent(r.id_penghuni));
  });
}

function cek(name, checked, title, desc) {
  return '<label class="check mb-8"><input type="checkbox" name="' + name + '" ' + (checked ? 'checked' : '') + '><span class="box">' + ic('check') + '</span><span class="grow"><span class="t">' + title + '</span><span class="d" style="display:block">' + desc + '</span></span></label>';
}
