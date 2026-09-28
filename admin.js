// ============================================
// GasWeb Admin Dashboard
// Auth: Firebase Authentication (Email/Password)
// Write hanya bisa dilakukan oleh user yang sudah login
// ============================================

let currentData = {};

const DEFAULT_DATA = {
  settings: {
    siteTitle: 'GasWeb — Website Profesional. Bisnis Makin Gas.',
    whatsapp: '6281234567890',
    instagram: '#',
    tiktok: '#',
    heroBadge: '🚀 Jasa Pembuatan Website Profesional',
    heroHeadline1: 'Website Profesional.',
    heroHeadline2: 'Bisnis Makin Gas. 🚀',
    heroSubheadline: 'Kami bantu bisnis, UMKM, dan profesional memiliki website modern yang siap menjadi wajah digital bisnis Anda.',
    ctaText: 'Konsultasi Gratis',
    finalCtaHeadline: 'Siap Bikin Bisnis Kamu Makin Gas? 🚀',
    finalCtaText: 'Konsultasikan kebutuhan website kamu sekarang. Gratis dan tanpa kewajiban.',
    footerDescription: 'GasWeb membantu bisnis, UMKM, dan profesional memiliki website modern yang siap menjadi wajah digital bisnis Anda.',
    problemsTitle: 'Bisnis Kamu Sudah Jalan, Tapi Belum Punya Website?',
    problemsSubtitle: 'Banyak bisnis hebat yang masih kesulitan tampil profesional di dunia digital.',
    problemsClosing: 'Saatnya punya rumah sendiri di internet. 🏠',
    servicesTitle: 'Website yang Siap Bantu Bisnis Kamu Berkembang.',
    servicesSubtitle: 'Pilih jenis website yang paling sesuai dengan kebutuhan bisnismu.',
    featuresTitle: 'Kenapa Pilih GasWeb?',
    featuresSubtitle: 'Kami fokus pada hasil yang benar-benar membantu bisnis kamu tumbuh.',
    portfolioTitle: 'Portfolio Kami',
    portfolioSubtitle: 'Beberapa contoh website yang sudah kami kerjakan untuk klien.',
    stepsTitle: 'Gampang. Tinggal Cerita, Kami yang Kerjakan.',
    stepsSubtitle: 'Proses sederhana dan transparan dari awal sampai website live.',
    pricingTitle: 'Pilih Paket Sesuai Kebutuhan.',
    pricingSubtitle: 'Harga transparan. Konsultasi dulu, baru tentukan paket yang pas.'
  },
  logo: { url: '', alt: 'GasWeb' },
  packages: [
    { name: 'Landing Page', badge: 'Starter', price: 'Rp XXX', description: 'Cocok untuk promosi produk atau jasa fokus konversi.', features: ['Desain modern 1 halaman', 'Mobile responsive', 'Integrasi WhatsApp', 'Domain & hosting setup'], isPopular: false, buttonText: 'Konsultasi Sekarang' },
    { name: 'Company Profile', badge: 'Business', price: 'Rp XXX', description: 'Tampilkan bisnis secara profesional dan terpercaya.', features: ['Multi-page professional site', 'Custom design brand', 'SEO foundation + WhatsApp', 'Galeri & halaman layanan', '1 bulan support'], isPopular: true, buttonText: 'Konsultasi Sekarang' },
    { name: 'Website Bisnis', badge: 'Custom', price: 'Custom', description: 'Solusi lengkap untuk katalog, order, dan operasional.', features: ['Fitur sesuai kebutuhan', 'Katalog produk / layanan', 'Integrasi lanjutan', 'Maintenance opsional'], isPopular: false, buttonText: 'Konsultasi Sekarang' }
  ],
  portfolio: [
    { title: 'Construction Company Website', category: 'Construction', imageUrl: '', link: '#cta', colorTheme: 'navy' },
    { title: 'Coffee Shop Website', category: 'F&B', imageUrl: '', link: '#cta', colorTheme: 'orange' },
    { title: 'Wedding Organizer Website', category: 'Wedding', imageUrl: '', link: '#cta', colorTheme: 'pink' }
  ],
  services: [
    { icon: '🌐', title: 'Landing Page', description: 'Website fokus untuk promosi produk atau jasa. Satu halaman yang powerful untuk konversi.' },
    { icon: '🏢', title: 'Company Profile', description: 'Tampilkan bisnis kamu secara profesional dan terpercaya dengan profil perusahaan lengkap.' },
    { icon: '🛍️', title: 'Website Bisnis', description: 'Website untuk katalog produk, layanan, dan kebutuhan operasional bisnis sehari-hari.' },
    { icon: '🔧', title: 'Website Maintenance', description: 'Bantu update, merawat, dan menjaga website tetap aman, cepat, dan berjalan dengan baik.' }
  ],
  problems: [
    { icon: 'search', title: 'Informasi Bisnis Sulit Ditemukan', description: 'Calon pelanggan sulit mencari info lengkap tentang produk, layanan, atau kontak bisnis kamu.' },
    { icon: 'shield', title: 'Terlihat Kurang Profesional', description: 'Tanpa website, bisnis kamu terlihat kurang meyakinkan dibanding kompetitor yang sudah punya website rapi.' },
    { icon: 'chat', title: 'Terlalu Bergantung WhatsApp & Sosmed', description: 'Semua info dan order hanya lewat chat. Susah dikelola, tidak terstruktur, dan kurang kredibel.' }
  ],
  features: [
    { title: 'Modern & Professional Design', description: 'Desain bersih, bold, dan sesuai identitas brand modern.' },
    { title: 'Mobile Responsive', description: 'Tampil sempurna di HP, tablet, maupun desktop.' },
    { title: 'WhatsApp Integration', description: 'Tombol chat langsung ke WhatsApp bisnis kamu.' },
    { title: 'SEO Friendly Foundation', description: 'Struktur yang ramah mesin pencari sejak awal.' },
    { title: 'Fast Performance', description: 'Loading cepat supaya pengunjung tidak kabur.' },
    { title: 'Free Consultation', description: 'Diskusi gratis dulu sebelum mulai proyek.' }
  ],
  steps: [
    { number: '01', title: 'Konsultasi', description: 'Ceritakan kebutuhan bisnis dan website yang kamu inginkan.' },
    { number: '02', title: 'Desain & Development', description: 'Kami mulai membangun website sesuai kebutuhan kamu.' },
    { number: '03', title: 'Review & Revisi', description: 'Kamu review website dan memberikan masukan.' },
    { number: '04', title: 'Launch 🚀', description: 'Website kamu siap online dan digunakan.' }
  ]
};

