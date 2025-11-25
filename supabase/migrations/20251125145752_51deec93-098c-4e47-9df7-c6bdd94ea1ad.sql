-- Adiciona índices para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_products_is_visible ON public.products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_visible_created ON public.products(is_visible, created_at DESC) WHERE is_visible = true;