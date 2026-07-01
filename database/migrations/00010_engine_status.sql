-- =============================================================================
-- 00010 — engine_status: Bot engine heartbeat tablosu
-- =============================================================================
-- Her bot engine örneği bu tabloya heartbeat atar.
-- Satır sayısı = çalışan engine örneği (genellikle 1).
-- Service role ile yazılır (RLS bypass), authenticated ile okunur.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.engine_status (
  id           TEXT        PRIMARY KEY DEFAULT 'bot-engine',
  status       TEXT        NOT NULL DEFAULT 'offline',       -- 'online' | 'offline'
  last_heartbeat TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  version      TEXT        DEFAULT '1.0',
  host         TEXT,                                         -- makine adı (opsiyonel)
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION public.set_engine_status_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_engine_status_updated_at ON public.engine_status;
CREATE TRIGGER trg_engine_status_updated_at
  BEFORE UPDATE ON public.engine_status
  FOR EACH ROW EXECUTE FUNCTION public.set_engine_status_updated_at();

-- RLS
ALTER TABLE public.engine_status ENABLE ROW LEVEL SECURITY;

-- Tüm authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "engine_status_select" ON public.engine_status;
CREATE POLICY "engine_status_select"
  ON public.engine_status FOR SELECT
  TO authenticated
  USING (true);

-- Başlangıç kaydı
INSERT INTO public.engine_status (id, status)
VALUES ('bot-engine', 'offline')
ON CONFLICT (id) DO NOTHING;