// ---------- AUTH STATE ----------
auth.onAuthStateChanged(user => {
  if (user) {
    showAdmin();
    loadAdminData();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-screen').classList.add('hidden');
}

function showAdmin() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-screen').classList.remove('hidden');
}

// ---------- LOGIN ----------
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    console.error(err);
    let msg = 'Login gagal. ';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Email atau password salah.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Format email tidak valid.';
    } else {
      msg += err.message;
    }
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  auth.signOut();
});

// ---------- TABS ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// ---------- LOAD DATA ----------
async function loadAdminData() {
  try {
    const paths = ['settings', 'logo', 'packages', 'portfolio', 'services', 'problems', 'features', 'steps'];
    const results = await Promise.all(
      paths.map(p => db.ref(p).once('value').then(s => ({ key: p, val: s.val() })))
    );

    const data = {};
    let hasData = false;
    results.forEach(r => {
      if (r.val !== null) {
        data[r.key] = r.val;
        hasData = true;
      }
    });

    if (!hasData) {
      currentData = JSON.parse(JSON.stringify(DEFAULT_DATA));
      await saveToFirebase(currentData);
      showStatus('Data default berhasil di-seed ke Firebase.', 'success');
    } else {
      currentData = { ...DEFAULT_DATA, ...data };
    }
    populateForms();
  } catch (e) {
    console.error(e);
    currentData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    populateForms();
    showStatus('Gagal load data. Menampilkan default. Pastikan kamu sudah login & rules benar.', 'error');
  }
}

