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
    testimonialsTitle: 'Kata Mereka Tentang GasWeb',
    testimonialsSubtitle: 'Cerita dari klien yang sudah merasakan hasil kerja kami.',
    faqTitle: 'Pertanyaan yang Sering Ditanyakan',
    faqSubtitle: 'Masih ragu? Semoga jawaban di bawah ini membantu.',
    pricingTitle: 'Pilih Paket Sesuai Kebutuhan.',
    pricingSubtitle: 'Harga transparan. Konsultasi dulu, baru tentukan paket yang pas.'
  },
  bankAccounts: [
    // Contoh: { bank: 'BCA', accountName: 'Nama Anda', accountNumber: '1234567890', notes: '' }
  ],
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
    { icon: 'fa-solid fa-globe', title: 'Landing Page', description: 'Website fokus untuk promosi produk atau jasa. Satu halaman yang powerful untuk konversi.' },
    { icon: 'fa-solid fa-building', title: 'Company Profile', description: 'Tampilkan bisnis kamu secara profesional dan terpercaya dengan profil perusahaan lengkap.' },
    { icon: 'fa-solid fa-store', title: 'Website Bisnis', description: 'Website untuk katalog produk, layanan, dan kebutuhan operasional bisnis sehari-hari.' },
    { icon: 'fa-solid fa-wrench', title: 'Website Maintenance', description: 'Bantu update, merawat, dan menjaga website tetap aman, cepat, dan berjalan dengan baik.' }
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
  ],
  testimonials: [],
  faq: [
    { question: 'Berapa lama proses pembuatan website?', answer: 'Tergantung paket dan kompleksitas website. Estimasi waktu kami sampaikan jelas saat sesi konsultasi, sebelum proyek dimulai.' },
    { question: 'Apakah harga sudah termasuk domain dan hosting?', answer: 'Detail apa saja yang termasuk di setiap paket kami jelaskan saat konsultasi, jadi tidak ada biaya tersembunyi di tengah jalan.' },
    { question: 'Apakah bisa revisi setelah website jadi?', answer: 'Bisa. Kamu akan mereview website dan memberi masukan di tahap Review & Revisi sebelum website live.' },
    { question: 'Apakah website-nya tampil bagus di HP?', answer: 'Ya, semua website kami dibuat responsif sehingga tampil rapi di HP, tablet, maupun desktop.' },
    { question: 'Bagaimana cara mulai?', answer: 'Klik tombol konsultasi di halaman ini, ceritakan kebutuhan bisnismu lewat WhatsApp, dan kami bantu dari sana. Konsultasi awal gratis.' }
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
    const paths = ['settings', 'logo', 'packages', 'portfolio', 'services', 'problems', 'features', 'steps', 'testimonials', 'faq', 'bankAccounts'];
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
    'testimonialsTitle','testimonialsSubtitle','faqTitle','faqSubtitle',
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
  renderTestimonialsEditor();
  renderFaqEditor();
  renderBankAccountsEditor();
}

