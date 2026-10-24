// ============================================
// GasWeb — Orders Dashboard + Invoice from Order
// Data order: Google Sheet via Apps Script
// Invoice: generate & print (tidak disimpan Firebase)
// ============================================

(function () {
  'use strict';

  // URL Web App Apps Script (apps-script/Code.gs). Otorisasi memakai Firebase ID token
  // user yang sedang login — tidak ada lagi token statis di frontend.
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJA4PNVhkeaHkt9r2e8A1kudZbX1wpJH2CUwT1sMOcU5Kxybq5S2zKG0BDjU_gW6sv/exec';

  /** Panggil Apps Script sebagai admin (POST, text/plain agar tanpa preflight CORS). */
  async function callAdmin(payload) {
    if (typeof auth === 'undefined' || !auth.currentUser) throw new Error('Sesi login habis. Silakan login ulang.');
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({}, payload, { idToken: idToken }))
    });
    let data;
    try { data = await res.json(); } catch (e) { throw new Error('Respon server tidak valid (HTTP ' + res.status + ').'); }
    if (!data.success) throw new Error(data.message || 'Permintaan gagal');
    return data;
  }

  let ordersCache = [];
  let paymentsByOrder = {};   // { orderId: [payment, ...] }
  let paymentsError = '';
  let payBusy = false;
  let currentOrder = null;
  let invItems = [];

  function formatRp(n) {
    const num = Math.round(Number(n) || 0);
    if (num === 0) return 'Rp0';
    return 'Rp' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function addDays(d, n) {
    const x = new Date(d + 'T00:00:00');
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  }
  function formatDateID(s) {
    if (!s) return '-';
    const p = String(s).split(/[- T]/);
    if (p.length >= 3) return p[2].slice(0, 2) + '/' + p[1] + '/' + p[0];
    return s;
  }
  function nextInvNumber() {
    const key = 'gasweb_inv_seq_' + new Date().getFullYear();
    let n = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    localStorage.setItem(key, String(n));
    return 'INV/GW/' + new Date().getFullYear() + '/' + String(n).padStart(3, '0');
  }

  function paidTotal(o) {
    const list = paymentsByOrder[o['Order ID']] || [];
    return list.reduce(function (t, p) { return t + (Number(p['Jumlah']) || 0); }, 0);
  }

  // ---------- Load orders ----------
  async function loadOrders() {
    const statusEl = document.getElementById('orders-status');
    const tbody = document.getElementById('orders-tbody');
    if (statusEl) statusEl.textContent = 'Memuat order...';
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-400 py-8">Memuat data dari Google Sheet...</td></tr>';

    try {
      const [data, payRes] = await Promise.all([
        callAdmin({ action: 'listOrders' }),
        callAdmin({ action: 'listPayments' }).catch(function (e) { return { success: false, message: e.message }; })
      ]);
      ordersCache = data.orders || [];

      // Riwayat pembayaran (opsional: kalau Code.gs belum di-deploy ulang, order tetap tampil)
      paymentsByOrder = {};
      paymentsError = '';
      try {
        const pd = payRes;
        if (!pd || !pd.success) throw new Error((pd && pd.message) || 'listPayments belum tersedia');
        (pd.payments || []).forEach(function (pm) {
          const k = pm['Order ID'];
          (paymentsByOrder[k] = paymentsByOrder[k] || []).push(pm);
        });
      } catch (pe) {
        paymentsError = pe.message || 'Gagal memuat riwayat pembayaran';
      }
      renderOrdersStats();
      renderOrdersTable();
      if (statusEl) statusEl.textContent = ordersCache.length + ' order dimuat · ' + new Date().toLocaleTimeString('id-ID');
    } catch (err) {
      console.error(err);
      ordersCache = [];
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-red-500 py-8">Gagal memuat order. Pastikan Code.gs versi terbaru sudah di-deploy dan akun ini punya akses menu Orders.<br><span class="text-xs">' + esc(err.message) + '</span></td></tr>';
      if (statusEl) statusEl.textContent = 'Error: ' + err.message;
      renderOrdersStats();
    }
  }
  window.loadOrders = loadOrders;

  function renderOrdersStats() {
    const total = ordersCache.length;
    let menunggu = 0, proses = 0, selesai = 0, belumBayar = 0;
    let nilaiTotal = 0, nilaiBayar = 0;
    ordersCache.forEach(function (o) {
      const so = String(o['Status Order'] || '');
      const sp = String(o['Status Pembayaran'] || '');
      const harga = Number(o['Harga Paket']) || 0;
      nilaiTotal += harga;
      const pays = paymentsByOrder[o['Order ID']];
      if (pays && pays.length) nilaiBayar += paidTotal(o);   // riwayat pembayaran nyata
      else if (/lunas/i.test(sp)) nilaiBayar += harga;      // fallback: estimasi dari status
      else if (/dp/i.test(sp)) nilaiBayar += Math.round(harga * 0.7);
      else if (/sebagian/i.test(sp)) nilaiBayar += Math.round(harga * 0.5);
      if (/menunggu/i.test(so)) menunggu++;
      else if (/selesai|done|completed/i.test(so)) selesai++;
      else if (/batal/i.test(so)) { /* skip from proses */ }
      else if (so) proses++;
      if (/belum/i.test(sp)) belumBayar++;
    });
    const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
    // Orders tab stats
    set('ord-stat-total', total);
    set('ord-stat-menunggu', menunggu);
    set('ord-stat-proses', proses);
    set('ord-stat-selesai', selesai);
    set('ord-stat-belumbayar', belumBayar);
    // Dashboard stats
    set('dash-stat-total', total);
    set('dash-stat-menunggu', menunggu);
    set('dash-stat-proses', proses);
    set('dash-stat-selesai', selesai);
    set('dash-stat-belumbayar', belumBayar);
    set('dash-nilai-total', formatRp(nilaiTotal));
    set('dash-nilai-bayar', formatRp(nilaiBayar));
    set('dash-nilai-sisa', formatRp(Math.max(0, nilaiTotal - nilaiBayar)));
    renderDashboardRecent();
  }

  function renderDashboardRecent() {
    const tbody = document.getElementById('dash-recent-body');
    if (!tbody) return;
    const list = ordersCache.slice(0, 8);
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-8 text-sm">Belum ada order.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(function (o) {
      const harga = Number(o['Harga Paket']) || 0;
      const so = o['Status Order'] || '-';
      return '<tr class="border-b border-gray-50 hover:bg-gray-50">' +
        '<td class="py-2.5 pr-2 font-mono text-xs font-semibold text-navy">' + esc(o['Order ID'] || '') + '</td>' +
        '<td class="py-2.5 pr-2"><div class="font-medium text-sm">' + esc(o['Nama Pemesan'] || '') + '</div>' +
        '<div class="text-xs text-gray-400">' + esc(o['Nama Bisnis'] || '') + '</div></td>' +
        '<td class="py-2.5 pr-2 text-xs">' + esc(o['Paket'] || '') + '</td>' +
        '<td class="py-2.5 pr-2"><span class="text-[11px] px-2 py-0.5 rounded-full bg-gray-100">' + esc(so) + '</span></td>' +
        '<td class="py-2.5 text-right text-sm font-semibold">' + (harga > 0 ? formatRp(harga) : 'Custom') + '</td></tr>';
    }).join('');
    const st = document.getElementById('dash-status');
    if (st) st.textContent = ordersCache.length + ' order · diperbarui ' + new Date().toLocaleTimeString('id-ID');
  }

  function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    const q = (document.getElementById('orders-search') || {}).value || '';
    const filter = (document.getElementById('orders-filter') || {}).value || '';
    let list = ordersCache.slice();

    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(function (o) {
        return [o['Order ID'], o['Nama Pemesan'], o['Nama Bisnis'], o['Nomor WhatsApp'], o['Paket']]
          .join(' ').toLowerCase().indexOf(qq) >= 0;
      });
    }
    if (filter === 'menunggu') list = list.filter(function (o) { return /menunggu/i.test(o['Status Order'] || ''); });
    if (filter === 'belumbayar') list = list.filter(function (o) { return /belum/i.test(o['Status Pembayaran'] || ''); });
    if (filter === 'lunas') list = list.filter(function (o) { return /lunas|dibayar/i.test(o['Status Pembayaran'] || '') && !/belum/i.test(o['Status Pembayaran'] || ''); });

    const countEl = document.getElementById('orders-count');
    if (countEl) countEl.textContent = list.length + ' ditampilkan';

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-gray-400 py-10">Belum ada order' + (q || filter ? ' yang cocok' : '') + '.</td></tr>';
      return;
    }

    const statusOrderOpts = ['Menunggu Konfirmasi', 'Dikonfirmasi', 'On Progress', 'Revisi', 'Selesai', 'Dibatalkan'];
    const statusBayarOpts = ['Belum Dibayar', 'DP Dibayar', 'Dibayar Sebagian', 'Lunas'];

    function optHtml(opts, current) {
      const cur = String(current || '').trim();
      let found = false;
      let html = opts.map(function (o) {
        const sel = o === cur ? ' selected' : '';
        if (sel) found = true;
        return '<option value="' + esc(o) + '"' + sel + '>' + esc(o) + '</option>';
      }).join('');
      if (cur && !found) html = '<option value="' + esc(cur) + '" selected>' + esc(cur) + '</option>' + html;
      return html;
    }

    tbody.innerHTML = list.map(function (o) {
      const id = esc(o['Order ID'] || '');
      const harga = Number(o['Harga Paket']) || 0;
      const realIdx = ordersCache.indexOf(o);
      const so = o['Status Order'] || 'Menunggu Konfirmasi';
      const sp = o['Status Pembayaran'] || 'Belum Dibayar';
      return '<tr class="border-b border-gray-100 hover:bg-orange-50/50">' +
        '<td class="px-3 py-2.5 text-xs font-mono font-semibold text-navy">' + id + '</td>' +
        '<td class="px-3 py-2.5 text-xs text-gray-500">' + esc(formatDateID(String(o['Timestamp'] || '').slice(0, 10))) + '</td>' +
        '<td class="px-3 py-2.5 text-sm"><div class="font-medium">' + esc(o['Nama Pemesan']) + '</div><div class="text-xs text-gray-500">' + esc(o['Nama Bisnis']) + '</div></td>' +
        '<td class="px-3 py-2.5 text-xs">' + esc(o['Paket']) + '</td>' +
        '<td class="px-3 py-2.5 text-sm font-semibold">' + (harga > 0 ? formatRp(harga) : 'Custom') + '</td>' +
        '<td class="px-3 py-2.5">' +
          '<select class="text-xs border rounded-lg px-1.5 py-1 max-w-[150px] bg-white" onchange="updateOrderStatusField(' + realIdx + ',\'statusOrder\',this.value)">' +
          optHtml(statusOrderOpts, so) + '</select></td>' +
        '<td class="px-3 py-2.5">' +
          '<select class="text-xs border rounded-lg px-1.5 py-1 max-w-[140px] bg-white" onchange="updateOrderStatusField(' + realIdx + ',\'statusPembayaran\',this.value)">' +
          optHtml(statusBayarOpts, sp) + '</select></td>' +
        '<td class="px-3 py-2.5 text-xs text-gray-500">' + esc(o['Kota']) + '</td>' +
        '<td class="px-3 py-2.5 whitespace-nowrap">' +
          '<button type="button" onclick="openOrderDetail(' + realIdx + ')" class="px-2.5 py-1 rounded-lg border border-navy text-navy text-xs font-semibold hover:bg-navy hover:text-white mr-1">Detail</button>' +
          '<button type="button" onclick="openOrderDetail(' + realIdx + ',true)" class="px-2.5 py-1 rounded-lg border border-green-600 text-green-700 text-xs font-semibold hover:bg-green-600 hover:text-white mr-1">Bayar</button>' +
          '<button type="button" onclick="openInvoiceFromOrder(' + realIdx + ')" class="px-2.5 py-1 rounded-lg bg-orange text-white text-xs font-semibold hover:bg-orange-600 mr-1">Invoice</button>' +
          '<button type="button" onclick="waOrder(' + realIdx + ')" class="px-2.5 py-1 rounded-lg border text-xs font-medium hover:border-orange hover:text-orange">WA</button>' +
        '</td></tr>';
    }).join('');
  }
  window.renderOrdersTable = renderOrdersTable;

  window.updateOrderStatusField = async function (idx, field, value) {
    const o = ordersCache[idx];
    if (!o || !o['Order ID']) return;
    const orderId = o['Order ID'];
    const prevOrder = o['Status Order'];
    const prevPay = o['Status Pembayaran'];

    if (field === 'statusOrder') o['Status Order'] = value;
    if (field === 'statusPembayaran') o['Status Pembayaran'] = value;
    renderOrdersStats();

    const payload = {
      action: 'updateStatus',
      orderId: orderId,
      statusOrder: field === 'statusOrder' ? value : undefined,
      statusPembayaran: field === 'statusPembayaran' ? value : undefined
    };

    try {
      await callAdmin(payload);
      const st = document.getElementById('orders-status');
      if (st) st.textContent = 'Status ' + orderId + ' diperbarui · ' + new Date().toLocaleTimeString('id-ID');
    } catch (err) {
      o['Status Order'] = prevOrder;
      o['Status Pembayaran'] = prevPay;
      renderOrdersTable();
      renderOrdersStats();
      alert('Gagal update status: ' + (err.message || err));
    }
  };

  window.waOrder = function (idx) {
    const o = ordersCache[idx];
    if (!o) return;
    let wa = String(o['Nomor WhatsApp'] || '').replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (!wa) { alert('Nomor WhatsApp kosong'); return; }
    const msg = 'Halo ' + (o['Nama Pemesan'] || '') + ', terima kasih sudah order di GasWeb.\n\nOrder ID: ' + (o['Order ID'] || '') + '\nPaket: ' + (o['Paket'] || '') + '\n\nAda yang bisa kami bantu?';
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
  };

  // ---------- Detail order (semua isian dari order.html + riwayat pembayaran) ----------
  const DETAIL_GROUPS = [
    { title: 'Data Pemesan', keys: ['Order ID', 'Timestamp', 'Nama Pemesan', 'Nama Bisnis', 'Nomor WhatsApp', 'Email', 'Kota'] },
    { title: 'Paket & Pembayaran', keys: ['Paket', 'Harga Paket', 'Estimasi DP', 'Estimasi Pelunasan', 'Status Order', 'Status Pembayaran'] },
    { title: 'Kebutuhan Website', keys: ['Jenis Bisnis', 'Tujuan Website', 'Fitur', 'Referensi Website', 'Deskripsi Kebutuhan', 'Target Pengerjaan', 'Status Materi', 'Preferensi Domain'] }
  ];
  const MONEY_KEYS = ['Harga Paket', 'Estimasi DP', 'Estimasi Pelunasan'];
  const PAY_METHODS = ['Transfer Bank', 'QRIS / E-Wallet', 'Tunai', 'Lainnya'];

  function detailValueHtml(key, val) {
    const v = val == null ? '' : String(val).trim();
    if (MONEY_KEYS.indexOf(key) >= 0) {
      return Number(v) > 0 ? esc(formatRp(v)) : '<span class="text-gray-400">Belum ditentukan</span>';
    }
    if (!v) return '<span class="text-gray-300">-</span>';
    if (/^https?:\/\//i.test(v)) {
      return '<a href="' + esc(v) + '" target="_blank" rel="noopener" class="text-orange underline break-all">' + esc(v) + '</a>';
    }
    if (/referensi/i.test(key) && /\./.test(v) && !/\s/.test(v)) {
      const href = 'https://' + v.replace(/^\/+/, '');
      return '<a href="' + esc(href) + '" target="_blank" rel="noopener" class="text-orange underline break-all">' + esc(v) + '</a>';
    }
    return esc(v).replace(/\n/g, '<br>');
  }

  function paymentSectionHtml(idx, o) {
    const id = o['Order ID'];
    const list = paymentsByOrder[id] || [];
    const harga = Number(o['Harga Paket']) || 0;
    const dp = Number(o['Estimasi DP']) || 0;
    const paid = paidTotal(o);
    const sisa = Math.max(0, harga - paid);
    const lebih = harga > 0 && paid > harga ? paid - harga : 0;
    const inp = 'w-full px-2 py-1.5 border rounded-lg text-sm bg-white';

    let html = '<div id="od-pay" class="mb-5 rounded-xl border border-gray-200 p-4 bg-gray-50/60">' +
      '<h4 class="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Riwayat Pembayaran</h4>';

    if (paymentsError) {
      html += '<div class="mb-3 text-xs rounded-lg bg-red-50 text-red-600 px-3 py-2">Riwayat pembayaran belum bisa dimuat (' + esc(paymentsError) + '). Pastikan Code.gs terbaru sudah di-deploy sebagai versi baru.</div>';
    }

    // ringkasan
    html += '<div class="grid grid-cols-3 gap-2 mb-3">' +
      '<div class="rounded-lg bg-white border p-2"><div class="text-[10px] uppercase text-gray-400">Total</div><div class="text-sm font-bold">' + (harga > 0 ? formatRp(harga) : '<span class="text-gray-400 font-medium">Belum ada</span>') + '</div></div>' +
      '<div class="rounded-lg bg-white border p-2"><div class="text-[10px] uppercase text-green-600">Terbayar</div><div class="text-sm font-bold text-green-600">' + formatRp(paid) + '</div></div>' +
      '<div class="rounded-lg bg-white border p-2"><div class="text-[10px] uppercase text-red-500">Sisa</div><div class="text-sm font-bold text-red-500">' + (harga > 0 ? formatRp(sisa) : '-') + '</div></div>' +
      '</div>';
    if (lebih) html += '<div class="mb-2 text-xs text-amber-600">Terbayar melebihi total sebesar ' + esc(formatRp(lebih)) + '.</div>';
    if (!list.length && /lunas|dp|sebagian/i.test(o['Status Pembayaran'] || '') && !/belum/i.test(o['Status Pembayaran'] || '')) {
      html += '<div class="mb-2 text-xs text-gray-500">Status sudah "' + esc(o['Status Pembayaran']) + '" tetapi belum ada transaksi tercatat. Catat pembayarannya di bawah agar riwayat lengkap.</div>';
    }

    // harga disepakati
    html += '<div class="flex items-end gap-2 mb-4">' +
      '<div class="flex-1"><label class="text-xs text-gray-500">Harga disepakati (Rp)</label>' +
      '<input id="pay-harga" type="number" min="0" step="1000" value="' + (harga || '') + '" placeholder="mis. 1500000" class="' + inp + '"></div>' +
      '<button type="button" onclick="saveHargaFromModal(' + idx + ')" class="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:border-orange hover:text-orange">Simpan harga</button></div>';

    // daftar transaksi
    if (list.length) {
      html += '<div class="overflow-x-auto mb-4"><table class="w-full text-sm"><thead><tr class="text-left text-[11px] uppercase text-gray-400">' +
        '<th class="py-1 pr-2">Tanggal</th><th class="py-1 pr-2">Metode</th><th class="py-1 pr-2">Catatan</th><th class="py-1 pr-2 text-right">Jumlah</th><th></th></tr></thead><tbody>' +
        list.map(function (pm) {
          return '<tr class="border-t border-gray-200">' +
            '<td class="py-1.5 pr-2 whitespace-nowrap">' + esc(formatDateID(pm['Tanggal'])) + '</td>' +
            '<td class="py-1.5 pr-2 text-xs">' + esc(pm['Metode'] || '-') + '</td>' +
            '<td class="py-1.5 pr-2 text-xs text-gray-500">' + esc(pm['Catatan'] || '') + '</td>' +
            '<td class="py-1.5 pr-2 text-right font-semibold whitespace-nowrap">' + esc(formatRp(pm['Jumlah'])) + '</td>' +
            '<td class="py-1.5 text-right"><button type="button" title="Hapus transaksi" onclick="deletePaymentFromModal(' + idx + ',\'' + esc(pm['Payment ID']) + '\')" class="text-gray-300 hover:text-red-500 text-base leading-none">&times;</button></td></tr>';
        }).join('') + '</tbody></table></div>';
    } else {
      html += '<div class="mb-4 text-xs text-gray-400">Belum ada transaksi tercatat.</div>';
    }

    // form tambah
    html += '<div class="rounded-lg bg-white border p-3"><div class="text-xs font-semibold mb-2">Catat pembayaran baru</div>' +
      '<div class="grid grid-cols-2 gap-2 mb-2">' +
        '<div><label class="text-xs text-gray-500">Tanggal bayar</label><input id="pay-date" type="date" value="' + todayStr() + '" class="' + inp + '"></div>' +
        '<div><label class="text-xs text-gray-500">Jumlah (Rp)</label><input id="pay-amount" type="number" min="1" step="1000" placeholder="0" class="' + inp + '"></div>' +
        '<div><label class="text-xs text-gray-500">Metode</label><select id="pay-method" class="' + inp + '">' +
          PAY_METHODS.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select></div>' +
        '<div><label class="text-xs text-gray-500">Catatan (opsional)</label><input id="pay-note" type="text" maxlength="200" placeholder="mis. DP 70%" class="' + inp + '"></div>' +
      '</div>' +
      '<div class="flex items-center gap-2 flex-wrap">' +
        '<button type="button" onclick="addPaymentFromModal(' + idx + ')" class="px-3 py-1.5 rounded-lg bg-orange text-white text-xs font-semibold hover:bg-orange-600">+ Catat pembayaran</button>' +
        (dp > 0 ? '<button type="button" onclick="fillPayAmount(' + dp + ',\'DP\')" class="px-2 py-1 rounded-lg border text-xs hover:border-orange">Isi DP (' + esc(formatRp(dp)) + ')</button>' : '') +
        (harga > 0 && sisa > 0 ? '<button type="button" onclick="fillPayAmount(' + sisa + ',\'Pelunasan\')" class="px-2 py-1 rounded-lg border text-xs hover:border-orange">Isi sisa (' + esc(formatRp(sisa)) + ')</button>' : '') +
      '</div></div></div>';
    return html;
  }

  function renderOrderDetailModal(idx, focusPay) {
    const o = ordersCache[idx];
    if (!o) return;
    currentOrder = o;

    let modal = document.getElementById('order-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'order-detail-modal';
      modal.className = 'fixed inset-0 z-50 hidden items-center justify-center bg-black/50 p-4';
      modal.addEventListener('click', function (e) { if (e.target === modal) closeOrderDetail(); });
      document.body.appendChild(modal);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOrderDetail(); });
    }
    const prevBody = document.getElementById('od-body');
    const prevScroll = prevBody ? prevBody.scrollTop : 0;

    const keys = Object.keys(o);
    const used = {};
    const groups = DETAIL_GROUPS.map(function (g) {
      const ks = g.keys.filter(function (k) { return keys.indexOf(k) >= 0; });
      ks.forEach(function (k) { used[k] = true; });
      return { title: g.title, keys: ks };
    });
    const rest = keys.filter(function (k) { return !used[k]; });
    if (rest.length) groups.push({ title: 'Data Lainnya', keys: rest });

    const body = groups.filter(function (g) { return g.keys.length; }).map(function (g) {
      let html = '<div class="mb-5"><h4 class="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">' + esc(g.title) + '</h4>' +
        '<dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">' +
        g.keys.map(function (k) {
          const long = String(o[k] || '').length > 60 || /tujuan|fitur|deskripsi/i.test(k);
          return '<div class="' + (long ? 'sm:col-span-2' : '') + '"><dt class="text-xs text-gray-500">' + esc(k) + '</dt>' +
            '<dd class="text-sm font-medium text-gray-800 mt-0.5">' + detailValueHtml(k, o[k]) + '</dd></div>';
        }).join('') + '</dl></div>';
      if (g.title === 'Paket & Pembayaran') html += paymentSectionHtml(idx, o);
      return html;
    }).join('');

    modal.innerHTML =
      '<div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">' +
        '<div class="flex items-start justify-between px-5 py-4 border-b">' +
          '<div><h3 class="font-bold text-navy">Detail Order</h3>' +
          '<p class="text-xs font-mono text-gray-500">' + esc(o['Order ID'] || '') + '</p></div>' +
          '<button type="button" onclick="closeOrderDetail()" class="text-gray-400 hover:text-gray-700 text-xl leading-none" aria-label="Tutup">&times;</button>' +
        '</div>' +
        '<div id="od-body" class="px-5 py-4 overflow-y-auto">' + body + '</div>' +
        '<div class="flex gap-2 justify-end px-5 py-3 border-t bg-gray-50 rounded-b-2xl">' +
          '<button type="button" onclick="waOrder(' + idx + ')" class="px-3 py-1.5 rounded-lg border text-sm font-medium hover:border-orange hover:text-orange">WA</button>' +
          '<button type="button" onclick="closeOrderDetail();openInvoiceFromOrder(' + idx + ')" class="px-3 py-1.5 rounded-lg bg-orange text-white text-sm font-semibold hover:bg-orange-600">Buat Invoice</button>' +
        '</div>' +
      '</div>';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.dataset.idx = String(idx);

    const bodyEl = document.getElementById('od-body');
    if (focusPay) {
      const pay = document.getElementById('od-pay');
      if (pay) bodyEl.scrollTop = pay.offsetTop - 8;
    } else {
      bodyEl.scrollTop = prevScroll;
    }
  }

  window.openOrderDetail = function (idx, focusPay) { renderOrderDetailModal(idx, !!focusPay); };
  window.closeOrderDetail = function () {
    const m = document.getElementById('order-detail-modal');
    if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
  };

  async function postAdmin(payload) {
    return callAdmin(payload);
  }

  function afterPaymentChange(idx) {
    renderOrdersTable();
    renderOrdersStats();
    renderOrderDetailModal(idx, false);
  }

  window.fillPayAmount = function (n, note) {
    const a = document.getElementById('pay-amount');
    const nt = document.getElementById('pay-note');
    if (a) a.value = n;
    if (nt && !nt.value) nt.value = note || '';
  };

  window.addPaymentFromModal = async function (idx) {
    const o = ordersCache[idx];
    if (!o || payBusy) return;
    const tanggal = (document.getElementById('pay-date') || {}).value || '';
    const jumlah = Number((document.getElementById('pay-amount') || {}).value);
    const metode = (document.getElementById('pay-method') || {}).value || '';
    const catatan = (document.getElementById('pay-note') || {}).value || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) { alert('Tanggal bayar belum diisi.'); return; }
    if (!(jumlah > 0)) { alert('Jumlah pembayaran harus lebih dari 0.'); return; }

    payBusy = true;
    try {
      const data = await postAdmin({ action: 'addPayment', orderId: o['Order ID'], tanggal: tanggal, jumlah: jumlah, metode: metode, catatan: catatan });
      const id = o['Order ID'];
      (paymentsByOrder[id] = paymentsByOrder[id] || []).push(data.payment);
      paymentsByOrder[id].sort(function (a, b) { return String(a['Tanggal'] + a['Dicatat Pada']).localeCompare(String(b['Tanggal'] + b['Dicatat Pada'])); });
      if (data.statusPembayaran) o['Status Pembayaran'] = data.statusPembayaran;
      paymentsError = '';
      afterPaymentChange(idx);
    } catch (err) {
      alert('Gagal mencatat pembayaran: ' + (err.message || err));
    } finally {
      payBusy = false;
    }
  };

  window.deletePaymentFromModal = async function (idx, paymentId) {
    const o = ordersCache[idx];
    if (!o || payBusy) return;
    if (!confirm('Hapus transaksi ini dari riwayat pembayaran?')) return;
    payBusy = true;
    try {
      const data = await postAdmin({ action: 'deletePayment', paymentId: paymentId });
      const id = o['Order ID'];
      paymentsByOrder[id] = (paymentsByOrder[id] || []).filter(function (p) { return p['Payment ID'] !== paymentId; });
      if (data.statusPembayaran) o['Status Pembayaran'] = data.statusPembayaran;
      afterPaymentChange(idx);
    } catch (err) {
      alert('Gagal menghapus: ' + (err.message || err));
    } finally {
      payBusy = false;
    }
  };

  window.saveHargaFromModal = async function (idx) {
    const o = ordersCache[idx];
    if (!o || payBusy) return;
    const raw = (document.getElementById('pay-harga') || {}).value;
    const harga = Number(raw);
    if (raw === '' || isNaN(harga) || harga < 0) { alert('Isi harga dengan angka yang valid.'); return; }
    payBusy = true;
    try {
      const data = await postAdmin({ action: 'setHarga', orderId: o['Order ID'], harga: harga });
      o['Harga Paket'] = data.harga;
      o['Estimasi DP'] = data.dp;
      o['Estimasi Pelunasan'] = data.pelunasan;
      if (data.statusPembayaran) o['Status Pembayaran'] = data.statusPembayaran;
      afterPaymentChange(idx);
    } catch (err) {
      alert('Gagal menyimpan harga: ' + (err.message || err));
    } finally {
      payBusy = false;
    }
  };

  // ---------- Invoice from order ----------
  window.openInvoiceFromOrder = function (idx) {
    const o = ordersCache[idx];
    if (!o) return;
    currentOrder = o;
    const harga = Number(o['Harga Paket']) || 0;
    const dp = Number(o['Estimasi DP']) || 0;

    document.getElementById('inv-number').value = nextInvNumber();
    document.getElementById('inv-date').value = todayStr();
    document.getElementById('inv-due').value = addDays(todayStr(), 7);
    document.getElementById('inv-status').value = /lunas/i.test(o['Status Pembayaran'] || '') ? 'Lunas' : (dp > 0 && /dp/i.test(o['Status Pembayaran'] || '') ? 'DP Dibayar' : 'Belum Dibayar');
    document.getElementById('inv-client-name').value = o['Nama Bisnis'] || o['Nama Pemesan'] || '';
    document.getElementById('inv-client-pic').value = o['Nama Pemesan'] || '';
    document.getElementById('inv-client-email').value = o['Email'] || '';
    document.getElementById('inv-client-wa').value = o['Nomor WhatsApp'] || '';
    document.getElementById('inv-client-city').value = o['Kota'] || '';
    document.getElementById('inv-client-note').value = 'Order ID: ' + (o['Order ID'] || '');
    document.getElementById('inv-notes').value = 'Terima kasih telah mempercayakan kebutuhan website Anda kepada GasWeb.\nReferensi order: ' + (o['Order ID'] || '');
    document.getElementById('inv-terms').value =
      '1. Pengerjaan dimulai setelah pembayaran uang muka diterima dan kebutuhan proyek disepakati.\n' +
      '2. Pelunasan dilakukan sesuai kesepakatan yang tercantum pada invoice.\n' +
      '3. Perubahan di luar ruang lingkup pekerjaan dapat dikenakan biaya tambahan setelah disetujui klien.\n' +
      '4. Ketentuan revisi, pemeliharaan, dan garansi mengikuti kesepakatan proyek.\n' +
      '5. Invoice ini merupakan dokumen penagihan atas layanan yang tercantum di dalamnya.';

    invItems = [{
      name: o['Paket'] || 'Jasa Website',
      desc: (o['Jenis Bisnis'] ? o['Jenis Bisnis'] + ' · ' : '') + (o['Tujuan Website'] || ''),
      qty: 1,
      price: harga,
      discount: 0
    }];
    document.getElementById('inv-discount').value = 0;
    document.getElementById('inv-tax').value = 0;
    document.getElementById('inv-extra').value = 0;
    document.getElementById('inv-dp').value = dp > 0 ? dp : 0;

    renderInvItems();
    recalcInv();

    // Switch to invoice tab
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.add('hidden'); });
    const invTabBtn = document.querySelector('.tab-btn[data-tab="invoice"]');
    if (invTabBtn) invTabBtn.classList.add('active');
    document.getElementById('tab-invoice').classList.remove('hidden');
    window.scrollTo(0, 0);
  };

  function renderInvItems() {
    const tbody = document.getElementById('inv-items-body');
    if (!tbody) return;
    if (!invItems.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-gray-400 py-4">Belum ada item</td></tr>';
      return;
    }
    tbody.innerHTML = invItems.map(function (it, i) {
      const sub = Math.max(0, (Number(it.qty) || 0) * (Number(it.price) || 0) - (Number(it.discount) || 0));
      return '<tr class="border-b border-gray-100">' +
        '<td class="px-2 py-1.5 text-center text-xs">' + (i + 1) + '</td>' +
        '<td class="px-2 py-1.5"><input class="w-full px-2 py-1 border rounded text-sm" value="' + esc(it.name) + '" onchange="updInvItem(' + i + ',\'name\',this.value)"></td>' +
        '<td class="px-2 py-1.5"><input class="w-full px-2 py-1 border rounded text-sm" value="' + esc(it.desc) + '" onchange="updInvItem(' + i + ',\'desc\',this.value)"></td>' +
        '<td class="px-2 py-1.5 w-16"><input type="number" min="0.01" class="w-full px-2 py-1 border rounded text-sm" value="' + esc(it.qty) + '" onchange="updInvItem(' + i + ',\'qty\',this.value)"></td>' +
        '<td class="px-2 py-1.5 w-28"><input type="number" min="0" class="w-full px-2 py-1 border rounded text-sm" value="' + esc(it.price) + '" onchange="updInvItem(' + i + ',\'price\',this.value)"></td>' +
        '<td class="px-2 py-1.5 w-24"><input type="number" min="0" class="w-full px-2 py-1 border rounded text-sm" value="' + esc(it.discount) + '" onchange="updInvItem(' + i + ',\'discount\',this.value)"></td>' +
        '<td class="px-2 py-1.5 text-right text-sm font-semibold">' + formatRp(sub) + '</td>' +
        '</tr>';
    }).join('');
  }
  window.updInvItem = function (i, f, v) {
    if (!invItems[i]) return;
    if (f === 'qty' || f === 'price' || f === 'discount') invItems[i][f] = Math.max(0, parseFloat(v) || 0);
    else invItems[i][f] = v;
    renderInvItems();
    recalcInv();
  };
  window.addInvItem = function () {
    invItems.push({ name: '', desc: '', qty: 1, price: 0, discount: 0 });
    renderInvItems();
    recalcInv();
  };

  function calcInv() {
    let sub = 0;
    invItems.forEach(function (it) {
      sub += Math.max(0, (Number(it.qty) || 0) * (Number(it.price) || 0) - (Number(it.discount) || 0));
    });
    const disc = Math.min(parseFloat(document.getElementById('inv-discount').value) || 0, sub);
    const taxPct = parseFloat(document.getElementById('inv-tax').value) || 0;
    const extra = parseFloat(document.getElementById('inv-extra').value) || 0;
    const tax = Math.round(Math.max(0, sub - disc) * taxPct / 100);
    const total = Math.max(0, sub - disc + tax + extra);
    const paid = parseFloat(document.getElementById('inv-dp').value) || 0;
    return { sub: sub, disc: disc, tax: tax, extra: extra, total: total, paid: Math.min(paid, total), remaining: Math.max(0, total - Math.min(paid, total)) };
  }
  function recalcInv() {
    const t = calcInv();
    const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('inv-s-sub', formatRp(t.sub));
    set('inv-s-disc', '- ' + formatRp(t.disc));
    set('inv-s-tax', formatRp(t.tax));
    set('inv-s-extra', formatRp(t.extra));
    set('inv-s-total', formatRp(t.total));
    set('inv-s-paid', formatRp(t.paid));
    set('inv-s-remain', formatRp(t.remaining));
  }
  window.recalcInv = recalcInv;

  function buildInvoiceHTML() {
    const t = calcInv();
    const number = document.getElementById('inv-number').value;
    const date = document.getElementById('inv-date').value;
    const due = document.getElementById('inv-due').value;
    const status = document.getElementById('inv-status').value;
    const cName = document.getElementById('inv-client-name').value;
    const cPic = document.getElementById('inv-client-pic').value;
    const cEmail = document.getElementById('inv-client-email').value;
    const cWa = document.getElementById('inv-client-wa').value;
    const cCity = document.getElementById('inv-client-city').value;
    const cNote = document.getElementById('inv-client-note').value;
    const notes = document.getElementById('inv-notes').value;
    const terms = document.getElementById('inv-terms').value;

    // Seller dari settings website jika ada
    let sellerWA = '', sellerEmail = '';
    try {
      if (typeof currentData !== 'undefined' && currentData.settings) {
        sellerWA = currentData.settings.whatsapp || '';
        sellerEmail = currentData.settings.email || '';
      }
    } catch (e) {}

    let rows = '';
    invItems.forEach(function (it, i) {
      if (!it.name && !it.price) return;
      const sub = Math.max(0, (Number(it.qty) || 0) * (Number(it.price) || 0) - (Number(it.discount) || 0));
      rows += '<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb">' + (i + 1) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>' + esc(it.name) + '</strong>' +
        (it.desc ? '<div style="font-size:11px;color:#6b7280">' + esc(it.desc) + '</div>' : '') + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center">' + esc(it.qty) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">' + formatRp(it.price) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">' + formatRp(sub) + '</td></tr>';
    });

    const badgeColor = status === 'Lunas' ? '#16a34a' : (status === 'Belum Dibayar' ? '#dc2626' : '#ca8a04');

    return '<div style="font-family:system-ui,sans-serif;color:#0F1F3D;max-width:800px;margin:0 auto;padding:32px">' +
      '<div style="display:flex;justify-content:space-between;border-bottom:3px solid #0F1F3D;padding-bottom:16px;margin-bottom:24px">' +
      '<div><div style="font-size:26px;font-weight:800">Gas<span style="color:#FF5A1F">Web</span></div>' +
      '<div style="font-size:11px;color:#6b7280">Website Profesional, Bisnis Makin Gas.</div></div>' +
      '<div style="text-align:right"><div style="font-size:16px;font-weight:800">' + esc(number) + '</div>' +
      '<div style="font-size:12px;color:#6b7280">Tanggal: ' + formatDateID(date) + (due ? '<br>Jatuh Tempo: ' + formatDateID(due) : '') + '</div>' +
      '<div style="margin-top:6px"><span style="background:' + badgeColor + ';color:#fff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700">' + esc(status) + '</span></div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">' +
      '<div><div style="font-size:10px;text-transform:uppercase;color:#6b7280;margin-bottom:4px">Dari</div>' +
      '<div style="font-weight:700">GasWeb</div><div style="font-size:12px;color:#6b7280">Cirebon, Jawa Barat<br>https://gasweb.id' +
      (sellerWA ? '<br>WA: ' + esc(sellerWA) : '') + '</div></div>' +
      '<div><div style="font-size:10px;text-transform:uppercase;color:#6b7280;margin-bottom:4px">Untuk</div>' +
      '<div style="font-weight:700">' + esc(cName) + '</div><div style="font-size:12px;color:#6b7280">' +
      (cPic ? 'PIC: ' + esc(cPic) + '<br>' : '') + (cCity ? esc(cCity) + '<br>' : '') +
      (cEmail ? esc(cEmail) + '<br>' : '') + (cWa ? esc(cWa) + '<br>' : '') + (cNote ? esc(cNote) : '') +
      '</div></div></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">' +
      '<thead><tr style="background:#0F1F3D;color:#fff">' +
      '<th style="padding:8px;text-align:left">No</th><th style="padding:8px;text-align:left">Layanan</th>' +
      '<th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Harga</th>' +
      '<th style="padding:8px;text-align:right">Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:24px"><table style="width:260px;font-size:13px">' +
      '<tr><td style="padding:4px 0">Subtotal</td><td style="text-align:right;font-weight:600">' + formatRp(t.sub) + '</td></tr>' +
      (t.disc > 0 ? '<tr><td style="padding:4px 0">Diskon</td><td style="text-align:right">- ' + formatRp(t.disc) + '</td></tr>' : '') +
      (t.tax > 0 ? '<tr><td style="padding:4px 0">Pajak</td><td style="text-align:right">' + formatRp(t.tax) + '</td></tr>' : '') +
      (t.extra > 0 ? '<tr><td style="padding:4px 0">Biaya Tambahan</td><td style="text-align:right">' + formatRp(t.extra) + '</td></tr>' : '') +
      '<tr style="border-top:2px solid #0F1F3D"><td style="padding:8px 0;font-weight:800;font-size:15px">Total</td><td style="text-align:right;font-weight:800;font-size:15px">' + formatRp(t.total) + '</td></tr>' +
      (t.paid > 0 ? '<tr><td style="padding:4px 0">Dibayar / DP</td><td style="text-align:right">' + formatRp(t.paid) + '</td></tr>' : '') +
      (t.remaining > 0 ? '<tr><td style="padding:4px 0;color:#dc2626;font-weight:700">Sisa</td><td style="text-align:right;color:#dc2626;font-weight:700">' + formatRp(t.remaining) + '</td></tr>' : '') +
      '</table></div>' +
      (notes ? '<div style="font-size:12px;margin-bottom:12px"><strong>Catatan</strong><br>' + esc(notes).replace(/\n/g, '<br>') + '</div>' : '') +
      (terms ? '<div style="font-size:11px;color:#6b7280;margin-bottom:16px"><strong style="color:#0F1F3D">Syarat & Ketentuan</strong><br>' + esc(terms).replace(/\n/g, '<br>') + '</div>' : '') +
      '<div style="border-top:1px solid #e5e7eb;padding-top:12px;text-align:center;font-size:11px;color:#6b7280">' +
      '<strong style="color:#0F1F3D">Gas<span style="color:#FF5A1F">Web</span></strong> · https://gasweb.id<br>Website Profesional, Bisnis Makin Gas.</div></div>';
  }

  window.previewInvoiceDoc = function () {
    const html = buildInvoiceHTML();
    document.getElementById('inv-preview').innerHTML = html;
    document.getElementById('inv-preview-wrap').classList.remove('hidden');
  };

  window.printInvoiceDoc = function () {
    const html = buildInvoiceHTML();
    const w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html><head><title>Invoice GasWeb</title><style>@page{size:A4;margin:12mm}body{margin:0}</style></head><body>' + html +
      '<script>window.onload=function(){window.print();}<\/script></body></html>');
    w.document.close();
  };

  window.waInvoiceDoc = function () {
    const t = calcInv();
    let wa = (document.getElementById('inv-client-wa').value || '').replace(/\D/g, '');
    if (wa.startsWith('0')) wa = '62' + wa.slice(1);
    if (!wa || wa.length < 10) { alert('Nomor WhatsApp klien belum diisi'); return; }
    const number = document.getElementById('inv-number').value;
    const name = document.getElementById('inv-client-name').value;
    const due = document.getElementById('inv-due').value;
    const layanan = invItems.filter(function (i) { return i.name; }).map(function (i) { return i.name; }).join(', ') || '-';
    const msg =
      'Halo Bapak/Ibu ' + name + ',\n\n' +
      'Berikut informasi invoice dari GasWeb:\n\n' +
      'Nomor Invoice: ' + number + '\n' +
      'Layanan: ' + layanan + '\n' +
      'Total Invoice: ' + formatRp(t.total) + '\n' +
      'Total Dibayar: ' + formatRp(t.paid) + '\n' +
      'Sisa Pembayaran: ' + formatRp(t.remaining) + '\n' +
      'Jatuh Tempo: ' + formatDateID(due) + '\n\n' +
      'Mohon melakukan pembayaran sesuai informasi pada invoice.\n\n' +
      'Terima kasih telah mempercayakan kebutuhan website Anda kepada GasWeb.\n\n' +
      'Website Profesional, Bisnis Makin Gas.';
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
  };

  // Hook: load orders when Dashboard / Orders tab clicked
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const tab = btn.dataset.tab;
        if (tab === 'orders' || tab === 'dashboard') {
          if (!ordersCache.length) loadOrders();
          else {
            renderOrdersStats();
            if (tab === 'orders') renderOrdersTable();
          }
        }
      });
    });
    // Auto-load when admin screen becomes visible (default tab = dashboard)
    const adminScreen = document.getElementById('admin-screen');
    if (adminScreen) {
      const obs = new MutationObserver(function () {
        if (!adminScreen.classList.contains('hidden') && !ordersCache.length) {
          loadOrders();
        }
      });
      obs.observe(adminScreen, { attributes: true, attributeFilter: ['class'] });
    }
  });
})();
