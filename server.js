// server.js — ContractGuard Express Backend
// Kullanım: node server.js

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Health check ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── POST /api/analyze ───────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Sözleşme metni çok kısa (min 50 karakter)." });
    }

    console.log(`[Analiz] ${text.length} karakter, ${new Date().toLocaleTimeString("tr-TR")}`);

    const prompt = `Sen deneyimli bir Türk hukuk asistanısın. Aşağıdaki sözleşmeyi analiz et ve şu formatta SADECE JSON döndür (başka metin yok, markdown yok):

{
  "score": <0-100 arası güvenlik skoru, 100 en güvenli>,
  "summary": "<2-3 cümle genel özet>",
  "risks": [
    {
      "title": "<risk başlığı>",
      "level": "<Yüksek|Orta|Düşük>",
      "clause": "<sözleşmeden riskli ifade - max 120 karakter>",
      "explanation": "<risk açıklaması - 2-3 cümle>",
      "suggestion": "<somut iyileştirme önerisi>"
    }
  ],
  "categories": {
    "Ödeme Koşulları": <0-100>,
    "Gizlilik": <0-100>,
    "Fesih Hakları": <0-100>,
    "Fikri Mülkiyet": <0-100>,
    "Sorumluluk Sınırlaması": <0-100>
  }
}

Sözleşme:
${text.substring(0, 6000)}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    let raw = message.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    raw = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const result = JSON.parse(raw);

    console.log(`[Analiz] Tamamlandı — Skor: ${result.score}, ${result.risks?.length} risk`);
    res.json(result);
  } catch (err) {
    console.error("[Analiz Hatası]", err.message);
    res.status(500).json({ error: "Analiz sırasında hata oluştu.", detail: err.message });
  }
});

// ─── POST /api/chat ──────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, contractContext, analysisResult } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Mesaj boş." });
    }

    const systemPrompt = `Sen ContractGuard platformunun uzman AI hukuk asistanısın. Türk hukuku konusunda bilgilisin.

Kullanıcı şu sözleşmeyi analiz ettirdi:
---
${(contractContext || "").substring(0, 3000)}
---

Analiz sonuçları: ${JSON.stringify(analysisResult || {})}

Kurallar:
- Türkçe, net ve anlaşılır yanıtla
- Gerektiğinde "Bu hukuki tavsiye değildir" uyarısı ekle
- Somut, uygulanabilir öneriler sun`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const reply = response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    res.json({ reply });
  } catch (err) {
    console.error("[Chat Hatası]", err.message);
    res.status(500).json({ error: "Mesaj gönderilemedi." });
  }
});

// ─── POST /api/upload ────────────────────────────────────────────────
// PDF/dosya yükle → metin çıkar
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Dosya bulunamadı." });

    const { mimetype, buffer, originalname } = req.file;

    // Basit text dosyaları
    if (mimetype === "text/plain") {
      return res.json({ text: buffer.toString("utf-8"), filename: originalname });
    }

    // PDF için pdf-parse kullan
    if (mimetype === "application/pdf") {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      return res.json({ text: data.text, filename: originalname, pages: data.numpages });
    }

    res.status(400).json({ error: "Desteklenmeyen dosya türü. PDF veya TXT yükleyin." });
  } catch (err) {
    console.error("[Upload Hatası]", err.message);
    res.status(500).json({ error: "Dosya işlenemedi." });
  }
});

// ─── Start ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║       ContractGuard Backend           ║
║  http://localhost:${PORT}               ║
╚═══════════════════════════════════════╝
  `);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  UYARI: ANTHROPIC_API_KEY bulunamadı! .env dosyanızı kontrol edin.");
  }
});