function renderBankAccountsEditor() {
  const list = document.getElementById('bank-list');
  if (!list) return;
  if (!Array.isArray(currentData.bankAccounts)) currentData.bankAccounts = [];
  if (!currentData.bankAccounts.length) {
    list.innerHTML = '<p class="text-sm text-gray-400 py-4">Belum ada rekening. Klik <b>+ Tambah Rekening</b>.</p>';
    return;
  }
  list.innerHTML = currentData.bankAccounts.map((a, i) => `
    <div class="border rounded-xl p-4 bg-gray-50 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-gray-500">Rekening #${i + 1}</span>
        <button type="button" class="text-xs text-red-600 font-semibold hover:underline" onclick="removeBankAccount(${i})">Hapus</button>
      </div>
      <div class="grid sm:grid-cols-2 gap-2">
        <div>
          <label class="text-xs text-gray-500">Bank</label>
          <input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(a.bank || '')}" onchange="updateBankAccount(${i},'bank',this.value)" placeholder="BCA / Mandiri / BNI">
        </div>
        <div>
          <label class="text-xs text-gray-500">Atas Nama</label>
          <input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(a.accountName || '')}" onchange="updateBankAccount(${i},'accountName',this.value)" placeholder="Nama pemilik rekening">
        </div>
        <div class="sm:col-span-2">
          <label class="text-xs text-gray-500">Nomor Rekening</label>
          <input class="w-full px-2 py-1.5 border rounded text-sm font-mono" value="${esc(a.accountNumber || '')}" onchange="updateBankAccount(${i},'accountNumber',this.value)" placeholder="1234567890">
        </div>
        <div class="sm:col-span-2">
          <label class="text-xs text-gray-500">Catatan (opsional)</label>
          <input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(a.notes || '')}" onchange="updateBankAccount(${i},'notes',this.value)" placeholder="Mis. Cabang Jakarta">
        </div>
      </div>
    </div>
  `).join('');
}

function addBankAccount() {
  if (!Array.isArray(currentData.bankAccounts)) currentData.bankAccounts = [];
  currentData.bankAccounts.push({ bank: '', accountName: '', accountNumber: '', notes: '' });
  renderBankAccountsEditor();
}

function removeBankAccount(i) {
  if (!Array.isArray(currentData.bankAccounts)) return;
  currentData.bankAccounts.splice(i, 1);
  renderBankAccountsEditor();
}

function updateBankAccount(i, field, value) {
  if (!currentData.bankAccounts || !currentData.bankAccounts[i]) return;
  currentData.bankAccounts[i][field] = value;
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

// ---------- LOGO UPLOAD (dikompres di browser, disimpan sebagai data URL) ----------
const LOGO_MAX_WIDTH = 480;
const LOGO_MAX_HEIGHT = 200;
const LOGO_MAX_CHARS = 150000; // batas ukuran data URL (~110 KB)

function setLogoInfo(msg, isError) {
  const el = document.getElementById('logo-upload-info');
  el.textContent = msg;
  el.className = 'text-xs mt-2 ' + (isError ? 'text-red-600' : 'text-gray-500');
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak bisa dibaca')); };
    img.src = url;
  });
}

async function compressImage(file, opts) {
  const { maxW, maxH, maxChars, quality } = opts;
  const img = await fileToImage(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error('Ukuran gambar tidak terbaca');

  let scale = Math.min(1, maxW / w, maxH / h);
  // SVG tanpa ukuran bisa sangat kecil: perbesar sedikit supaya tetap tajam
  if (w < 200 && h < 100) scale = Math.min(maxW / w, maxH / h, 2);

  for (let attempt = 0; attempt < 5; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

    // WebP: kecil & mendukung transparansi; fallback PNG kalau browser tidak mendukung
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/png');
    if (dataUrl.length <= maxChars) return { dataUrl, width: canvas.width, height: canvas.height };
    scale *= 0.8;
  }
  throw new Error('Gambar terlalu kompleks/besar. Coba gambar yang lebih sederhana atau lebih kecil.');
}

const compressLogo = (file) => compressImage(file, { maxW: LOGO_MAX_WIDTH, maxH: LOGO_MAX_HEIGHT, maxChars: LOGO_MAX_CHARS, quality: 0.9 });

// ---------- PORTFOLIO IMAGE UPLOAD ----------
const PORTFOLIO_IMG = { maxW: 800, maxH: 600, maxChars: 130000, quality: 0.82 }; // ~95 KB per gambar

async function uploadPortfolioImage(idx, input) {
  const file = input.files && input.files[0];
  const info = document.getElementById('pf-info-' + idx);
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
    info.textContent = 'Format tidak didukung. Pakai PNG, JPG, WebP, atau SVG.';
    info.className = 'text-xs mt-1 text-red-600';
    input.value = '';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    info.textContent = 'File terlalu besar (maks. 8 MB).';
    info.className = 'text-xs mt-1 text-red-600';
    input.value = '';
    return;
  }
  info.textContent = 'Memproses gambar...';
  info.className = 'text-xs mt-1 text-gray-500';
  try {
    const { dataUrl, width, height } = await compressImage(file, PORTFOLIO_IMG);
    currentData.portfolio[idx].imageUrl = dataUrl;
    renderPortfolioEditor();
    const el = document.getElementById('pf-info-' + idx);
    if (el) el.textContent = 'Gambar siap: ' + width + '×' + height + 'px, ±' + Math.round(dataUrl.length / 1024) + ' KB. Klik "Simpan Semua" untuk menerapkan.';
  } catch (err) {
    console.error(err);
    info.textContent = err.message || 'Gagal memproses gambar.';
    info.className = 'text-xs mt-1 text-red-600';
  }
  input.value = '';
}

