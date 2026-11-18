-- ShotLingo schema: paid plans synced from Lemon Squeezy webhooks + server-side usage limits.

-- One row per Lemon Squeezy subscription or lifetime order.
create table public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  ls_id text not null unique,               -- "sub_<id>" or "order_<id>"
  kind text not null check (kind in ('subscription', 'lifetime')),
  plan_name text,                           -- variant name, e.g. "Pro Monthly"
  status text not null,                     -- LS subscription status, or 'paid' / 'refunded' for orders
  ls_customer_id text,
  variant_id text,
  renews_at timestamptz,
  ends_at timestamptz,
  customer_portal_url text,
  update_payment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;
create policy "Users can read their own subscriptions"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = user_id);
-- No insert/update/delete policies: only the server (service role) writes, from verified webhooks.

-- Daily usage counters for AI features (keyed by user id or IP).
create table public.usage_counters (
  key text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (key, day)
);
alter table public.usage_counters enable row level security;

-- Atomically increments a counter; returns true while still within the limit.
create function public.bump_usage(p_key text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  c integer;
begin
  insert into public.usage_counters (key, day, count)
  values (p_key, current_date, 1)
  on conflict (key, day) do update set count = public.usage_counters.count + 1
  returning count into c;
  return c <= p_limit;
end;
$$;
revoke execute on function public.bump_usage(text, integer) from public, anon, authenticated;
grant execute on function public.bump_usage(text, integer) to service_role;

-- Raw webhook log for debugging and idempotency.
create table public.webhook_events (
  id text primary key,                      -- sha256 of the raw body
  event_name text not null,
  received_at timestamptz not null default now(),
  payload jsonb not null
);
alter table public.webhook_events enable row level security;
