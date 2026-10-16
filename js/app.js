// ============================================
// GasWeb Landing Page - Frontend Logic
// ============================================

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

// Maksimal portfolio yang tampil di beranda (sisanya di demo.html)
const PORTFOLIO_HOME_LIMIT = 6;

function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 300);
  }
}

function waLink(number) {
  const num = (number || '6281234567890').toString().replace(/\D/g, '');
  return `https://wa.me/${num}`;
}

function render(data) {
  const s = { ...DEFAULT_DATA.settings, ...(data.settings || {}) };
  const logo = data.logo || DEFAULT_DATA.logo;
  const packages = data.packages || DEFAULT_DATA.packages;
  const portfolio = data.portfolio || DEFAULT_DATA.portfolio;
  const services = data.services || DEFAULT_DATA.services;
  const problems = data.problems || DEFAULT_DATA.problems;
  const features = data.features || DEFAULT_DATA.features;
  const steps = data.steps || DEFAULT_DATA.steps;
  const testimonials = data.testimonials || DEFAULT_DATA.testimonials;
  const faq = data.faq || DEFAULT_DATA.faq;

  document.title = s.siteTitle || document.title;

  // Logo
  const logoImg = document.getElementById('site-logo');
  const defaultLogo = document.getElementById('default-logo');
  if (logo.url) {
    logoImg.src = logo.url;
    logoImg.alt = logo.alt || 'GasWeb';
    logoImg.classList.remove('hidden');
    if (defaultLogo) defaultLogo.classList.add('hidden');
  }

  // Settings / Hero
  setText('hero-badge', s.heroBadge);
  setText('hero-headline1', s.heroHeadline1);
  setText('hero-headline2', s.heroHeadline2);
  setText('hero-subheadline', s.heroSubheadline);
  setText('problems-title', s.problemsTitle);
  setText('problems-subtitle', s.problemsSubtitle);
  setText('problems-closing', s.problemsClosing);
  setText('services-title', s.servicesTitle);
  setText('services-subtitle', s.servicesSubtitle);
  setText('features-title', s.featuresTitle);
  setText('features-subtitle', s.featuresSubtitle);
  setText('portfolio-title', s.portfolioTitle);
  setText('portfolio-subtitle', s.portfolioSubtitle);
  setText('steps-title', s.stepsTitle);
  setText('steps-subtitle', s.stepsSubtitle);
  setText('pricing-title', s.pricingTitle);
  setText('pricing-subtitle', s.pricingSubtitle);
  setText('final-cta-headline', s.finalCtaHeadline);
  setText('final-cta-text', s.finalCtaText);
  setText('footer-desc', s.footerDescription);

  // CTA links
  const wa = waLink(s.whatsapp);
  ['nav-cta', 'mobile-cta', 'hero-cta', 'final-cta-btn', 'footer-wa', 'wa-float'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.href = wa;
      if (id === 'nav-cta' || id === 'mobile-cta' || id === 'hero-cta') el.textContent = s.ctaText || 'Konsultasi Gratis';
    }
  });
  const ig = document.getElementById('footer-ig');
  if (ig) ig.href = s.instagram || '#';
  const tt = document.getElementById('footer-tt');
  if (tt) tt.href = s.tiktok || '#';

  // Problems
  const problemsEl = document.getElementById('problems-list');
  if (problemsEl) {
    problemsEl.innerHTML = problems.map(p => `
      <div class="bg-white rounded-2xl p-8 shadow-soft hover:shadow-card transition-shadow border border-navy/5">
        <div class="w-14 h-14 rounded-xl bg-orange/10 flex items-center justify-center mb-6">
          <svg class="w-7 h-7 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h3 class="text-xl font-bold text-navy mb-3">${esc(p.title)}</h3>
        <p class="text-navy/65 leading-relaxed">${esc(p.description)}</p>
      </div>
    `).join('');
  }

  // Services
  const servicesEl = document.getElementById('services-list');
  if (servicesEl) {
    servicesEl.innerHTML = services.map(svc => `
      <div class="group bg-white rounded-2xl p-7 border border-navy/8 shadow-soft hover:shadow-card hover:border-orange/30 transition-all duration-300">
        <div class="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center text-2xl text-orange mb-5 group-hover:scale-110 transition-transform">${renderIcon(svc.icon, 'text-xl')}</div>
        <h3 class="text-lg font-bold text-navy mb-2">${esc(svc.title)}</h3>
        <p class="text-navy/65 text-sm leading-relaxed">${esc(svc.description)}</p>
      </div>
    `).join('');
  }

  // Features
  const featuresEl = document.getElementById('features-list');
  if (featuresEl) {
    featuresEl.innerHTML = features.map(f => `
      <div class="bg-white/5 backdrop-blur rounded-2xl p-7 border border-white/10 hover:bg-white/10 transition-colors">
        <div class="w-11 h-11 rounded-lg bg-orange/20 flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h3 class="font-bold text-lg mb-2">${esc(f.title)}</h3>
        <p class="text-white/65 text-sm">${esc(f.description)}</p>
      </div>
    `).join('');
  }

  // Portfolio
  const portfolioEl = document.getElementById('portfolio-list');
  if (portfolioEl) {
    const portfolioShown = portfolio.slice(0, PORTFOLIO_HOME_LIMIT);
    const portfolioMore = document.getElementById('portfolio-more');
    if (portfolioMore) portfolioMore.classList.toggle('hidden', portfolio.length <= PORTFOLIO_HOME_LIMIT);
    portfolioEl.innerHTML = portfolioShown.map(item => {
      const bg = item.colorTheme === 'orange' ? 'from-orange/10 to-orange/5' : (item.colorTheme === 'pink' ? 'from-pink-50 to-purple-50' : 'from-navy-100 to-navy-50');
      const img = item.imageUrl
        ? `<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" class="w-full h-full object-cover">`
        : `<div class="absolute inset-0 flex flex-col p-5"><div class="flex items-center gap-2 mb-4"><div class="w-3 h-3 rounded-full bg-red-400"></div><div class="w-3 h-3 rounded-full bg-yellow-400"></div><div class="w-3 h-3 rounded-full bg-green-400"></div></div><div class="flex-1 bg-white rounded-lg shadow-sm p-4"><div class="h-3 w-24 bg-navy/20 rounded mb-3"></div><div class="h-6 w-3/4 bg-navy/15 rounded mb-2"></div><div class="h-2 w-full bg-navy/10 rounded mb-1"></div></div></div>`;
      return `
        <div class="group bg-white rounded-2xl overflow-hidden border border-navy/8 shadow-soft hover:shadow-card transition-all">
          <div class="aspect-[4/3] bg-gradient-to-br ${bg} relative overflow-hidden">${img}
            <div class="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span class="px-5 py-2.5 bg-white text-navy font-semibold rounded-full text-sm">Lihat Website</span>
            </div>
          </div>
          <div class="p-6">
            <span class="text-xs font-semibold text-orange uppercase tracking-wide">${esc(item.category)}</span>
            <h3 class="text-lg font-bold text-navy mt-1">${esc(item.title)}</h3>
            <a href="${esc(item.link || '#cta')}" class="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-orange hover:gap-2 transition-all">Lihat Website →</a>
          </div>
        </div>`;
    }).join('');
  }

  // Steps
  const stepsEl = document.getElementById('steps-list');
  if (stepsEl) {
    stepsEl.innerHTML = steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      const boxClass = isLast ? 'bg-orange text-white shadow-orange' : 'bg-white border-2 border-navy/20 shadow-soft text-navy';
      return `
        <div class="relative text-center">
          <div class="w-20 h-20 mx-auto rounded-2xl ${boxClass} flex items-center justify-center text-2xl font-extrabold mb-5 relative z-10">${esc(step.number)}</div>
          <h3 class="text-lg font-bold text-navy mb-2">${esc(step.title)}</h3>
          <p class="text-navy/65 text-sm leading-relaxed px-2">${esc(step.description)}</p>
        </div>`;
    }).join('');
  }

  // Packages
  const packagesEl = document.getElementById('packages-list');
  if (packagesEl) {
    packagesEl.innerHTML = packages.map(pkg => {
      if (pkg.isPopular) {
        return `
          <div class="bg-navy rounded-2xl p-8 shadow-card relative flex flex-col scale-[1.02] md:scale-105">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange text-white text-xs font-bold rounded-full uppercase tracking-wide">Paling Populer</div>
            <div class="mb-6">
              <span class="text-sm font-semibold text-orange uppercase tracking-wide">${esc(pkg.badge)}</span>
              <h3 class="text-2xl font-bold text-white mt-1">${esc(pkg.name)}</h3>
              <p class="text-white/60 text-sm mt-2">${esc(pkg.description)}</p>
            </div>
            <div class="mb-6"><span class="text-sm text-white/50">Starting from</span><div class="text-3xl font-extrabold text-white">${esc(pkg.price)}</div></div>
            <ul class="space-y-3 mb-8 flex-1 text-sm text-white/80">
              ${(pkg.features || []).map(f => `<li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>${esc(f)}</li>`).join('')}
            </ul>
            <a href="${wa}" target="_blank" class="block w-full text-center py-3.5 rounded-full bg-orange text-white font-semibold shadow-orange hover:bg-orange-600 transition-all">${esc(pkg.buttonText || 'Konsultasi Sekarang')}</a>
          </div>`;
      }
      return `
        <div class="bg-white rounded-2xl p-8 border border-navy/10 shadow-soft hover:shadow-card transition-all flex flex-col">
          <div class="mb-6">
            <span class="text-sm font-semibold text-orange uppercase tracking-wide">${esc(pkg.badge)}</span>
            <h3 class="text-2xl font-bold text-navy mt-1">${esc(pkg.name)}</h3>
            <p class="text-navy/60 text-sm mt-2">${esc(pkg.description)}</p>
          </div>
          <div class="mb-6"><span class="text-sm text-navy/50">Starting from</span><div class="text-3xl font-extrabold text-navy">${esc(pkg.price)}</div></div>
          <ul class="space-y-3 mb-8 flex-1 text-sm text-navy/70">
            ${(pkg.features || []).map(f => `<li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>${esc(f)}</li>`).join('')}
          </ul>
          <a href="${wa}" target="_blank" class="block w-full text-center py-3.5 rounded-full border-2 border-navy/15 text-navy font-semibold hover:border-orange hover:text-orange transition-all">${esc(pkg.buttonText || 'Konsultasi Sekarang')}</a>
        </div>`;
    }).join('');
  }
  // Testimonials (section disembunyikan kalau kosong)
  const testiSection = document.getElementById('testimonials');
  const testiEl = document.getElementById('testimonials-list');
  if (testiSection && testiEl) {
    const list = (Array.isArray(testimonials) ? testimonials : Object.values(testimonials || {})).filter(t => t && t.text);
    testiSection.classList.toggle('hidden', list.length === 0);
    setText('testimonials-title', s.testimonialsTitle);
    setText('testimonials-subtitle', s.testimonialsSubtitle);
    testiEl.innerHTML = list.map(t => {
      const rating = Math.max(0, Math.min(5, parseInt(t.rating, 10) || 0));
      const stars = rating
        ? '<div class="flex gap-0.5 mb-4" aria-label="Rating ' + rating + ' dari 5">' +
          Array.from({ length: 5 }, (_, i) =>
            '<svg class="w-5 h-5 ' + (i < rating ? 'text-orange' : 'text-navy/15') + '" fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z"/></svg>'
          ).join('') + '</div>'
        : '';
      const photoUrl = safeUrl(t.photoUrl, '');
      const initial = esc((t.name || '?').trim().charAt(0).toUpperCase());
      const avatar = photoUrl
        ? '<img src="' + esc(photoUrl) + '" alt="' + esc(t.name) + '" class="w-12 h-12 rounded-full object-cover flex-shrink-0" loading="lazy">'
        : '<div class="w-12 h-12 rounded-full bg-orange/10 text-orange font-bold flex items-center justify-center flex-shrink-0">' + initial + '</div>';
      return `
        <figure class="bg-white rounded-2xl p-7 border border-navy/10 shadow-soft flex flex-col">
          ${stars}
          <blockquote class="text-navy/80 leading-relaxed flex-1">${esc(t.text).replace(/\n/g, '<br>')}</blockquote>
          <figcaption class="flex items-center gap-3 mt-6 pt-5 border-t border-navy/10">
            ${avatar}
            <div>
              <div class="font-bold text-navy text-sm">${esc(t.name)}</div>
              <div class="text-navy/55 text-xs">${esc(t.role)}</div>
            </div>
          </figcaption>
        </figure>`;
    }).join('');
  }

  // FAQ (accordion native <details>, tanpa JS tambahan)
  const faqSection = document.getElementById('faq');
  const faqEl = document.getElementById('faq-list');
  if (faqSection && faqEl) {
    const list = (Array.isArray(faq) ? faq : Object.values(faq || {})).filter(f => f && f.question);
    faqSection.classList.toggle('hidden', list.length === 0);
    setText('faq-title', s.faqTitle);
    setText('faq-subtitle', s.faqSubtitle);
    faqEl.innerHTML = list.map(f => `
      <details class="group bg-white rounded-xl border border-navy/10 shadow-soft open:shadow-card">
        <summary class="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 font-semibold text-navy">
          <span>${esc(f.question)}</span>
          <svg class="w-5 h-5 text-orange flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </summary>
        <div class="px-6 pb-5 text-navy/70 leading-relaxed">${esc(f.answer).replace(/\n/g, '<br>')}</div>
      </details>`).join('');
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.textContent = value;
}

