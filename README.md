# 🛡 ContractGuard — Kurulum & Deployment Rehberi

AI destekli sözleşme analiz SaaS'ınızı 3 farklı yöntemle ayağa kaldırın.

---

## 📁 Proje Yapısı

```
contractguard/
├── nextjs-app/          ← Full-stack (önerilen)
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts   ← AI analiz endpoint
│   │   │   └── chat/route.ts      ← AI sohbet endpoint
│   │   ├── page.tsx               ← Ana sayfa
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AnalyzePage.tsx        ← Çekirdek analiz UI
│   │   └── ReportsPage.tsx
│   ├── .env.example
│   └── package.json
│
└── express-backend/     ← Sadece backend (alternatif)
    ├── server.js
    ├── .env.example
    └── package.json
```

---

## 🚀 YÖNTem 1: Next.js (Önerilen — 5 Dakikada Çalışır)

### 1. Kurulum

```bash
cd contractguard/nextjs-app
npm install
```

### 2. API Key

```bash
cp .env.example .env.local
```

`.env.local` dosyasını açın ve API key'inizi girin:

```
ANTHROPIC_API_KEY=sk-ant-api03-GERCEK_KEY_BURAYA
```

**API key nereden alınır?** → https://console.anthropic.com/settings/keys

### 3. Çalıştır

```bash
npm run dev
```

Tarayıcıda açın: **http://localhost:3000**

### 4. Vercel'e Deploy Et (Ücretsiz)

```bash
# Vercel CLI kur
npm i -g vercel

# Deploy et
vercel

# Environment variable ekle
vercel env add ANTHROPIC_API_KEY
```

Ya da GitHub'a push edin, vercel.com'dan "Import Project" yapın — otomatik deploy olur.

---

## 🔧 YÖNTem 2: Express Backend + Herhangi Bir Frontend

Eğer kendi frontend'iniz varsa sadece backend'i kullanın.

### 1. Kurulum

```bash
cd contractguard/express-backend
npm install
```

### 2. Ayarlar

```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

### 3. Çalıştır

```bash
npm run dev    # geliştirme (nodemon ile)
npm start      # production
```

Server **http://localhost:3001**'de açılır.

### API Endpoint'leri

#### POST /api/analyze
Sözleşme metni gönder, AI analizi al.

```javascript
const res = await fetch("http://localhost:3001/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Sözleşme metni buraya..." })
});
const data = await res.json();
// data.score, data.risks, data.categories, data.summary
```

**Cevap formatı:**
```json
{
  "score": 42,
  "summary": "Sözleşmede ciddi dengesizlikler tespit edildi...",
  "risks": [
    {
      "title": "Tek taraflı fesih hakkı",
      "level": "Yüksek",
      "clause": "Hizmet sağlayıcı 3 günlük bildirimle feshedebilir",
      "explanation": "Fesih süreleri taraflar arasında ciddi biçimde dengesiz...",
      "suggestion": "Her iki taraf için 30 günlük eşit fesih süresi belirlenmeli"
    }
  ],
  "categories": {
    "Ödeme Koşulları": 55,
    "Gizlilik": 20,
    "Fesih Hakları": 15,
    "Fikri Mülkiyet": 10,
    "Sorumluluk Sınırlaması": 45
  }
}
```

#### POST /api/chat
Sözleşme bağlamında AI sohbeti.

```javascript
const res = await fetch("http://localhost:3001/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Bu fesih maddesini nasıl düzeltirim?",
    contractContext: "...sözleşme metni...",
    analysisResult: { risks: [...] }
  })
});
const { reply } = await res.json();
```

#### POST /api/upload
PDF/TXT dosya yükle, metin çıkar.

```javascript
const formData = new FormData();
formData.append("file", pdfFile);

const res = await fetch("http://localhost:3001/api/upload", {
  method: "POST",
  body: formData
});
const { text, filename, pages } = await res.json();
```

---

## 🌐 Deployment Seçenekleri

### Vercel (Next.js için — Ücretsiz)
1. vercel.com → New Project → GitHub repo'nuzu bağlayın
2. Environment Variables → `ANTHROPIC_API_KEY` ekleyin
3. Deploy

### Railway (Express için — Ücretsiz tier)
```bash
npm i -g @railway/cli
railway login
railway init
railway up
railway variables set ANTHROPIC_API_KEY=sk-ant-...
```

### Render (Ücretsiz)
1. render.com → New Web Service
2. GitHub repo bağla
3. Start Command: `node server.js`
4. Environment: `ANTHROPIC_API_KEY` ekle

### VPS (Kendi sunucu)
```bash
# PM2 ile production'da çalıştır
npm i -g pm2
pm2 start server.js --name contractguard
pm2 save
pm2 startup
```

---

## 💡 Sonraki Geliştirmeler

Bu yapıya kolayca eklenebilecekler:

| Özellik | Nasıl |
|---------|-------|
| Kullanıcı girişi | NextAuth.js + Google OAuth |
| Veritabanı | Supabase (PostgreSQL) veya MongoDB |
| Ödeme sistemi | Stripe entegrasyonu |
| PDF export | jsPDF ile rapor indirme |
| Email bildirimi | Resend veya SendGrid |
| Rate limiting | `express-rate-limit` paketi |
| Gerçek PDF parse | pdf-parse (zaten backend'de var) |

---

## 🔑 Güvenlik Notları

- API key'i **asla** frontend koduna yazmayın
- `.env.local` veya `.env` dosyalarını **asla** git'e commit etmeyin
- `.gitignore`'a ekleyin: `.env`, `.env.local`, `node_modules/`
- Production'da rate limiting mutlaka açın

---

## 📞 Destek

Takıldığınız yerde bu projenin tüm kodları hazır — sorunuzu Claude'a sorun!
