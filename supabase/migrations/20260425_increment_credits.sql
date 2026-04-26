-- Função para incrementar créditos de forma atômica (evita race conditions)
create or replace function increment_credits(target_user_id uuid)
returns void as $$
update public.user_credits
set credits_used = credits_used + 1,
    updated_at = now()
where user_id = target_user_id;
$$ language sql security definer;
