-- =============================================================================
-- Vize Randevu — Tam Veritabanı Şeması
-- =============================================================================
-- Bu dosya Supabase Dashboard > SQL Editor'a kopyalanıp tek seferde
-- çalıştırılabilir.
--
-- Sıra önemlidir — tablolar bağımlılık sırasına göre yerleştirilmiştir.
-- =============================================================================

-- ===========================================================================
-- BÖLÜM 1: Yardımcı fonksiyonlar
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================================================
-- BÖLÜM 2: profiles
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text        NOT NULL DEFAULT '',
  company_name text,
  phone        text,
  role         text        NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- ===========================================================================
-- BÖLÜM 3: visa_accounts
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.visa_accounts (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider           text        NOT NULL CHECK (provider IN ('vfs', 'bls')),
  email              text        NOT NULL,
  encrypted_password text        NOT NULL,
  country            text        NOT NULL,
  city               text,
  visa_center        text,
  visa_type          text,
  status             text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at         timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider, email)
);

ALTER TABLE public.visa_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visa_accounts_select" ON public.visa_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "visa_accounts_insert" ON public.visa_accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "visa_accounts_update" ON public.visa_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "visa_accounts_delete" ON public.visa_accounts FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ===========================================================================
-- BÖLÜM 4: bots
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.bots (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  visa_account_id  uuid        NOT NULL REFERENCES public.visa_accounts(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  provider         text        NOT NULL CHECK (provider IN ('vfs', 'bls')),
  status           text        NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'paused', 'error')),
  check_interval   integer     NOT NULL DEFAULT 60 CHECK (check_interval BETWEEN 10 AND 3600),
  auto_book        boolean     NOT NULL DEFAULT false,
  last_run         timestamptz,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bots_updated_at
  BEFORE UPDATE ON public.bots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bots_select" ON public.bots FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "bots_insert" ON public.bots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bots_update" ON public.bots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "bots_delete" ON public.bots FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ===========================================================================
-- BÖLÜM 5: bot_logs
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.bot_logs (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bot_id     uuid        NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  level      text        NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.bot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_logs_select" ON public.bot_logs FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = bot_logs.bot_id AND b.user_id = auth.uid())
  );
CREATE POLICY "bot_logs_insert" ON public.bot_logs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = bot_logs.bot_id AND b.user_id = auth.uid())
  );
CREATE POLICY "bot_logs_delete" ON public.bot_logs FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = bot_logs.bot_id AND b.user_id = auth.uid())
  );

-- ===========================================================================
-- BÖLÜM 6: notifications
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  message    text        NOT NULL,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ===========================================================================
-- BÖLÜM 7: appointments
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id           uuid        NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  country          text        NOT NULL,
  city             text,
  center           text,
  visa_type        text,
  appointment_date date        NOT NULL,
  appointment_time time,
  status           text        NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'expired')),
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select" ON public.appointments FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = appointments.bot_id AND b.user_id = auth.uid())
  );
CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = appointments.bot_id AND b.user_id = auth.uid())
  );
CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = appointments.bot_id AND b.user_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = appointments.bot_id AND b.user_id = auth.uid())
  );
CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.bots b WHERE b.id = appointments.bot_id AND b.user_id = auth.uid())
  );

-- ===========================================================================
-- BÖLÜM 8: Performans indeksleri
-- ===========================================================================

-- visa_accounts
CREATE INDEX IF NOT EXISTS idx_visa_accounts_user_id    ON public.visa_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_visa_accounts_status     ON public.visa_accounts (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_visa_accounts_country    ON public.visa_accounts (country);

-- bots
CREATE INDEX IF NOT EXISTS idx_bots_user_id             ON public.bots (user_id);
CREATE INDEX IF NOT EXISTS idx_bots_visa_account_id     ON public.bots (visa_account_id);
CREATE INDEX IF NOT EXISTS idx_bots_status              ON public.bots (status);
CREATE INDEX IF NOT EXISTS idx_bots_last_run            ON public.bots (last_run DESC NULLS LAST) WHERE status = 'running';

-- bot_logs
CREATE INDEX IF NOT EXISTS idx_bot_logs_bot_id          ON public.bot_logs (bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at      ON public.bot_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_logs_level           ON public.bot_logs (bot_id, level, created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread     ON public.notifications (user_id, created_at DESC) WHERE is_read = false;

-- appointments
CREATE INDEX IF NOT EXISTS idx_appointments_bot_id      ON public.appointments (bot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_available   ON public.appointments (appointment_date ASC, appointment_time ASC) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_appointments_country     ON public.appointments (country, appointment_date DESC);
