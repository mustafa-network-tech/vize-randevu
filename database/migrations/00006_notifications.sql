-- =============================================================================
-- 00006 — notifications tablosu
-- =============================================================================
-- Kullanıcıya gönderilen bildirim geçmişi.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,   -- 'slot_found' | 'bot_error' | 'captcha' | vb.
  title      text        NOT NULL,
  message    text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.notifications         IS 'Kullanıcı bildirim geçmişi.';
COMMENT ON COLUMN public.notifications.type    IS 'slot_found | bot_error | captcha | proxy_changed | account_locked | appointment_booked';
COMMENT ON COLUMN public.notifications.is_read IS 'Kullanıcı bildirimi okudu mu?';

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- Bildirimler sistem/servis hesabı tarafından eklenir.
-- Kullanıcı da kendi adına bildirim ekleyebilir.
CREATE POLICY "notifications_insert"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sadece is_read güncellemesine izin ver
CREATE POLICY "notifications_update"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
