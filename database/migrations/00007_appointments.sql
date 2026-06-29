-- =============================================================================
-- 00007 — appointments tablosu
-- =============================================================================
-- Bot tarafından bulunan veya rezerve edilen randevular.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id           uuid        NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  country          text        NOT NULL,
  city             text,
  center           text,
  visa_type        text,
  appointment_date date        NOT NULL,
  appointment_time time,
  status           text        NOT NULL DEFAULT 'available'
                               CHECK (status IN ('available', 'booked', 'expired')),
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.appointments                  IS 'Botların bulduğu ve rezerve ettiği randevular.';
COMMENT ON COLUMN public.appointments.status           IS 'available | booked | expired';
COMMENT ON COLUMN public.appointments.appointment_date IS 'Randevu tarihi (date tipinde).';
COMMENT ON COLUMN public.appointments.appointment_time IS 'Randevu saati (time tipinde, opsiyonel).';

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = appointments.bot_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_insert"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = appointments.bot_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_update"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = appointments.bot_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = appointments.bot_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "appointments_delete"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.bots b
      WHERE b.id      = appointments.bot_id
        AND b.user_id = auth.uid()
    )
  );
