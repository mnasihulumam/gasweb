// ============================================
// GasLead Finder — Frontend (admin tab)
// Backend: gaslead-Code.gs (Apps Script JSON API)
// ============================================
(function () {
  'use strict';

  // === KONFIG — samakan token & URL setelah deploy ===
  const GASLEAD_URL = 'https://script.google.com/macros/s/AKfycbxH97OOsWYe46Co9g2GCTT0MwoCNYpBYpH8AWQvFQCivRMAg_OBGUpHBWH6H_8xXhi9/exec';
  const ADMIN_TOKEN = 'gasweb-admin-2026';

  const STATUS_LIST = ['Baru', 'Akan Dihubungi', 'Sudah Dihubungi', 'Tertarik', 'Follow-up', 'Closing', 'Tidak Tertarik', 'Nomor tidak ditemukan'];
  function todayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  const PAGE_SIZE = 10;
  let sortKey = '';
  let sortDir = 1; // 1 asc, -1 desc

  let store = {};
  let searchResults = [];
  let view = 'search'; // search | saved
  let page = 1;
  let me = null;
  let sheetUrl = '';
  let searched = false;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function idAttr(id) {
    // aman untuk atribut onclick
    return encodeURIComponent(String(id));
  }
  function idFromAttr(enc) {
    try { return decodeURIComponent(enc); } catch (e) { return enc; }
  }

  const WA_TEMPLATE_KEY = 'gaslead_wa_template';
  const DEFAULT_WA_TEMPLATE =
    'Assalamu\'alaikum, Bapak/Ibu pengelola *{{nama}}*.\n\n' +
    'Perkenalkan, saya dari *GasWeb* — jasa pembuatan website profesional.\n\n' +
    'Saya lihat LPK Anda di {{alamat}}. Banyak lembaga pelatihan yang sudah mulai tampil profesional di internet biar lebih mudah ditemukan calon siswa.\n\n' +
    'Berikut contoh website LPK yang pernah kami buatkan:\n' +
    '👉 https://lpknusakarya.netlify.app/\n\n' +
    'Atau bisa cek profil kami di:\n' +
    '🌐 https://gasweb.id\n\n' +
    'Kalau berkenan, saya bantu buatkan website serupa untuk *{{nama}}* — mulai dari landing page sampai sistem pendaftaran siswa.\n\n' +
    'Boleh saya kirim penawaran singkatnya, Bapak/Ibu?';

  function toWaNumber(phone) {
    if (!phone) return '';
    let n = String(phone).replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    else if (n.startsWith('8') && n.length >= 9 && n.length <= 13) n = '62' + n;
    if (n.length < 10) return '';
    return n;
  }

  function getWaTemplate() {
    const el = document.getElementById('gl-wa-template');
    if (el && el.value.trim()) return el.value;
    return localStorage.getItem(WA_TEMPLATE_KEY) || DEFAULT_WA_TEMPLATE;
  }

  function applyWaTemplate(tpl, p) {
    return String(tpl)
      .replace(/\{\{nama\}\}/gi, p.name || '')
      .replace(/\{\{kategori\}\}/gi, p.cat || '')
      .replace(/\{\{alamat\}\}/gi, p.addr || '')
      .replace(/\{\{telepon\}\}/gi, p.phone || '');
  }

  function toWa(phone, prospect) {
    const num = toWaNumber(phone);
    if (!num) return '';
    if (!prospect) return 'https://wa.me/' + num;
    const msg = applyWaTemplate(getWaTemplate(), prospect);
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg);
  }

  window.glSaveWaTemplate = async function () {
    const el = document.getElementById('gl-wa-template');
    if (!el) return;
    localStorage.setItem(WA_TEMPLATE_KEY, el.value);
    try {
      await api('saveWaTemplate', { template: el.value });
      const hint = document.getElementById('gl-wa-saved-hint');
      if (hint) {
        hint.textContent = 'Template tersimpan ke Spreadsheet.';
        hint.classList.remove('hidden');
        setTimeout(function () { hint.classList.add('hidden'); }, 3000);
      }
      toast('Template WA disimpan ke Spreadsheet.');
    } catch (err) {
      toast('Gagal simpan ke Sheet: ' + err.message + ' (tersimpan lokal)', true);
    }
  };

  window.glWaFmt = function (marker) {
    const ta = document.getElementById('gl-wa-template');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const selected = val.slice(start, end) || 'teks';
    const wrap = marker === '```' ? '```' + selected + '```' : marker + selected + marker;
    ta.value = val.slice(0, start) + wrap + val.slice(end);
    ta.focus();
    const pos = start + wrap.length;
    ta.setSelectionRange(pos, pos);
  };

  window.glWaInsert = function (text) {
    const ta = document.getElementById('gl-wa-template');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
    ta.focus();
    const pos = start + text.length;
    ta.setSelectionRange(pos, pos);
  };

  window.glOpenWa = function (id) {
    id = idFromAttr(String(id));
    const p = searchResults.find(function (x) { return String(x.id) === id; }) || store[id];
    if (!p || !p.phone) return toast('Nomor telepon tidak ada.', true);
    const url = toWa(p.phone, p);
    if (!url) return toast('Nomor tidak valid.', true);
    window.open(url, '_blank');
  };

  async function initWaTemplate() {
    const el = document.getElementById('gl-wa-template');
    if (!el) return;
    // local dulu biar cepat
    el.value = localStorage.getItem(WA_TEMPLATE_KEY) || DEFAULT_WA_TEMPLATE;
    try {
      const data = await api('getWaTemplate');
      if (data.template && String(data.template).trim()) {
        el.value = data.template;
        localStorage.setItem(WA_TEMPLATE_KEY, data.template);
      }
    } catch (e) { /* fallback lokal */ }
  }

  async function api(action, extra) {
    const body = Object.assign({ action: action, token: ADMIN_TOKEN }, extra || {});
    const res = await fetch(GASLEAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success && data.message) throw new Error(data.message);
    if (data.success === false) throw new Error(data.message || 'Gagal');
    return data;
  }

  function toast(msg, isErr) {
    const el = document.getElementById('gl-toast');
    if (!el) { if (isErr) alert(msg); return; }
    const d = document.createElement('div');
    d.className = 'px-4 py-2.5 rounded-lg text-sm text-white shadow-lg ' + (isErr ? 'bg-red-600' : 'bg-navy');
    d.textContent = msg;
    el.appendChild(d);
    setTimeout(function () { d.remove(); }, 3500);
  }

  function setSpin(on) {
    const s = document.getElementById('gl-spin');
    if (s) s.classList.toggle('hidden', !on);
  }

  // ---------- Load prospects ----------
  async function loadProspects() {
    try {
      const data = await api('getProspects');
      store = {};
      (data.list || []).forEach(function (p) {
        if (p && p.id != null) store[String(p.id)] = p;
      });
      if (data.spreadsheetUrl) sheetUrl = data.spreadsheetUrl;
      renderStats();
      if (view === 'saved') renderTable();
      return data;
    } catch (err) {
      toast('Gagal muat prospek: ' + err.message, true);
      throw err;
    }
  }

  // ---------- Search ----------
  window.glSearch = async function (ev) {
    if (ev) ev.preventDefault();
    const kw = (document.getElementById('gl-kw') || {}).value || '';
    const loc = (document.getElementById('gl-loc') || {}).value || '';
    const rad = +(document.getElementById('gl-rad') || {}).value || 5;
    const lim = +(document.getElementById('gl-lim') || {}).value || 20;
    if (!kw.trim()) return toast('Kata kunci wajib.', true);
    if (!loc.trim() && !me) return toast('Isi lokasi atau pakai lokasi saya.', true);

    setSpin(true);
    try {
      const data = await api('searchPlaces', {
        params: {
          kw: kw.trim(),
          loc: loc.trim(),
          rad: rad,
          lim: lim,
          me: me
        }
      });
      searchResults = data.results || [];
      searched = true;
      page = 1;
      view = 'search';
      setViewUI();
      renderStats();
      renderTable();
      toast(searchResults.length ? searchResults.length + ' bisnis ditemukan.' : 'Tidak ada hasil.');
    } catch (err) {
      searchResults = [];
      searched = true;
      renderTable();
      toast(err.message, true);
    } finally {
      setSpin(false);
    }
  };

  window.glUseMyLocation = function () {
    if (!navigator.geolocation) return toast('Browser tidak support geolocation.', true);
    toast('Meminta izin lokasi...');
    navigator.geolocation.getCurrentPosition(function (p) {
      me = { lat: p.coords.latitude, lng: p.coords.longitude };
      const inp = document.getElementById('gl-loc');
      if (inp) inp.value = 'Lokasi saya (' + me.lat.toFixed(4) + ', ' + me.lng.toFixed(4) + ')';
      toast('Lokasi terdeteksi.');
    }, function (e) {
      toast(e.code === 1 ? 'Izin lokasi ditolak.' : 'Lokasi tidak bisa ditentukan.', true);
    }, { enableHighAccuracy: true, timeout: 15000 });
  };

  // ---------- Rows / filter ----------
  function currentRows() {
    let r = view === 'saved'
      ? Object.values(store)
      : searchResults.slice();

    const q = ((document.getElementById('gl-q') || {}).value || '').trim().toLowerCase();
    const fp = (document.getElementById('gl-fp') || {}).checked;
    const fw = (document.getElementById('gl-fw') || {}).checked;
    const mr = +((document.getElementById('gl-fr') || {}).value || 0);
    const stFilter = ((document.getElementById('gl-st-filter') || {}).value) || '';
    const sortSel = ((document.getElementById('gl-ts') || {}).value) || 'near';

    if (q) r = r.filter(function (p) {
      return [p.name, p.cat, p.addr, p.phone].join(' ').toLowerCase().indexOf(q) >= 0;
    });
    if (fp) r = r.filter(function (p) { return p.phone && String(p.phone).trim(); });
    if (fw) r = r.filter(function (p) { return !p.web || !String(p.web).trim(); });
    if (mr) r = r.filter(function (p) { return (Number(p.rating) || 0) >= mr; });
    if (stFilter) {
      r = r.filter(function (p) {
        const st = (store[String(p.id)] && store[String(p.id)].st) || p.st || 'Baru';
        return st === stFilter;
      });
    }

    // Sort: thead click overrides dropdown
    if (sortKey) {
      r.sort(function (a, b) {
        var va, vb;
        if (sortKey === 'st') {
          va = ((store[String(a.id)] && store[String(a.id)].st) || a.st || '');
          vb = ((store[String(b.id)] && store[String(b.id)].st) || b.st || '');
        } else if (sortKey === 'rating' || sortKey === 'dist' || sortKey === 'rev') {
          va = Number(a[sortKey]) || 0;
          vb = Number(b[sortKey]) || 0;
          return (va - vb) * sortDir;
        } else {
          va = String(a[sortKey] || '').toLowerCase();
          vb = String(b[sortKey] || '').toLowerCase();
        }
        if (va < vb) return -1 * sortDir;
        if (va > vb) return 1 * sortDir;
        return 0;
      });
    } else {
      if (sortSel === 'near') r.sort(function (a, b) { return (Number(a.dist) || 1e9) - (Number(b.dist) || 1e9); });
      if (sortSel === 'rating') r.sort(function (a, b) {
        return ((Number(b.rating) || -1) - (Number(a.rating) || -1)) || ((Number(b.rev) || 0) - (Number(a.rev) || 0));
      });
      if (sortSel === 'rev') r.sort(function (a, b) {
        return ((Number(b.rev) || 0) - (Number(a.rev) || 0)) || ((Number(b.rating) || -1) - (Number(a.rating) || -1));
      });
    }
    return r;
  }

  window.glResetSort = function () { sortKey = ''; sortDir = 1; };
  window.glSortBy = function (key) {
    if (sortKey === key) sortDir = -sortDir;
    else { sortKey = key; sortDir = 1; }
    page = 1;
    renderTable();
    // update thead arrows
    document.querySelectorAll('[data-gl-sort]').forEach(function (th) {
      const k = th.getAttribute('data-gl-sort');
      const base = th.getAttribute('data-label') || th.textContent.replace(/[↑↓]\s*$/, '').trim();
      th.setAttribute('data-label', base);
      th.innerHTML = base + (k === sortKey ? (sortDir === 1 ? ' ↑' : ' ↓') : '');
    });
  };

  function renderStats() {
    const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('gl-s1', searchResults.length);
    set('gl-s2', searchResults.filter(function (p) { return p.phone; }).length);
    set('gl-s3', searchResults.filter(function (p) { return !p.web; }).length);
    set('gl-s4', Object.keys(store).length);
    renderProspectDash();
  }

  function renderProspectDash() {
    const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
    const list = Object.values(store);
    set('dash-prospek-total', list.length);
    const counts = {};
    STATUS_LIST.forEach(function (s) { counts[s] = 0; });
    list.forEach(function (p) {
      const st = p.st || 'Baru';
      counts[st] = (counts[st] || 0) + 1;
    });
    set('dash-prospek-baru', counts['Baru'] || 0);
    set('dash-prospek-fu', (counts['Akan Dihubungi'] || 0) + (counts['Follow-up'] || 0));
    set('dash-prospek-sudah', counts['Sudah Dihubungi'] || 0);
    set('dash-prospek-tertarik', counts['Tertarik'] || 0);
    set('dash-prospek-closing', counts['Closing'] || 0);
    set('dash-prospek-tolak', counts['Tidak Tertarik'] || 0);
    set('dash-prospek-nonum', counts['Nomor tidak ditemukan'] || 0);
  }

  // expose for dashboard refresh button
  window.loadProspects = loadProspects;

  function renderTable() {
    const tbody = document.getElementById('gl-tbody');
    const empty = document.getElementById('gl-empty');
    if (!tbody) return;

    const r = currentRows();
    const pages = Math.max(1, Math.ceil(r.length / PAGE_SIZE));
    page = Math.min(page, pages);
    const slice = r.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const info = document.getElementById('gl-info');
    if (info) info.textContent = r.length + ' bisnis' + (view === 'saved' ? ' tersimpan' : '');
    const pg = document.getElementById('gl-pg');
    if (pg) pg.textContent = 'Hal. ' + page + ' / ' + pages;
    const pv = document.getElementById('gl-pv');
    const nx = document.getElementById('gl-nx');
    if (pv) pv.disabled = page <= 1;
    if (nx) nx.disabled = page >= pages;

    if (!slice.length) {
      tbody.innerHTML = '';
      let msg = '';
      if (view === 'saved' && !Object.keys(store).length) {
        msg = 'Belum ada prospek. Cari dulu lalu simpan ke Sheet.';
      } else if (view === 'saved') {
        msg = 'Tidak ada yang cocok dengan filter.';
      } else if (!searched) {
        msg = 'Isi kata kunci & lokasi, lalu klik Cari prospek.';
      } else {
        msg = 'Tidak ada hasil. Ubah kata kunci atau perbesar radius.';
      }
      if (empty) { empty.textContent = msg; empty.classList.remove('hidden'); }
      return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = slice.map(function (p) {
      const pid = String(p.id);
      const s = store[pid];
      const wa = toWa(p.phone, p);
      const stOpts = STATUS_LIST.map(function (x) {
        return '<option value="' + esc(x) + '"' + (s && s.st === x ? ' selected' : '') + '>' + esc(x) + '</option>';
      }).join('');

      return '<tr class="gl-row border-b border-gray-100 hover:bg-orange-50/40" data-id="' + esc(pid) + '">' +
        '<td class="gl-c-name px-3 py-2.5"><div class="font-semibold text-sm">' + esc(p.name) + '</div>' +
        '<div class="text-[11px] text-gray-500">' + esc(p.cat || '') + '</div></td>' +
        '<td class="gl-c-addr px-3 py-2.5 text-xs text-gray-600 max-w-[200px]">' + esc(p.addr || '') + '</td>' +
        '<td class="gl-c-phone px-3 py-2.5 text-xs">' +
          (p.phone ? '<button type="button" class="text-green-700 font-semibold hover:underline text-left" onclick="glOpenWa(\'' + idAttr(pid) + '\')">' + esc(p.phone) + '</button>' : '-') +
        '</td>' +
        '<td class="gl-c-web px-3 py-2.5 text-xs">' +
          (p.web ? '<a class="text-orange hover:underline" href="' + esc(p.web) + '" target="_blank" rel="noopener">Web</a>' : '<span class="text-gray-400">—</span>') +
        '</td>' +
        '<td class="gl-c-rate px-3 py-2.5 text-xs">' + (p.rating != null ? p.rating + ' (' + (p.rev || 0) + ')' : '-') + '</td>' +
        '<td class="gl-c-dist px-3 py-2.5 text-xs">' + (p.dist != null ? Number(p.dist).toFixed(1) + ' km' : '-') + '</td>' +
        '<td class="gl-c-pros px-3 py-2.5 min-w-[180px]">' +
          '<button type="button" class="text-lg leading-none mr-1 ' + (s ? 'text-orange' : 'text-gray-300') + '" onclick="glToggleStar(\'' + idAttr(pid) + '\')" title="Simpan prospek">' + (s ? '★' : '☆') + '</button>' +
          '<select class="text-xs border rounded px-1 py-0.5 w-full mb-1" onchange="glUpdateField(\'' + idAttr(pid) + '\',\'st\',this.value)">' + stOpts + '</select>' +
          '<input type="date" class="text-xs border rounded px-1 py-0.5 w-full mb-1" value="' + esc(s ? s.fu || '' : '') + '" onchange="glUpdateField(\'' + idAttr(pid) + '\',\'fu\',this.value)">' +
          '<input class="text-xs border rounded px-1 py-0.5 w-full" placeholder="Catatan" value="' + esc(s ? s.note || '' : '') + '" onchange="glUpdateField(\'' + idAttr(pid) + '\',\'note\',this.value)">' +
        '</td>' +
        '<td class="gl-c-act px-3 py-2.5 whitespace-nowrap">' +
          (p.url ? '<a class="text-xs px-2 py-1 rounded border hover:border-orange mr-1" href="' + esc(p.url) + '" target="_blank" rel="noopener">Maps</a>' : '') +
          (p.phone ? '<button type="button" class="text-xs px-2 py-1 rounded border hover:border-green-600 text-green-700 mr-1" onclick="glOpenWa(\'' + idAttr(pid) + '\')">WA</button>' : '') +
          (store[pid] ? '<button type="button" class="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50" onclick="glDeleteProspect(\'' + idAttr(pid) + '\')" title="Hapus prospek">Hapus</button>' : '') +
        '</td></tr>';
    }).join('');
  }

  window.glDeleteProspect = async function (id) {
    id = idFromAttr(String(id || ''));
    if (!id) return toast('ID kosong.', true);
    if (!store[id]) return toast('Prospek tidak ada di daftar tersimpan.', true);
    var nama = store[id].name || id;
    if (!confirm('Hapus prospek "' + nama + '" dari Spreadsheet?\n\nTindakan ini tidak bisa dibatalkan.')) return;
    try {
      setSpin(true);
      await api('saveProspect', { payload: { id: id, action: 'delete' } });
      delete store[id];
      toast('Prospek dihapus.');
      renderStats();
      renderProspectDash();
      renderTable();
    } catch (err) {
      console.error(err);
      toast('Gagal hapus: ' + (err.message || err), true);
    } finally {
      setSpin(false);
    }
  };

  window.glToggleStar = async function (id) {
    id = idFromAttr(String(id));
    if (store[id]) {
      if ((store[id].note || store[id].fu) && !confirm('Prospek punya catatan. Hapus?')) return;
      try {
        await api('saveProspect', { payload: { id: id, action: 'delete' } });
        delete store[id];
        toast('Dihapus dari prospek.');
        renderStats();
        renderTable();
      } catch (err) { toast(err.message, true); }
      return;
    }
    const fromSearch = searchResults.find(function (x) { return String(x.id) === id; });
    const payload = fromSearch
      ? Object.assign({}, fromSearch, { id: id, st: 'Baru', note: '', fu: '' })
      : null;
    if (!payload) return toast('Data tidak ditemukan.', true);
    try {
      await api('saveProspect', { payload: payload });
      store[id] = payload;
      toast('Disimpan ke Spreadsheet.');
      renderStats();
      renderTable();
    } catch (err) { toast(err.message, true); }
  };

  window.glUpdateField = async function (id, field, value) {
    id = idFromAttr(String(id));
    // Ganti status -> tanggal otomatis terisi hari ini (tetap bisa diubah manual)
    const autoFu = field === 'st' ? todayStr() : null;
    try {
      if (!store[id]) {
        const fromSearch = searchResults.find(function (x) { return String(x.id) === id; });
        if (!fromSearch) return toast('Data tidak ditemukan.', true);
        const payload = Object.assign({}, fromSearch, {
          id: id,
          st: field === 'st' ? value : 'Baru',
          note: field === 'note' ? value : '',
          fu: field === 'fu' ? value : (autoFu || '')
        });
        await api('saveProspect', { payload: payload });
        store[id] = payload;
      } else {
        await api('updateProspectField', { id: id, field: field, value: value });
        store[id][field] = value;
        if (autoFu) {
          await api('updateProspectField', { id: id, field: 'fu', value: autoFu });
          store[id].fu = autoFu;
        }
      }
      toast('Diperbarui.');
      renderStats();
      renderTable();
    } catch (err) { toast(err.message, true); }
  };

  window.glSaveAll = async function () {
    const list = view === 'saved' ? Object.values(store) : currentRows();
    const belum = list.filter(function (p) { return !store[String(p.id)]; });
    if (!belum.length) return toast('Semua sudah tersimpan / tidak ada data.');
    if (!confirm('Simpan ' + belum.length + ' bisnis ke Spreadsheet (status: Baru)?')) return;
    setSpin(true);
    try {
      const res = await api('saveAllResults', { list: belum });
      await loadProspects();
      renderTable();
      toast((res.added || 0) + ' baru disimpan' + (res.skipped ? ', ' + res.skipped + ' dilewati' : '') + '.');
    } catch (err) { toast(err.message, true); }
    finally { setSpin(false); }
  };

  window.glOpenSheet = async function () {
    if (sheetUrl) { window.open(sheetUrl, '_blank'); return; }
    try {
      const data = await api('getSpreadsheetUrl');
      sheetUrl = data.url;
      window.open(sheetUrl, '_blank');
    } catch (err) { toast(err.message, true); }
  };

  window.glSetView = function (v) {
    view = v;
    page = 1;
    setViewUI();
    if (v === 'saved') {
      loadProspects().then(function () { renderTable(); });
    } else {
      renderTable();
    }
  };

  function setViewUI() {
    document.querySelectorAll('[data-gl-view]').forEach(function (b) {
      b.classList.toggle('bg-orange', b.dataset.glView === view);
      b.classList.toggle('text-white', b.dataset.glView === view);
      b.classList.toggle('bg-gray-100', b.dataset.glView !== view);
    });
    const form = document.getElementById('gl-search-form');
    if (form) form.classList.toggle('hidden', view === 'saved');
  }

  window.glPage = function (dir) {
    page += dir;
    renderTable();
  };

  window.glFilter = function () {
    page = 1;
    renderTable();
  };

  window.glExportCsv = function () {
    const r = currentRows();
    if (!r.length) return toast('Tidak ada data.', true);
    const cell = function (v) {
      v = String(v == null ? '' : v);
      if (/^[=@\t\r]/.test(v)) v = "'" + v;
      return '"' + v.replace(/"/g, '""') + '"';
    };
    const h = ['Nama', 'Kategori', 'Alamat', 'Telepon', 'Website', 'Rating', 'Ulasan', 'Jarak', 'Maps', 'Status', 'Catatan', 'Follow-up'];
    const lines = r.map(function (p) {
      const s = store[String(p.id)] || {};
      return [p.name, p.cat, p.addr, p.phone || '', p.web || '', p.rating ?? '', p.rev ?? '', p.dist != null ? Number(p.dist).toFixed(1) : '', p.url || '', s.st || '', s.note || '', s.fu || ''].map(cell).join(',');
    });
    const blob = new Blob(['\uFEFF' + h.map(cell).join(',') + '\r\n' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gaslead-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    toast('CSV diekspor (' + r.length + ' baris).');
  };

  // Hook tab
  document.addEventListener('DOMContentLoaded', function () {
    initWaTemplate();
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.tab === 'gaslead') {
          initWaTemplate();
          if (!Object.keys(store).length) loadProspects().catch(function () {});
        }
        if (btn.dataset.tab === 'dashboard') {
          if (!Object.keys(store).length) loadProspects().catch(function () {});
          else renderProspectDash();
        }
      });
    });
    // Load prospek saat admin terbuka (dashboard default)
    const adminScreen = document.getElementById('admin-screen');
    if (adminScreen) {
      const obs = new MutationObserver(function () {
        if (!adminScreen.classList.contains('hidden') && !Object.keys(store).length) {
          loadProspects().catch(function () {});
        }
      });
      obs.observe(adminScreen, { attributes: true, attributeFilter: ['class'] });
    }
  });
})();
