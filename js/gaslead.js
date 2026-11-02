// ============================================
// GasLead Finder — Frontend (admin tab)
// Backend: gaslead-Code.gs (Apps Script JSON API)
// ============================================
(function () {
  'use strict';

  // === KONFIG — samakan token & URL setelah deploy ===
  const GASLEAD_URL = 'https://script.google.com/macros/s/AKfycbxH97OOsWYe46Co9g2GCTT0MwoCNYpBYpH8AWQvFQCivRMAg_OBGUpHBWH6H_8xXhi9/exec';
  const ADMIN_TOKEN = 'gasweb-admin-2026';

  let STATUS_LIST = ['Baru', 'Akan Dihubungi', 'Sudah Dihubungi', 'Tertarik', 'Follow-up', 'Closing', 'Tidak Tertarik', 'Nomor tidak ditemukan'];
  let counts = {};          // jumlah prospek per status (dari server, ringan)
  let countsLoaded = false;
  let loadedSt = {};        // status → sudah di-load ke store
  let allLoaded = false;
  let savedViewInit = false;
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
  const WA_TEMPLATES_KEY = 'gaslead_wa_templates';
  const WA_ACTIVE_KEY = 'gaslead_wa_active';
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

  // Map kategori → isi template. Kategori "Umum" selalu ada sebagai default.
  let waTemplates = { 'Umum': DEFAULT_WA_TEMPLATE };
  let waActiveCat = 'Umum';

  function toWaNumber(phone) {
    if (!phone) return '';
    let n = String(phone).replace(/\D/g, '');
    if (n.startsWith('0')) n = '62' + n.slice(1);
    else if (n.startsWith('8') && n.length >= 9 && n.length <= 13) n = '62' + n;
    if (n.length < 10) return '';
    return n;
  }

  function getActiveCat() {
    const sel = document.getElementById('gl-wa-cat');
    if (sel && sel.value) return sel.value;
    return waActiveCat || 'Umum';
  }

  function getWaTemplate(forProspect) {
    // Prioritas: cocokkan kategori prospek → template aktif → textarea → default
    if (forProspect && forProspect.cat) {
      const matched = matchTemplateByCat(forProspect.cat);
      if (matched) return matched;
    }
    const cat = getActiveCat();
    if (waTemplates[cat] && String(waTemplates[cat]).trim()) return waTemplates[cat];
    const el = document.getElementById('gl-wa-template');
    if (el && el.value.trim()) return el.value;
    return waTemplates['Umum'] || DEFAULT_WA_TEMPLATE;
  }

  function matchTemplateByCat(bizCat) {
    if (!bizCat) return null;
    const lower = String(bizCat).toLowerCase();
    const keys = Object.keys(waTemplates);
    // exact / contains match (abaikan "Umum")
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === 'Umum') continue;
      const kl = k.toLowerCase();
      if (lower.indexOf(kl) >= 0 || kl.indexOf(lower) >= 0) {
        if (String(waTemplates[k] || '').trim()) return waTemplates[k];
      }
    }
    return null;
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
    const msg = cleanWaText(applyWaTemplate(getWaTemplate(prospect), prospect));
    return 'https://api.whatsapp.com/send?phone=' + num + '&text=' + encodeUtf8(msg);
  }

  // Buang karakter rusak (surrogate yatim / U+FFFD) supaya emoji tidak jadi tanda tanya di WA
  function cleanWaText(s) {
    s = String(s).normalize('NFC').replace(/\uFFFD/g, '');
    if (typeof s.toWellFormed === 'function') return s.toWellFormed();
    return s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
  }

  // Percent-encode eksplisit dari byte UTF-8 (aman untuk emoji)
  function encodeUtf8(s) {
    const bytes = new TextEncoder().encode(s);
    let out = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      out += (b >= 0x30 && b <= 0x39) || (b >= 0x41 && b <= 0x5A) || (b >= 0x61 && b <= 0x7A) || b === 0x2D || b === 0x2E || b === 0x5F || b === 0x7E
        ? String.fromCharCode(b) : '%' + (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }
    return out;
  }

  function persistLocalTemplates() {
    try {
      localStorage.setItem(WA_TEMPLATES_KEY, JSON.stringify(waTemplates));
      localStorage.setItem(WA_ACTIVE_KEY, waActiveCat);
      localStorage.setItem(WA_TEMPLATE_KEY, waTemplates[waActiveCat] || '');
    } catch (e) { /* ignore quota */ }
  }

  function fillCatSelect() {
    const sel = document.getElementById('gl-wa-cat');
    if (!sel) return;
    const keys = Object.keys(waTemplates).sort(function (a, b) {
      if (a === 'Umum') return -1;
      if (b === 'Umum') return 1;
      return a.localeCompare(b, 'id');
    });
    const current = waActiveCat;
    sel.innerHTML = keys.map(function (k) {
      return '<option value="' + esc(k) + '"' + (k === current ? ' selected' : '') + '>' + esc(k) + '</option>';
    }).join('');
    if (keys.indexOf(current) < 0 && keys.length) {
      waActiveCat = keys[0];
      sel.value = waActiveCat;
    }
  }

  function loadTemplateToEditor(cat) {
    const el = document.getElementById('gl-wa-template');
    if (!el) return;
    waActiveCat = cat || getActiveCat();
    el.value = waTemplates[waActiveCat] || '';
    const nameInput = document.getElementById('gl-wa-cat-name');
    if (nameInput) nameInput.value = waActiveCat === 'Umum' ? '' : waActiveCat;
    fillCatSelect();
    persistLocalTemplates();
  }

  window.glOnWaCatChange = function () {
    const sel = document.getElementById('gl-wa-cat');
    if (!sel) return;
    // Simpan dulu isi editor ke kategori sebelumnya (biar gak hilang)
    const prev = waActiveCat;
    const el = document.getElementById('gl-wa-template');
    if (el && prev && waTemplates[prev] !== undefined) {
      waTemplates[prev] = el.value;
    }
    loadTemplateToEditor(sel.value);
  };

  window.glSaveWaTemplate = async function () {
    const el = document.getElementById('gl-wa-template');
    if (!el) return;
    const nameInput = document.getElementById('gl-wa-cat-name');
    let cat = (nameInput && nameInput.value.trim()) || getActiveCat() || 'Umum';
    cat = cat.replace(/\s+/g, ' ').trim();
    if (!cat) cat = 'Umum';

    waTemplates[cat] = el.value;
    waActiveCat = cat;
    persistLocalTemplates();
    fillCatSelect();
    if (nameInput) nameInput.value = cat === 'Umum' ? '' : cat;

    try {
      await api('saveWaTemplate', { template: el.value, category: cat, templates: waTemplates, active: cat });
      const hint = document.getElementById('gl-wa-saved-hint');
      if (hint) {
        hint.textContent = 'Template "' + cat + '" tersimpan.';
        hint.classList.remove('hidden');
        setTimeout(function () { hint.classList.add('hidden'); }, 3000);
      }
      toast('Template WA "' + cat + '" disimpan.');
    } catch (err) {
      toast('Gagal simpan ke server: ' + err.message + ' (tersimpan lokal)', true);
    }
  };

  window.glDeleteWaTemplate = async function () {
    const cat = getActiveCat();
    if (!cat || cat === 'Umum') {
      toast('Kategori "Umum" tidak bisa dihapus.', true);
      return;
    }
    if (!confirm('Hapus template kategori "' + cat + '"?')) return;
    delete waTemplates[cat];
    waActiveCat = 'Umum';
    persistLocalTemplates();
    loadTemplateToEditor('Umum');
    try {
      await api('saveWaTemplate', { template: waTemplates['Umum'] || '', category: 'Umum', templates: waTemplates, active: 'Umum', deleted: cat });
      toast('Template "' + cat + '" dihapus.');
    } catch (err) {
      toast('Dihapus lokal. Server: ' + err.message, true);
    }
  };

  window.glNewWaTemplate = function () {
    const el = document.getElementById('gl-wa-template');
    const nameInput = document.getElementById('gl-wa-cat-name');
    // Simpan dulu kategori aktif
    if (el && waActiveCat) waTemplates[waActiveCat] = el.value;
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
      nameInput.placeholder = 'Nama kategori baru, mis. Klinik / LPK / Resto';
    }
    if (el) el.value = '';
    toast('Isi nama kategori + template, lalu klik Simpan.');
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

  window.glWaEmojiToggle = function () {
    const p = document.getElementById('gl-wa-emoji-panel');
    if (p) p.classList.toggle('hidden');
  };

  window.glWaEmoji = function (e) {
    window.glWaInsert(e);
  };

  // Kirim manual ke customer (WA / Instagram / TikTok) memakai template aktif
  function buildManualMessage() {
    const el = document.getElementById('gl-wa-template');
    if (el && waActiveCat) waTemplates[waActiveCat] = el.value;
    const nameEl = document.getElementById('gl-send-name');
    const p = { name: nameEl ? nameEl.value.trim() : '', cat: getActiveCat() === 'Umum' ? '' : getActiveCat(), addr: '', phone: '' };
    return cleanWaText(applyWaTemplate(getWaTemplate(null), p));
  }

  // Instagram/TikTok tidak render *tebal* _miring_ ala WA, jadi penanda dibuang
  function stripWaMarkup(s) {
    return String(s)
      .replace(/```([\s\S]*?)```/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/_([^_\n]+)_/g, '$1')
      .replace(/~([^~\n]+)~/g, '$1');
  }

  function cleanHandle(v) {
    return String(v || '').trim().replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\/(@)?/i, '').replace(/^@/, '').replace(/[\/?#].*$/, '');
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) {}
      document.body.removeChild(t);
      return ok;
    }
  }

  window.glSendManual = async function (channel) {
    const msg = buildManualMessage();
    if (!msg.trim()) return toast('Template kosong.', true);

    if (channel === 'wa') {
      const num = toWaNumber((document.getElementById('gl-send-wa') || {}).value);
      if (!num) return toast('Nomor WA tidak valid.', true);
      window.open('https://api.whatsapp.com/send?phone=' + num + '&text=' + encodeUtf8(msg), '_blank');
      return toast('WA dibuka · template ' + getActiveCat());
    }

    const isIg = channel === 'ig';
    const handle = cleanHandle((document.getElementById(isIg ? 'gl-send-ig' : 'gl-send-tt') || {}).value);
    if (!handle) return toast('Isi username ' + (isIg ? 'Instagram' : 'TikTok') + ' dulu.', true);
    const ok = await copyText(stripWaMarkup(msg));
    toast(ok ? 'Pesan disalin · tempel (Ctrl+V) di chat' : 'Gagal menyalin pesan, salin manual dari template.', !ok);
    window.open(isIg ? 'https://ig.me/m/' + encodeURIComponent(handle) : 'https://www.tiktok.com/@' + encodeURIComponent(handle), '_blank');
  };

  window.glOpenWa = function (id) {
    id = idFromAttr(String(id));
    const p = searchResults.find(function (x) { return String(x.id) === id; }) || store[id];
    if (!p || !p.phone) return toast('Nomor telepon tidak ada.', true);
    // Sinkronkan isi editor ke map sebelum kirim
    const el = document.getElementById('gl-wa-template');
    if (el && waActiveCat) waTemplates[waActiveCat] = el.value;
    const url = toWa(p.phone, p);
    if (!url) return toast('Nomor tidak valid.', true);
    const used = matchTemplateByCat(p.cat) ? ('auto: ' + p.cat) : ('aktif: ' + getActiveCat());
    toast('WA dibuka · template ' + used);
    window.open(url, '_blank');
  };

  async function initWaTemplate() {
    const el = document.getElementById('gl-wa-template');
    if (!el) return;

    // 1) Load lokal dulu biar cepat
    try {
      const raw = localStorage.getItem(WA_TEMPLATES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') waTemplates = parsed;
      }
      const act = localStorage.getItem(WA_ACTIVE_KEY);
      if (act) waActiveCat = act;
      // legacy single template
      const legacy = localStorage.getItem(WA_TEMPLATE_KEY);
      if (legacy && (!waTemplates['Umum'] || waTemplates['Umum'] === DEFAULT_WA_TEMPLATE)) {
        waTemplates['Umum'] = legacy;
      }
    } catch (e) { /* ignore */ }
    if (!waTemplates['Umum']) waTemplates['Umum'] = DEFAULT_WA_TEMPLATE;

    fillCatSelect();
    loadTemplateToEditor(waActiveCat);

    // 2) Sync dari server
    try {
      const data = await api('getWaTemplate');
      if (data.templates && typeof data.templates === 'object' && Object.keys(data.templates).length) {
        waTemplates = data.templates;
        if (!waTemplates['Umum']) waTemplates['Umum'] = DEFAULT_WA_TEMPLATE;
      } else if (data.template && String(data.template).trim()) {
        // backward compatible: single template → Umum
        waTemplates['Umum'] = data.template;
      }
      if (data.active && waTemplates[data.active]) waActiveCat = data.active;
      persistLocalTemplates();
      fillCatSelect();
      loadTemplateToEditor(waActiveCat);
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
  function totalSaved() {
    if (!countsLoaded) return Object.keys(store).length;
    return Object.keys(counts).reduce(function (n, k) { return n + (Number(counts[k]) || 0); }, 0);
  }

  function applyCounts(c) {
    if (c && typeof c === 'object') { counts = c; countsLoaded = true; }
  }

  function applyStatuses(list) {
    if (Array.isArray(list) && list.length) STATUS_LIST = list;
    fillStatusFilter();
    renderStatusManager();
  }

  let pendingFilter = null;
  function fillStatusFilter() {
    const sel = document.getElementById('gl-st-filter');
    if (!sel) return;
    const cur = pendingFilter != null ? pendingFilter : sel.value;
    sel.innerHTML = '<option value="">Semua status</option>' + STATUS_LIST.map(function (s) {
      return '<option value="' + esc(s) + '">' + esc(s) + (countsLoaded ? ' (' + (counts[s] || 0) + ')' : '') + '</option>';
    }).join('');
    sel.value = STATUS_LIST.indexOf(cur) >= 0 ? cur : '';
  }

  function mergeList(list) {
    (list || []).forEach(function (p) {
      if (p && p.id != null) store[String(p.id)] = p;
    });
  }

  // Refresh: ambil jumlah per status + hanya tab yang sedang dipakai (bukan semua)
  async function loadProspects() {
    try {
      const needSaved = view === 'saved';
      const st = needSaved ? ((document.getElementById('gl-st-filter') || {}).value || '') : '';
      const data = await api('getProspects', { status: st, countsOnly: !needSaved });
      store = {};
      loadedSt = {};
      allLoaded = false;
      mergeList(data.list);
      if (needSaved) {
        if (st) loadedSt[st] = true; else { allLoaded = true; (data.statuses || STATUS_LIST).forEach(function (s) { loadedSt[s] = true; }); }
      }
      applyCounts(data.counts);
      applyStatuses(data.statuses);
      if (data.spreadsheetUrl) sheetUrl = data.spreadsheetUrl;
      // hasil pencarian yang sudah tersimpan di tab lain
      if (searchResults.length) {
        try {
          const lk = await api('lookupProspects', { ids: searchResults.map(function (p) { return p.id; }) });
          Object.keys(lk.saved || {}).forEach(function (id) { if (!store[id]) store[id] = lk.saved[id]; });
        } catch (e) { /* abaikan */ }
      }
      renderStats();
      if (view === 'saved') renderTable();
      return data;
    } catch (err) {
      toast('Gagal muat prospek: ' + err.message, true);
      throw err;
    }
  }

  function isLoadedFor(st) { return allLoaded || (st && loadedSt[st]); }

  // Muat tab yang diminta saja ('' = semua tab)
  async function ensureLoaded(st) {
    if (isLoadedFor(st)) return;
    setSpin(true);
    try {
      const data = await api('getProspects', { status: st || '' });
      if (st) {
        mergeList(data.list);
        loadedSt[st] = true;
      } else {
        const keep = store;
        store = {};
        mergeList(data.list);
        Object.keys(keep).forEach(function (id) { if (!store[id]) store[id] = keep[id]; });
        allLoaded = true;
        (data.statuses || STATUS_LIST).forEach(function (s) { loadedSt[s] = true; });
      }
      applyCounts(data.counts);
      applyStatuses(data.statuses);
    } finally {
      setSpin(false);
    }
  }

  async function renderSavedForFilter() {
    const st = (document.getElementById('gl-st-filter') || {}).value || '';
    try { await ensureLoaded(st); } catch (err) { toast('Gagal muat prospek: ' + err.message, true); }
    renderStats();
    renderTable();
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
      Object.keys(data.saved || {}).forEach(function (id) { store[id] = data.saved[id]; });
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
    set('gl-s4', totalSaved());
    renderProspectDash();
  }

  function renderProspectDash() {
    const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('dash-prospek-total', totalSaved());
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
      if (view === 'saved' && totalSaved() === 0) {
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
      const dres = await api('saveProspect', { payload: { id: id, action: 'delete' } });
      applyCounts(dres.counts);
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
        const dres = await api('saveProspect', { payload: { id: id, action: 'delete' } });
        applyCounts(dres.counts);
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
      const sres = await api('saveProspect', { payload: payload });
      applyCounts(sres.counts);
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
        const sres = await api('saveProspect', { payload: payload });
        applyCounts(sres.counts);
        store[id] = payload;
      } else {
        // satu panggilan: status + tanggal sekaligus (baris pindah tab otomatis di server)
        const fields = {};
        fields[field] = value;
        if (autoFu) fields.fu = autoFu;
        const ures = await api('updateProspectFields', { id: id, fields: fields });
        applyCounts(ures.counts);
        Object.keys(fields).forEach(function (k) { store[id][k] = fields[k]; });
      }
      fillStatusFilter();
      renderStatusManager();
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
      applyCounts(res.counts);
      await loadProspects();
      renderTable();
      toast((res.added || 0) + ' baru disimpan' + (res.skipped ? ', ' + res.skipped + ' dilewati' : '') + '.');
    } catch (err) { toast(err.message, true); }
    finally { setSpin(false); }
  };

  // ---------- Kelola status ----------
  function renderStatusManager() {
    const box = document.getElementById('gl-status-list');
    if (!box) return;
    box.innerHTML = STATUS_LIST.map(function (s, i) {
      const locked = s === 'Baru';
      const btn = 'px-1.5 py-0.5 rounded border text-[10px] hover:border-orange disabled:opacity-30 disabled:cursor-not-allowed';
      return '<div class="flex items-center gap-1 py-1 border-b border-gray-100 last:border-0">' +
        '<div class="flex-1 min-w-0"><span class="text-xs font-semibold truncate">' + esc(s) + '</span>' +
        (locked ? ' <span class="text-[9px] text-gray-400">default</span>' : '') + '</div>' +
        '<span class="text-[10px] text-gray-500 w-8 text-right">' + (countsLoaded ? (counts[s] || 0) : '-') + '</span>' +
        '<button type="button" class="' + btn + '" onclick="glStatusMove(' + i + ',-1)"' + (i === 0 ? ' disabled' : '') + ' title="Naik">▲</button>' +
        '<button type="button" class="' + btn + '" onclick="glStatusMove(' + i + ',1)"' + (i === STATUS_LIST.length - 1 ? ' disabled' : '') + ' title="Turun">▼</button>' +
        '<button type="button" class="' + btn + '" onclick="glStatusRename(' + i + ')"' + (locked ? ' disabled' : '') + ' title="Ganti nama">Ubah</button>' +
        '<button type="button" class="px-1.5 py-0.5 rounded border border-red-200 text-red-600 text-[10px] hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed" onclick="glStatusDelete(' + i + ')"' + (locked ? ' disabled' : '') + ' title="Hapus">Hapus</button>' +
        '</div>';
    }).join('');
  }

  async function statusCall(action, payload, okMsg, keepFilter) {
    setSpin(true);
    try {
      const res = await api(action, payload);
      applyCounts(res.counts);
      pendingFilter = keepFilter != null ? keepFilter : null;
      applyStatuses(res.statuses);
      pendingFilter = null;
      // data di memori bisa basi (nama/tab berubah) → muat ulang tab yang dipakai
      await loadProspects();
      if (okMsg) toast(okMsg(res));
      return res;
    } catch (err) {
      toast(err.message, true);
    } finally {
      pendingFilter = null;
      setSpin(false);
    }
  }

  window.glStatusAdd = function () {
    const el = document.getElementById('gl-status-new');
    const name = el ? el.value.trim() : '';
    if (!name) return toast('Isi nama status dulu.', true);
    statusCall('addStatus', { name: name }, function () { return 'Status "' + name + '" ditambahkan (tab baru dibuat).'; })
      .then(function (r) { if (r && el) el.value = ''; });
  };

  window.glStatusRename = function (i) {
    const from = STATUS_LIST[i];
    const to = prompt('Ganti nama status "' + from + '" menjadi:', from);
    if (to == null || !to.trim() || to.trim() === from) return;
    const cur = document.getElementById('gl-st-filter');
    const keep = cur && cur.value === from ? to.trim() : null;
    statusCall('renameStatus', { from: from, to: to.trim() }, function () { return 'Status diganti nama.'; }, keep);
  };

  window.glStatusDelete = function (i) {
    const name = STATUS_LIST[i];
    const n = counts[name] || 0;
    if (!confirm('Hapus status "' + name + '"?\n\n' + n + ' prospek di dalamnya akan dipindah ke "Baru", lalu tab "' + name + '" dihapus.')) return;
    statusCall('deleteStatus', { name: name, moveTo: 'Baru' }, function (r) {
      return 'Status dihapus' + (r.moved ? ', ' + r.moved + ' prospek dipindah ke Baru.' : '.');
    });
  };

  window.glStatusMove = function (i, dir) {
    const j = i + dir;
    if (j < 0 || j >= STATUS_LIST.length) return;
    const order = STATUS_LIST.slice();
    const t = order[i]; order[i] = order[j]; order[j] = t;
    // urutan di UI langsung berubah, server menyusul
    STATUS_LIST = order;
    fillStatusFilter();
    renderStatusManager();
    renderTable();
    api('reorderStatuses', { order: order }).catch(function (err) { toast(err.message, true); });
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
      // pertama kali buka "Prospek saya": default ke status Baru supaya cuma 1 tab yang dimuat
      const sel = document.getElementById('gl-st-filter');
      if (!savedViewInit && sel && !sel.value) sel.value = 'Baru';
      savedViewInit = true;
      renderSavedForFilter();
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
    if (view === 'saved') {
      const st = (document.getElementById('gl-st-filter') || {}).value || '';
      if (!isLoadedFor(st)) { renderSavedForFilter(); return; }
    }
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
    fillStatusFilter();
    renderStatusManager();
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.tab === 'gaslead') {
          initWaTemplate();
          if (!countsLoaded) loadProspects().catch(function () {});
        }
        if (btn.dataset.tab === 'dashboard') {
          if (!countsLoaded) loadProspects().catch(function () {});
          else renderProspectDash();
        }
      });
    });
    // Load prospek saat admin terbuka (dashboard default)
    const adminScreen = document.getElementById('admin-screen');
    if (adminScreen) {
      const obs = new MutationObserver(function () {
        if (!adminScreen.classList.contains('hidden') && !countsLoaded) {
          loadProspects().catch(function () {});
        }
      });
      obs.observe(adminScreen, { attributes: true, attributeFilter: ['class'] });
    }
  });
})();
