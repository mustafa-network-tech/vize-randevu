-- =============================================================================
-- 00008 — Performans indeksleri
-- =============================================================================
-- CONCURRENTLY: Canlı sistemde tablo kilitlemeden index oluşturur.
-- Supabase SQL Editor'da CONCURRENTLY desteklenmez; o ortamda kaldırın.
-- =============================================================================

-- ── visa_accounts ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_visa_accounts_user_id
  ON public.visa_accounts (user_id);

CREATE INDEX IF NOT EXISTS idx_visa_accounts_status
  ON public.visa_accounts (status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_visa_accounts_country
  ON public.visa_accounts (country);

-- ── bots ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bots_user_id
  ON public.bots (user_id);

CREATE INDEX IF NOT EXISTS idx_bots_visa_account_id
  ON public.bots (visa_account_id);

CREATE INDEX IF NOT EXISTS idx_bots_status
  ON public.bots (status);

-- Çalışan botların son tarama zamanına hızlı erişim
CREATE INDEX IF NOT EXISTS idx_bots_last_run
  ON public.bots (last_run DESC NULLS LAST)
  WHERE status = 'running';

-- ── bot_logs ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bot_logs_bot_id
  ON public.bot_logs (bot_id);

-- En son logları hızlı çekmek için (created_at DESC)
CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at
  ON public.bot_logs (created_at DESC);

-- Belirli seviyedeki logları filtrelemek için
CREATE INDEX IF NOT EXISTS idx_bot_logs_level
  ON public.bot_logs (bot_id, level, created_at DESC);

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id);

-- Okunmamış bildirimleri hızlı getirmek için
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- ── appointments ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_appointments_bot_id
  ON public.appointments (bot_id);

-- Müsait randevuları tarihe göre hızlı sıralama
CREATE INDEX IF NOT EXISTS idx_appointments_available
  ON public.appointments (appointment_date ASC, appointment_time ASC)
  WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_appointments_country_date
  ON public.appointments (country, appointment_date DESC);