function clearPortfolioImage(idx) {
  currentData.portfolio[idx].imageUrl = '';
  renderPortfolioEditor();
}

document.getElementById('logo-file').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) {
    setLogoInfo('Format tidak didukung. Pakai PNG, JPG, WebP, atau SVG.', true);
    e.target.value = '';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    setLogoInfo('File terlalu besar (maks. 8 MB).', true);
    e.target.value = '';
    return;
  }
  setLogoInfo('Memproses gambar...', false);
  try {
    const { dataUrl, width, height } = await compressLogo(file);
    document.getElementById('logo-url').value = dataUrl;
    updateLogoPreview();
    const kb = Math.round(dataUrl.length / 1024);
    setLogoInfo('Logo siap: ' + width + '×' + height + 'px, ±' + kb + ' KB. Klik "Simpan Semua" untuk menerapkan.', false);
  } catch (err) {
    console.error(err);
    setLogoInfo(err.message || 'Gagal memproses gambar.', true);
  }
  e.target.value = '';
});

document.getElementById('logo-clear').addEventListener('click', () => {
  document.getElementById('logo-url').value = '';
  updateLogoPreview();
  setLogoInfo('Logo dihapus. Klik "Simpan Semua" untuk kembali ke logo default.', false);
});

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
        <div class="sm:col-span-2">
          <label class="text-xs text-gray-500">Gambar Project</label>
          <div class="flex flex-wrap items-center gap-3 mt-1">
            ${item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="preview" class="h-16 w-24 object-cover rounded border bg-white">` : '<div class="h-16 w-24 rounded border border-dashed bg-white text-[10px] text-gray-400 flex items-center justify-center text-center">Belum ada gambar</div>'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onchange="uploadPortfolioImage(${i}, this)" class="text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-orange file:text-white file:font-medium file:cursor-pointer">
            ${item.imageUrl ? `<button type="button" onclick="clearPortfolioImage(${i})" class="text-red-500 text-xs hover:underline">Hapus gambar</button>` : ''}
          </div>
          <p id="pf-info-${i}" class="text-xs mt-1 text-gray-500">Otomatis dikecilkan (maks. 800px). Atau tempel URL gambar di bawah.</p>
          <input class="w-full px-2 py-1.5 border rounded text-sm mt-1" placeholder="https://... (opsional)" value="${item.imageUrl && item.imageUrl.startsWith('data:') ? '' : esc(item.imageUrl)}" onchange="updateItem('portfolio',${i},'imageUrl',this.value)">
        </div>
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
        <div><label class="text-xs text-gray-500">Icon (emoji / FA class)</label><input class="w-full px-2 py-1.5 border rounded text-sm" placeholder="fa-solid fa-globe" value="${esc(item.icon)}" onchange="updateItem('services',${i},'icon',this.value)"></div>
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

function renderTestimonialsEditor() {
  const list = currentData.testimonials || [];
  document.getElementById('testimonials-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between"><span class="font-semibold text-sm">Testimoni #${i+1}</span>
        <button type="button" onclick="removeItem('testimonials',${i})" class="text-red-500 text-xs hover:underline">Hapus</button></div>
      <div class="grid sm:grid-cols-3 gap-3">
        <div><label class="text-xs text-gray-500">Nama</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.name)}" onchange="updateItem('testimonials',${i},'name',this.value)"></div>
        <div><label class="text-xs text-gray-500">Jabatan / Nama Bisnis</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.role)}" onchange="updateItem('testimonials',${i},'role',this.value)"></div>
        <div><label class="text-xs text-gray-500">Rating</label>
          <select class="w-full px-2 py-1.5 border rounded text-sm" onchange="updateItem('testimonials',${i},'rating',parseInt(this.value,10))">
            ${[5,4,3,2,1,0].map(n => `<option value="${n}" ${Number(item.rating)===n?'selected':''}>${n === 0 ? 'Tanpa rating' : '★'.repeat(n)}</option>`).join('')}
          </select></div>
        <div class="sm:col-span-3"><label class="text-xs text-gray-500">Isi Testimoni</label><textarea class="w-full px-2 py-1.5 border rounded text-sm" rows="3" onchange="updateItem('testimonials',${i},'text',this.value)">${esc(item.text)}</textarea></div>
        <div class="sm:col-span-3"><label class="text-xs text-gray-500">URL Foto (opsional, kosong = inisial nama)</label><input class="w-full px-2 py-1.5 border rounded text-sm" placeholder="https://..." value="${esc(item.photoUrl)}" onchange="updateItem('testimonials',${i},'photoUrl',this.value)"></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada testimoni. Section Testimoni tidak akan tampil di website sampai kamu menambahkan minimal satu.</p>';
}

function renderFaqEditor() {
  const list = currentData.faq || [];
  document.getElementById('faq-editor').innerHTML = list.map((item, i) => `
    <div class="border rounded-xl p-4 space-y-3 bg-gray-50">
      <div class="flex justify-between"><span class="font-semibold text-sm">FAQ #${i+1}</span>
        <button type="button" onclick="removeItem('faq',${i})" class="text-red-500 text-xs hover:underline">Hapus</button></div>
      <div class="space-y-3">
        <div><label class="text-xs text-gray-500">Pertanyaan</label><input class="w-full px-2 py-1.5 border rounded text-sm" value="${esc(item.question)}" onchange="updateItem('faq',${i},'question',this.value)"></div>
        <div><label class="text-xs text-gray-500">Jawaban</label><textarea class="w-full px-2 py-1.5 border rounded text-sm" rows="3" onchange="updateItem('faq',${i},'answer',this.value)">${esc(item.answer)}</textarea></div>
      </div>
    </div>
  `).join('') || '<p class="text-gray-400 text-sm">Belum ada. Section FAQ tidak akan tampil di website sampai kamu menambahkan minimal satu.</p>';
}

function addTestimonial() {
  if (!currentData.testimonials) currentData.testimonials = [];
  currentData.testimonials.push({ name: '', role: '', rating: 5, text: '', photoUrl: '' });
  renderTestimonialsEditor();
}
function addFaq() {
  if (!currentData.faq) currentData.faq = [];
  currentData.faq.push({ question: 'Pertanyaan baru', answer: '' });
  renderFaqEditor();
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
  if (section === 'testimonials') renderTestimonialsEditor();
  if (section === 'faq') renderFaqEditor();
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
  currentData.services.push({ icon: 'fa-solid fa-star', title: 'Service Baru', description: '' });
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
    'testimonialsTitle','testimonialsSubtitle','faqTitle','faqSubtitle',
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
  ['settings', 'logo', 'packages', 'portfolio', 'services', 'problems', 'features', 'steps', 'testimonials', 'faq', 'bankAccounts'].forEach(key => {
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