function populateForms() {
  const s = currentData.settings || DEFAULT_DATA.settings;
  const fields = [
    'siteTitle','whatsapp','instagram','tiktok','heroBadge','ctaText',
    'heroHeadline1','heroHeadline2','heroSubheadline',
    'problemsTitle','problemsSubtitle','problemsClosing',
    'servicesTitle','servicesSubtitle',
    'featuresTitle','featuresSubtitle',
    'portfolioTitle','portfolioSubtitle',
    'stepsTitle','stepsSubtitle',
    'pricingTitle','pricingSubtitle',
    'finalCtaHeadline','finalCtaText','footerDescription'
  ];
  fields.forEach(f => {
    const el = document.getElementById('s-' + f);
    if (el) el.value = s[f] || '';
  });

  document.getElementById('logo-url').value = (currentData.logo && currentData.logo.url) || '';
  document.getElementById('logo-alt').value = (currentData.logo && currentData.logo.alt) || 'GasWeb';
  updateLogoPreview();

  renderPackagesEditor();
  renderPortfolioEditor();
  renderServicesEditor();
  renderProblemsEditor();
  renderFeaturesEditor();
  renderStepsEditor();
}

document.getElementById('logo-url').addEventListener('input', updateLogoPreview);
function updateLogoPreview() {
  const url = document.getElementById('logo-url').value.trim();
  const preview = document.getElementById('logo-preview');
  if (url) {
    preview.innerHTML = '<img src="' + url + '" alt="Logo preview" class="max-h-16 mx-auto" onerror="this.parentElement.innerHTML=\'URL gambar tidak valid\'">';
  } else {
    preview.innerHTML = 'Preview logo akan muncul di sini (kosong = logo default SVG)';
  }
}

// ---------- EDITORS ----------
function renderPackagesEditor() {
  const list = currentData.packages || [];
  document.getElementById('packages-editor').innerHTML = list.map((pkg, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between items-center">
        <span class="font-semibold text-sm">Paket #${i + 1}</span>
        <button type="button" onclick="removeItem('packages',${i})" class="text-red-500 text-xs hover:underline">Hapus</button>
      </div>
      <div class="grid sm:grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500">Nama</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(pkg.name)}" onchange="updateItem('packages',${i},'name',this.value)"></div>
        <div><label class="text-xs text-gray-500">Badge</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(pkg.badge)}" onchange="updateItem('packages',${i},'badge',this.value)"></div>
        <div><label class="text-xs text-gray-500">Harga</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(pkg.price)}" onchange="updateItem('packages',${i},'price',this.value)"></div>
        <div><label class="text-xs text-gray-500">Button Text</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(pkg.buttonText)}" onchange="updateItem('packages',${i},'buttonText',this.value)"></div>
        <div class="sm:col-span-2"><label class="text-xs text-gray-500">Deskripsi</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(pkg.description)}" onchange="updateItem('packages',${i},'description',this.value)"></div>
        <div class="sm:col-span-2"><label class="text-xs text-gray-500">Features (pisah dengan | )</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc((pkg.features||[]).join(' | '))}" onchange="updateItem('packages',${i},'features',this.value.split('|').map(s=>s.trim()).filter(Boolean))"></div>
        <div><label class="flex items-center gap-2 text-sm"><input type="checkbox" ${pkg.isPopular ? 'checked' : ''} onchange="updateItem('packages',${i},'isPopular',this.checked)"> Paling Populer</label></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada paket.</p>';
}

function renderPortfolioEditor() {
  const list = currentData.portfolio || [];
  document.getElementById('portfolio-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between items-center">
        <span class="font-semibold text-sm">Project #${i + 1}</span>
        <button type="button" onclick="removeItem('portfolio',${i})" class="text-red-500 text-xs hover:underline">Hapus</button>
      </div>
      <div class="grid sm:grid-cols-2 gap-3">
        <div><label class="text-xs text-gray-500">Judul</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.title)}" onchange="updateItem('portfolio',${i},'title',this.value)"></div>
        <div><label class="text-xs text-gray-500">Kategori</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.category)}" onchange="updateItem('portfolio',${i},'category',this.value)"></div>
        <div class="sm:col-span-2"><label class="text-xs text-gray-500">Image URL</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.imageUrl)}" onchange="updateItem('portfolio',${i},'imageUrl',this.value)"></div>
        <div><label class="text-xs text-gray-500">Link</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.link)}" onchange="updateItem('portfolio',${i},'link',this.value)"></div>
        <div><label class="text-xs text-gray-500">Color Theme</label>
          <select class="w-full px-2 py-1.5 border rounded text-sm" onchange="updateItem('portfolio',${i},'colorTheme',this.value)">
            <option value="navy" ${item.colorTheme==='navy'?'selected':''}>Navy</option>
            <option value="orange" ${item.colorTheme==='orange'?'selected':''}>Orange</option>
            <option value="pink" ${item.colorTheme==='pink'?'selected':''}>Pink</option>
          </select>
        </div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada portfolio.</p>';
}

