# AI-Powered Anime Recommendation Engine

## Overview

This is a web application designed to provide personalized anime recommendations. Users can search for an anime they enjoy, and the system will generate a list of similar anime based on a sophisticated analysis of their synopses and metadata.

The application leverages a hybrid recommendation strategy, combining modern semantic search with traditional metadata filtering to deliver relevant and nuanced recommendations.

## Features

-   **Anime Search**: Find any anime by title using the Jikan API.
-   **AI-Powered Recommendations**: Get a list of recommended anime based on a weighted score of:
    -   **Semantic Similarity**: The core of the recommendation engine. It compares the synopses of anime using a `sentence-transformers/all-MiniLM-L6-v2` model from Hugging Face to understand thematic and narrative similarities.
    -   **Genre Overlap**: Boosts anime that share similar genres.
    -   **Score-Based Weighting**: Considers the average user score to promote high-quality anime.
-   **Lightweight Fallback**: If the Hugging Face API is unavailable, the system gracefully degrades to a local term-frequency (TF) based similarity model to ensure uptime.
-   **Modern Frontend**: A clean and responsive user interface built with Next.js and Tailwind CSS.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/UI](https://ui.shadcn.com/) components
-   **Backend-as-a-Service**: [Supabase](https://supabase.io/)
-   **Primary Data Source**: [Jikan API](https://jikan.moe/) (Unofficial MyAnimeList API)
-   **Embeddings API**: [Hugging Face Inference API](https://huggingface.co/inference-api) (`sentence-transformers/all-MiniLM-L6-v2` model)

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18 or later)
-   [pnpm](https://pnpm.io/installation) (or another package manager like npm or yarn)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

### Environment Variables

To run this application, you need to set up the following environment variables. Create a file named `.env.local` in the root of your project and add the following:

```env
# Supabase credentials (get these from your Supabase project dashboard)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face API Key (for the recommendation model)
# Get one here: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=your_huggingface_api_key

# YouTube API Key (for the Video Playback)
YOUTUBE_API_KEY=your_youtube_api_key
```

### Running the Development Server

Once the dependencies are installed and the environment variables are set, you can start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.
