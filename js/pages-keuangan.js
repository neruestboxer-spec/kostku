/* ============================================================
   KOSTKU — Halaman: Pembayaran, Catat Bayar, Pengeluaran, Laporan
   ============================================================ */

UI.bayarBulan = null;
UI.bayarF = 'semua';
UI.outBulan = null;
UI.outList = null;
UI.lapBulan = null;
UI.lapTab = 'semua';
UI.lapQ = '';

/* ============================================================
   PEMBAYARAN SEWA
   ============================================================ */
Pages.bayar = (args, q) => {
  if (!UI.bayarBulan) UI.bayarBulan = U.today().slice(0, 7);
  if (q.m && /^\d{4}-\d{2}$/.test(q.m)) UI.bayarBulan = q.m;
  const bln = UI.bayarBulan;
  const items = (App.S.tagihan || []).filter(t => t.periode === bln);
  const ditagih = items.reduce((a, t) => a + t.harga, 0);
  const diterima = items.reduce((a, t) => a + t.dibayar, 0);
  const tertunda = items.filter(t => t.sisa > 0);
  const pct = ditagih ? Math.round(diterima / ditagih * 1000) / 10 : 0;
  const n = f => items.filter(f).length;
  const filt = {
    semua: () => true,
    lunas: t => t.sisa <= 0,
    menunggak: t => t.sisa > 0 && t.kategori === 'Menunggak',
    belum: t => t.sisa > 0 && t.kategori !== 'Menunggak'
  };
  const list = items.filter(filt[UI.bayarF] || filt.semua).sort((a, b) => {
    const r = x => x.sisa <= 0 ? 3 : x.kategori === 'Menunggak' ? 0 : x.kategori === 'Hari Ini' ? 1 : 2;
    return r(a) - r(b) || a.jatuh_tempo.localeCompare(b.jatuh_tempo);
  });

  view(
    '<div class="page-head"><div><div class="eyebrow">KEUANGAN KOS</div><h1 class="h-xl">Pembayaran Sewa</h1></div>' +
    '<button class="btn btn-primary btn-pill" data-act="catatBayar">' + ic('plus') + '<span>Catat Bayar</span></button></div>' +
    monthNav(bln, 'bayarBulan') +
    '<div class="grid-3 mt-12">' +
      '<div class="card" style="padding:12px"><div class="row-between small semi muted">Ditagih ' + ic('file', 'ic-sm') + '</div><div class="bold mt-8 rp">' + U.rpShort(ditagih) + '</div><div class="small muted">' + items.length + ' Kamar</div></div>' +
      '<div class="card" style="padding:12px"><div class="row-between small semi muted">Diterima <span class="c-primary">' + ic('checkCircle', 'ic-sm') + '</span></div><div class="bold mt-8 rp c-primary">' + U.rpShort(diterima) + '</div><div class="small muted">' + n(filt.lunas) + ' Lunas</div></div>' +
      '<div class="card" style="padding:12px;background:var(--danger-tint);border-color:#FBCACA"><div class="row-between small semi c-danger">Tertunda ' + ic('clock', 'ic-sm') + '</div><div class="bold mt-8 rp c-danger">' + U.rpShort(ditagih - diterima) + '</div><div class="small c-danger">' + tertunda.length + ' Kamar</div></div>' +
    '</div>' +
    '<div class="card mt-12"><div class="row-between xs muted"><span>TARGET PENERIMAAN BULAN INI</span><span class="c-primary" style="font-size:13px">' + String(pct).replace('.', ',') + '%</span></div>' +
    '<div class="progress mt-8"><span style="width:' + Math.min(100, pct) + '%"></span></div>' +
    '<div class="row-between small muted mt-8"><span>Terkumpul ' + U.rp(diterima) + '</span><span>Sisa ' + U.rp(ditagih - diterima) + '</span></div></div>' +
    '<div class="mt-16">' + filterChips([
      { id: 'semua', label: 'Semua', n: items.length },
      { id: 'lunas', label: 'Lunas', n: n(filt.lunas) },
      { id: 'menunggak', label: 'Menunggak', n: n(filt.menunggak) },
      { id: 'belum', label: 'Belum Bayar', n: n(filt.belum) }
    ], UI.bayarF, 'bayarFilter') + '</div>' +
    '<div class="section-head mt-8"><div class="section-title">Daftar Tagihan & Pembayaran</div><span class="small muted">' + U.bulan(bln) + '</span></div>' +
    '<div class="grid-cards">' + (list.length ? list.map(bayarCard).join('') : '<div class="card" style="grid-column:1/-1">' + emptyState('wallet', 'Tidak ada tagihan', items.length ? 'Tidak ada data pada filter ini.' : 'Belum ada kontrak yang ditagih pada ' + U.bulan(bln) + '.') + '</div>') + '</div>'
  );
};

