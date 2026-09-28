# GasWeb — GitHub Pages + Firebase (Secure Version)

Landing page + Admin Dashboard.  
Keamanan memakai **Firebase Authentication** + rules yang dikunci ke 1 UID admin.

---

## Keamanan (penting dibaca)

| Ancaman | Mitigasi |
|---|---|
| Siapa saja bisa tulis data | Rules write **hanya** untuk UID admin spesifik |
| Orang daftar akun sendiri | **Matikan** Email/Password sign-up (hanya admin yang dibuat manual) |
| Password di database | Tidak ada. Auth ditangani Firebase |
| Landing load data sensitif | Hanya load node konten publik |

---

## Setup Step-by-Step

### 1. Buat Firebase Project
https://console.firebase.google.com → Add project

### 2. Aktifkan Authentication
1. **Build → Authentication → Get started**
2. Sign-in method → enable **Email/Password** → Save

### 3. Matikan public sign-up (WAJIB)
1. Authentication → tab **Settings** (ikon gear)
2. Bagian **User actions**
3. **Uncheck / nonaktifkan** “Enable create (sign-up)” / “Email enumeration protection” sesuai UI terbaru
4. Atau di **Sign-in method → Email/Password** pastikan hanya admin yang bisa dibuat manual

> Yang penting: pengunjung **tidak bisa** mendaftarkan akun baru sendiri.

### 4. Buat akun Admin (manual)
1. Authentication → tab **Users → Add user**
2. Isi email + password kuat milikmu
3. Setelah user dibuat, **klik user tersebut**
4. Copy **User UID** (contoh: `xY7kP2mN9qR4sT1uV6wZ8aB3cD0e`)

Simpan UID ini — nanti dipakai di Rules.

### 5. Aktifkan Realtime Database
Build → Realtime Database → Create Database  
Pilih lokasi → Start in **locked mode**

### 6. Security Rules (kunci ke UID kamu)
Realtime Database → **Rules** → paste:

```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null && auth.uid === 'PASTE_ADMIN_UID_DISINI'"
  }
}
```

Ganti `PASTE_ADMIN_UID_DISINI` dengan **User UID** yang kamu copy di langkah 4.

Contoh:
```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null && auth.uid === 'xY7kP2mN9qR4sT1uV6wZ8aB3cD0e'"
  }
}
```

Klik **Publish**.

Sekarang:
- Semua orang boleh **baca** (landing page)
- **Hanya** akun admin dengan UID itu yang boleh **tulis**

### 7. Config Web App
Project Overview → Add web app → copy `firebaseConfig`  
Paste ke file `js/firebase-config.js`

### 8. Deploy ke GitHub Pages
Upload semua file → Settings → Pages → branch main / root  
- Website: `https://USERNAME.github.io/REPO/`
- Admin: `https://USERNAME.github.io/REPO/admin.html`

---

## Login Admin
Pakai **email + password** yang kamu buat di Authentication → Users.

Ganti password bisa dari menu **Ganti Password** di admin, atau dari Firebase Console.

---

## Checklist keamanan sebelum go-live

- [ ] Sign-up publik **dimatikan**
- [ ] Rules write dikunci ke **UID admin saja**
- [ ] Password admin kuat & tidak dipakai di tempat lain
- [ ] Tidak ada node sensitif yang di-load oleh landing page

---

## Struktur file
```
gasweb-firebase/
├── index.html
├── admin.html
├── js/
│   ├── firebase-config.js
│   ├── app.js
│   └── admin.js
└── README.md
```
