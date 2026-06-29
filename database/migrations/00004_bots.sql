-- =============================================================================
-- 00004 — bots tablosu
-- =============================================================================
-- Her visa_account için çalışan otomasyon bot tanımları.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bots (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visa_account_id  uuid        NOT NULL REFERENCES public.visa_accounts(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  provider         text        NOT NULL CHECK (provider IN ('vfs', 'bls')),
  status           text        NOT NULL DEFAULT 'idle'
                               CHECK (status IN ('idle', 'running', 'paused', 'error')),
  check_interval   integer     NOT NULL DEFAULT 60
                               CHECK (check_interval BETWEEN 10 AND 3600),  -- saniye
  auto_book        boolean     NOT NULL DEFAULT false,
  last_run         timestamptz,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.bots                IS 'VFS/BLS randevu tarama botları.';
COMMENT ON COLUMN public.bots.check_interval IS 'Saniye cinsinden tarama aralığı (10–3600).';
COMMENT ON COLUMN public.bots.auto_book      IS 'True ise slot bulunduğunda otomatik rezervasyon yapar.';
COMMENT ON COLUMN public.bots.user_id        IS 'Denormalize edilmiş user_id — RLS performansı için.';

-- updated_at trigger
CREATE TRIGGER bots_updated_at
  BEFORE UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bots_select"
  ON public.bots FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

CREATE POLICY "bots_insert"
  ON public.bots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bots_update"
  ON public.bots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "bots_delete"
  ON public.bots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