function bayarCard(t) {
  const lunas = t.sisa <= 0;
  const last = t.bayar[t.bayar.length - 1];
  const bukti = t.bayar.find(b => b.id_file_bukti);
  let chip;
  if (lunas) chip = '<span class="chip chip-success">' + ic('checkCircle') + 'Lunas (' + U.esc(last ? last.metode : '-') + ')</span>';
  else if (t.kategori === 'Menunggak') chip = '<span class="chip chip-danger">' + ic('alert') + 'Nunggak ' + (-t.selisih) + ' Hari</span>';
  else if (t.kategori === 'Hari Ini') chip = '<span class="chip chip-amber">' + ic('clock') + 'Tempo Hari Ini</span>';
  else chip = '<span class="chip">' + ic('calendar') + t.selisih + ' hari lagi</span>';
  const aktif = t.status_kontrak === 'Aktif';
  return '<div class="card"><div class="row row-top"><div class="avatar ' + U.avClass(t.nama) + '">' + U.esc(U.initials(t.nama)) + '</div><div class="grow">' +
    '<div class="row-between row-top"><div class="h-sm ellipsis">' + U.esc(t.nama) + '</div>' + chip + '</div>' +
    '<div class="small muted row">' + ic('door', 'ic-xs') + 'Kamar ' + U.esc(t.nomor_kamar) + (lunas && last ? ' • ' + U.tgl(last.tanggal_bayar) : '') + (!aktif ? ' • <span class="chip">Kontrak selesai</span>' : '') + '</div></div></div>' +
    '<div class="card-flat mt-12 row-between"><div><div class="small semi muted">' + (lunas ? 'Nominal Lunas' : t.dibayar ? 'Sisa Tagihan (dibayar ' + U.rpShort(t.dibayar) + ')' : t.kategori === 'Menunggak' ? 'Tagihan Tertunggak' : 'Tagihan Sewa') + '</div>' +
    '<div class="money ' + (lunas ? '' : t.kategori === 'Menunggak' ? 'c-danger' : 'c-amber') + '">' + U.rp(lunas ? t.dibayar : t.sisa) + '</div></div>' +
    (lunas ? (bukti ? '<button class="btn btn-outline btn-sm" data-act="lihatBerkas" data-id="' + U.esc(bukti.id_file_bukti) + '" data-title="Bukti Pembayaran">' + ic('receipt', 'ic-sm') + 'Lihat Struk</button>' : '<span class="small muted row">' + ic('shield', 'ic-sm') + U.esc(last ? last.dicatat_oleh : '') + '</span>')
      : '<span class="small muted">Jatuh: ' + U.tgl(t.jatuh_tempo) + '</span>') + '</div>' +
    (!lunas ? '<div class="btn-row mt-12">' + (aktif ? '<button class="btn btn-ghost btn-sm" data-act="kirimPengingat" data-id="' + t.id_penghuni + '">' + ic('wa', 'ic-sm') + 'Kirim WA</button>' : '') +
      '<button class="btn btn-primary btn-sm" data-act="catatBayar" data-kid="' + t.id_kontrak + '" data-periode="' + t.periode + '">' + ic('check', 'ic-sm') + 'Catat Bayar</button></div>' : '') +
    '</div>';
}

Act.bayarBulan = el => { UI.bayarBulan = el.dataset.m; history.replaceState(null, '', '#/bayar'); Pages.bayar([], {}); };
Act.bayarFilter = el => { UI.bayarF = el.dataset.f; Pages.bayar([], {}); };

/* ============================================================
   CATAT PEMBAYARAN (bottom sheet)
   ============================================================ */
Act.catatBayar = el => {
  const ds = (el && el.dataset) || {};
  let kid = ds.kid || '';
  if (!kid && ds.pid) { const k = D.kontrakAktifPenghuni(ds.pid) || D.kontrakTerakhirPenghuni(ds.pid); kid = k ? k.id_kontrak : ''; }
  bukaCatatBayar(kid, ds.periode);
};

