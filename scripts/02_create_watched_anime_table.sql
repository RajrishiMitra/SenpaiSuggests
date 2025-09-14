-- Create watched_anime table
CREATE TABLE IF NOT EXISTS public.watched_anime (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id INTEGER NOT NULL,
  anime_title TEXT NOT NULL,
  anime_image TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one entry per user per anime
  UNIQUE(user_id, anime_id)
);

-- Enable RLS
ALTER TABLE public.watched_anime ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own watched anime" ON public.watched_anime
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watched anime" ON public.watched_anime
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watched anime" ON public.watched_anime
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watched anime" ON public.watched_anime
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_watched_anime_user_id ON public.watched_anime(user_id);
CREATE INDEX IF NOT EXISTS idx_watched_anime_anime_id ON public.watched_anime(anime_id);
CREATE INDEX IF NOT EXISTS idx_watched_anime_watched_at ON public.watched_anime(watched_at DESC);
