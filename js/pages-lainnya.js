/* ============================================================
   KOSTKU — Halaman: WhatsApp, Surat Perjanjian, Pengaturan, Akun
   ============================================================ */

UI.waTab = 'pengingat';
UI.waFilter = 'menunggak';
UI.waJenis = 'teguran';
UI.waPilih = null;
UI.waInfo = null;
UI.waRiwayat = null;
UI.waRiwayatF = '';
UI.blast = { teks: 'Halo Kak {nama} (Kamar {kamar}),\n\nInfo dari pengelola {nama_kost}: ', mode: 'semua', pilih: new Set() };
UI.suratTab = 'arsip';
UI.suratF = 'semua';
UI.suratQ = '';
UI.suratPilih = '';
UI.suratHtml = null;
UI.suratFileBaru = null;

/* ---------- Pesan WhatsApp (sama dengan logika server) ---------- */
function isiTemplate(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m);
}
function varsRek() {
  const s = D.set();
  return { nama_kost: s.nama_kost, bank_tujuan: s.nama_bank, no_rekening: s.no_rekening, atas_nama: s.atas_nama, jam_malam: s.jam_malam };
}
function waPesan(idP, jenis) {
  const set = D.set();
  const items = D.tagihanOutstanding(idP);
  if (!items.length) return null;
  const t = items[0];
  const total = items.reduce((a, x) => a + x.sisa, 0);
  const vars = Object.assign(varsRek(), {
    nama: t.nama, kamar: t.nomor_kamar, nominal: U.rp(total), tanggal_tagih: U.tglPanjang(t.jatuh_tempo),
    periode: items.map(i => U.bulan(i.periode)).join(', '), hari_telat: String(Math.max(0, -t.selisih))
  });
  return isiTemplate(jenis === 'teguran' ? set.template_teguran_WA : set.template_pesan_WA, vars);
}
function waFormat(teks) {
  return U.esc(teks).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/_([^_\n]+)_/g, '<i>$1</i>').replace(/~([^~\n]+)~/g, '<s>$1</s>');
}
function waBubble(nama, teks) {
  return '<div class="wa-preview"><div class="wa-head">' + ic('arrowLeft', 'ic-sm') + '<div class="avatar">' + U.esc(U.initials(nama)) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(nama) + '</div><div class="small" style="opacity:.8">online</div></div></div>' +
    '<div class="wa-body"><div class="wa-day"><span>HARI INI</span></div>' +
    (teks ? '<div class="wa-bubble">' + waFormat(teks) + '<span class="wm">+ watermark Fonnte (paket Free)</span><div class="tm">' + new Date().toTimeString().slice(0, 5) + ' ✓✓</div></div>' : '<div class="center small muted">Pilih penerima untuk melihat pratinjau.</div>') + '</div></div>';
}

/* ---------- Kirim pengingat satu penghuni ---------- */
Act.kirimPengingat = el => {
  const p = D.penghuni(el.dataset.id);
  if (!p) return;
  const st = D.status(p);
  if (!st.items.length) return U.toast('Tidak ada tagihan tertunda untuk ' + p.nama + '.', 'warn');
  let jenis = st.kind === 'menunggak' ? 'teguran' : 'pengingat';
  const set = D.set();
  const s = U.sheet({
    title: 'Kirim Pengingat WhatsApp', sub: U.esc(p.nama) + ' · ' + U.waFmt(p.no_wa),
    body: (!set.wa_token_terpasang ? '<div class="banner danger mb-12">' + ic('alert') + '<div>Token Fonnte belum diisi. Owner perlu mengaturnya di menu Pengaturan.</div></div>' : '') +
      '<div class="seg light mb-12" id="kp-jenis"><button type="button" data-v="pengingat" class="' + (jenis === 'pengingat' ? 'active' : '') + '">Tagihan Sopan</button><button type="button" data-v="teguran" class="' + (jenis === 'teguran' ? 'active' : '') + '">Teguran Menunggak</button></div>' +
      '<div id="kp-prev"></div><div class="hint mt-8">' + ic('info', 'ic-xs') + 'Hanya teks (tanpa lampiran/tautan) sesuai paket Free Fonnte. Memakai 1 kuota pesan.</div>',
    foot: '<button class="btn btn-ghost" data-x>Batal</button><button class="btn btn-primary" data-ok>' + ic('send', 'ic-sm') + 'Kirim Sekarang</button>'
  });
  const prev = () => { s.q('#kp-prev').innerHTML = waBubble(p.nama, waPesan(p.id_penghuni, jenis)); };
  prev();
  segmen(s.q('#kp-jenis'), v => { jenis = v; prev(); });
  s.q('[data-x]').onclick = () => s.close();
  s.q('[data-ok]').onclick = async () => {
    const r = await App.run('waKirim', { jenis: jenis, penerima: [p.id_penghuni] }, { busy: 'Mengirim via Fonnte...' });
    if (r) { s.close(); if (r.wa) UI.waInfo = r.wa; UI.waRiwayat = null; }
  };
};

/* ============================================================
   WHATSAPP
   ============================================================ */