function renderServicesEditor() {
  const list = currentData.services || [];
  document.getElementById('services-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between"><span class="font-semibold text-sm">Service #${i+1}</span>
        <button type="button" onclick="removeItem('services',${i})" class="text-red-500 text-xs hover:underline">Hapus</button></div>
      <div class="grid sm:grid-cols-3 gap-3">
        <div><label class="text-xs text-gray-500">Icon (emoji)</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.icon)}" onchange="updateItem('services',${i},'icon',this.value)"></div>
        <div class="sm:col-span-2"><label class="text-xs text-gray-500">Judul</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.title)}" onchange="updateItem('services',${i},'title',this.value)"></div>
        <div class="sm:col-span-3"><label class="text-xs text-gray-500">Deskripsi</label><textarea class="w-full px-2 py-1.5 border rounded text-sm" rows="2" onchange="updateItem('services',${i},'description',this.value)">${esc(item.description)}</textarea></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada service.</p>';
}

function renderProblemsEditor() {
  const list = currentData.problems || [];
  document.getElementById('problems-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between"><span class="font-semibold text-sm">Problem #${i+1}</span>
        <button type="button" onclick="removeItem('problems',${i})" class="text-red-500 text-xs hover:underline">Hapus</button></div>
      <div class="grid gap-3">
        <div><label class="text-xs text-gray-500">Judul</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.title)}" onchange="updateItem('problems',${i},'title',this.value)"></div>
        <div><label class="text-xs text-gray-500">Deskripsi</label><textarea class="w-full px-2 py-1.5 border rounded text-sm" rows="2" onchange="updateItem('problems',${i},'description',this.value)">${esc(item.description)}</textarea></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada.</p>';
}

function renderFeaturesEditor() {
  const list = currentData.features || [];
  document.getElementById('features-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between"><span class="font-semibold text-sm">Feature #${i+1}</span>
        <button type="button" onclick="removeItem('features',${i})" class="text-red-500 text-xs hover:underline">Hapus</button></div>
      <div class="grid gap-3">
        <div><label class="text-xs text-gray-500">Judul</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.title)}" onchange="updateItem('features',${i},'title',this.value)"></div>
        <div><label class="text-xs text-gray-500">Deskripsi</label><textarea class="w-full px-2 py-1.5 border rounded text-sm" rows="2" onchange="updateItem('features',${i},'description',this.value)">${esc(item.description)}</textarea></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada.</p>';
}

function renderStepsEditor() {
  const list = currentData.steps || [];
  document.getElementById('steps-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between"><span class="font-semibold text-sm">Step #${i+1}</span>
        <button type="button" onclick="removeItem('steps',${i})" class="text-red-500 text-xs hover:underline">Hapus</button></div>
      <div class="grid sm:grid-cols-3 gap-3">
        <div><label class="text-xs text-gray-500">Nomor</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.number)}" onchange="updateItem('steps',${i},'number',this.value)"></div>
        <div class="sm:col-span-2"><label class="text-xs text-gray-500">Judul</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.title)}" onchange="updateItem('steps',${i},'title',this.value)"></div>
        <div class="sm:col-span-3"><label class="text-xs text-gray-500">Deskripsi</label><textarea class="w-full px-2 py-1.5 border rounded text-sm" rows="2" onchange="updateItem('steps',${i},'description',this.value)">${esc(item.description)}</textarea></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada.</p>';
}

function updateItem(section, idx, key, value) {
  if (!currentData[section]) currentData[section] = [];
  currentData[section][idx][key] = value;
}

function removeItem(section, idx) {
  if (!confirm('Hapus item ini?')) return;
  currentData[section].splice(idx, 1);
  if (section === 'packages') renderPackagesEditor();
  if (section === 'portfolio') renderPortfolioEditor();
  if (section === 'services') renderServicesEditor();
  if (section === 'problems') renderProblemsEditor();
  if (section === 'features') renderFeaturesEditor();
  if (section === 'steps') renderStepsEditor();
}