function bukaCatatBayar(kid, periodeAwal) {
  const S = App.S;
  const tunggakId = new Set((S.tagihan || []).filter(t => t.sisa > 0).map(t => t.id_kontrak));
  const kontrak = (S.kontrak || []).filter(k => k.status === 'Aktif' || tunggakId.has(k.id_kontrak))
    .map(k => ({ k: k, p: D.penghuni(k.id_penghuni) || { nama: '(terhapus)' }, km: D.kamar(k.id_kamar) || {} }))
    .sort((a, b) => a.p.nama.localeCompare(b.p.nama, 'id'));
  if (!kontrak.length) return U.alert('Belum ada kontrak', 'Daftarkan penghuni terlebih dahulu sebelum mencatat pembayaran.');
  if (!kid || !kontrak.some(x => x.k.id_kontrak === kid)) {
    const desak = new Set(D.urgent().sort((a, b) => a.selisih - b.selisih).map(t => t.id_kontrak));
    const prior = kontrak.find(x => desak.has(x.k.id_kontrak)) || kontrak.find(x => tunggakId.has(x.k.id_kontrak));
    kid = (prior || kontrak[0]).k.id_kontrak;
  }
  const F = { kid: kid, periode: [], jumlah: 0, metode: 'Transfer', bukti: null, custom: [] };

  const s = U.sheet({
    title: 'Catat Pembayaran Sewa', sub: 'Verifikasi & pembukuan kas masuk kamar kos', sticky: true,
    body: '<div class="field"><label>Pilih Penghuni / Kamar <span class="req">*</span></label><select class="select" id="cb-kontrak">' +
      kontrak.map(x => '<option value="' + x.k.id_kontrak + '" ' + (x.k.id_kontrak === kid ? 'selected' : '') + '>' + U.esc(x.p.nama) + ' — Kamar ' + U.esc(x.km.nomor_kamar || '-') + (x.k.status !== 'Aktif' ? ' (kontrak selesai)' : '') + '</option>').join('') + '</select>' +
      '<div id="cb-info" class="mt-8"></div></div>' +
      '<div class="field"><label>Periode Sewa <span class="opt">Bisa pilih lebih dari satu</span></label><div class="filters" id="cb-periode" style="flex-wrap:wrap"></div>' +
      '<div class="row mt-8"><input type="month" class="input" id="cb-bulan-lain" style="min-height:40px;padding:8px 12px"><button type="button" class="btn btn-ghost btn-sm" id="cb-tambah-bulan">' + ic('plus', 'ic-sm') + 'Bulan Lain</button></div></div>' +
      '<div class="field"><label>Jumlah Pembayaran <span class="req">*</span><span class="opt" id="cb-sisa"></span></label><div class="input-group"><span class="prefix">Rp</span><input class="input money" id="cb-jumlah" inputmode="numeric" style="font-size:20px;font-weight:700"></div>' +
      '<div class="filters mt-8" id="cb-quick"></div></div>' +
      '<div class="field"><label>Tanggal Bayar Diterima</label><input type="date" class="input" id="cb-tgl" value="' + U.today() + '" max="' + U.today() + '"></div>' +
      '<div class="field"><label>Metode Pembayaran</label><div class="grid-2" id="cb-metode">' +
        '<button type="button" class="fac on" data-v="Transfer" style="min-height:64px;flex-direction:column;align-items:flex-start;padding:10px 12px">' + ic('bank', 'ic-sm') + '<span>Transfer Bank<br><small style="font-weight:500;opacity:.8">' + U.esc(D.set().nama_bank || 'Rekening kost') + '</small></span></button>' +
        '<button type="button" class="fac" data-v="Tunai" style="min-height:64px;flex-direction:column;align-items:flex-start;padding:10px 12px">' + ic('cash', 'ic-sm') + '<span>Tunai / Cash<br><small style="font-weight:500;opacity:.8">Diterima langsung</small></span></button></div></div>' +
      '<div class="field"><label>Bukti Pembayaran / Struk <span class="opt">Opsional</span></label><div id="cb-bukti"></div></div>' +
      '<div class="field"><label>Catatan Transaksi <span class="opt">Opsional</span></label><input class="input" id="cb-catatan" maxlength="300" placeholder="Contoh: transfer dari rekening orang tua"></div>',
    foot: '<button class="btn btn-ghost" data-x>Batal</button><button class="btn btn-primary" data-ok>' + ic('check') + 'Simpan Pembayaran</button>'
  });

  const outstanding = () => (App.S.tagihan || []).filter(t => t.id_kontrak === F.kid && t.sisa > 0).sort((a, b) => a.periode.localeCompare(b.periode));
  const kontrakNow = () => D.kontrak(F.kid);

  const setJumlah = v => { F.jumlah = v; s.q('#cb-jumlah').value = v ? U.numFmt(v) : ''; };
  const sisaTerpilih = () => {
    const k = kontrakNow();
    return F.periode.reduce((a, p) => {
      const t = (App.S.tagihan || []).find(x => x.id_kontrak === F.kid && x.periode === p);
      return a + (t ? t.sisa : k.harga_sewa);
    }, 0);
  };

  const render = () => {
    const k = kontrakNow();
    const p = D.penghuni(k.id_penghuni) || {};
    const st = D.status(p);
    s.q('#cb-info').innerHTML = '<div class="file-pill"><div class="avatar sm ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow"><div class="semi">' + U.esc(p.nama || '-') + ' ' + (st.kind !== 'lunas' && st.kind !== 'keluar' ? '<span class="chip ' + st.cls + '">' + U.esc(st.short) + '</span>' : '') + '</div>' +
      '<div class="small muted">Kamar ' + U.esc((D.kamar(k.id_kamar) || {}).nomor_kamar || '-') + ' • ' + U.rp(k.harga_sewa) + ' / bln</div></div></div>';
    const out = outstanding();
    const periods = out.map(t => ({ p: t.periode, sisa: t.sisa, t: t })).concat(F.custom.filter(c => !out.some(t => t.periode === c)).map(c => ({ p: c, sisa: null })));
    s.q('#cb-periode').innerHTML = periods.length ? periods.map(x => '<button type="button" class="filter ' + (F.periode.includes(x.p) ? 'active' : '') + '" data-p="' + x.p + '">' +
      (F.periode.includes(x.p) ? ic('check', 'ic-xs') : '') + U.bulan(x.p) + (x.sisa !== null ? ' <span class="n">' + U.rpShort(x.sisa) + '</span>' : '') + '</button>').join('')
      : '<span class="small muted">Tidak ada tagihan tertunda. Gunakan "Bulan Lain" untuk bayar di muka.</span>';
    const total = sisaTerpilih();
    s.q('#cb-sisa').textContent = F.periode.length ? 'Sisa terpilih: ' + U.rp(total) : '';
    s.q('#cb-quick').innerHTML = total ? '<button type="button" class="filter ' + (F.jumlah === total ? 'active' : '') + '" data-q="' + total + '">' + ic('check', 'ic-xs') + 'Lunas Penuh (' + U.rpShort(total) + ')</button>' +
      '<button type="button" class="filter ' + (F.jumlah === Math.round(total / 2) ? 'active' : '') + '" data-q="' + Math.round(total / 2) + '">Cicilan 50% (' + U.rpShort(total / 2) + ')</button>' : '';
  };

  const pilihAwal = () => {
    const out = outstanding();
    F.periode = periodeAwal && out.some(t => t.periode === periodeAwal) ? [periodeAwal] : (out[0] ? [out[0].periode] : []);
    F.custom = [];
    setJumlah(sisaTerpilih());
    render();
  };

  const renderBukti = () => {
    s.q('#cb-bukti').innerHTML = F.bukti
      ? '<div class="file-pill"><div class="thumb">' + (/^data:image/.test(F.bukti.data) ? '<img src="' + F.bukti.data + '" alt="">' : ic('file')) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(F.bukti.nama) + '</div><div class="small c-primary row">' + ic('checkCircle', 'ic-xs') + 'Lampiran siap diunggah</div></div><button type="button" class="btn btn-ghost btn-sm btn-icon" id="cb-bukti-rm" aria-label="Hapus">' + ic('x', 'ic-sm') + '</button></div>'
      : '<div class="upload" id="cb-bukti-pick" style="padding:14px">' + ic('upload') + '<span class="semi">Unggah foto struk / bukti transfer</span><span class="small">JPG, PNG, atau PDF</span></div>';
  };

  pilihAwal();
  renderBukti();

  s.q('#cb-kontrak').onchange = e => { F.kid = e.target.value; periodeAwal = null; pilihAwal(); };
  s.q('#cb-periode').addEventListener('click', e => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    const p = b.dataset.p;
    F.periode = F.periode.includes(p) ? F.periode.filter(x => x !== p) : F.periode.concat(p).sort();
    setJumlah(sisaTerpilih()); render();
  });
  s.q('#cb-tambah-bulan').onclick = () => {
    const v = s.q('#cb-bulan-lain').value;
    if (!/^\d{4}-\d{2}$/.test(v)) return U.toast('Pilih bulan terlebih dahulu.', 'warn');
    if (!F.custom.includes(v)) F.custom.push(v);
    if (!F.periode.includes(v)) F.periode = F.periode.concat(v).sort();
    setJumlah(sisaTerpilih()); render();
  };
  s.q('#cb-quick').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) { setJumlah(Number(b.dataset.q)); render(); } });
  s.q('#cb-jumlah').addEventListener('input', e => { setJumlah(U.parseNum(e.target.value)); render(); });
  s.q('#cb-metode').addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    F.metode = b.dataset.v;
    s.qa('#cb-metode .fac').forEach(x => x.classList.toggle('on', x === b));
  });
  s.q('#cb-bukti').addEventListener('click', async e => {
    if (e.target.closest('#cb-bukti-rm')) { F.bukti = null; renderBukti(); return; }
    if (e.target.closest('#cb-bukti-pick')) { const f = await pilihBerkas('image/*,application/pdf'); if (f) { F.bukti = f; renderBukti(); } }
  });
  s.q('[data-x]').onclick = () => s.close();
  s.q('[data-ok]').onclick = async () => {
    if (!F.periode.length) return U.toast('Pilih periode sewa yang dibayar.', 'error');
    if (!F.jumlah) return U.toast('Isi nominal pembayaran.', 'error');
    const r = await App.run('catatBayar', {
      id_kontrak: F.kid, periode: F.periode, jumlah: F.jumlah, tanggal_bayar: s.q('#cb-tgl').value, metode: F.metode,
      bukti: F.bukti ? F.bukti.data : '', catatan: s.q('#cb-catatan').value
    }, { busy: F.bukti ? 'Mengunggah bukti & menyimpan...' : 'Menyimpan pembayaran...' });
    if (r) { s.close(); App.refresh(); }
  };
}

