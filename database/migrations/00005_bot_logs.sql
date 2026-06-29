-- =============================================================================
-- 00005 — bot_logs tablosu
-- =============================================================================
-- Bot aktivite kayıtları. Yüksek yazma hızı için partition veya
-- pg_partman ileride düşünülebilir.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bot_logs (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bot_id     uuid        NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  level      text        NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.bot_logs        IS 'Bot çalışma logları.';
COMMENT ON COLUMN public.bot_logs.level  IS 'info | success | warning | error';
COMMENT ON COLUMN public.bot_logs.id     IS 'bigint IDENTITY — uuid yerine daha verimli sıralı ID.';

-- ── Row Level Security ────────────────────────────────────────────────────────
-- bot_logs tablosunun doğrudan user_id sütunu yoktur.
-- RLS, bots tablosu üzerinden JOIN ile kurulur.

ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_logs_select"
  ON public.bot_logs FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = bot_logs.bot_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "bot_logs_insert"
  ON public.bot_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = bot_logs.bot_id
        AND b.user_id = auth.uid()
    )
  );

-- Log kayıtları güncellenmez; silme sadece admin ya da kendi botu için
CREATE POLICY "bot_logs_delete"
  ON public.bot_logs FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = bot_logs.bot_id
        AND b.user_id = auth.uid()
    )
  );
