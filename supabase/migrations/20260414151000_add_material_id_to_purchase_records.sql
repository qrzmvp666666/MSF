ALTER TABLE public.purchase_records
ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_records_user_status_material
ON public.purchase_records (auth_user_id, payment_status, material_id, completed_time DESC);

DO $$
DECLARE
  only_material_id UUID;
  material_count INTEGER;
BEGIN
  SELECT COUNT(*), MIN(id)
  INTO material_count, only_material_id
  FROM public.materials;

  IF material_count = 1 THEN
    UPDATE public.purchase_records
    SET material_id = only_material_id,
        updated_at = NOW()
    WHERE material_id IS NULL
      AND plan_id = 1
      AND payment_status IN ('pending', 'paid');
  END IF;
END $$;