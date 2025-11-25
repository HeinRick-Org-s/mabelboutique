-- Criar tabela para configurações da loja
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT,
  store_address TEXT,
  store_number TEXT,
  store_complement TEXT,
  store_neighborhood TEXT,
  store_city TEXT,
  store_state TEXT,
  store_cep TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Política para admin gerenciar configurações
CREATE POLICY "Admin can manage store settings"
ON public.store_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Política para permitir que todos vejam as configurações (necessário para checkout)
CREATE POLICY "Everyone can view store settings"
ON public.store_settings
FOR SELECT
USING (true);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial vazia (apenas uma linha para facilitar updates)
INSERT INTO public.store_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;