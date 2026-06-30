-- =============================================================================
-- 00009 — applicants tablosu
-- Otomatik rezervasyon için başvuran (pasaport sahibi) bilgileri
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.applicants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Kişisel bilgiler
  full_name        text NOT NULL,
  first_name       text,
  last_name        text,
  date_of_birth    date,
  nationality      text DEFAULT 'TR',

  -- Pasaport bilgileri
  passport_number  text,
  passport_expiry  date,

  -- İletişim
  email            text,
  phone            text,

  -- Otomatik rezervasyon önceliği (1 = en yüksek)
  priority         int DEFAULT 1,
  is_active        boolean DEFAULT true,

  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- updated_at trigger
CREATE TRIGGER trg_applicants_updated_at
  BEFORE UPDATE ON public.applicants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index
CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON public.applicants(user_id);

-- RLS
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applicants_select_own"
  ON public.applicants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "applicants_insert_own"
  ON public.applicants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applicants_update_own"
  ON public.applicants FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "applicants_delete_own"
  ON public.applicants FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
