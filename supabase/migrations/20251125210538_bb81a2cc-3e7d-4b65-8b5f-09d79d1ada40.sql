-- Adicionar campos de pagamento à tabela orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_intent_id text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS tracking_code text UNIQUE;

-- Criar função para gerar código de rastreamento único
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_tracking_code text;
  counter integer := 0;
BEGIN
  LOOP
    -- Gera um código de 8 caracteres (letras maiúsculas e números)
    new_tracking_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Verifica se o código já existe
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE tracking_code = new_tracking_code) THEN
      RETURN new_tracking_code;
    END IF;
    
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Unable to generate unique tracking code';
    END IF;
  END LOOP;
END;
$$;

-- Adicionar trigger para gerar tracking_code automaticamente ao criar pedido
CREATE OR REPLACE FUNCTION public.set_tracking_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := generate_tracking_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_tracking_code_trigger ON public.orders;
CREATE TRIGGER set_tracking_code_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_tracking_code();