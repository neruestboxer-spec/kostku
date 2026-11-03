/* ============================================================
   KOSTKU — Komunikasi ke backend Google Apps Script (REST JSON)
   POST wajib Content-Type text/plain agar tidak memicu CORS preflight.
   ============================================================ */
const Api = {
  async call(action, data, opt) {
    const cfg = window.KOSTKU_CONFIG || {};
    const url = cfg.GAS_URL || '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
      throw new Error('GAS_URL belum diisi dengan benar di js/config.js (harus berakhiran /exec).');
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), (opt && opt.timeout) || 120000);
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, token: App.token, data: data || {} }),
        redirect: 'follow',
        signal: ctrl.signal
      });
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      clearTimeout(timer);
    }
    let json;
    try { json = await res.json(); }
    catch (e) { throw new Error('Respons server tidak valid. Pastikan Web App sudah di-deploy dengan akses "Anyone".'); }

    if (!json.success) {
      if (json.code === 'AUTH' && action !== 'login') App.sesiHabis(json.message);
      const err = new Error(json.message || 'Terjadi kesalahan.');
      err.code = json.code;
      err.data = json;
      throw err;
    }
    if (json.state) App.setState(json.state);
    return json;
  }
};
