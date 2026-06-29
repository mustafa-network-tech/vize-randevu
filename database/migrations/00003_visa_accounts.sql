-- =============================================================================
-- 00003 — visa_accounts tablosu
-- =============================================================================
-- Kullanıcının VFS / BLS portal hesapları.
-- encrypted_password: uygulama katmanında şifrelenerek saklanır.
-- =============================================================================

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
  status             text        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'inactive')),
  created_at         timestamptz NOT NULL DEFAULT NOW(),

  -- Aynı kullanıcı, aynı provider'da aynı e-posta ile tek hesap
  UNIQUE (user_id, provider, email)
);

COMMENT ON TABLE  public.visa_accounts                   IS 'Kullanıcıların VFS/BLS portal hesapları.';
COMMENT ON COLUMN public.visa_accounts.encrypted_password IS 'Uygulama katmanında (AES-256) şifrelenmiş parola. Ham değer asla saklanmaz.';
COMMENT ON COLUMN public.visa_accounts.provider           IS 'vfs veya bls.';

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.visa_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visa_accounts_select"
  ON public.visa_accounts FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

CREATE POLICY "visa_accounts_insert"
  ON public.visa_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visa_accounts_update"
  ON public.visa_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "visa_accounts_delete"
  ON public.visa_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
