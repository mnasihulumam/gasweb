// ============================================
// GasWeb Admin - User, Role & Role Auth
// Data disimpan di Firebase Realtime Database:
//   users/{uid}      -> { name, email, roleId, active, createdAt }
//   roles/{roleId}   -> { name, description, createdAt }
//   roleAuth/{roleId}-> { [menuKey]: true }
// Password tetap dikelola Firebase Authentication.
// ============================================

(function () {
  'use strict';

  const SUPER_ROLE = 'superadmin';
  const ALWAYS_TABS = ['dashboard', 'password'];
  const SUPER_ONLY_TABS = ['users', 'roles', 'roleauth'];

  // Node Firebase -> menu (tab) yang berhak menulisnya
  const NODE_TAB = {
    settings: 'settings',
    logo: 'logo',
    packages: 'packages',
    portfolio: 'portfolio',
    services: 'services',
    problems: 'problems',
    features: 'features',
    steps: 'steps',
    testimonials: 'testimonials',
    faq: 'faq',
    bankAccounts: 'bank'
  };

  // Daftar menu yang bisa diatur lewat Role Auth
  const MENU_GROUPS = [
    {
      title: 'Konten Website', icon: 'fa-solid fa-globe',
      items: [
        { key: 'settings', label: 'Settings & Teks' },
        { key: 'bank', label: 'Rekening' },
        { key: 'logo', label: 'Logo' },
        { key: 'packages', label: 'Paket' },
        { key: 'portfolio', label: 'Portfolio' },
        { key: 'services', label: 'Services' },
        { key: 'problems', label: 'Problems' },
        { key: 'features', label: 'Features' },
        { key: 'steps', label: 'Steps' },
        { key: 'testimonials', label: 'Testimoni' },
        { key: 'faq', label: 'FAQ' }
      ]
    },
    {
      title: 'Bisnis', icon: 'fa-solid fa-briefcase',
      items: [
        { key: 'orders', label: 'Orders' },
        { key: 'invoice', label: 'Invoice' },
        { key: 'gaslead', label: 'GasLead' }
      ]
    }
  ];

  const state = { user: null, profile: null, isSuper: false, perms: {} };
  const cache = { users: {}, roles: {}, roleAuth: {} };
  let editingUid = null;
  let editingRoleId = null;

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  function h(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function notify(msg, type) {
    if (typeof window.showStatus === 'function') window.showStatus(msg, type);
    else alert(msg);
  }
  function fmtDate(ts) {
    if (!ts) return '-';
    return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ---------- AKSES ----------
  function can(tab) {
    if (ALWAYS_TABS.indexOf(tab) !== -1) return true;
    if (SUPER_ONLY_TABS.indexOf(tab) !== -1) return state.isSuper;
    if (state.isSuper) return true;
    return state.perms[tab] === true;
  }

  function canWriteNode(node) {
    const tab = NODE_TAB[node];
    if (!tab) return state.isSuper;
    return can(tab);
  }

  function deny(message) {
    return { ok: false, message: message };
  }

  // Jika belum ada satu pun user di database, akun yang login pertama
  // didaftarkan sebagai Super Admin. Penulisan tetap dijaga oleh Firebase Rules,
  // jadi akun yang tidak berhak akan ditolak server.
  async function bootstrapOwner(user) {
    try {
      const all = await db.ref('users').once('value');
      if (all.exists()) return null;
      const profile = {
        name: (user.email || 'Admin').split('@')[0],
        email: user.email || '',
        roleId: SUPER_ROLE,
        active: true,
        createdAt: Date.now()
      };
      const updates = {};
      updates['roles/' + SUPER_ROLE] = { name: 'Super Admin', description: 'Akses penuh ke semua menu', system: true, createdAt: Date.now() };
      updates['users/' + user.uid] = profile;
      await db.ref().update(updates);
      return profile;
    } catch (e) {
      console.warn('Bootstrap Super Admin gagal:', e);
      return null;
    }
  }

  async function init(user) {
    try {
      state.user = null; state.profile = null; state.isSuper = false; state.perms = {};
      editingUid = null; editingRoleId = null;

      const snap = await db.ref('users/' + user.uid).once('value');
      let profile = snap.val();
      if (!profile) {
        profile = await bootstrapOwner(user);
        if (!profile) return deny('Akun ini belum terdaftar sebagai user admin. Hubungi Super Admin.');
      }
      if (profile.active === false) return deny('Akun kamu dinonaktifkan. Hubungi Super Admin.');

      const isSuper = profile.roleId === SUPER_ROLE;
      let perms = {};
      if (!isSuper) {
        if (!profile.roleId) return deny('Akun kamu belum punya role. Hubungi Super Admin.');
        const rs = await db.ref('roleAuth/' + profile.roleId).once('value');
        perms = rs.val() || {};
      }

      state.user = user; state.profile = profile; state.isSuper = isSuper; state.perms = perms;
      applyMenu();
      return { ok: true };
    } catch (e) {
      console.error(e);
      return deny('Gagal memeriksa akses: ' + (e.message || e));
    }
  }

  function applyMenu() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.style.display = can(btn.dataset.tab) ? '' : 'none';
    });
    document.querySelectorAll('.nav-group').forEach(function (group) {
      const anyVisible = Array.prototype.some.call(group.querySelectorAll('.tab-btn'), function (b) { return b.style.display !== 'none'; });
      group.style.display = anyVisible ? '' : 'none';
    });
    // Tombol Aksi Cepat di dashboard mengikuti hak akses
    document.querySelectorAll('#tab-dashboard button[onclick]').forEach(function (b) {
      const m = /data-tab=([a-z]+)\]/.exec(b.getAttribute('onclick') || '');
      if (m) b.style.display = can(m[1]) ? '' : 'none';
    });
  }

  window.GasAccess = {
    init: init,
    can: can,
    canWriteNode: canWriteNode,
    isSuper: function () { return state.isSuper; }
  };

  // ---------- DATA ----------
  async function loadAccessData() {
    const res = await Promise.all(['users', 'roles', 'roleAuth'].map(function (p) { return db.ref(p).once('value'); }));
    cache.users = res[0].val() || {};
    cache.roles = res[1].val() || {};
    cache.roleAuth = res[2].val() || {};
    cache.roles[SUPER_ROLE] = Object.assign({ name: 'Super Admin', description: 'Akses penuh ke semua menu', system: true }, cache.roles[SUPER_ROLE] || {});
  }

  async function refreshAll() {
    try {
      await loadAccessData();
      renderAll();
    } catch (e) {
      console.error(e);
      notify('Gagal memuat data user/role. Pastikan Firebase Rules sudah diperbarui (lihat README).', 'error');
    }
  }

  function sortedRoleIds() {
    return Object.keys(cache.roles).sort(function (a, b) {
      if (a === SUPER_ROLE) return -1;
      if (b === SUPER_ROLE) return 1;
      return String(cache.roles[a].name || '').localeCompare(String(cache.roles[b].name || ''));
    });
  }

  function sortedUserIds() {
    return Object.keys(cache.users).sort(function (a, b) {
      return String(cache.users[a].name || cache.users[a].email || '').localeCompare(String(cache.users[b].name || cache.users[b].email || ''));
    });
  }

  function roleName(id) {
    return cache.roles[id] ? cache.roles[id].name : '(role dihapus)';
  }

  function roleOptions(selected, includeEmpty) {
    let html = includeEmpty ? '<option value="">- Pilih role -</option>' : '';
    sortedRoleIds().forEach(function (id) {
      html += '<option value="' + h(id) + '"' + (id === selected ? ' selected' : '') + '>' + h(cache.roles[id].name) + '</option>';
    });
    return html;
  }

  function activeSuperCount(excludeUid) {
    return Object.keys(cache.users).filter(function (uid) {
      const u = cache.users[uid];
      return uid !== excludeUid && u.roleId === SUPER_ROLE && u.active !== false;
    }).length;
  }

  // ---------- RENDER ----------
  function renderAll() {
    renderUsers();
    renderRoles();
    renderRoleUsers();
    renderRoleAuth();
  }

  function renderUsers() {
    const tbody = $('users-tbody');
    if (!tbody) return;
    const ids = sortedUserIds();
    if (!ids.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-400 py-10">Belum ada user.</td></tr>';
      return;
    }
    tbody.innerHTML = ids.map(function (uid) {
      const u = cache.users[uid];
      const isMe = state.user && uid === state.user.uid;
      const roleBadge = u.roleId === SUPER_ROLE
        ? '<span class="px-2 py-0.5 rounded-full bg-navy text-white text-[11px] font-semibold">' + h(roleName(u.roleId)) + '</span>'
        : '<span class="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-semibold">' + h(roleName(u.roleId)) + '</span>';
      const status = u.active === false
        ? '<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-semibold">Nonaktif</span>'
        : '<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold">Aktif</span>';
      return '<tr class="border-t">' +
        '<td class="px-3 py-2.5 font-medium">' + h(u.name || '-') + (isMe ? ' <span class="text-[10px] text-gray-400">(kamu)</span>' : '') + '</td>' +
        '<td class="px-3 py-2.5 text-gray-600">' + h(u.email || '-') + '</td>' +
        '<td class="px-3 py-2.5">' + roleBadge + '</td>' +
        '<td class="px-3 py-2.5">' + status + '</td>' +
        '<td class="px-3 py-2.5 text-gray-500">' + h(fmtDate(u.createdAt)) + '</td>' +
        '<td class="px-3 py-2.5 text-right whitespace-nowrap">' +
          '<button type="button" data-act="edit" data-uid="' + h(uid) + '" class="px-2 py-1 text-gray-500 hover:text-orange" title="Edit" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>' +
          '<button type="button" data-act="reset" data-uid="' + h(uid) + '" class="px-2 py-1 text-gray-500 hover:text-orange" title="Reset password" aria-label="Reset password"><i class="fa-solid fa-key"></i></button>' +
          '<button type="button" data-act="delete" data-uid="' + h(uid) + '" class="px-2 py-1 text-gray-500 hover:text-red-600" title="Hapus" aria-label="Hapus"><i class="fa-solid fa-trash"></i></button>' +
        '</td></tr>';
    }).join('');
  }

  function renderRoles() {
    const tbody = $('roles-tbody');
    if (!tbody) return;
    const counts = {};
    Object.keys(cache.users).forEach(function (uid) {
      const r = cache.users[uid].roleId;
      counts[r] = (counts[r] || 0) + 1;
    });
    tbody.innerHTML = sortedRoleIds().map(function (id) {
      const r = cache.roles[id];
      const system = id === SUPER_ROLE;
      return '<tr class="border-t">' +
        '<td class="px-3 py-2.5 font-medium">' + h(r.name) + (system ? ' <span class="ml-1 px-2 py-0.5 rounded-full bg-navy text-white text-[10px] font-semibold">Sistem</span>' : '') + '</td>' +
        '<td class="px-3 py-2.5 text-gray-600">' + h(r.description || '-') + '</td>' +
        '<td class="px-3 py-2.5">' + (counts[id] || 0) + '</td>' +
        '<td class="px-3 py-2.5 text-right whitespace-nowrap">' + (system
          ? '<span class="text-[11px] text-gray-400">Tidak dapat diubah</span>'
          : '<button type="button" data-act="edit" data-id="' + h(id) + '" class="px-2 py-1 text-gray-500 hover:text-orange" title="Edit" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>' +
            '<button type="button" data-act="delete" data-id="' + h(id) + '" class="px-2 py-1 text-gray-500 hover:text-red-600" title="Hapus" aria-label="Hapus"><i class="fa-solid fa-trash"></i></button>') +
        '</td></tr>';
    }).join('');
  }

  function renderRoleUsers() {
    const tbody = $('role-users-tbody');
    if (!tbody) return;
    const ids = sortedUserIds();
    if (!ids.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-gray-400 py-8">Belum ada user.</td></tr>';
      return;
    }
    tbody.innerHTML = ids.map(function (uid) {
      const u = cache.users[uid];
      const isMe = state.user && uid === state.user.uid;
      return '<tr class="border-t">' +
        '<td class="px-3 py-2.5 font-medium">' + h(u.name || '-') + '</td>' +
        '<td class="px-3 py-2.5 text-gray-600">' + h(u.email || '-') + '</td>' +
        '<td class="px-3 py-2.5"><select data-uid="' + h(uid) + '" class="px-2 py-1.5 border rounded-lg text-sm" ' + (isMe ? 'disabled title="Role akun sendiri tidak dapat diubah"' : '') + '>' + roleOptions(u.roleId, true) + '</select></td>' +
        '</tr>';
    }).join('');
  }

  function renderRoleAuth() {
    const sel = $('ra-role');
    const matrix = $('ra-matrix');
    if (!sel || !matrix) return;
    const prev = sel.value;
    const ids = sortedRoleIds().filter(function (id) { return id !== SUPER_ROLE; });
    sel.innerHTML = ids.map(function (id) {
      return '<option value="' + h(id) + '">' + h(cache.roles[id].name) + '</option>';
    }).join('');
    if (!ids.length) {
      sel.disabled = true;
      matrix.innerHTML = '<p class="text-sm text-gray-400 md:col-span-3">Belum ada role selain Super Admin. Buat role dulu di menu Role.</p>';
      $('ra-btn-save').disabled = true;
      return;
    }
    sel.disabled = false;
    $('ra-btn-save').disabled = false;
    sel.value = ids.indexOf(prev) !== -1 ? prev : ids[0];
    renderMatrix();
  }

  function renderMatrix() {
    const roleId = $('ra-role').value;
    const granted = cache.roleAuth[roleId] || {};
    $('ra-matrix').innerHTML = MENU_GROUPS.map(function (g, gi) {
      const allChecked = g.items.every(function (it) { return granted[it.key] === true; });
      return '<div class="border rounded-xl p-4 bg-gray-50">' +
        '<label class="flex items-center gap-2 font-semibold text-sm mb-3 pb-2 border-b cursor-pointer">' +
          '<input type="checkbox" data-group-all="' + gi + '" ' + (allChecked ? 'checked' : '') + '>' +
          '<i class="' + g.icon + ' text-gray-400"></i> ' + h(g.title) +
        '</label>' +
        '<div class="space-y-2">' + g.items.map(function (it) {
          return '<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" data-menu="' + h(it.key) + '" data-g="' + gi + '" ' + (granted[it.key] === true ? 'checked' : '') + '> ' + h(it.label) + '</label>';
        }).join('') + '</div>' +
      '</div>';
    }).join('');
    $('ra-hint').textContent = '';
  }

  // ---------- USER: modal ----------
  function openUserModal(uid) {
    editingUid = uid || null;
    const isEdit = !!uid;
    const u = isEdit ? cache.users[uid] : null;
    const isMe = isEdit && state.user && uid === state.user.uid;

    $('user-modal-title').textContent = isEdit ? 'Edit User' : 'Tambah User';
    $('user-f-name').value = u ? (u.name || '') : '';
    $('user-f-email').value = u ? (u.email || '') : '';
    $('user-f-email').disabled = isEdit;
    $('user-f-pass').value = '';
    $('user-f-uid').value = '';
    $('user-f-pass-wrap').classList.toggle('hidden', isEdit);
    $('user-f-uid-wrap').classList.toggle('hidden', isEdit);
    $('user-f-role').innerHTML = roleOptions(u ? u.roleId : '', true);
    $('user-f-role').disabled = !!isMe;
    $('user-f-active').checked = u ? u.active !== false : true;
    $('user-f-active').disabled = !!isMe;
    $('user-f-error').classList.add('hidden');
    $('user-modal').classList.remove('hidden');
  }

  function closeUserModal() {
    $('user-modal').classList.add('hidden');
    editingUid = null;
  }

  function userFormError(msg) {
    const el = $('user-f-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  // Buat akun di Firebase Authentication memakai app kedua,
  // supaya sesi admin yang sedang login tidak berganti.
  async function createAuthUser(email, password) {
    let app;
    try { app = firebase.app('gasweb-secondary'); }
    catch (e) { app = firebase.initializeApp(firebaseConfig, 'gasweb-secondary'); }
    const sAuth = app.auth();
    try {
      const cred = await sAuth.createUserWithEmailAndPassword(email, password);
      return cred.user.uid;
    } finally {
      try { await sAuth.signOut(); } catch (e) { /* abaikan */ }
    }
  }

  function authErrorMessage(err) {
    switch (err && err.code) {
      case 'auth/email-already-in-use':
        return 'Email sudah terdaftar di Firebase Authentication. Isi kolom UID untuk mendaftarkan akun tersebut ke daftar user admin.';
      case 'auth/invalid-email':
        return 'Format email tidak valid.';
      case 'auth/weak-password':
        return 'Password terlalu lemah (minimal 6 karakter).';
      case 'auth/admin-restricted-operation':
      case 'auth/operation-not-allowed':
        return 'Pembuatan akun dari browser sedang dinonaktifkan di Firebase. Aktifkan sementara "Enable create (sign-up)", atau buat akun di Firebase Console lalu isi kolom UID.';
      default:
        return 'Gagal membuat akun: ' + ((err && err.message) || err);
    }
  }

  async function saveUser() {
    const name = $('user-f-name').value.trim();
    const email = $('user-f-email').value.trim().toLowerCase();
    const roleId = $('user-f-role').value;
    const active = $('user-f-active').checked;
    const btn = $('user-modal-save');

    if (!name) return userFormError('Nama wajib diisi.');
    if (!roleId) return userFormError('Role wajib dipilih.');

    btn.disabled = true;
    try {
      if (editingUid) {
        const old = cache.users[editingUid];
        const losingSuper = old.roleId === SUPER_ROLE && (roleId !== SUPER_ROLE || !active);
        if (losingSuper && activeSuperCount(editingUid) === 0) {
          return userFormError('Tidak bisa: minimal harus ada satu Super Admin aktif.');
        }
        await db.ref('users/' + editingUid).update({ name: name, roleId: roleId, active: active });
        closeUserModal();
        notify('User berhasil diperbarui.', 'success');
      } else {
        const manualUid = $('user-f-uid').value.trim();
        const password = $('user-f-pass').value;
        if (!email) return userFormError('Email wajib diisi.');
        const dupEmail = Object.keys(cache.users).some(function (id) { return String(cache.users[id].email || '').toLowerCase() === email; });
        if (dupEmail) return userFormError('Email ini sudah ada di daftar user.');
        if (manualUid && cache.users[manualUid]) return userFormError('UID ini sudah ada di daftar user.');
        if (!manualUid && password.length < 6) return userFormError('Password minimal 6 karakter.');

        let uid = manualUid;
        if (!uid) {
          try { uid = await createAuthUser(email, password); }
          catch (err) { return userFormError(authErrorMessage(err)); }
        }
        try {
          await db.ref('users/' + uid).set({ name: name, email: email, roleId: roleId, active: active, createdAt: Date.now() });
        } catch (err) {
          return userFormError('Akun login dibuat, tetapi profil gagal disimpan ke Firebase. Coba lagi dengan mengisi UID: ' + uid);
        }
        closeUserModal();
        notify('User berhasil ditambahkan.', 'success');
      }
      await refreshAll();
    } catch (e) {
      console.error(e);
      userFormError('Gagal menyimpan: ' + (e.message || e));
    } finally {
      btn.disabled = false;
    }
  }

  async function deleteUser(uid) {
    const u = cache.users[uid];
    if (!u) return;
    if (state.user && uid === state.user.uid) return notify('Akun yang sedang dipakai tidak bisa dihapus.', 'error');
    if (u.roleId === SUPER_ROLE && u.active !== false && activeSuperCount(uid) === 0) {
      return notify('Tidak bisa: minimal harus ada satu Super Admin aktif.', 'error');
    }
    if (!confirm('Cabut akses admin untuk ' + (u.email || u.name) + '?\nProfil user akan dihapus dari Firebase.')) return;
    try {
      await db.ref('users/' + uid).remove();
      notify('Akses user dicabut.', 'success');
      await refreshAll();
    } catch (e) {
      console.error(e);
      notify('Gagal menghapus user: ' + (e.message || e), 'error');
    }
  }

  async function resetPassword(uid) {
    const u = cache.users[uid];
    if (!u || !u.email) return;
    if (!confirm('Kirim email reset password ke ' + u.email + '?')) return;
    try {
      await auth.sendPasswordResetEmail(u.email);
      notify('Email reset password dikirim ke ' + u.email + '.', 'success');
    } catch (e) {
      console.error(e);
      notify('Gagal kirim reset password: ' + (e.message || e), 'error');
    }
  }

  // ---------- ROLE ----------
  function resetRoleForm() {
    editingRoleId = null;
    $('role-f-name').value = '';
    $('role-f-desc').value = '';
    $('role-btn-save-label').textContent = 'Tambah';
    $('role-btn-cancel').classList.add('hidden');
  }

  async function saveRole() {
    const name = $('role-f-name').value.trim();
    const description = $('role-f-desc').value.trim();
    if (!name) return notify('Nama role wajib diisi.', 'error');
    const dup = Object.keys(cache.roles).some(function (id) {
      return id !== editingRoleId && String(cache.roles[id].name || '').toLowerCase() === name.toLowerCase();
    });
    if (dup) return notify('Nama role sudah dipakai.', 'error');
    try {
      if (editingRoleId) {
        await db.ref('roles/' + editingRoleId).update({ name: name, description: description });
        notify('Role diperbarui.', 'success');
      } else {
        const id = db.ref('roles').push().key;
        await db.ref('roles/' + id).set({ name: name, description: description, createdAt: Date.now() });
        notify('Role ditambahkan. Atur akses menunya di Role Auth.', 'success');
      }
      resetRoleForm();
      await refreshAll();
    } catch (e) {
      console.error(e);
      notify('Gagal menyimpan role: ' + (e.message || e), 'error');
    }
  }

  async function deleteRole(id) {
    const r = cache.roles[id];
    if (!r || id === SUPER_ROLE) return;
    const used = Object.keys(cache.users).filter(function (uid) { return cache.users[uid].roleId === id; }).length;
    if (used > 0) return notify('Role masih dipakai ' + used + ' user. Pindahkan user ke role lain dulu.', 'error');
    if (!confirm('Hapus role "' + r.name + '"? Pengaturan akses menunya juga ikut terhapus.')) return;
    try {
      const updates = {};
      updates['roles/' + id] = null;
      updates['roleAuth/' + id] = null;
      await db.ref().update(updates);
      notify('Role dihapus.', 'success');
      if (editingRoleId === id) resetRoleForm();
      await refreshAll();
    } catch (e) {
      console.error(e);
      notify('Gagal menghapus role: ' + (e.message || e), 'error');
    }
  }

  async function changeUserRole(uid, roleId) {
    const u = cache.users[uid];
    if (!u) return;
    if (!roleId) { renderRoleUsers(); return notify('Role tidak boleh kosong.', 'error'); }
    if (u.roleId === SUPER_ROLE && roleId !== SUPER_ROLE && u.active !== false && activeSuperCount(uid) === 0) {
      renderRoleUsers();
      return notify('Tidak bisa: minimal harus ada satu Super Admin aktif.', 'error');
    }
    try {
      await db.ref('users/' + uid + '/roleId').set(roleId);
      notify('Role ' + (u.name || u.email) + ' diubah menjadi ' + roleName(roleId) + '.', 'success');
      await refreshAll();
    } catch (e) {
      console.error(e);
      renderRoleUsers();
      notify('Gagal mengubah role: ' + (e.message || e), 'error');
    }
  }

  // ---------- ROLE AUTH ----------
  async function saveRoleAuth() {
    const roleId = $('ra-role').value;
    if (!roleId) return;
    const map = {};
    document.querySelectorAll('#ra-matrix input[data-menu]').forEach(function (cb) {
      if (cb.checked) map[cb.dataset.menu] = true;
    });
    try {
      await db.ref('roleAuth/' + roleId).set(Object.keys(map).length ? map : null);
      cache.roleAuth[roleId] = map;
      $('ra-hint').textContent = 'Tersimpan. User dengan role ini perlu login ulang agar menu diperbarui.';
      notify('Akses role "' + roleName(roleId) + '" berhasil disimpan.', 'success');
    } catch (e) {
      console.error(e);
      notify('Gagal menyimpan akses role: ' + (e.message || e), 'error');
    }
  }

  // ---------- EVENTS ----------
  function bind() {
    // buka tab -> muat data
    ['users', 'roles', 'roleauth'].forEach(function (tab) {
      const btn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
      if (btn) btn.addEventListener('click', function () { if (state.isSuper) refreshAll(); });
    });

    // User
    $('user-btn-add').addEventListener('click', function () { openUserModal(null); });
    $('user-modal-close').addEventListener('click', closeUserModal);
    $('user-modal-cancel').addEventListener('click', closeUserModal);
    $('user-modal-save').addEventListener('click', saveUser);
    $('user-modal').addEventListener('click', function (e) { if (e.target === $('user-modal')) closeUserModal(); });
    $('users-tbody').addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const uid = btn.dataset.uid;
      if (btn.dataset.act === 'edit') openUserModal(uid);
      if (btn.dataset.act === 'reset') resetPassword(uid);
      if (btn.dataset.act === 'delete') deleteUser(uid);
    });

    // Role
    $('role-btn-save').addEventListener('click', saveRole);
    $('role-btn-cancel').addEventListener('click', resetRoleForm);
    $('roles-tbody').addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.act === 'edit') {
        const r = cache.roles[id];
        if (!r) return;
        editingRoleId = id;
        $('role-f-name').value = r.name || '';
        $('role-f-desc').value = r.description || '';
        $('role-btn-save-label').textContent = 'Simpan';
        $('role-btn-cancel').classList.remove('hidden');
        $('role-f-name').focus();
      }
      if (btn.dataset.act === 'delete') deleteRole(id);
    });
    $('role-users-tbody').addEventListener('change', function (e) {
      const sel = e.target.closest('select[data-uid]');
      if (sel) changeUserRole(sel.dataset.uid, sel.value);
    });

    // Role Auth
    $('ra-role').addEventListener('change', renderMatrix);
    $('ra-btn-save').addEventListener('click', saveRoleAuth);
    $('ra-matrix').addEventListener('change', function (e) {
      const t = e.target;
      if (t.dataset.groupAll !== undefined) {
        document.querySelectorAll('#ra-matrix input[data-g="' + t.dataset.groupAll + '"]').forEach(function (cb) { cb.checked = t.checked; });
      } else if (t.dataset.menu) {
        const g = t.dataset.g;
        const boxes = document.querySelectorAll('#ra-matrix input[data-g="' + g + '"]');
        const all = Array.prototype.every.call(boxes, function (cb) { return cb.checked; });
        const head = document.querySelector('#ra-matrix input[data-group-all="' + g + '"]');
        if (head) head.checked = all;
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
