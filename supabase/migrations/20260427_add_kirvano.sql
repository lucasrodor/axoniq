-- Add support for Kirvano payment gateway

-- Adiciona gateway de pagamento com default 'stripe' para não quebrar legados
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS payment_gateway text DEFAULT 'stripe' CHECK (payment_gateway IN ('stripe', 'kirvano'));

-- Colunas de controle da Kirvano
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS kirvano_customer_id text;

ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS kirvano_subscription_id text;

-- Remove constraint de stripe_customer_id obrigatório nas rotinas (caso exista restrição implícita ou futura)
-- O status passa a refletir qualquer um dos gateways.
