-- ============================================
-- FUNÇÃO: Setup automático de auto-login
-- Cria tabela e migrations necessárias
-- ============================================

-- 1. Criar função que executa o setup
CREATE OR REPLACE FUNCTION public.setup_auto_login()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Adicionar coluna access_token se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='device_sessions' AND column_name='access_token'
  ) THEN
    ALTER TABLE public.device_sessions ADD COLUMN access_token TEXT;
  END IF;

  -- Adicionar coluna refresh_token se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='device_sessions' AND column_name='refresh_token'
  ) THEN
    ALTER TABLE public.device_sessions ADD COLUMN refresh_token TEXT;
  END IF;

  -- Criar índice se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname='idx_device_sessions_refresh_token'
  ) THEN
    CREATE INDEX idx_device_sessions_refresh_token 
    ON public.device_sessions(refresh_token) 
    WHERE refresh_token IS NOT NULL;
  END IF;

  result := jsonb_build_object(
    'success', true,
    'message', 'Auto-login configurado com sucesso!',
    'timestamp', now()
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'error_code', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Permitir que qualquer usuário possa chamar esta função
GRANT EXECUTE ON FUNCTION public.setup_auto_login() TO anon, authenticated;

-- 3. Comentários
COMMENT ON FUNCTION public.setup_auto_login() IS 
  'Função para setup automático do sistema de Remember Me. Cria colunas de tokens de autenticação.';