// Hanya izinkan http(s), anchor, atau path relatif (blokir javascript: dll.)
function safeUrl(url, fallback) {
  const u = String(url || '').trim();
  if (/^(https?:\/\/|#|\/|\.\/|assets\/)/i.test(u)) return u;
  return fallback || '#';
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Render icon: Font Awesome class (contains "fa-") → <i>, else treat as emoji/text */
function renderIcon(icon, sizeClass = 'text-xl') {
  const val = (icon || '🌐').trim();
  if (val.includes('fa-')) {
    return `<i class="${esc(val)} ${sizeClass}" aria-hidden="true"></i>`;
  }
  return esc(val);
}

// Load data from Firebase (hanya node konten publik, tidak mengambil data sensitif)
function loadData() {
  try {
    // Ambil hanya node yang dibutuhkan (bukan root '/')
    const paths = ['settings', 'logo', 'packages', 'portfolio', 'services', 'problems', 'features', 'steps', 'testimonials', 'faq'];
    const promises = paths.map(p => db.ref(p).once('value').then(s => ({ key: p, val: s.val() })));

    Promise.all(promises)
      .then(results => {
        const data = {};
        results.forEach(r => { if (r.val !== null) data[r.key] = r.val; });
        render(data);
        hideLoader();
      })
      .catch(err => {
        console.warn('Firebase load failed, using default data', err);
        render(DEFAULT_DATA);
        hideLoader();
      });
  } catch (e) {
    console.warn('Firebase not ready, using default', e);
    render(DEFAULT_DATA);
    hideLoader();
  }
}

// Mobile menu + navbar scroll
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  document.getElementById('mobile-menu')?.classList.toggle('hidden');
});
document.querySelectorAll('#mobile-menu a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('mobile-menu')?.classList.add('hidden'));
});
window.addEventListener('scroll', () => {
  document.getElementById('navbar')?.classList.toggle('nav-scrolled', window.scrollY > 20);
});

// Start
loadData();
// Fallback hide loader
setTimeout(hideLoader, 2500);