function addPackage() {
  if (!currentData.packages) currentData.packages = [];
  currentData.packages.push({ name: 'Paket Baru', badge: 'New', price: 'Rp XXX', description: '', features: [], isPopular: false, buttonText: 'Konsultasi Sekarang' });
  renderPackagesEditor();
}
function addPortfolio() {
  if (!currentData.portfolio) currentData.portfolio = [];
  currentData.portfolio.push({ title: 'Project Baru', category: 'Category', imageUrl: '', link: '#cta', colorTheme: 'navy' });
  renderPortfolioEditor();
}
function addService() {
  if (!currentData.services) currentData.services = [];
  currentData.services.push({ icon: '🌐', title: 'Service Baru', description: '' });
  renderServicesEditor();
}
function addProblem() {
  if (!currentData.problems) currentData.problems = [];
  currentData.problems.push({ icon: 'search', title: 'Problem Baru', description: '' });
  renderProblemsEditor();
}
function addFeature() {
  if (!currentData.features) currentData.features = [];
  currentData.features.push({ title: 'Feature Baru', description: '' });
  renderFeaturesEditor();
}
function addStep() {
  if (!currentData.steps) currentData.steps = [];
  const num = String(currentData.steps.length + 1).padStart(2, '0');
  currentData.steps.push({ number: num, title: 'Step Baru', description: '' });
  renderStepsEditor();
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ---------- SAVE ----------
document.getElementById('btn-save-all').addEventListener('click', saveAll);

async function saveAll() {
  if (!auth.currentUser) {
    showStatus('Kamu belum login. Silakan login ulang.', 'error');
    return;
  }

  const s = currentData.settings || {};
  const fields = [
    'siteTitle','whatsapp','instagram','tiktok','heroBadge','ctaText',
    'heroHeadline1','heroHeadline2','heroSubheadline',
    'problemsTitle','problemsSubtitle','problemsClosing',
    'servicesTitle','servicesSubtitle',
    'featuresTitle','featuresSubtitle',
    'portfolioTitle','portfolioSubtitle',
    'stepsTitle','stepsSubtitle',
    'pricingTitle','pricingSubtitle',
    'finalCtaHeadline','finalCtaText','footerDescription'
  ];
  fields.forEach(f => {
    const el = document.getElementById('s-' + f);
    if (el) s[f] = el.value;
  });
  currentData.settings = s;
  currentData.logo = {
    url: document.getElementById('logo-url').value.trim(),
    alt: document.getElementById('logo-alt').value.trim() || 'GasWeb'
  };

  try {
    await saveToFirebase(currentData);
    showStatus('Semua data berhasil disimpan! Refresh website untuk melihat perubahan.', 'success');
  } catch (e) {
    console.error(e);
    showStatus('Gagal menyimpan. Pastikan rules Firebase sudah benar (write hanya untuk auth).', 'error');
  }
}

async function saveToFirebase(data) {
  const updates = {};
  ['settings', 'logo', 'packages', 'portfolio', 'services', 'problems', 'features', 'steps'].forEach(key => {
    if (data[key] !== undefined) updates[key] = data[key];
  });
  await db.ref('/').update(updates);
}

function showStatus(msg, type) {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = 'mb-4 px-4 py-3 rounded-lg text-sm font-medium ' + (type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}

// ---------- CHANGE PASSWORD ----------
async function changePassword() {
  const p1 = document.getElementById('new-password').value;
  const p2 = document.getElementById('new-password2').value;

  if (!auth.currentUser) {
    showStatus('Kamu belum login.', 'error');
    return;
  }
  if (!p1 || p1.length < 6) {
    showStatus('Password minimal 6 karakter.', 'error');
    return;
  }
  if (p1 !== p2) {
    showStatus('Password tidak sama.', 'error');
    return;
  }

  try {
    await auth.currentUser.updatePassword(p1);
    document.getElementById('new-password').value = '';
    document.getElementById('new-password2').value = '';
    showStatus('Password berhasil diganti!', 'success');
  } catch (e) {
    console.error(e);
    if (e.code === 'auth/requires-recent-login') {
      showStatus('Untuk keamanan, logout dulu lalu login lagi, baru ganti password.', 'error');
    } else {
      showStatus('Gagal ganti password: ' + e.message, 'error');
    }
  }
}
