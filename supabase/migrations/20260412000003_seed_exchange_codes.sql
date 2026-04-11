INSERT INTO public.exchange_codes (code, is_used) VALUES 
('VIP8888', false),
('CODE123', false),
('TEST999', false),
('FREE001', false),
('HELLO2026', false)
ON CONFLICT (code) DO NOTHING;
