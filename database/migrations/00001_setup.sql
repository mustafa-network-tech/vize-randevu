-- =============================================================================
-- 00001 — Temel yardımcı fonksiyonlar ve trigger'lar
-- =============================================================================
-- Çalıştırma sırası: İlk önce bu dosyayı çalıştırın.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- updated_at otomatik güncelleme trigger fonksiyonu
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
  'updated_at sütununu her UPDATE işleminde otomatik olarak NOW() değerine çeker.';

-- -----------------------------------------------------------------------------
-- is_admin() — Mevcut kullanıcının admin rolünü kontrol eder
-- SECURITY DEFINER: RLS bypass ile profiles tablosunu okur.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id   = auth.uid()
      AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Mevcut auth.uid() kullanıcısının admin rolünde olup olmadığını döner.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- handle_new_user() — auth.users INSERT trigger'ı
-- Yeni kayıt olan her kullanıcı için profiles tablosuna otomatik satır ekler.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auth.users tablosuna INSERT yapıldığında profiles tablosuna otomatik profil oluşturur.';

-- Trigger: auth.users → handle_new_user
-- Not: Bu trigger'ı Supabase Dashboard > SQL Editor'dan çalıştırın.
-- auth şeması üzerinde DDL yetkisi gerektirir.
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
