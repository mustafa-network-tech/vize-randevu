-- =============================================================================
-- 00011 — bot metrikleri: başarı sayaçları + günlük istatistikler
-- =============================================================================

-- ── 1. bots tablosuna metrik kolonları ekle ──────────────────────────────────
ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS login_success    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS login_fail       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slot_checks      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ip_blocks        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS captcha_events   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appointments_found INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at    TIMESTAMPTZ;

-- ── 2. Günlük metrik tablosu (grafik verisi) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_daily_metrics (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id            UUID        NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  date              DATE        NOT NULL DEFAULT CURRENT_DATE,
  login_success     INTEGER     NOT NULL DEFAULT 0,
  login_fail        INTEGER     NOT NULL DEFAULT 0,
  slot_checks       INTEGER     NOT NULL DEFAULT 0,
  ip_blocks         INTEGER     NOT NULL DEFAULT 0,
  captcha_events    INTEGER     NOT NULL DEFAULT 0,
  appointments_found INTEGER    NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bot_id, date)
);

ALTER TABLE public.bot_daily_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bot_daily_metrics_select" ON public.bot_daily_metrics;
CREATE POLICY "bot_daily_metrics_select"
  ON public.bot_daily_metrics FOR SELECT
  TO authenticated
  USING (true);

-- ── 3. engine_status — worker_count kolonu ───────────────────────────────────
ALTER TABLE public.engine_status
  ADD COLUMN IF NOT EXISTS worker_count INTEGER DEFAULT 0;
