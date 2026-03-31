-- Create documents table to track processing history
create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  status text not null default 'processing', -- processing, ready, error
  num_flashcards integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Documents
alter table public.documents enable row level security;

create policy "Users can view own documents." 
on public.documents for select 
using (auth.uid() = user_id);

create policy "Users can insert own documents." 
on public.documents for insert 
with check (auth.uid() = user_id);

create policy "Users can update own documents." 
on public.documents for update 
using (auth.uid() = user_id);

create policy "Users can delete own documents." 
on public.documents for delete 
using (auth.uid() = user_id);

-- Add trigger for updated_at if needed (optional for this table but good practice)
-- (Reusing handle_updated_at from previous migration)
-- alter table public.documents add column updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
-- create trigger on_documents_updated before update on public.documents for each row execute procedure public.handle_updated_at();
