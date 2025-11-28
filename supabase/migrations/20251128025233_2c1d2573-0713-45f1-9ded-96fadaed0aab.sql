-- Adicionar política para admin poder atualizar pedidos
CREATE POLICY "Admin can update orders" 
ON public.orders 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));