-- Função para decrementar créditos (estorno)
create or replace function decrement_credits(target_user_id uuid)
returns void as $$
update public.user_credits
set credits_used = case when credits_used > 0 then credits_used - 1 else 0 end,
    updated_at = now()
where user_id = target_user_id;
$$ language sql security definer;