Pages.wa = (args, q) => {
  if (q.tab) UI.waTab = q.tab;
  if (q.pilih === 'menunggak') { UI.waTab = 'pengingat'; UI.waFilter = 'menunggak'; UI.waJenis = 'teguran'; UI.waPilih = null; }
  if (q.tab || q.pilih) history.replaceState(null, '', '#/wa');
  const set = D.set();
  view(
    '<div class="page-head"><div><div class="eyebrow">LAYANAN OTOMATIS</div><h1 class="h-xl">Pusat Pesan WhatsApp</h1><p>Pengingat tagihan, teguran, & siaran pengumuman</p></div>' +
    '<span class="chip ' + (set.wa_token_terpasang ? 'chip-success' : 'chip-danger') + '"><span class="status-dot ' + (set.wa_token_terpasang ? 'on' : 'off') + '"></span>' + (set.wa_token_terpasang ? 'Server Aktif' : 'Belum Diatur') + '</span></div>' +
    '<div id="wa-gateway"></div>' +
    '<div class="tabs mt-16 mb-16">' + [['pengingat', 'Pengingat Tagihan'], ['blast', 'Broadcast'], ['riwayat', 'Riwayat Kirim']].map(t => '<button class="tab ' + (UI.waTab === t[0] ? 'active' : '') + '" data-act="waTab" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    '<div id="wa-isi"></div>'
  );
  renderGateway();
  if (!UI.waInfo) Api.call('waInfo').then(r => { UI.waInfo = r.wa; if (App.route.page === 'wa') renderGateway(); }).catch(() => {});
  renderWaTab();
};

function renderGateway() {
  const el = document.getElementById('wa-gateway');
  if (!el) return;
  const set = D.set(), w = UI.waInfo;
  const pct = w ? Math.min(100, w.terkirim / w.batas * 100) : 0;
  const reset = U.addMonths(U.today().slice(0, 7), 1);
  el.innerHTML = '<div class="card"><div class="row-between row-top"><div class="row"><div class="icon-box">' + ic('wa') + '</div><div><div class="semi row">Fonnte Gateway <span class="status-dot ' + (set.wa_token_terpasang ? 'on' : 'off') + '"></span></div>' +
    '<div class="small muted">' + (set.wa_token_terpasang ? 'Token terpasang · paket Free (teks saja)' : 'Token belum diisi') + '</div></div></div>' +
    '<button class="btn btn-secondary btn-sm btn-pill" data-act="waCek">' + ic('wifi', 'ic-sm') + 'Cek Sinyal</button></div>' +
    '<div id="wa-sinyal"></div>' +
    '<div class="row-between mt-16"><span class="small semi muted">Kuota Terpakai Bulan Ini</span><span><b class="h-md c-primary rp">' + (w ? w.terkirim : '…') + '</b><span class="muted"> / ' + (w ? U.numFmt(w.batas) : '1.000') + ' Pesan</span></span></div>' +
    '<div class="progress mt-8 ' + (pct >= 80 ? 'amber' : '') + '"><span style="width:' + pct + '%"></span></div>' +
    '<div class="row-between small muted mt-8"><span class="row">' + ic('info', 'ic-xs') + (w ? w.sisa + ' pesan tersisa' + (w.antre ? ' · ' + w.antre + ' dalam antrean' : '') : 'Memuat…') + '</span><span class="semi">Reset 1 ' + U.bulan(reset) + '</span></div>' +
    (w && pct >= 80 ? '<div class="banner amber mt-12">' + ic('alert') + '<div>Kuota sudah terpakai <b>' + Math.round(pct) + '%</b>. Prioritaskan pengingat tagihan menunggak.</div></div>' : '') +
    (!set.wa_token_terpasang && D.owner() ? '<button class="btn btn-primary btn-block mt-12" data-go="#/pengaturan">' + ic('key', 'ic-sm') + 'Isi Token Fonnte di Pengaturan</button>' : '') + '</div>';
}

Act.waCek = async () => {
  const r = await App.run('waCekKoneksi', {}, { busy: 'Menghubungi Fonnte...', toast: false });
  const el = document.getElementById('wa-sinyal');
  if (r && el) {
    const k = r.koneksi;
    el.innerHTML = '<div class="banner ' + (k.terhubung ? '' : 'danger') + ' mt-12">' + ic(k.terhubung ? 'checkCircle' : 'alert') + '<div><b>' + U.esc(k.pesan) + '</b>' +
      (k.nomor ? '<br>Nomor: +' + U.esc(k.nomor) + (k.paket ? ' · Paket ' + U.esc(k.paket) : '') + (k.kuota ? ' · Kuota Fonnte: ' + U.esc(k.kuota) : '') : '') + '</div></div>';
  }
};

Act.waTab = el => { UI.waTab = el.dataset.t; document.querySelectorAll('[data-act=waTab]').forEach(b => b.classList.toggle('active', b === el)); renderWaTab(); };

function renderWaTab() {
  if (UI.waTab === 'blast') return renderBlast();
  if (UI.waTab === 'riwayat') return renderRiwayat();
  return renderPengingat();
}

function kandidatPengingat() {
  return (App.S.penghuni || []).filter(p => p.status === 'Aktif').map(p => ({ p: p, st: D.status(p) })).filter(x => ['menunggak', 'jatuh', 'segera'].includes(x.st.kind));
}

function renderPengingat() {
  const el = document.getElementById('wa-isi');
  const set = D.set(), owner = D.owner();
  const semua = kandidatPengingat();
  const fil = { menunggak: x => x.st.kind === 'menunggak', jatuh: x => x.st.kind === 'jatuh' || x.st.kind === 'segera', semua: () => true };
  const list = semua.filter(fil[UI.waFilter] || fil.semua).sort((a, b) => (b.st.hari || 0) - (a.st.hari || 0));
  if (!UI.waPilih) UI.waPilih = new Set(list.map(x => x.p.id_penghuni));
  const ids = list.map(x => x.p.id_penghuni);
  const dipilih = ids.filter(id => UI.waPilih.has(id));
  const pertama = dipilih[0] ? D.penghuni(dipilih[0]) : null;
  const N = set.hari_pengingat || 3;

  el.innerHTML =
    '<div class="card"><div class="row-between"><div class="row"><div class="icon-box">' + ic('clock') + '</div><div><div class="semi">Auto-Reminder Pintar</div><div class="small muted">Jadwal H-' + U.esc(N) + ', Hari H, & H+3 tempo</div></div></div>' +
    '<label class="toggle"><input type="checkbox" id="auto-rem" ' + (set.pengingat_otomatis === 'Ya' ? 'checked' : '') + ' ' + (owner ? '' : 'disabled') + '><span class="slider"></span></label></div>' +
    '<div class="card-flat mt-12 small muted">Pesan dikirim bertahap setiap hari pukul ' + U.esc(set.jam_kirim_pengingat || '09:00') + ' ' + U.esc(set.zona_waktu || 'WIB') + ' dengan jeda ±' + U.esc(set.jeda_kirim_detik || 15) + ' detik agar tidak dianggap spam oleh WhatsApp.' + (owner ? '' : ' Hanya Owner yang dapat mengubah pengaturan ini.') + '</div></div>' +

    '<div class="section-head mt-16"><div class="h-sm">Pilih Penerima Target</div>' + (list.length ? '<button class="link-btn" data-act="waPilihSemua">' + (dipilih.length === list.length ? 'Hapus Pilihan' : 'Pilih Semua') + '</button>' : '') + '</div>' +
    filterChips([
      { id: 'menunggak', label: 'Menunggak', n: semua.filter(fil.menunggak).length },
      { id: 'jatuh', label: 'Jatuh Tempo', n: semua.filter(fil.jatuh).length },
      { id: 'semua', label: 'Semua Tagihan', n: semua.length }
    ], UI.waFilter, 'waFilter') +
    '<div class="two-col"><div>' +
    (list.length ? list.map(x => {
      const p = x.p, k = D.kamar(p.id_kamar) || {};
      return '<label class="recipient ' + (UI.waPilih.has(p.id_penghuni) ? 'on' : '') + '"><input type="checkbox" data-pilih="' + p.id_penghuni + '" ' + (UI.waPilih.has(p.id_penghuni) ? 'checked' : '') + '>' +
        '<div class="grow"><div class="row"><span class="semi ellipsis">' + U.esc(p.nama) + '</span><span class="chip ' + x.st.cls + '">' + U.esc(x.st.short) + '</span></div>' +
        '<div class="small muted">Kamar ' + U.esc(k.nomor_kamar || '-') + ' • ' + x.st.items.map(t => U.bulanPendek(t.periode)).join(', ') + ' • tempo ' + U.tgl(x.st.items[0].jatuh_tempo) + '</div></div>' +
        '<div class="semi rp">' + U.rp(x.st.total) + '</div></label>';
    }).join('') : '<div class="card">' + emptyState('checkCircle', 'Tidak ada penerima', 'Tidak ada tagihan pada kategori ini.') + '</div>') +
    '</div><div>' +
    '<div class="card' + (list.length ? '' : ' mt-12') + '"><div class="row-between mb-12"><div class="h-sm">Template Pesan</div>' + (owner ? '<button class="link-btn" data-go="#/pengaturan?s=template">Ubah Teks</button>' : '') + '</div>' +
    '<div class="seg light mb-12" id="wa-jenis"><button type="button" data-v="pengingat" class="' + (UI.waJenis === 'pengingat' ? 'active' : '') + '">Tagihan Sopan</button><button type="button" data-v="teguran" class="' + (UI.waJenis === 'teguran' ? 'active' : '') + '">Teguran Menunggak</button></div>' +
    '<div class="small muted mb-8">Pratinjau untuk: ' + (pertama ? U.esc(pertama.nama) : '-') + '</div>' +
    waBubble(pertama ? pertama.nama : 'Penghuni', pertama ? waPesan(pertama.id_penghuni, UI.waJenis) : '') + '</div>' +
    '<div class="banner mt-12">' + ic('shield') + '<div><b>Aman dari blokir WhatsApp.</b> Sistem memberi jeda antarpengiriman untuk melindungi nomor pengelola kost.</div></div>' +
    '</div></div>' +
    '<div class="send-bar"><div><div class="semi">' + dipilih.length + ' Penerima Dipilih</div><div class="small muted">Estimasi kuota: ' + dipilih.length + ' pesan</div></div>' +
    '<button class="btn btn-primary btn-pill" data-act="waKirimPengingat" ' + (dipilih.length ? '' : 'disabled') + '>' + ic('send', 'ic-sm') + 'Kirim Sekarang</button></div>';

  el.querySelectorAll('[data-pilih]').forEach(c => c.addEventListener('change', () => {
    if (c.checked) UI.waPilih.add(c.dataset.pilih); else UI.waPilih.delete(c.dataset.pilih);
    renderPengingat();
  }));
  segmen(document.getElementById('wa-jenis'), v => { UI.waJenis = v; renderPengingat(); });
  const ar = document.getElementById('auto-rem');
  if (ar && owner) ar.addEventListener('change', async () => {
    const r = await App.run('pengaturanSimpan', { nilai: { pengingat_otomatis: ar.checked ? 'Ya' : 'Tidak' } }, { ok: 'Pengingat otomatis ' + (ar.checked ? 'diaktifkan' : 'dimatikan') + '.' });
    if (!r) ar.checked = !ar.checked;
  });
}

Act.waFilter = el => { UI.waFilter = el.dataset.f; UI.waPilih = null; UI.waJenis = el.dataset.f === 'menunggak' ? 'teguran' : 'pengingat'; renderPengingat(); };
Act.waPilihSemua = () => {
  const ids = Array.from(document.querySelectorAll('[data-pilih]')).map(c => c.dataset.pilih);
  const semua = ids.every(id => UI.waPilih.has(id));
  ids.forEach(id => semua ? UI.waPilih.delete(id) : UI.waPilih.add(id));
  renderPengingat();
};

async function konfirmasiKirim(n, label) {
  const w = UI.waInfo;
  const jeda = Number(D.set().jeda_kirim_detik) || 15;
  if (w && n > w.sisa) {
    U.alert('Kuota tidak cukup', 'Sisa kuota bulan ini <b>' + w.sisa + ' pesan</b>, sedangkan penerima <b>' + n + '</b>. Kurangi jumlah penerima terlebih dahulu.');
    return false;
  }
  return U.confirm({
    title: 'Kirim ' + label + ' ke ' + n + ' penerima?',
    html: 'Memakai <b>' + n + '</b> kuota pesan' + (w ? ' (sisa ' + w.sisa + ')' : '') + '.' + (n > 1 ? ' Pesan dikirim bertahap dengan jeda ±' + jeda + ' detik, estimasi selesai <b>' + Math.ceil(n * jeda / 60) + ' menit</b>. Anda boleh menutup aplikasi.' : ''),
    ok: 'Kirim Sekarang'
  });
}

Act.waKirimPengingat = async () => {
  const ids = Array.from(document.querySelectorAll('[data-pilih]:checked')).map(c => c.dataset.pilih);
  if (!ids.length) return;
  if (!(await konfirmasiKirim(ids.length, UI.waJenis === 'teguran' ? 'teguran' : 'pengingat'))) return;
  const r = await App.run('waKirim', { jenis: UI.waJenis, penerima: ids }, { busy: ids.length > 1 ? 'Menyiapkan antrean...' : 'Mengirim...' });
  if (r) { if (r.wa) UI.waInfo = r.wa; UI.waRiwayat = null; renderGateway(); }
};

/* ---------- Broadcast ---------- */
function renderBlast() {
  const el = document.getElementById('wa-isi');
  const B = UI.blast;
  const aktif = (App.S.penghuni || []).filter(p => p.status === 'Aktif').sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  const target = B.mode === 'semua' ? aktif.map(p => p.id_penghuni) : aktif.filter(p => B.pilih.has(p.id_penghuni)).map(p => p.id_penghuni);
  const contoh = D.penghuni(target[0]) || aktif[0];
  const preview = contoh ? isiTemplate(B.teks, Object.assign(varsRek(), { nama: contoh.nama, kamar: (D.kamar(contoh.id_kamar) || {}).nomor_kamar || '-' })) : B.teks;
  el.innerHTML = '<div class="two-col"><div>' +
    '<div class="card"><div class="h-sm mb-12">Tulis Pengumuman</div>' +
    '<div class="var-chips mb-8">' + ['nama', 'kamar', 'nama_kost', 'bank_tujuan', 'no_rekening', 'atas_nama'].map(v => '<button type="button" class="var-chip" data-var="{' + v + '}">{' + v + '}</button>').join('') + '</div>' +
    '<textarea class="textarea" id="blast-teks" maxlength="2000" style="min-height:170px" placeholder="Tulis pesan...">' + U.esc(B.teks) + '</textarea>' +
    '<div class="row-between small muted mt-8"><span>Format: *tebal*, _miring_, ~coret~</span><span id="blast-len">' + B.teks.length + '/2000</span></div></div>' +
    '<div class="card"><div class="h-sm mb-12">Penerima</div><div class="seg light mb-12" id="blast-mode"><button type="button" data-v="semua" class="' + (B.mode === 'semua' ? 'active' : '') + '">Semua Penghuni Aktif (' + aktif.length + ')</button><button type="button" data-v="pilih" class="' + (B.mode === 'pilih' ? 'active' : '') + '">Pilih Manual</button></div>' +
    (B.mode === 'pilih' ? aktif.map(p => '<label class="recipient ' + (B.pilih.has(p.id_penghuni) ? 'on' : '') + '"><input type="checkbox" data-bp="' + p.id_penghuni + '" ' + (B.pilih.has(p.id_penghuni) ? 'checked' : '') + '><div class="grow"><div class="semi">' + U.esc(p.nama) + '</div><div class="small muted">Kamar ' + U.esc((D.kamar(p.id_kamar) || {}).nomor_kamar || '-') + ' · ' + U.waFmt(p.no_wa) + '</div></div></label>').join('') : '<div class="small muted">Pesan dikirim ke seluruh ' + aktif.length + ' penghuni aktif.</div>') +
    '</div></div><div>' +
    '<div class="card"><div class="h-sm mb-12">Pratinjau Chat</div>' + waBubble(contoh ? contoh.nama : 'Penghuni', preview) + '</div>' +
    '<div class="banner amber mt-12">' + ic('info') + '<div>Paket Free Fonnte <b>tidak mendukung lampiran</b>. Kirim teks saja; berkas diserahkan langsung.</div></div>' +
    '</div></div>' +
    '<div class="send-bar"><div><div class="semi">' + target.length + ' Penerima</div><div class="small muted">Estimasi kuota: ' + target.length + ' pesan</div></div>' +
    '<button class="btn btn-primary btn-pill" data-act="waKirimBlast" ' + (target.length ? '' : 'disabled') + '>' + ic('megaphone', 'ic-sm') + 'Kirim Broadcast</button></div>';

  const ta = document.getElementById('blast-teks');
  ta.addEventListener('input', U.debounce(() => { B.teks = ta.value; const pos = ta.selectionStart; renderBlast(); const t2 = document.getElementById('blast-teks'); t2.focus(); t2.setSelectionRange(pos, pos); }, 400));
  el.querySelectorAll('[data-var]').forEach(b => b.addEventListener('click', () => {
    const pos = ta.selectionStart || ta.value.length;
    B.teks = ta.value.slice(0, pos) + b.dataset.var + ta.value.slice(ta.selectionEnd || pos);
    renderBlast();
  }));
  segmen(document.getElementById('blast-mode'), v => { B.mode = v; renderBlast(); });
  el.querySelectorAll('[data-bp]').forEach(c => c.addEventListener('change', () => { if (c.checked) B.pilih.add(c.dataset.bp); else B.pilih.delete(c.dataset.bp); renderBlast(); }));
}

Act.waKirimBlast = async () => {
  const B = UI.blast;
  B.teks = document.getElementById('blast-teks').value;
  if (B.teks.trim().length < 5) return U.toast('Isi pesan broadcast terlalu pendek.', 'error');
  const aktif = (App.S.penghuni || []).filter(p => p.status === 'Aktif');
  const ids = B.mode === 'semua' ? aktif.map(p => p.id_penghuni) : aktif.filter(p => B.pilih.has(p.id_penghuni)).map(p => p.id_penghuni);
  if (!(await konfirmasiKirim(ids.length, 'broadcast'))) return;
  const r = await App.run('waKirim', { jenis: 'blast', pesan: B.teks, penerima: ids }, { busy: 'Menyiapkan antrean...' });
  if (r) { if (r.wa) UI.waInfo = r.wa; UI.waRiwayat = null; renderGateway(); }
};

/* ---------- Riwayat ---------- */
function renderRiwayat() {
  const el = document.getElementById('wa-isi');
  if (!UI.waRiwayat) {
    el.innerHTML = '<div class="skeleton" style="height:70px"></div><div class="skeleton mt-8" style="height:70px"></div><div class="skeleton mt-8" style="height:70px"></div>';
    Api.call('waRiwayat', {}).then(r => { UI.waRiwayat = r.riwayat; UI.waInfo = r.wa; if (App.route.page === 'wa' && UI.waTab === 'riwayat') { renderGateway(); renderRiwayat(); } })
      .catch(e => { el.innerHTML = '<div class="banner danger">' + ic('alert') + U.esc(e.message) + '</div>'; });
    return;
  }
  const all = UI.waRiwayat;
  const list = all.filter(l => !UI.waRiwayatF || l.status_kirim === UI.waRiwayatF);
  const n = s => all.filter(l => l.status_kirim === s).length;
  const chip = s => s === 'Terkirim' ? '<span class="chip chip-success">' + ic('check') + 'Terkirim</span>' : s === 'Antre' ? '<span class="chip chip-info">' + ic('clock') + 'Antre</span>' : '<span class="chip chip-danger">' + ic('alert') + 'Gagal</span>';
  el.innerHTML = '<div class="row-between">' + filterChips([
    { id: '', label: 'Semua', n: all.length }, { id: 'Terkirim', label: 'Terkirim', n: n('Terkirim') }, { id: 'Antre', label: 'Antre', n: n('Antre') }, { id: 'Gagal', label: 'Gagal', n: n('Gagal') }
  ], UI.waRiwayatF, 'waRiwayatF') + '<button class="btn btn-ghost btn-sm btn-icon" data-act="waRiwayatRefresh" aria-label="Muat ulang" style="flex-shrink:0;margin-bottom:10px">' + ic('refresh', 'ic-sm') + '</button></div>' +
    '<div class="card">' + (list.length ? list.map(l => '<div class="list-item row-top"><div class="avatar sm ' + U.avClass(l.nama) + '">' + U.esc(U.initials(l.nama)) + '</div><div class="grow" style="min-width:0">' +
      '<div class="row-between"><span class="semi ellipsis">' + U.esc(l.nama) + '</span>' + chip(l.status_kirim) + '</div>' +
      '<div class="small muted">' + U.esc(l.jenis) + ' · ' + U.waktu(l.waktu) + ' · oleh ' + U.esc(l.dikirim_oleh) + '</div>' +
      '<details class="mt-8"><summary class="small c-primary" style="cursor:pointer">Lihat isi pesan</summary><div class="card-flat small mt-8" style="white-space:pre-wrap">' + waFormat(l.isi_pesan) + '</div></details>' +
      (l.status_kirim === 'Gagal' ? '<div class="row-between mt-8"><span class="small c-danger">' + U.esc(l.keterangan) + '</span><button class="btn btn-secondary btn-sm" data-act="waUlang" data-id="' + l.id_log + '">' + ic('refresh', 'ic-sm') + 'Kirim Ulang</button></div>' : '') +
      '</div></div>').join('') : emptyState('chat', 'Belum ada riwayat', 'Pesan yang dikirim akan tercatat di sini.')) + '</div>';
}
Act.waRiwayatF = el => { UI.waRiwayatF = el.dataset.f; renderRiwayat(); };
Act.waRiwayatRefresh = () => { UI.waRiwayat = null; renderRiwayat(); };
Act.waUlang = async el => {
  const r = await App.run('waKirimUlang', { id_log: el.dataset.id }, { busy: 'Mengirim ulang...' });
  if (r) { UI.waRiwayat = null; UI.waInfo = null; Pages.wa([], {}); }
};

/* ============================================================
   SURAT PERJANJIAN
   ============================================================ */
Pages.surat = (args, q) => {
  if (args[0] === 'template') return suratTemplate();
  if (q.kontrak) { UI.suratTab = 'buat'; UI.suratPilih = q.kontrak; UI.suratHtml = null; UI.suratFileBaru = null; }
  if (q.f) { UI.suratTab = 'arsip'; UI.suratF = q.f; }
  if (q.kontrak || q.f) history.replaceState(null, '', '#/surat');
  const owner = D.owner();
  const today = U.today();
  const all = (App.S.kontrak || []);
  const aktif = all.filter(k => k.status === 'Aktif');
  const akhir = aktif.filter(k => U.diff(today, k.tanggal_keluar) <= 30);
  view(
    '<div class="page-head"><div><div class="eyebrow">' + ic('shield', 'ic-xs') + 'DOKUMEN HUKUM & ADMINISTRASI</div><h1 class="h-xl">Surat Perjanjian Sewa</h1><p>Kelola keabsahan kontrak hunian & masa berlaku sewa</p></div>' +
    (owner ? '<button class="btn btn-secondary btn-icon" data-go="#/surat/template" title="Edit template" aria-label="Edit template">' + ic('sign') + '</button>' : '') + '</div>' +
    '<div class="tabs dark mb-16"><button class="tab ' + (UI.suratTab === 'buat' ? 'active' : '') + '" data-act="suratTab" data-t="buat">' + ic('filePlus', 'ic-sm') + 'Buat Surat Baru</button>' +
    '<button class="tab ' + (UI.suratTab === 'arsip' ? 'active' : '') + '" data-act="suratTab" data-t="arsip">' + ic('archive', 'ic-sm') + 'Arsip Surat <span class="n">' + all.length + '</span></button></div>' +
    '<div class="grid-3 mb-16">' +
      '<div class="stat" data-act="suratFilter" data-f="aktif" style="padding:12px"><div class="top">' + ic('checkCircle', 'ic-sm') + '<span class="status-dot on"></span></div><div class="h-lg mt-8">' + aktif.length + '</div><div class="small semi">Surat Aktif</div></div>' +
      '<div class="stat" data-act="suratFilter" data-f="akhir" style="padding:12px"><div class="top"><span class="c-amber">' + ic('bell', 'ic-sm') + '</span><span class="chip chip-amber">H-30</span></div><div class="h-lg mt-8 c-amber">' + akhir.length + '</div><div class="small semi">Mendekati Akhir</div></div>' +
      '<div class="stat" data-act="suratFilter" data-f="selesai" style="padding:12px"><div class="top">' + ic('archive', 'ic-sm') + '</div><div class="h-lg mt-8">' + (all.length - aktif.length) + '</div><div class="small semi">Selesai</div></div>' +
    '</div>' +
    '<div id="surat-isi"></div>'
  );
  if (UI.suratTab === 'buat') renderSuratBuat(); else renderSuratArsip();
};

Act.suratTab = el => { UI.suratTab = el.dataset.t; Pages.surat([], {}); };
Act.suratFilter = el => { UI.suratTab = 'arsip'; UI.suratF = el.dataset.f; Pages.surat([], {}); };

function renderSuratArsip() {
  const today = U.today();
  const q = U.norm(UI.suratQ);
  const all = (App.S.kontrak || []).slice().sort((a, b) => (a.status === 'Aktif' ? 0 : 1) - (b.status === 'Aktif' ? 0 : 1) || String(b.tanggal_masuk).localeCompare(a.tanggal_masuk));
  const kat = k => k.status !== 'Aktif' ? 'selesai' : U.diff(today, k.tanggal_keluar) <= 30 ? 'akhir' : 'aktif';
  const f = UI.suratF;
  const list = all.filter(k => (f === 'semua' || (f === 'belum' ? !k.id_file_surat_pdf : (f === 'aktif' ? k.status === 'Aktif' : kat(k) === f))) &&
    (!q || U.norm([k.nomor_surat, (D.penghuni(k.id_penghuni) || {}).nama, (D.kamar(k.id_kamar) || {}).nomor_kamar].join(' ')).includes(q)));
  document.getElementById('surat-isi').innerHTML =
    '<div class="input-icon mb-12">' + ic('search') + '<input class="input" id="surat-q" placeholder="Cari no. surat, nama, kamar..." value="' + U.esc(UI.suratQ) + '"></div>' +
    filterChips([{ id: 'semua', label: 'Semua', n: all.length }, { id: 'aktif', label: 'Aktif Berjalan', n: all.filter(k => k.status === 'Aktif').length }, { id: 'akhir', label: 'Perlu Diperpanjang', n: all.filter(k => kat(k) === 'akhir').length, dot: '#F2B544' }, { id: 'belum', label: 'Belum Ada PDF', n: all.filter(k => !k.id_file_surat_pdf).length }, { id: 'selesai', label: 'Selesai', n: all.filter(k => kat(k) === 'selesai').length }], f, 'suratF') +
    '<div class="grid-cards">' + (list.length ? list.map(k => suratCard(k, kat(k))).join('') : '<div class="card" style="grid-column:1/-1">' + emptyState('file', 'Tidak ada kontrak', 'Kontrak dibuat otomatis saat menambah penghuni baru.') + '</div>') + '</div>';
  const inp = document.getElementById('surat-q');
  inp.addEventListener('input', U.debounce(() => { UI.suratQ = inp.value; const pos = inp.selectionStart; renderSuratArsip(); const i2 = document.getElementById('surat-q'); i2.focus(); i2.setSelectionRange(pos, pos); }, 250));
}
Act.suratF = el => { UI.suratF = el.dataset.f; renderSuratArsip(); };

function suratCard(k, kat) {
  const p = D.penghuni(k.id_penghuni) || { nama: '(penghuni terhapus)' };
  const km = D.kamar(k.id_kamar) || {};
  const sisa = U.diff(U.today(), k.tanggal_keluar);
  const sisaTxt = sisa > 60 ? Math.round(sisa / 30) + ' Bulan' : Math.max(0, sisa) + ' Hari';
  const tone = kat === 'akhir' ? 'amber' : kat === 'selesai' ? 'muted' : '';
  const eyebrow = kat === 'akhir' ? '<span class="xs c-amber">SEGERA BERAKHIR</span>' : kat === 'selesai' ? '<span class="xs muted">ARSIP SELESAI</span>' : '<span class="xs muted">KONTRAK ' + (k.durasi_bulan >= 12 ? 'TAHUNAN' : 'RESMI') + '</span>';
  const chip = kat === 'akhir' ? '<span class="chip chip-amber">' + ic('clock') + 'Perlu Perpanjangan</span>' : kat === 'selesai' ? '<span class="chip">' + ic('archive') + 'Kontrak Selesai</span>' : '<span class="chip chip-primary">' + ic('checkCircle') + 'Berlaku / Aktif</span>';
  return '<div class="card accent-left ' + tone + '"><div class="row-between row-top"><div class="row row-top"><div class="icon-box ' + (kat === 'akhir' ? 'amber' : '') + '">' + ic(kat === 'selesai' ? 'archive' : 'file') + '</div><div>' + eyebrow +
    '<div class="contract-no">' + U.esc(k.nomor_surat || 'Draf belum dibuat') + '</div></div></div>' + chip + '</div>' +
    '<div class="tenant-strip mt-12"><div class="avatar sm ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow"><div class="semi ellipsis">' + U.esc(p.nama) + '</div><div class="small muted">' + ic('door', 'ic-xs') + ' Kamar ' + U.esc(km.nomor_kamar || '-') + (km.lantai ? ' • Lantai ' + U.esc(km.lantai) : '') + '</div></div>' +
    (kat !== 'selesai' ? '<div class="right"><div class="small muted">Sisa Masa Sewa</div><div class="semi ' + (kat === 'akhir' ? 'c-amber' : 'c-primary') + '">' + sisaTxt + '</div></div>' : '<div class="right small muted">Status Unit<br><b>Check-out</b></div>') + '</div>' +
    '<div class="row-between small muted mt-12"><span class="row">' + ic('calendar', 'ic-xs') + U.tgl(k.tanggal_masuk) + ' – ' + U.tgl(k.tanggal_keluar) + '</span><span class="row">' + ic('shield', 'ic-xs') + 'Deposit ' + U.rp(k.deposit) + '</span></div>' +
    '<div class="small mt-8 row ' + (k.id_file_surat_pdf ? 'c-primary' : 'c-amber') + '">' + ic(k.id_file_surat_pdf ? 'file' : 'alert', 'ic-xs') + (k.id_file_surat_pdf ? 'Dokumen PDF · template v' + U.esc(k.versi_template || 1) + ' · tersimpan privat di Drive' : 'PDF belum dibuat') + '</div>' +
    '<div class="btn-row mt-12">' +
    (k.id_file_surat_pdf ? '<button class="btn btn-ghost btn-sm" data-act="lihatBerkas" data-id="' + U.esc(k.id_file_surat_pdf) + '" data-title="Surat ' + U.esc(k.nomor_surat || '') + '">' + ic('eye', 'ic-sm') + 'Lihat PDF</button>' : '') +
    (kat !== 'selesai' ? '<button class="btn btn-' + (k.id_file_surat_pdf ? 'ghost btn-icon' : 'primary') + ' btn-sm" data-act="suratBuatDari" data-id="' + k.id_kontrak + '" title="' + (k.id_file_surat_pdf ? 'Buat ulang' : 'Buat PDF') + '">' + ic(k.id_file_surat_pdf ? 'refresh' : 'filePlus', 'ic-sm') + (k.id_file_surat_pdf ? '' : 'Buat PDF') + '</button>' : '') +
    (kat === 'akhir' ? '<button class="btn btn-primary btn-sm" data-act="perpanjang" data-id="' + k.id_kontrak + '">' + ic('repeat', 'ic-sm') + 'Perpanjang</button>' : '') +
    '</div></div>';
}

Act.suratBuatDari = el => { UI.suratTab = 'buat'; UI.suratPilih = el.dataset.id; UI.suratHtml = null; UI.suratFileBaru = null; Pages.surat([], {}); };

function renderSuratBuat() {
  const el = document.getElementById('surat-isi');
  const aktif = (App.S.kontrak || []).filter(k => k.status === 'Aktif');
  if (!aktif.length) { el.innerHTML = '<div class="card">' + emptyState('file', 'Belum ada kontrak aktif', 'Daftarkan penghuni baru terlebih dahulu.', '<button class="btn btn-primary" data-go="#/penghuni/baru">' + ic('userPlus', 'ic-sm') + 'Tambah Penghuni</button>') + '</div>'; return; }
  if (!UI.suratPilih || !aktif.some(k => k.id_kontrak === UI.suratPilih)) UI.suratPilih = aktif[0].id_kontrak;
  const k = D.kontrak(UI.suratPilih);
  const p = D.penghuni(k.id_penghuni) || {};
  const km = D.kamar(k.id_kamar) || {};
  const step = UI.suratFileBaru ? 3 : UI.suratHtml ? 2 : 1;
  const stp = (n, t) => '<div class="step ' + (step > n ? 'done' : step === n ? 'on' : '') + '"><span class="n">' + (step > n ? ic('check', 'ic-xs') : n) + '</span>' + t + '</div>';
  el.innerHTML = '<div class="steps">' + stp(1, 'Pilih Penghuni') + '<div class="step-line"></div>' + stp(2, 'Pratinjau') + '<div class="step-line"></div>' + stp(3, 'Unduh PDF') + '</div>' +
    '<div class="two-col"><div>' +
    '<div class="card"><div class="field"><label>Kontrak Penghuni</label><select class="select" id="surat-kontrak">' + aktif.map(x => { const pp = D.penghuni(x.id_penghuni) || {}; return '<option value="' + x.id_kontrak + '" ' + (x.id_kontrak === k.id_kontrak ? 'selected' : '') + '>' + U.esc(pp.nama) + ' — Kamar ' + U.esc((D.kamar(x.id_kamar) || {}).nomor_kamar || '-') + '</option>'; }).join('') + '</select></div>' +
    '<div class="row"><div class="avatar ' + U.avClass(p.nama) + '">' + U.esc(U.initials(p.nama)) + '</div><div class="grow"><div class="h-sm">' + U.esc(p.nama) + '</div><div class="small muted num">NIK: ' + U.esc(p.no_ktp || '-') + '</div></div></div>' +
    '<div class="grid-2 mt-12"><div class="card-flat"><div class="xs muted">KAMAR KOST</div><div class="semi">Kamar ' + U.esc(km.nomor_kamar || '-') + (km.lantai ? ' (Lt. ' + U.esc(km.lantai) + ')' : '') + '</div><div class="small c-primary">' + U.esc(km.tipe_unit || '') + '</div></div>' +
    '<div class="card-flat"><div class="xs muted">PERIODE SEWA</div><div class="semi small">' + U.tgl(k.tanggal_masuk) + ' – ' + U.tgl(k.tanggal_keluar) + '</div><div class="small c-primary">' + k.durasi_bulan + ' Bulan</div></div></div>' +
    '<div class="row-between mt-12"><div><div class="small muted">Tarif Sewa Bulanan</div><div class="money c-primary">' + U.rp(k.harga_sewa) + '<span class="small muted">/bln</span></div></div><div class="right"><div class="small muted">Deposit Jaminan</div><div class="semi rp">' + U.rp(k.deposit) + '</div></div></div>' +
    (k.id_file_surat_pdf ? '<div class="banner amber mt-12">' + ic('info', 'ic-sm') + '<div>Kontrak ini sudah memiliki PDF. Membuat ulang akan menyimpan versi baru; PDF lama tetap ada di Drive.</div></div>' : '') +
    '</div>' +
    (UI.suratFileBaru ? '<div class="card" style="background:var(--primary-tint);border-color:var(--primary-soft)"><div class="row"><div class="icon-box" style="background:var(--primary);color:#fff">' + ic('checkCircle') + '</div><div class="grow"><div class="semi">PDF berhasil dibuat</div><div class="small muted">Tersimpan di folder Surat_Perjanjian dan tertaut ke kontrak.</div></div></div>' +
      '<div class="btn-row mt-12"><button class="btn btn-ghost" data-act="lihatBerkas" data-id="' + U.esc(UI.suratFileBaru) + '" data-title="Surat Perjanjian">' + ic('eye', 'ic-sm') + 'Lihat</button><button class="btn btn-primary" data-act="suratUnduh" data-id="' + U.esc(UI.suratFileBaru) + '">' + ic('download', 'ic-sm') + 'Unduh PDF</button></div>' +
      '<div class="hint">' + ic('info', 'ic-xs') + 'Cetak, tandatangani di atas meterai, lalu serahkan ke penghuni (paket Free WA tidak bisa kirim lampiran).</div></div>' : '') +
    '<div class="banner mt-12">' + ic('shield') + '<div><b>Kekuatan pembuktian hukum.</b> Perjanjian sah bila memenuhi syarat Pasal 1320 KUH Perdata (sepakat, cakap, objek tertentu, sebab halal) dan ditandatangani kedua pihak.</div></div>' +
    '</div><div>' +
    '<div class="row-between mb-8"><div class="xs muted">PRATINJAU LEMBAR A4</div>' + (D.owner() ? '<button class="link-btn" data-go="#/surat/template">' + ic('pencil', 'ic-xs') + 'Edit Template</button>' : '') + '</div>' +
    '<div id="surat-preview">' + (UI.suratHtml ? '<div class="a4">' + UI.suratHtml + '</div>' : '<div class="card center" style="padding:32px 16px"><div class="icon-box" style="margin:0 auto 12px">' + ic('eye') + '</div><div class="semi">Lihat draf sebelum dibuat PDF</div><div class="small muted mb-12">Data penghuni & kontrak diisi otomatis dari template.</div><button class="btn btn-secondary" data-act="suratPreview">' + ic('eye', 'ic-sm') + 'Pratinjau Draf</button></div>') + '</div>' +
    '</div></div>' +
    '<div class="send-bar"><button class="btn btn-ghost" data-act="suratPreview">' + ic('eye', 'ic-sm') + '<span>Pratinjau</span></button><button class="btn btn-primary btn-pill" data-act="suratGenerate">' + ic('file', 'ic-sm') + 'Generate & Simpan PDF</button></div>';
  document.getElementById('surat-kontrak').onchange = e => { UI.suratPilih = e.target.value; UI.suratHtml = null; UI.suratFileBaru = null; renderSuratBuat(); };
}

Act.suratPreview = async () => {
  const r = await App.run('suratPreview', { id_kontrak: UI.suratPilih }, { busy: 'Menyusun draf...', toast: false });
  if (r) { UI.suratHtml = r.html; renderSuratBuat(); const pv = document.getElementById('surat-preview'); if (pv && window.innerWidth < 1024) pv.scrollIntoView({ behavior: 'smooth' }); }
};
Act.suratGenerate = async () => {
  const r = await App.run('suratGenerate', { id_kontrak: UI.suratPilih }, { busy: 'Membuat PDF di Google Drive...', timeout: 180000 });
  if (r) { UI.suratFileBaru = r.id_file; if (!UI.suratHtml) { const pv = await Api.call('suratPreview', { id_kontrak: UI.suratPilih }).catch(() => null); if (pv) UI.suratHtml = pv.html; } Pages.surat([], {}); }
};
Act.suratUnduh = async el => {
  U.busy(true, 'Mengunduh...');
  try { const f = await App.fileBlob(el.dataset.id); U.downloadBlob(f.blob, f.nama); }
  catch (e) { U.toast(e.message, 'error'); }
  finally { U.busy(false); }
};

/* ---------- Editor template surat (Owner) ---------- */
function suratTemplate() {
  if (!D.owner()) { view(emptyState('lock', 'Khusus Owner', 'Admin dapat membuat surat dari template, tetapi tidak dapat mengubah isinya.', '<button class="btn btn-primary" data-go="#/surat">Kembali</button>')); return; }
  view('<button class="link-btn mt-8" data-go="#/surat">' + ic('arrowLeft', 'ic-sm') + 'Surat Perjanjian</button><div class="page-head"><h1 class="h-xl">Editor Template Surat</h1></div><div class="skeleton" style="height:420px"></div>');
  Api.call('templateGet').then(r => { if (App.route.page === 'surat') renderEditorTemplate(r); })
    .catch(e => view(emptyState('alert', 'Gagal memuat template', U.esc(e.message))));
}

function renderEditorTemplate(r) {
  const t = r.template;
  const grup = {
    'Data Penyewa': ['nama_penyewa', 'no_ktp', 'alamat', 'no_wa', 'pekerjaan', 'kontak_darurat'],
    'Kamar & Kontrak': ['kamar', 'lantai', 'tipe_unit', 'fasilitas', 'harga_sewa', 'harga_sewa_terbilang', 'deposit', 'deposit_terbilang', 'tanggal_masuk', 'tanggal_keluar', 'durasi', 'tanggal_tagih', 'denda_per_hari', 'jam_malam'],
    'Info Kost & Surat': ['nama_pemilik', 'nama_kost', 'alamat_kost', 'kontak_kost', 'nomor_surat', 'tanggal_surat', 'hari_surat']
  };
  view(
    '<button class="link-btn mt-8" data-go="#/surat">' + ic('arrowLeft', 'ic-sm') + 'Surat Perjanjian</button>' +
    '<div class="page-head"><div><h1 class="h-xl">Editor Template Surat</h1><p>Versi aktif: <b>v' + t.versi + '</b> · diubah ' + U.esc(t.diubah_oleh) + (t.diubah_pada ? ' · ' + U.waktu(t.diubah_pada) : '') + '</p></div><span class="chip chip-amber">' + ic('lock', 'ic-xs') + 'Owner</span></div>' +
    '<div class="two-col"><div>' +
    '<div class="card"><div class="row-between mb-12"><div class="h-sm">Isi Template</div><div class="row">' +
      '<button type="button" class="btn btn-ghost btn-sm btn-icon" data-ins="## " title="Judul pasal">' + ic('heading', 'ic-sm') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm btn-icon" data-wrap="**" title="Tebal">' + ic('bold', 'ic-sm') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm btn-icon" data-ins="- " title="Butir">' + ic('list', 'ic-sm') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-ins="[TTD]" title="Blok tanda tangan">TTD</button></div></div>' +
      '<textarea class="textarea mono" id="tpl-isi" style="min-height:460px" spellcheck="false">' + U.esc(t.isi) + '</textarea>' +
      '<div class="small muted mt-8"><b>#</b> judul surat · <b>##</b> judul pasal · <b>- </b> butir · <b>**teks**</b> tebal · <b>[TTD]</b> kolom tanda tangan · <b>{placeholder}</b> diisi otomatis</div></div>' +
    '</div><div>' +
    '<div class="card"><div class="row-between mb-12"><div class="h-sm">Variabel Dinamis</div><span class="small muted">Ketuk untuk menyisipkan</span></div>' +
      Object.keys(grup).map(g => '<div class="xs muted mt-12 mb-8">' + g.toUpperCase() + '</div><div class="var-chips">' + grup[g].map(v => '<button type="button" class="var-chip" data-var="{' + v + '}">{' + v + '}</button>').join('') + '</div>').join('') + '</div>' +
    '<div class="card"><div class="h-sm mb-8">Riwayat Versi</div>' + (r.riwayat.length ? r.riwayat.slice(0, 8).map(x => '<div class="list-item"><span class="chip ' + (x.versi === t.versi ? 'chip-primary' : '') + '">v' + x.versi + '</span><div class="grow small">' + U.esc(x.diubah_oleh) + '</div><div class="small muted">' + U.waktu(x.diubah_pada) + '</div></div>').join('') : '<div class="small muted">Belum ada riwayat.</div>') +
    '<div class="banner mt-12">' + ic('info', 'ic-sm') + '<div>Menyimpan membuat <b>versi baru</b>. Surat PDF yang sudah dibuat tidak ikut berubah.</div></div></div>' +
    '</div></div>' +
    '<div class="form-actions"><button class="btn btn-ghost" data-act="tplPreview">' + ic('eye', 'ic-sm') + 'Pratinjau</button><button class="btn btn-primary" data-act="tplSimpan">' + ic('check', 'ic-sm') + 'Simpan Versi Baru</button></div>'
  );
  const ta = document.getElementById('tpl-isi');
  const sisip = (a, b) => {
    const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    ta.value = v.slice(0, s) + a + v.slice(s, e) + (b || '') + v.slice(e);
    ta.focus(); ta.setSelectionRange(s + a.length, e + a.length);
  };
  ta.closest('.two-col').addEventListener('click', e => {
    const v = e.target.closest('[data-var]'); if (v) return sisip(v.dataset.var);
    const i = e.target.closest('[data-ins]'); if (i) return sisip(i.dataset.ins);
    const w = e.target.closest('[data-wrap]'); if (w) return sisip(w.dataset.wrap, w.dataset.wrap);
  });
}

Act.tplPreview = async () => {
  const isi = document.getElementById('tpl-isi').value;
  const r = await App.run('suratPreview', { isi: isi }, { busy: 'Menyusun pratinjau...', toast: false });
  if (r) U.sheet({ title: 'Pratinjau Template', sub: 'Memakai data contoh', body: '<div class="a4">' + r.html + '</div>' });
};
Act.tplSimpan = async () => {
  if (!(await U.confirm({ title: 'Simpan sebagai versi baru?', message: 'Surat yang dibuat setelah ini memakai template baru. Surat lama tidak berubah.', ok: 'Simpan' }))) return;
  const r = await App.run('templateSimpan', { isi: document.getElementById('tpl-isi').value });
  if (r) suratTemplate();
};

/* ============================================================
   PENGATURAN (Owner)
   ============================================================ */
Pages.pengaturan = (args, q) => {
  const s = D.set();
  const F = { tpl: 'template_pesan_WA', logo: null, qris: null };
  const inp = (k, label, ph, extra) => '<div class="field"><label>' + label + '</label><input class="input" name="' + k + '" value="' + U.esc(s[k]) + '" placeholder="' + U.esc(ph || '') + '" ' + (extra || '') + '></div>';
  view(
    '<div class="page-head"><div><h1 class="h-xl">Pengaturan & Integrasi</h1><p>Profil kost, WhatsApp Gateway, otomasi, dan hak akses</p></div><span class="chip chip-primary">v' + U.esc((App.S.app || {}).versi || '1.0') + '</span></div>' +
    '<form id="set-form" novalidate><div class="two-col"><div>' +

    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('building', 'ic-sm') + '</div><div><div class="t">Profil Properti Kost</div><div class="s">Tampil di aplikasi, pesan WA, & kop surat</div></div></div>' +
      '<div class="row mb-16"><div class="brand-logo" style="width:56px;height:56px;border-radius:14px" id="logo-prev">' + (s.logo_url ? '<img data-img="' + U.esc(s.logo_url) + '" alt="">' : ic('building', 'ic-lg')) + '</div><button type="button" class="btn btn-ghost btn-sm" id="logo-pick">' + ic('upload', 'ic-sm') + 'Ganti Logo</button></div>' +
      '<div class="form-grid two">' + inp('nama_kost', 'Nama Kost', 'Kost Griya Harmoni', 'maxlength="80"') + inp('nama_pemilik', 'Nama Pemilik (Pihak Pertama)', 'Nama sesuai KTP', 'maxlength="80"') + '</div>' +
      inp('alamat', 'Alamat Lengkap', 'Jl. ...', 'maxlength="200"') +
      '<div class="form-grid two">' + inp('kontak', 'WhatsApp CS Pengelola', '0812...', 'maxlength="30"') + inp('nama_aplikasi', 'Nama Aplikasi', 'Kostku', 'maxlength="40"') + '</div>' +
      '<div class="form-grid two">' + inp('jam_malam', 'Jam Malam Tamu', '22:00', 'type="time"') +
      '<div class="field"><label>Denda Telat / Hari</label><div class="input-group"><span class="prefix">Rp</span><input class="input rp" name="denda_per_hari" data-money value="' + U.numFmt(s.denda_per_hari) + '"></div></div></div>' +
    '</div>' +

    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('bank', 'ic-sm') + '</div><div><div class="t">Rekening Kas & QRIS</div><div class="s">Disisipkan ke pesan tagihan WhatsApp</div></div></div>' +
      '<div class="form-grid two">' + inp('nama_bank', 'Bank Tujuan', 'BCA', 'maxlength="40"') + inp('no_rekening', 'Nomor Rekening', '8291...', 'maxlength="40" inputmode="numeric"') + '</div>' +
      inp('atas_nama', 'Atas Nama', 'Nama pemilik rekening', 'maxlength="80"') +
      '<div class="field"><label>QRIS Statis <span class="opt">Hanya tampil di aplikasi</span></label><div class="file-pill"><div class="thumb">' + ic('qr') + '</div><div class="grow small">' + (s.id_file_qris ? 'QRIS tersimpan' : 'Belum ada QRIS') + '<div class="muted" id="qris-nama"></div></div>' +
      (s.id_file_qris ? '<button type="button" class="btn btn-ghost btn-sm" data-act="lihatBerkas" data-id="' + U.esc(s.id_file_qris) + '" data-title="QRIS">' + ic('eye', 'ic-sm') + '</button>' : '') + '<button type="button" class="btn btn-secondary btn-sm" id="qris-pick">' + ic('upload', 'ic-sm') + 'Unggah</button></div></div>' +
    '</div>' +

    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('clock', 'ic-sm') + '</div><div class="grow"><div class="t">Otomasi Pengingat</div><div class="s">Trigger harian Google Apps Script</div></div>' +
      '<label class="toggle"><input type="checkbox" name="pengingat_otomatis" ' + (s.pengingat_otomatis === 'Ya' ? 'checked' : '') + '><span class="slider"></span></label></div>' +
      '<div class="form-grid two"><div class="field"><label>Kirim H-N Sebelum Tempo</label><select class="select" name="hari_pengingat">' + [1, 2, 3, 4, 5, 7, 10, 14].map(n => '<option ' + (String(n) === String(s.hari_pengingat) ? 'selected' : '') + ' value="' + n + '">H-' + n + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Jam Kirim</label><input type="time" class="input" name="jam_kirim_pengingat" value="' + U.esc(s.jam_kirim_pengingat) + '"></div></div>' +
      '<div class="form-grid two"><div class="field"><label>Zona Waktu</label><select class="select" name="zona_waktu">' + ['WIB', 'WITA', 'WIT'].map(z => '<option ' + (z === s.zona_waktu ? 'selected' : '') + '>' + z + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Jeda Antarpesan</label><div class="input-group"><input class="input" type="number" min="5" max="60" name="jeda_kirim_detik" value="' + U.esc(s.jeda_kirim_detik) + '"><span class="suffix">detik</span></div></div></div>' +
      '<div class="hint mb-16">' + ic('info', 'ic-xs') + 'Jadwal: H-N (pengingat), Hari H (pengingat), H+3 (teguran). Rekomendasi jeda 10–30 detik.</div>' +
    '</div>' +
    '</div><div>' +

    '<div class="form-section" id="sec-wa"><div class="form-section-head"><div class="icon-box sm">' + ic('wa', 'ic-sm') + '</div><div class="grow"><div class="t">WhatsApp Gateway (Fonnte)</div><div class="s">Paket Free · teks saja · ±1.000 pesan/bulan</div></div>' +
      '<span class="chip ' + (s.wa_token_terpasang ? 'chip-success' : 'chip-danger') + '">' + (s.wa_token_terpasang ? 'Terverifikasi' : 'Kosong') + '</span></div>' +
      '<div class="field"><label>API Token / Device Key</label><div class="row"><div class="input-icon grow">' + ic('key') + '<input class="input" type="password" id="tok-wa" autocomplete="off" placeholder="' + (s.wa_token_terpasang ? '•••••••••••• (tersimpan — isi untuk mengganti)' : 'Tempel token dari dashboard Fonnte') + '"></div>' +
      '<button type="button" class="btn btn-primary" data-act="simpanToken">Simpan</button></div>' +
      '<div class="hint">' + ic('lock', 'ic-xs') + 'Disimpan di Script Properties, tidak pernah ditampilkan lagi.</div></div>' +
      '<div class="form-grid two"><div class="field"><label>Batas Kuota / Bulan</label><input class="input" type="number" min="1" name="batas_kuota_wa_bulanan" value="' + U.esc(s.batas_kuota_wa_bulanan) + '"></div>' +
      '<div class="field"><label>&nbsp;</label><div class="row">' + (s.wa_token_terpasang ? '<button type="button" class="btn btn-ghost btn-sm grow" data-act="waCekSet">' + ic('wifi', 'ic-sm') + 'Uji Koneksi</button><button type="button" class="btn btn-danger btn-sm btn-icon" data-act="hapusToken" aria-label="Hapus token">' + ic('trash', 'ic-sm') + '</button>' : '') + '</div></div></div>' +
      '<div id="set-sinyal"></div>' +
    '</div>' +

    '<div class="form-section" id="sec-template"><div class="form-section-head"><div class="icon-box sm">' + ic('chat', 'ic-sm') + '</div><div><div class="t">Template Pesan WhatsApp</div><div class="s">Ketuk variabel untuk menyisipkan</div></div></div>' +
      '<div class="seg light mb-12" id="tpl-pick"><button type="button" data-v="template_pesan_WA" class="active">Pengingat</button><button type="button" data-v="template_teguran_WA">Teguran</button><button type="button" data-v="template_welcome_WA">Selamat Datang</button></div>' +
      '<div class="var-chips mb-8">' + ['nama', 'kamar', 'nominal', 'periode', 'tanggal_tagih', 'hari_telat', 'nama_kost', 'bank_tujuan', 'no_rekening', 'atas_nama', 'jam_malam'].map(v => '<button type="button" class="var-chip" data-var="{' + v + '}">{' + v + '}</button>').join('') + '</div>' +
      '<textarea class="textarea" id="tpl-wa" maxlength="2000" style="min-height:200px"></textarea>' +
      '<div class="small muted mt-8 mb-12">Gunakan *teks* untuk tebal & _teks_ untuk miring. Tanpa tautan/lampiran (paket Free).</div>' +
      '<div id="tpl-wa-prev" class="mb-16"></div>' +
    '</div>' +

    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('users', 'ic-sm') + '</div><div class="grow"><div class="t">Hak Akses & Pengelola</div><div class="s">Akun Owner & Admin</div></div><button type="button" class="btn btn-secondary btn-sm" data-act="userBaru">' + ic('userPlus', 'ic-sm') + 'Tambah</button></div>' +
      '<div id="user-list" class="mb-16"><div class="skeleton" style="height:60px"></div></div>' +
    '</div>' +

    '<div class="form-section"><div class="form-section-head"><div class="icon-box sm">' + ic('database', 'ic-sm') + '</div><div><div class="t">Data & Backup</div><div class="s">Backup mingguan otomatis ke Google Drive</div></div></div>' +
      '<button type="button" class="btn btn-ghost btn-block mb-16" data-act="backupNow">' + ic('archive', 'ic-sm') + 'Buat Backup Sekarang</button>' +
    '</div>' +
    '</div></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-ghost" data-go="#/beranda">Batal</button><button type="submit" class="btn btn-primary">' + ic('check') + 'Simpan Perubahan</button></div>' +
    '</form>'
  );

  const form = document.getElementById('set-form');
  pasangUangInput(form);
  const tpl = { template_pesan_WA: s.template_pesan_WA, template_teguran_WA: s.template_teguran_WA, template_welcome_WA: s.template_welcome_WA };
  const ta = document.getElementById('tpl-wa');
  const contohVars = () => Object.assign(varsRek(), {
    nama_kost: form.nama_kost.value, bank_tujuan: form.nama_bank.value, no_rekening: form.no_rekening.value, atas_nama: form.atas_nama.value, jam_malam: form.jam_malam.value,
    nama: 'Rian Ardiansyah', kamar: '102', nominal: 'Rp 1.500.000', periode: U.bulan(U.today().slice(0, 7)), tanggal_tagih: U.tglPanjang(U.today()), hari_telat: '4'
  });
  const prev = () => { document.getElementById('tpl-wa-prev').innerHTML = waBubble('Rian Ardiansyah (102)', isiTemplate(ta.value, contohVars())); };
  const loadTpl = () => { ta.value = tpl[F.tpl] || ''; prev(); };
  loadTpl();
  ta.addEventListener('input', U.debounce(() => { tpl[F.tpl] = ta.value; prev(); }, 200));
  segmen(document.getElementById('tpl-pick'), v => { tpl[F.tpl] = ta.value; F.tpl = v; loadTpl(); });
  document.getElementById('sec-template').addEventListener('click', e => {
    const b = e.target.closest('[data-var]'); if (!b) return;
    const st = ta.selectionStart, en = ta.selectionEnd;
    ta.value = ta.value.slice(0, st) + b.dataset.var + ta.value.slice(en);
    ta.focus(); ta.setSelectionRange(st + b.dataset.var.length, st + b.dataset.var.length);
    tpl[F.tpl] = ta.value; prev();
  });
  document.getElementById('logo-pick').onclick = async () => {
    const f = await pilihBerkas('image/*');
    if (f) { F.logo = f; document.getElementById('logo-prev').innerHTML = '<img src="' + f.data + '" alt="">'; }
  };
  document.getElementById('qris-pick').onclick = async () => {
    const f = await pilihBerkas('image/*');
    if (f) { F.qris = f; document.getElementById('qris-nama').textContent = f.nama + ' (akan disimpan)'; }
  };

  muatPengguna();
  if (q.s === 'template') setTimeout(() => document.getElementById('sec-template').scrollIntoView({ behavior: 'smooth' }), 100);
  history.replaceState(null, '', '#/pengaturan');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    tpl[F.tpl] = ta.value;
    const fd = new FormData(form);
    const nilai = {};
    ['nama_kost', 'nama_pemilik', 'alamat', 'kontak', 'nama_aplikasi', 'jam_malam', 'nama_bank', 'no_rekening', 'atas_nama', 'hari_pengingat', 'jam_kirim_pengingat', 'zona_waktu', 'jeda_kirim_detik', 'batas_kuota_wa_bulanan']
      .forEach(k => { nilai[k] = String(fd.get(k) || '').trim(); });
    nilai.denda_per_hari = String(U.parseNum(fd.get('denda_per_hari')));
    nilai.pengingat_otomatis = fd.get('pengingat_otomatis') ? 'Ya' : 'Tidak';
    Object.assign(nilai, tpl);
    const r = await App.run('pengaturanSimpan', { nilai: nilai, logo: F.logo ? F.logo.data : '', qris: F.qris ? F.qris.data : '' });
    if (r) { UI.waInfo = null; Pages.pengaturan([], {}); App.hydrate(document.getElementById('view')); }
  });
};

Act.simpanToken = async () => {
  const v = document.getElementById('tok-wa').value.trim();
  if (!v) return U.toast('Tempel token Fonnte terlebih dahulu.', 'warn');
  const r = await App.run('tokenWASimpan', { token: v });
  if (r) { UI.waInfo = null; Pages.pengaturan([], {}); App.hydrate(document.getElementById('view')); }
};
Act.hapusToken = async () => {
  if (!(await U.confirm({ title: 'Hapus token Fonnte?', message: 'Pengiriman WhatsApp akan berhenti sampai token diisi kembali.', ok: 'Hapus', danger: true }))) return;
  if (await App.run('tokenWAHapus', {})) { Pages.pengaturan([], {}); App.hydrate(document.getElementById('view')); }
};
Act.waCekSet = async () => {
  const r = await App.run('waCekKoneksi', {}, { busy: 'Menghubungi Fonnte...', toast: false });
  if (r) {
    const k = r.koneksi;
    document.getElementById('set-sinyal').innerHTML = '<div class="banner ' + (k.terhubung ? '' : 'danger') + ' mb-16">' + ic(k.terhubung ? 'checkCircle' : 'alert') + '<div><b>' + U.esc(k.pesan) + '</b>' + (k.nomor ? '<br>+' + U.esc(k.nomor) + (k.kuota ? ' · kuota ' + U.esc(k.kuota) : '') : '') + '</div></div>';
  }
};
Act.backupNow = async () => { await App.run('backupSekarang', {}, { busy: 'Menyalin spreadsheet...' }); };

function muatPengguna() {
  Api.call('penggunaList').then(r => renderPengguna(r.pengguna)).catch(e => {
    const el = document.getElementById('user-list'); if (el) el.innerHTML = '<div class="banner danger">' + U.esc(e.message) + '</div>';
  });
}

function renderPengguna(list) {
  const el = document.getElementById('user-list');
  if (!el) return;
  const me = App.S.me.id_user;
  el.innerHTML = list.map(u => '<div class="list-item"><div class="avatar sm ' + U.avClass(u.nama) + '">' + U.esc(U.initials(u.nama)) + '</div><div class="grow"><div class="semi">' + U.esc(u.nama) + (u.id_user === me ? ' <span class="small muted">(Anda)</span>' : '') + '</div>' +
    '<div class="small muted">@' + U.esc(u.username) + ' · ' + (u.login_terakhir ? 'login ' + U.waktu(u.login_terakhir) : 'belum pernah login') + '</div></div>' +
    '<span class="chip ' + (u.status_aktif !== 'Aktif' ? '' : u.role === 'Owner' ? 'chip-amber' : 'chip-primary') + '">' + (u.status_aktif !== 'Aktif' ? 'Nonaktif' : u.role) + '</span>' +
    (u.id_user !== me ? '<button type="button" class="icon-btn" data-act="userMenu" data-id="' + u.id_user + '" data-u=\'' + U.esc(JSON.stringify(u)) + '\' aria-label="Kelola">' + ic('more', 'ic-sm') + '</button>' : '') + '</div>').join('');
}

function tampilSandi(nama, sandi) {
  U.alert('Sandi awal ' + U.esc(nama), '<p>Berikan sandi ini kepada pengguna secara langsung (jangan lewat grup). Sandi hanya ditampilkan sekali.</p>' +
    '<div class="card-flat row-between"><b class="num" style="font-size:20px;letter-spacing:.05em">' + U.esc(sandi) + '</b><button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(\'' + U.esc(sandi) + '\').then(()=>U.toast(\'Disalin\'))">' + ic('copy', 'ic-sm') + 'Salin</button></div>' +
    '<p class="small muted">Minta pengguna mengganti sandi lewat menu Akun Saya setelah login.</p>');
}

Act.userBaru = () => {
  let role = 'Admin';
  const s = U.sheet({
    title: 'Tambah Pengelola', sub: 'Admin: kamar, penghuni, pembayaran, WA, & buat surat', size: 'sm',
    body: '<div class="field"><label>Nama</label><input class="input" id="u-nama" maxlength="80"></div>' +
      '<div class="field"><label>Username</label><input class="input" id="u-user" maxlength="30" autocapitalize="off" placeholder="huruf kecil, angka, titik"></div>' +
      '<div class="field"><label>Peran</label><div class="seg light" id="u-role"><button type="button" data-v="Admin" class="active">Admin</button><button type="button" data-v="Owner">Owner</button></div></div>' +
      '<div class="hint">' + ic('key', 'ic-xs') + 'Sandi acak dibuat otomatis dan ditampilkan sekali.</div>',
    foot: '<button class="btn btn-ghost" data-x>Batal</button><button class="btn btn-primary" data-ok>' + ic('userPlus', 'ic-sm') + 'Buat Akun</button>'
  });
  segmen(s.q('#u-role'), v => { role = v; });
  s.q('[data-x]').onclick = () => s.close();
  s.q('[data-ok]').onclick = async () => {
    const nama = s.q('#u-nama').value;
    const r = await App.run('penggunaSimpan', { nama: nama, username: s.q('#u-user').value, role: role });
    if (r) { s.close(); renderPengguna(r.pengguna); if (r.sandi_awal) tampilSandi(nama, r.sandi_awal); }
  };
};

Act.userMenu = el => {
  const u = JSON.parse(el.dataset.u);
  const s = U.sheet({
    title: U.esc(u.nama), sub: '@' + U.esc(u.username) + ' · ' + u.role, size: 'sm',
    body: '<div class="menu-list"><button class="side-link" data-a="reset">' + ic('key') + '<span>Reset Sandi</span></button>' +
      '<button class="side-link" data-a="status" style="color:' + (u.status_aktif === 'Aktif' ? 'var(--danger-text)' : 'var(--primary)') + '">' + ic(u.status_aktif === 'Aktif' ? 'ban' : 'checkCircle') + '<span>' + (u.status_aktif === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Kembali') + '</span></button></div>'
  });
  s.q('[data-a=reset]').onclick = async () => {
    s.close();
    if (!(await U.confirm({ title: 'Reset sandi ' + U.esc(u.nama) + '?', message: 'Sandi lama tidak berlaku lagi.', ok: 'Reset' }))) return;
    const r = await App.run('penggunaReset', { id_user: u.id_user });
    if (r) { renderPengguna(r.pengguna); tampilSandi(u.nama, r.sandi_awal); }
  };
  s.q('[data-a=status]').onclick = async () => {
    s.close();
    const r = await App.run('penggunaStatus', { id_user: u.id_user });
    if (r) renderPengguna(r.pengguna);
  };
};

/* ============================================================
   AKUN SAYA
   ============================================================ */
Pages.akun = () => {
  const me = App.S.me, set = D.set();
  view(
    '<div class="page-head"><h1 class="h-xl">Akun Saya</h1></div>' +
    '<div class="two-col"><div>' +
    '<div class="card"><div class="row"><div class="avatar lg ' + U.avClass(me.nama) + '">' + U.esc(U.initials(me.nama)) + '</div><div class="grow"><div class="h-lg">' + U.esc(me.nama) + '</div><div class="muted">@' + U.esc(me.username) + '</div></div>' +
    '<span class="chip ' + (me.role === 'Owner' ? 'chip-amber' : 'chip-primary') + '">' + ic(me.role === 'Owner' ? 'key' : 'shield') + me.role + '</span></div>' +
    '<div class="card-flat mt-16 small muted">' + (me.role === 'Owner' ? 'Akses penuh: data, keuangan, laporan, template surat, pengaturan, dan pengelola.' : 'Akses Admin: kamar, penghuni, pembayaran, WhatsApp, dan membuat surat dari template. Laporan, pengeluaran, pengaturan, dan penghapusan data khusus Owner.') + '</div></div>' +
    '<div class="card"><div class="h-sm mb-12">Ganti Sandi</div><form id="pw-form">' +
    '<div class="field"><label>Sandi Lama</label><input type="password" class="input" name="lama" autocomplete="current-password" required></div>' +
    '<div class="field"><label>Sandi Baru</label><input type="password" class="input" name="baru" autocomplete="new-password" minlength="8" required><div class="hint">Minimal 8 karakter.</div></div>' +
    '<div class="field"><label>Ulangi Sandi Baru</label><input type="password" class="input" name="ulang" autocomplete="new-password" required></div>' +
    '<button class="btn btn-primary btn-block">' + ic('lock', 'ic-sm') + 'Perbarui Sandi</button></form></div>' +
    '</div><div>' +
    '<div class="card"><div class="h-sm mb-12">Tentang Aplikasi</div><div class="kv"><div><div class="k">Aplikasi</div><div class="v">' + U.esc(set.nama_aplikasi || 'Kostku') + '</div></div><div><div class="k">Versi</div><div class="v">' + U.esc((App.S.app || {}).versi || '1.0.0') + '</div></div>' +
    '<div><div class="k">Properti</div><div class="v">' + U.esc(set.nama_kost) + '</div></div><div><div class="k">Sesi</div><div class="v">Keluar otomatis setelah ' + ((window.KOSTKU_CONFIG || {}).IDLE_MENIT || 60) + ' menit tidak aktif</div></div></div></div>' +
    '<button class="btn btn-danger btn-block mt-12" data-act="logout">' + ic('logout') + 'Keluar dari Aplikasi</button>' +
    '</div></div>'
  );
  document.getElementById('pw-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target;
    if (f.baru.value.length < 8) return U.toast('Sandi baru minimal 8 karakter.', 'error');
    if (f.baru.value !== f.ulang.value) return U.toast('Ulangi sandi baru tidak sama.', 'error');
    const r = await App.run('gantiPassword', { lama: f.lama.value, baru: f.baru.value });
    if (r) f.reset();
  });
};