/* ============================================================
   PENGELUARAN (Owner)
   ============================================================ */
const KAT_ICON = { 'Listrik': 'zap', 'Air': 'droplet', 'Internet': 'wifi', 'Gaji/SDM': 'users', 'Perbaikan': 'wrench', 'Kebersihan': 'home', 'Pajak/Iuran': 'bank', 'Lainnya': 'tag' };

Pages.pengeluaran = (args, q) => {
  if (!UI.outBulan) UI.outBulan = U.today().slice(0, 7);
  if (!UI.outList) {
    view('<div class="page-head"><h1 class="h-xl">Pengeluaran</h1></div><div class="skeleton" style="height:120px"></div><div class="skeleton mt-12" style="height:240px"></div>');
    Api.call('pengeluaranList').then(r => { UI.outList = r.pengeluaran; if (App.route.page === 'pengeluaran') Pages.pengeluaran(args, q); })
      .catch(e => view(emptyState('alert', 'Gagal memuat', U.esc(e.message), '<button class="btn btn-primary" data-go="#/pengeluaran">Coba lagi</button>')));
    return;
  }
  const bln = UI.outBulan;
  const list = UI.outList.filter(x => String(x.tanggal).slice(0, 7) === bln);
  const total = list.reduce((a, x) => a + x.jumlah, 0);
  const perKat = {};
  list.forEach(x => { perKat[x.kategori] = (perKat[x.kategori] || 0) + x.jumlah; });
  view(
    '<div class="page-head"><div><div class="eyebrow">' + ic('lock', 'ic-xs') + 'KHUSUS OWNER</div><h1 class="h-xl">Catatan Pengeluaran</h1></div>' +
    '<button class="btn btn-primary btn-pill" data-act="pengeluaranBaru">' + ic('plus') + '<span>Catat</span></button></div>' +
    monthNav(bln, 'outBulan') +
    '<div class="card mt-12"><div class="row-between"><div><div class="small semi muted">Total Pengeluaran ' + U.bulan(bln) + '</div><div class="money-lg c-danger">' + U.rp(total) + '</div></div><div class="icon-box danger">' + ic('trendDown') + '</div></div>' +
    (Object.keys(perKat).length ? '<div class="row wrap mt-12">' + Object.keys(perKat).sort((a, b) => perKat[b] - perKat[a]).map(k => '<span class="tag">' + ic(KAT_ICON[k] || 'tag', 'ic-xs') + U.esc(k) + ' · <b class="rp">' + U.rpShort(perKat[k]) + '</b></span>').join('') + '</div>' : '') + '</div>' +
    '<div class="card mt-12"><div class="card-head"><div class="card-title">Rincian Transaksi</div><span class="small muted">' + list.length + ' transaksi</span></div>' +
    (list.length ? list.map(x => '<div class="tx"><div class="icon-box sm ' + (x.kategori === 'Perbaikan' ? 'amber' : '') + '">' + ic(KAT_ICON[x.kategori] || 'tag', 'ic-sm') + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(x.keterangan) + '</div>' +
      '<div class="small muted"><span class="chip">' + U.esc(x.kategori) + '</span> ' + U.tgl(x.tanggal) + ' · ' + U.esc(x.dicatat_oleh) + '</div></div>' +
      '<div class="right"><div class="amt out">−' + U.rp(x.jumlah) + '</div><div class="row" style="justify-content:flex-end;gap:2px">' +
      (x.id_file_nota ? '<button class="icon-btn" style="width:30px;height:30px" data-act="lihatBerkas" data-id="' + U.esc(x.id_file_nota) + '" data-title="Nota" aria-label="Lihat nota">' + ic('eye', 'ic-sm') + '</button>' : '') +
      '<button class="icon-btn" style="width:30px;height:30px;color:var(--danger-text)" data-act="hapusPengeluaran" data-id="' + x.id_pengeluaran + '" aria-label="Hapus">' + ic('trash', 'ic-sm') + '</button></div></div></div>').join('')
      : emptyState('receipt', 'Belum ada pengeluaran', 'Catat biaya listrik, air, gaji, perbaikan, dan lainnya.')) + '</div>'
  );
  if (q.baru) { history.replaceState(null, '', '#/pengeluaran'); Act.pengeluaranBaru(); }
};

