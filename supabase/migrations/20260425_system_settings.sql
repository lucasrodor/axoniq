-- Migration: System Settings for Launch Control
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Inserir a configuração inicial de monetização (começa desativada)
INSERT INTO public.system_settings (key, value)
VALUES ('is_monetization_active', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS: Apenas admins podem ver e editar
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_settings" 
ON public.system_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
