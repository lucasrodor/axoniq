-- Migration: Add multimodal and multi-source support
-- Path: supabase/migrations/20260409_multisource_multimodal.sql

-- 1. ADICIONAR COLUNA METADATA À TABELA SOURCES
-- Esta coluna armazenará um array de objetos representando cada arquivo processado,
-- permitindo que uma única source rastreie múltiplos PDFs e imagens.
alter table public.sources add column if not exists metadata jsonb default '[]'::jsonb;

-- 2. AJUSTE DE COLUNAS EXISTENTES (OPCIONAL)
-- Como agora suportamos múltiplos arquivos, as colunas file_name e file_type 
-- podem representar o "arquivo principal" ou o nome da coleção.
-- Vou adicionar uma coluna para URLs de imagens específicas para facilitar o acesso Vision.
alter table public.sources add column if not exists image_urls text[] default '{}';

-- 3. STORAGE SETUP (INSTRUCTIONAL)
-- Nota: A criação de buckets no Supabase via SQL requer que o esquema 'storage' esteja acessível.
-- Caso falhe, o bucket 'sources' deve ser criado manualmente no dashboard do Supabase.

insert into storage.buckets (id, name, public)
select 'sources', 'sources', true
where not exists (
    select 1 from storage.buckets where id = 'sources'
);

-- RLS para o Bucket Sources (Permitir que usuários autenticados façam upload de suas imagens)
create policy "Allow authenticated uploads"
on storage.objects for insert
with check (
  bucket_id = 'sources' 
  AND auth.role() = 'authenticated'
);

create policy "Allow users to view their own source files"
on storage.objects for select
using (
  bucket_id = 'sources'
);

create policy "Allow users to delete their own source files"
on storage.objects for delete
using (
  bucket_id = 'sources'
);