Act.outBulan = el => { UI.outBulan = el.dataset.m; Pages.pengeluaran([], {}); };

Act.pengeluaranBaru = () => {
  const kat = App.S.kategori_pengeluaran || Object.keys(KAT_ICON);
  const F = { kat: kat[0], nota: null };
  const s = U.sheet({
    title: 'Catat Pengeluaran', sub: 'Masuk ke laporan keuangan bulanan', sticky: true,
    body: '<div class="field"><label>Kategori</label><div class="filters" id="out-kat" style="flex-wrap:wrap">' + kat.map(k => '<button type="button" class="filter ' + (k === F.kat ? 'active' : '') + '" data-k="' + U.esc(k) + '">' + ic(KAT_ICON[k] || 'tag', 'ic-xs') + U.esc(k) + '</button>').join('') + '</div></div>' +
      '<div class="field"><label>Keterangan <span class="req">*</span></label><input class="input" id="out-ket" maxlength="200" placeholder="Contoh: Token listrik area bersama"></div>' +
      '<div class="form-grid two"><div class="field"><label>Nominal <span class="req">*</span></label><div class="input-group"><span class="prefix">Rp</span><input class="input rp" id="out-jml" inputmode="numeric" data-money></div></div>' +
      '<div class="field"><label>Tanggal</label><input type="date" class="input" id="out-tgl" value="' + U.today() + '"></div></div>' +
      '<div class="field"><label>Nota / Kuitansi <span class="opt">Opsional</span></label><div id="out-nota"></div></div>',
    foot: '<button class="btn btn-ghost" data-x>Batal</button><button class="btn btn-primary" data-ok>' + ic('check') + 'Simpan</button>'
  });
  pasangUangInput(s.el);
  const renderNota = () => {
    s.q('#out-nota').innerHTML = F.nota ? '<div class="file-pill"><div class="thumb">' + (/^data:image/.test(F.nota.data) ? '<img src="' + F.nota.data + '" alt="">' : ic('file')) + '</div><div class="grow semi ellipsis">' + U.esc(F.nota.nama) + '</div><button type="button" class="btn btn-ghost btn-sm btn-icon" id="nota-rm">' + ic('x', 'ic-sm') + '</button></div>'
      : '<div class="upload" id="nota-pick" style="padding:14px">' + ic('upload') + '<span class="semi">Unggah foto nota</span></div>';
  };
  renderNota();
  s.q('#out-nota').addEventListener('click', async e => {
    if (e.target.closest('#nota-rm')) { F.nota = null; renderNota(); }
    if (e.target.closest('#nota-pick')) { const f = await pilihBerkas('image/*,application/pdf'); if (f) { F.nota = f; renderNota(); } }
  });
  s.q('#out-kat').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; F.kat = b.dataset.k; s.qa('#out-kat .filter').forEach(x => x.classList.toggle('active', x === b)); });
  s.q('[data-x]').onclick = () => s.close();
  s.q('[data-ok]').onclick = async () => {
    const ket = s.q('#out-ket').value.trim(), jml = U.parseNum(s.q('#out-jml').value);
    if (!ket) return U.toast('Keterangan wajib diisi.', 'error');
    if (!jml) return U.toast('Nominal wajib diisi.', 'error');
    const r = await App.run('simpanPengeluaran', { kategori: F.kat, keterangan: ket, jumlah: jml, tanggal: s.q('#out-tgl').value, nota: F.nota ? F.nota.data : '' });
    if (r) { UI.outList = r.pengeluaran; UI.outBulan = s.q('#out-tgl').value.slice(0, 7); s.close(); if (App.route.page === 'pengeluaran') Pages.pengeluaran([], {}); }
  };
};

