-- Migration: Setup Supabase Storage for Flashcard Images
-- Date: 2024-02-23

-- 1. Create a public bucket for flashcard images
insert into storage.buckets (id, name, public)
values ('flashcard-images', 'flashcard-images', true)
on conflict (id) do nothing;

-- 2. RLS Policies for the bucket
-- Allow authenticated users to upload files to their own folder within the bucket
create policy "Users can upload their own images"
on storage.objects for insert
with check (
  bucket_id = 'flashcard-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
create policy "Users can delete their own images"
on storage.objects for delete
using (
  bucket_id = 'flashcard-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view images (since it's a public bucket, we just need to ensure the policy allows it)
create policy "Anyone can view images"
on storage.objects for select
using ( bucket_id = 'flashcard-images' );
