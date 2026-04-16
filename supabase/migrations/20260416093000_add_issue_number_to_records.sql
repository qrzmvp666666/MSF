ALTER TABLE public.records
ADD COLUMN IF NOT EXISTS issue_number INTEGER;

UPDATE public.records
SET issue_number = extracted.issue_number
FROM (
    SELECT
        id,
        CASE
            WHEN title ~ '第\s*[0-9]{1,3}\s*期' THEN NULLIF(substring(title FROM '第\s*([0-9]{1,3})\s*期'), '')::INTEGER
            ELSE NULL
        END AS issue_number
    FROM public.records
) AS extracted
WHERE public.records.id = extracted.id
  AND extracted.issue_number BETWEEN 1 AND 365
  AND public.records.issue_number IS NULL;

WITH ranked_duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY material_id, issue_number
            ORDER BY created_at DESC, id DESC
        ) AS row_num
    FROM public.records
    WHERE issue_number IS NOT NULL
)
UPDATE public.records
SET issue_number = NULL
WHERE id IN (
    SELECT id
    FROM ranked_duplicates
    WHERE row_num > 1
);

ALTER TABLE public.records
DROP CONSTRAINT IF EXISTS records_issue_number_range;

ALTER TABLE public.records
ADD CONSTRAINT records_issue_number_range
CHECK (issue_number IS NULL OR issue_number BETWEEN 1 AND 365);

CREATE UNIQUE INDEX IF NOT EXISTS records_material_id_issue_number_key
ON public.records (material_id, issue_number)
WHERE issue_number IS NOT NULL;