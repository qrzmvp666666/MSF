ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS winning_animal TEXT,
ADD COLUMN IF NOT EXISTS winning_number TEXT;
