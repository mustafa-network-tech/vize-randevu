-- =============================================================================
-- 00002 — profiles tablosu + is_admin() fonksiyonu
-- =============================================================================
-- Auth.users tablosunu genişleten kullanıcı profil tablosu.
-- Her auth kullanıcısı için 1:1 ilişki.
--
-- NEDEN is_admin() burada?
--   is_admin() fonksiyonu public.profiles tablosuna referans verir.
--   LANGUAGE plpgsql kullanılsa dahi tablonun var olması tercih edilir.
--   Bu nedenle profiles oluştuktan hemen sonra tanımlanır.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text        NOT NULL DEFAULT '',
  company_name text,
  phone        text,
  role         text        NOT NULL DEFAULT 'user'
                           CHECK (role IN ('admin', 'user')),
  created_at   timestamptz NOT NULL DEFAULT NOW(),
  updated_at   timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles            IS 'Auth kullanıcı profilleri (auth.users ile 1:1).';
COMMENT ON COLUMN public.profiles.id         IS 'auth.users.id ile eşleşir.';
COMMENT ON COLUMN public.profiles.role       IS 'admin veya user.';

-- updated_at trigger
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── is_admin() — profiles tablosu oluştuktan SONRA ─────────────────────────
-- LANGUAGE plpgsql: tablo referansı çalışma zamanında çözülür,
-- "relation does not exist" hatası oluşmaz.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Mevcut auth.uid() kullanıcısının admin rolünde olup olmadığını döner. SECURITY DEFINER ile RLS bypass.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi profilini okur; admin tüm profilleri okur
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

-- Kullanıcı sadece kendi profilini oluşturur
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Kullanıcı kendi profilini günceller; admin herkesi günceller
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
  );

-- Sadece admin silebilir
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());
