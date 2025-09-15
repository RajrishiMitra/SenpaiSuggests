# SenpAISuggests

[![Website](https://img.shields.io/badge/website-live-green)](https://senpaisuggests.vercel.app/)  
SenpAISuggests is an anime discovery & tracking app that lets you browse anime, watch trailers, track your watchlist, rate shows, take notes, and get **AI-powered recommendations** — all with a sleek **dark neumorphic UI**.

---

## 🚀 Live Demo

👉 [https://senpaisuggests.vercel.app/](https://senpaisuggests.vercel.app/)

---

## ✨ Features

- 🔍 Browse anime info via **Jikan API** (details, synopsis, characters, ratings)
- 🎬 Watch trailers (YouTube embed, if available)
- ✅ Mark anime as **Watched**, add ratings & notes
- 💾 Save watched anime with **Supabase persistence**
- 🤖 Smart recommendations:
  - **Primary**: Hugging Face embeddings (`all-MiniLM-L6-v2`) if `HUGGINGFACE_API_KEY` is set
  - **Fallback**: Local TF-like vectorizer (less accurate but works offline)
- 🔗 Quick links to streaming platforms (Netflix, Crunchyroll, Hulu, Prime Video)
- 🎨 Dark neumorphic UI with responsive design
- 🔐 Login via Supabase Auth (required for personal watchlists)

---

## 🧰 Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js (React) |
| Backend    | Supabase (Auth + Postgres) |
| APIs       | Jikan API, Hugging Face Inference API, YouTube Data API |
| Styling    | Tailwind CSS, Lucide Icons |
| Hosting    | Vercel |

---

## 🔑 Environment Variables

Create `.env.local` at the project root:

```env
# Jikan API
NEXT_PUBLIC_JIKAN_API_URL=https://api.jikan.moe/v4

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# YouTube API (optional)
YOUTUBE_API_KEY=your_youtube_api_key

# Hugging Face API (optional, for semantic recommendations)
HUGGINGFACE_API_KEY=hf_xxxYOUR_KEY_xxx

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```
⚠️ HUGGINGFACE_API_KEY is optional. Without it, fallback similarity is used.

## Recommendation System

**Model:** sentence-transformers/all-MiniLM-L6-v2

## Flow

- Extract synopsis + title for base anime  
- Send to Hugging Face API → embeddings  
- Compute cosine similarity vs candidates  
- Rank results, boost with genres & scores  
- Fallback: Local TF vectorizer if HF is missing or rate-limited

## 🛠️ Setup & Development

## Clone the repo
```bash
git clone <your-repo-url>
cd senpaisuggests
```
## Install dependencies
```bash
npm install
# or
yarn install
```
## Add environment variables
  Create a .env.local file (see above).

## Run dev server
```bash
npm run dev
```

## Open in browser
http://localhost:3000

# 🔍 How It Works (High-level)

- Search anime via Jikan  
- Fetch recommendations (/anime/{id}/recommendations)  
- Gather full details (synopsis, genres, score)  
- Generate embeddings:  
  - Hugging Face (if available)  
  - TF fallback otherwise  
- Compute cosine similarity  
- Sort & return recommendations  

# 🎨 Design Notes

- Dark neumorphism (soft shadows, raised cards, rounded edges)  
- Mobile-first responsive layout  
- Accessible interactive elements  

# 🧩 Troubleshooting

- ❌ No Hugging Face key → TF fallback used  
- ⚠️ HF rate-limits → cache embeddings, batch requests  
- ❌ No trailers → check YOUTUBE_API_KEY or fallback to "No trailer available"  
- ⚠️ Jikan rate-limits → avoid frequent polling  

# 📦 Deployment

- Deploy on Vercel  
- Set all env vars in dashboard  
- Cache embeddings or recommendation results for production efficiency  

# 🙏 Acknowledgments

- **Jikan API** — anime data  
- **Supabase** — backend + auth  
- **Hugging Face** — embeddings  
- **YouTube Data API** — trailers  
- **Lucide Icons** — icons  
- **Vercel** — hosting  
