# Senpai Suggests

**Deployed Website: [http://senpaisuggests.vercel.app/](http://senpaisuggests.vercel.app/)**

## Overview

Senpai Suggests is a web application that provides personalized anime recommendations. It leverages AI to offer context-aware suggestions and includes a fallback to a TF-IDF algorithm. The platform allows users to search for anime, view detailed information, and receive recommendations based on their preferences.

## Features

- **AI-Powered Recommendations**: Utilizes OpenAI's ChatGPT for intelligent and context-aware anime suggestions.
- **Fallback System**: If the OpenAI API is unavailable, it seamlessly switches to a TF-IDF algorithm for recommendations.
- **Real-time Search**: Instantly search and get recommendations for any anime.
- **Detailed Information**: Access comprehensive details for each anime, including ratings, genres, and synopses.
- **User Profiles**: Create and manage your own profile to keep track of your favorite anime and recommendations.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Database**: [Supabase](https://supabase.io/)
- **AI**: [OpenAI](https://openai.com/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [pnpm](https://pnpm.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/senpai-suggests.git
   ```
2. Navigate to the project directory:
   ```bash
   cd senpai-suggests
   ```
3. Install the dependencies:
   ```bash
   pnpm install
   ```

### Running the Application

1. Create a `.env.local` file in the root of the project and add the necessary environment variables (see below).
2. Start the development server:
   ```bash
   pnpm dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file:

- `OPENAI_API_KEY`: Your OpenAI API key for ChatGPT-powered recommendations.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key.
- `NEXT_PUBLIC_SUPABASE_URL`: Your public Supabase URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your public Supabase anonymous key.

**Note**: The app will still function without the OpenAI API key, but the recommendations will be less sophisticated.

## Deployment

This project is deployed on [Vercel](https://vercel.com/). Any changes pushed to the `main` branch will trigger a new deployment.
