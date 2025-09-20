# Anime recommendation website

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/rajrishi0219-1654s-projects/v0-anime-recommendation-website)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/o4xSVgVli5M)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Features

- **AI-Powered Recommendations**: Uses OpenAI ChatGPT models for context-aware, human-like anime recommendations
- **Fallback System**: Automatically falls back to TF-IDF algorithm if OpenAI API is unavailable
- **Real-time Search**: Search and get recommendations for any anime
- **Detailed Information**: View anime details, ratings, genres, and synopses

## Environment Variables

To run this project, you'll need to add the following environment variables:

### Required for Enhanced Recommendations
- `OPENAI_API_KEY`: Your OpenAI API key for ChatGPT-powered recommendations

### Optional (for database features)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public Supabase anonymous key

### Note on Recommendations
- **With OpenAI API**: Get enhanced, context-aware recommendations that understand plot themes, character types, and anime tone
- **Without OpenAI API**: Falls back to TF-IDF algorithm for basic similarity matching
- The app will continue to function regardless of API availability

## Deployment

Your project is live at:

**[https://vercel.com/rajrishi0219-1654s-projects/v0-anime-recommendation-website](https://vercel.com/rajrishi0219-1654s-projects/v0-anime-recommendation-website)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/o4xSVgVli5M](https://v0.app/chat/projects/o4xSVgVli5M)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