Act.hapusPengeluaran = async el => {
  if (!(await U.confirm({ title: 'Hapus pengeluaran ini?', message: 'Data dan notanya akan dihapus permanen.', ok: 'Hapus', danger: true }))) return;
  const r = await App.run('hapusPengeluaran', { id_pengeluaran: el.dataset.id });
  if (r) { UI.outList = r.pengeluaran; Pages.pengeluaran([], {}); }
};

/* ============================================================
   LAPORAN KEUANGAN (Owner)
   ============================================================ */
Pages.laporan = () => {
  if (!UI.lapBulan) UI.lapBulan = U.today().slice(0, 7);
  view('<div class="page-head"><h1 class="h-xl">Laporan Keuangan</h1></div>' + monthNav(UI.lapBulan, 'lapBulan') +
    '<div class="skeleton mt-12" style="height:150px"></div><div class="grid-2 mt-12"><div class="skeleton" style="height:90px"></div><div class="skeleton" style="height:90px"></div></div><div class="skeleton mt-12" style="height:260px"></div>');
  const bln = UI.lapBulan;
  Api.call('laporan', { bulan: bln }).then(r => { if (App.route.page === 'laporan' && UI.lapBulan === bln) { UI.lap = r.laporan; renderLaporan(); } })
    .catch(e => view(emptyState('alert', 'Gagal memuat laporan', U.esc(e.message), '<button class="btn btn-primary" data-go="#/laporan">Coba lagi</button>')));
};

Act.lapBulan = el => { UI.lapBulan = el.dataset.m; Pages.laporan(); };

