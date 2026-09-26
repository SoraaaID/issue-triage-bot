# 🤖 Issue Triage Bot

> Automated GitHub Issue Triage powered by **Gemini AI** — auto-labels, detects duplicates, finds related code, and creates draft PRs.

## ✨ Fitur

| # | Langkah | Keterangan |
|---|---------|------------|
| 1 | **Baca & Pahami** | Ekstrak jenis, gejala, environment dari issue |
| 2 | **Cek Duplikat** | Bandingkan dengan 90 hari issue terakhir |
| 3 | **Cari Kode** | Grep codebase untuk temukan file relevan |
| 4 | **Analisis** | Tentukan label, prioritas P0-P3, estimasi XS-XL |
| 5 | **Komentar + Label** | Post komentar triage & terapkan label otomatis |
| 6 | **Draft PR** | Buat draft PR untuk issue kecil (XS/S) |

## 🚀 Cara Install ke Repo Kamu

### 1. Copy workflow file
Salin `.github/workflows/triage.yml` ke repo target kamu.

### 2. Tambahkan GitHub Secret
Di repo target: **Settings → Secrets → Actions → New secret**
- Name: `GEMINI_API_KEY`
- Value: API key dari [Google AI Studio](https://aistudio.google.com)

### 3. Setup labels (sekali saja)
```bash
git clone https://github.com/SoraDev-ID/issue-triage-bot
cd issue-triage-bot
npm install

# Buat file .env
cp .env.example .env
# Edit .env: isi GITHUB_TOKEN, REPO_OWNER, REPO_NAME

# Jalankan setup labels
npm run setup:labels
```

### 4. Coba triage manual
```bash
node src/cli.js --mode=manual --owner=OWNER --repo=REPO --issue=42
```

## 📋 Contoh Output Komentar

```markdown
## 🔍 Triage Otomatis

**Status duplikat:** unique — tidak ada issue serupa dalam 90 hari terakhir
**Jenis:** `bug` — Screenshot gagal di-capture saat selector tidak ditemukan
**Label diusulkan:** `bug`, `P2-medium`, `size/S`
**Prioritas:** 🟡 P2 — Bug dengan workaround (hapus --selector flag)
**Estimasi ukuran:** 🟢 S — Perubahan kecil di 1 file

**File terkait:**
- `src/modules/screenshotter.js` — Fungsi captureScreenshot menangani selector

**Langkah pertama:**
1. Cek kondisi `if (element)` di screenshotter.js baris 67
2. Tambahkan error message yang lebih jelas ketika selector tidak ditemukan
3. Test dengan `--selector=".invalid-class" --url=https://example.com`
```

## ⚙️ Konfigurasi

| Env Var | Keterangan |
|---------|------------|
| `GITHUB_TOKEN` | Token GitHub (auto-provided oleh Actions) |
| `GEMINI_API_KEY` | API key Gemini |
| `REPO_OWNER` | Pemilik repo (auto dari Actions) |
| `REPO_NAME` | Nama repo (auto dari Actions) |

## 📁 Struktur Project

```
issue-triage-bot/
├── .github/workflows/triage.yml   ← Salin ini ke repo target
├── src/
│   ├── cli.js                     ← Entry point
│   ├── triage-engine.js           ← Orkestrasi 6 langkah
│   ├── setup-labels.js            ← Setup label standar
│   └── modules/
│       ├── github-client.js       ← GitHub API
│       ├── duplicate-finder.js    ← Cek duplikat
│       ├── code-searcher.js       ← Grep codebase
│       ├── gemini-analyzer.js     ← Analisis AI
│       ├── commenter.js           ← Post komentar
│       ├── labeler.js             ← Terapkan label
│       └── pr-creator.js         ← Buat draft PR
└── .env.example
```

## 📄 License
MIT © SoraDev-ID
