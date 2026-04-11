CREATE TABLE IF NOT EXISTS public.exchange_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exchange_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users but simpler not to enforce fkey in local dev unless necessary
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT '已完成',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