function renderLaporan() {
  const L = UI.lap, set = D.set();
  const o = L.okupansi;
  const pctOk = o.total ? Math.round(o.terisi / o.total * 1000) / 10 : 0;
  const circ = 2 * Math.PI * 40;
  const totalTunggak = L.tunggakan.reduce((a, t) => a + t.total, 0);
  view(
    '<div class="print-only"><h2 style="margin:0">' + U.esc(set.nama_kost) + '</h2><div>Laporan Keuangan ' + U.bulan(L.bulan) + ' · dicetak ' + U.tglPanjang(U.today()) + '</div><hr></div>' +
    '<div class="page-head no-print"><div><div class="row"><h1 class="h-xl">Laporan Keuangan</h1><span class="chip chip-amber">' + ic('lock', 'ic-xs') + 'Khusus Owner</span></div><p>Analisis arus kas & kepatuhan sewa unit kost</p></div></div>' +
    '<div class="no-print">' + monthNav(L.bulan, 'lapBulan') +
    '<div class="grid-2 mt-12"><button class="btn btn-outline" data-act="lapPdf">' + ic('printer', 'ic-sm') + 'Export PDF</button><button class="btn btn-outline" data-act="lapCsv">' + ic('download', 'ic-sm') + 'Export CSV</button></div></div>' +

    '<div class="two-col mt-12"><div>' +
    '<div class="profit-card"><div class="row-between"><div class="row semi">' + ic('wallet', 'ic-sm') + 'Laba Bersih (Net Profit)</div><span class="chip chip-amber">' + String(L.margin).replace('.', ',') + '% Margin</span></div>' +
      '<div class="money-lg mt-12" style="color:#fff">' + U.rp(L.laba) + '</div>' +
      '<div class="small row mt-8" style="opacity:.85">' + ic('checkCircle', 'ic-sm') + 'Pemasukan dikurangi pengeluaran ' + U.bulan(L.bulan) + '</div>' +
      '<div class="foot"><span>' + (L.margin >= 60 ? 'Efisiensi Margin Sehat' : L.margin >= 30 ? 'Margin Cukup' : 'Margin Perlu Ditinjau') + '</span><span>' + (L.perubahan_masuk !== null ? (L.perubahan_masuk >= 0 ? '+' : '') + String(L.perubahan_masuk).replace('.', ',') + '% pemasukan MoM' : '—') + '</span></div></div>' +
    '<div class="grid-2 mt-12">' +
      '<div class="card" style="padding:14px"><div class="row-between small semi muted">Pemasukan' + (L.perubahan_masuk !== null ? '<span class="chip ' + (L.perubahan_masuk >= 0 ? 'chip-success' : 'chip-danger') + '">' + (L.perubahan_masuk >= 0 ? '+' : '') + String(L.perubahan_masuk).replace('.', ',') + '%</span>' : '') + '</div><div class="h-lg rp mt-8">' + U.rpShort(L.total_masuk) + '</div><div class="small muted row">' + ic('checkCircle', 'ic-xs') + L.jumlah_lunas + ' pembayaran lunas</div></div>' +
      '<div class="card" style="padding:14px"><div class="row-between small semi muted">Pengeluaran<span class="chip chip-amber">Operasional</span></div><div class="h-lg rp mt-8">' + U.rpShort(L.total_keluar) + '</div><div class="small muted ellipsis">' + (Object.keys(L.per_kategori).slice(0, 3).join(', ') || 'Belum ada') + '</div></div>' +
    '</div>' +
    (L.tunggakan.length ? '<div class="card mt-12" style="background:var(--danger-tint);border-color:#FBCACA"><div class="row-between"><div class="row"><div class="icon-box" style="background:var(--danger);color:#fff">' + ic('alert') + '</div><div><div class="xs c-danger">TUNGGAKAN AKTIF <span class="chip chip-danger">' + L.tunggakan.length + ' Kamar</span></div><div class="money c-danger">' + U.rp(totalTunggak) + '</div></div></div>' +
      '<button class="btn btn-sm btn-outline no-print" data-act="lapScrollTunggak">Detail ' + ic('arrowRight', 'ic-xs') + '</button></div></div>' : '') +

    '<div class="card mt-12"><div class="row-between"><div><div class="h-sm">Arus Kas 6 Bulan</div><div class="small muted">Tren pendapatan vs operasional</div></div><div class="chart-legend"><span><i style="background:var(--primary)"></i>Masuk</span><span><i style="background:var(--amber)"></i>Keluar</span></div></div>' +
      '<div class="chart mt-12" id="chart-kas">' + chartKas(L.series, L.bulan) + '</div><div class="chart-tip" id="chart-tip">Ketuk batang untuk melihat nilai.</div></div>' +
    '</div><div>' +

    '<div class="card"><div class="h-sm mb-12">Efisiensi & Okupansi Unit</div><div class="row" style="gap:18px"><div style="position:relative;width:96px;height:96px;flex-shrink:0"><svg width="96" height="96" viewBox="0 0 96 96" style="transform:rotate(-90deg)"><circle cx="48" cy="48" r="40" fill="none" stroke="var(--primary-tint)" stroke-width="10"/>' +
      '<circle cx="48" cy="48" r="40" fill="none" stroke="var(--primary)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - pctOk / 100)) + '"/></svg><div style="position:absolute;inset:0;display:grid;place-items:center" class="bold">' + String(pctOk).replace('.', ',') + '%</div></div>' +
      '<div class="grow"><div class="h-md">' + o.terisi + '/' + o.total + ' Pintu</div><div class="small muted">Terisi aktif · ' + o.tersedia + ' kosong' + (o.perbaikan ? ' · ' + o.perbaikan + ' perbaikan' : '') + '</div>' +
      '<div class="card-tint mt-8" style="padding:10px"><div class="xs muted">RATA-RATA / UNIT TERISI</div><div class="semi rp c-primary">' + U.rp(o.terisi ? L.total_masuk / o.terisi : 0) + '</div><div class="small muted">Potensi maks: ' + U.rpShort(o.potensi) + '</div></div></div></div></div>' +

    '<div class="card mt-12"><div class="tabs mb-12 no-print">' + [['semua', 'Semua', L.pemasukan.length + L.pengeluaran.length], ['keluar', 'Pengeluaran', L.pengeluaran.length], ['masuk', 'Pemasukan', L.pemasukan.length]].map(t => '<button class="tab ' + (UI.lapTab === t[0] ? 'active' : '') + '" data-act="lapTab" data-t="' + t[0] + '">' + t[1] + ' (' + t[2] + ')</button>').join('') + '</div>' +
      '<div class="input-icon mb-8 no-print">' + ic('search') + '<input class="input" id="lap-q" placeholder="Cari transaksi..." value="' + U.esc(UI.lapQ) + '" style="min-height:42px"></div>' +
      '<div id="lap-tx"></div></div>' +

    '<div class="card mt-12" id="lap-tunggak"><div class="card-head"><div class="card-title"><span class="status-dot off"></span>Tunggakan Belum Lunas</div>' + (L.tunggakan.length ? '<button class="btn btn-primary btn-sm no-print" data-go="#/wa?pilih=menunggak">' + ic('wa', 'ic-sm') + 'Tagih Semua via WA</button>' : '') + '</div>' +
      (L.tunggakan.length ? '<div class="small muted mb-8">Total ' + U.rp(totalTunggak) + ' dari ' + L.tunggakan.length + ' penyewa melewati tenggat.</div>' + L.tunggakan.map(t => '<div class="list-item"><div class="room-stamp">' + U.esc(t.kamar) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(t.nama) + '</div><div class="small c-danger">Terlambat ' + t.hari_telat + ' hari · ' + t.periode.map(U.bulanPendek).join(', ') + '</div></div><div class="semi rp">' + U.rp(t.total) + '</div>' +
        (t.status_kontrak === 'Aktif' ? '<button class="icon-btn no-print" data-act="kirimPengingat" data-id="' + t.id_penghuni + '" aria-label="Kirim pengingat">' + ic('send', 'ic-sm') + '</button>' : '') + '</div>').join('')
        : emptyState('checkCircle', 'Tidak ada tunggakan', 'Semua tagihan yang jatuh tempo sudah lunas.')) + '</div>' +
    '</div></div>' +
    '<div class="btn-row mt-16 no-print"><button class="btn btn-primary" data-act="pengeluaranBaru">' + ic('plus', 'ic-sm') + 'Catat Pengeluaran</button><button class="btn btn-ghost" data-go="#/pengeluaran">' + ic('receipt', 'ic-sm') + 'Kelola Pengeluaran</button></div>'
  );
  const inp = document.getElementById('lap-q');
  inp.addEventListener('input', U.debounce(() => { UI.lapQ = inp.value; renderLapTx(); }, 120));
  renderLapTx();
  document.getElementById('chart-kas').addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const s = L.series[Number(b.dataset.i)];
    document.getElementById('chart-tip').innerHTML = '<b>' + U.bulan(s.bulan) + '</b> — Masuk <b class="c-primary rp">' + U.rp(s.masuk) + '</b> · Keluar <b class="c-amber rp">' + U.rp(s.keluar) + '</b> · Selisih <b class="rp">' + U.rp(s.masuk - s.keluar) + '</b>';
  });
}

function chartKas(series, aktif) {
  const W = 340, H = 190, pl = 34, pb = 22, pt = 8;
  const max = Math.max(1, ...series.map(s => Math.max(s.masuk, s.keluar)));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const gw = (W - pl) / series.length;
  const bw = Math.min(14, gw / 3.2);
  const y = v => pt + (H - pt - pb) * (1 - v / top);
  let g = '';
  for (let i = 0; i <= 4; i++) {
    const v = top * i / 4;
    g += '<line class="gridline" x1="' + pl + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="axis" x="' + (pl - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + (v >= 1e6 ? Math.round(v / 1e6 * 10) / 10 + 'jt' : v >= 1e3 ? Math.round(v / 1e3) + 'rb' : v) + '</text>';
  }
  series.forEach((s, i) => {
    const cx = pl + gw * i + gw / 2;
    const on = s.bulan === aktif;
    g += '<g class="bar-hit" data-i="' + i + '"><rect x="' + (cx - gw / 2) + '" y="' + pt + '" width="' + gw + '" height="' + (H - pt) + '" fill="transparent"/>' +
      '<rect x="' + (cx - bw - 1.5) + '" y="' + y(s.masuk) + '" width="' + bw + '" height="' + Math.max(0, H - pb - y(s.masuk)) + '" rx="4" fill="var(--primary)" opacity="' + (on ? 1 : .75) + '"/>' +
      '<rect x="' + (cx + 1.5) + '" y="' + y(s.keluar) + '" width="' + bw + '" height="' + Math.max(0, H - pb - y(s.keluar)) + '" rx="4" fill="var(--amber)" opacity="' + (on ? 1 : .75) + '"/>' +
      '<text class="axis" x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle" style="' + (on ? 'font-weight:700;fill:var(--text)' : '') + '">' + U.bulanPendek(s.bulan) + '</text></g>';
  });
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik pemasukan dan pengeluaran 6 bulan">' + g + '</svg>';
}

function renderLapTx() {
  const L = UI.lap;
  const q = U.norm(UI.lapQ);
  let rows = [];
  if (UI.lapTab !== 'keluar') rows = rows.concat(L.pemasukan.map(x => ({ t: 'in', tanggal: x.tanggal, judul: x.nama + ' — Kamar ' + x.kamar, sub: 'Sewa ' + U.bulan(x.periode) + ' · ' + x.metode, jumlah: x.jumlah, file: x.id_file, icon: x.metode === 'Tunai' ? 'cash' : 'bank' })));
  if (UI.lapTab !== 'masuk') rows = rows.concat(L.pengeluaran.map(x => ({ t: 'out', tanggal: x.tanggal, judul: x.keterangan, sub: x.kategori, jumlah: x.jumlah, file: x.id_file, icon: KAT_ICON[x.kategori] || 'tag' })));
  rows = rows.filter(r => !q || U.norm(r.judul + ' ' + r.sub).includes(q)).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  document.getElementById('lap-tx').innerHTML = rows.length ? rows.map(r => '<div class="tx"><div class="icon-box sm ' + (r.t === 'out' ? 'amber' : '') + '">' + ic(r.icon, 'ic-sm') + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(r.judul) + '</div><div class="small muted">' + U.esc(r.sub) + ' · ' + U.tgl(r.tanggal) + '</div></div>' +
    '<div class="amt ' + r.t + '">' + (r.t === 'out' ? '−' : '+') + U.rp(r.jumlah) + '</div>' + (r.file ? '<button class="icon-btn no-print" style="width:30px;height:30px" data-act="lihatBerkas" data-id="' + U.esc(r.file) + '" data-title="Lampiran">' + ic('eye', 'ic-sm') + '</button>' : '') + '</div>').join('')
    : emptyState('list', 'Tidak ada transaksi', 'Belum ada transaksi pada filter ini.');
}

Act.lapTab = el => { UI.lapTab = el.dataset.t; document.querySelectorAll('[data-act=lapTab]').forEach(b => b.classList.toggle('active', b === el)); renderLapTx(); };
Act.lapScrollTunggak = () => document.getElementById('lap-tunggak').scrollIntoView({ behavior: 'smooth' });
Act.lapPdf = () => window.print();
Act.lapCsv = () => {
  const L = UI.lap;
  const rows = [['Laporan Keuangan', D.set().nama_kost, U.bulan(L.bulan)], [],
    ['Ringkasan'], ['Total Pemasukan', L.total_masuk], ['Total Pengeluaran', L.total_keluar], ['Laba Bersih', L.laba], ['Margin (%)', L.margin], ['Okupansi', L.okupansi.terisi + '/' + L.okupansi.total], [],
    ['Jenis', 'Tanggal', 'Keterangan', 'Kategori/Periode', 'Metode', 'Jumlah']];
  L.pemasukan.forEach(x => rows.push(['Pemasukan', x.tanggal, x.nama + ' (Kamar ' + x.kamar + ')', x.periode, x.metode, x.jumlah]));
  L.pengeluaran.forEach(x => rows.push(['Pengeluaran', x.tanggal, x.keterangan, x.kategori, '', -x.jumlah]));
  rows.push([], ['Tunggakan'], ['Nama', 'Kamar', 'Periode', 'Hari Telat', 'Total']);
  L.tunggakan.forEach(t => rows.push([t.nama, t.kamar, t.periode.join(' '), t.hari_telat, t.total]));
  U.downloadBlob(new Blob([U.csv(rows)], { type: 'text/csv;charset=utf-8' }), 'Laporan-Kostku-' + L.bulan + '.csv');
};
