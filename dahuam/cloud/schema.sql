-- =====================================================================
-- DAHUAM.202 Küche · Cloud-Datenbank (Supabase / PostgreSQL)
-- Einmal komplett im Supabase SQL Editor ausführen.
-- Alle Tabellen sind durch Row Level Security geschützt: Jedes Konto
-- sieht nur die Daten der Betriebe, denen es als Mitglied zugeordnet ist.
-- =====================================================================

create extension if not exists pgcrypto;

-- Betriebe
create table if not exists public.restaurants (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- Mitglieder mit Rolle: owner = Inhaber, chef = Küchenchef, bar = Bar, staff = Mitarbeiter
create table if not exists public.members (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  role          text not null check (role in ('owner','chef','bar','staff')),
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

-- Gesamter App-Datenstand je Betrieb (JSON), mit Versionsnummer gegen Überschreiben
create table if not exists public.kitchen_state (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  data          jsonb not null,
  version       integer not null default 1,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id) on delete set null
);

-- Verlauf: jede gespeicherte Version (für Wiederherstellung), 60 Tage
create table if not exists public.kitchen_state_history (
  id            bigserial primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  version       integer not null,
  data          jsonb not null,
  saved_at      timestamptz not null default now(),
  saved_by      uuid
);
create index if not exists kitchen_state_history_rid on public.kitchen_state_history (restaurant_id, saved_at desc);

-- Protokoll der per E-Mail gesendeten Bestellungen
create table if not exists public.order_mail_log (
  id            bigserial primary key,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_no      text not null,
  to_email      text not null,
  sent_by       uuid,
  provider      text not null,
  provider_id   text,
  status        text not null,
  error         text,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------
create or replace function public.is_member(p_rid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where restaurant_id = p_rid and user_id = auth.uid());
$$;

create or replace function public.member_role(p_rid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.members where restaurant_id = p_rid and user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.restaurants           enable row level security;
alter table public.members               enable row level security;
alter table public.kitchen_state         enable row level security;
alter table public.kitchen_state_history enable row level security;
alter table public.order_mail_log        enable row level security;

drop policy if exists restaurants_read on public.restaurants;
create policy restaurants_read on public.restaurants for select to authenticated using (public.is_member(id));

drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated using (public.is_member(restaurant_id));

drop policy if exists state_read on public.kitchen_state;
create policy state_read on public.kitchen_state for select to authenticated using (public.is_member(restaurant_id));

drop policy if exists history_read on public.kitchen_state_history;
create policy history_read on public.kitchen_state_history for select to authenticated using (public.member_role(restaurant_id) = 'owner');

drop policy if exists maillog_read on public.order_mail_log;
create policy maillog_read on public.order_mail_log for select to authenticated using (public.is_member(restaurant_id));
-- Schreiben in diese Tabellen geht nur über die Funktionen unten (security definer)
-- bzw. über die Server-Funktion send-order mit dem Service-Schlüssel.

-- ---------------------------------------------------------------------
-- Funktionen, die die App aufruft
-- ---------------------------------------------------------------------
create or replace function public.my_memberships()
returns table (restaurant_id uuid, restaurant_name text, name text, role text)
language sql stable security definer set search_path = public as $$
  select m.restaurant_id, r.name, m.name, m.role
  from public.members m join public.restaurants r on r.id = m.restaurant_id
  where m.user_id = auth.uid()
  order by r.created_at;
$$;

create or replace function public.get_state(p_rid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare s public.kitchen_state; n text;
begin
  if not public.is_member(p_rid) then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into s from public.kitchen_state where restaurant_id = p_rid;
  if not found then return jsonb_build_object('version', 0, 'data', null); end if;
  select name into n from public.members where restaurant_id = p_rid and user_id = s.updated_by;
  return jsonb_build_object('version', s.version, 'data', s.data, 'updated_at', s.updated_at, 'updated_by', n);
end $$;

create or replace function public.get_version(p_rid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v integer; n text;
begin
  if not public.is_member(p_rid) then raise exception 'forbidden' using errcode = '42501'; end if;
  select k.version, m.name into v, n from public.kitchen_state k
    left join public.members m on m.restaurant_id = k.restaurant_id and m.user_id = k.updated_by
    where k.restaurant_id = p_rid;
  return jsonb_build_object('version', coalesce(v, 0), 'updated_by', n);
end $$;

-- Speichert nur, wenn niemand inzwischen eine neuere Version gespeichert hat.
-- Sonst kommt der aktuelle Stand zurück, die App führt zusammen und versucht es erneut.
create or replace function public.save_state(p_rid uuid, p_data jsonb, p_expected integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v integer; cur public.kitchen_state;
begin
  if not public.is_member(p_rid) then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'invalid data' using errcode = '22023'; end if;
  if octet_length(p_data::text) > 20000000 then raise exception 'data too large' using errcode = '54000'; end if;

  select * into cur from public.kitchen_state where restaurant_id = p_rid for update;
  if not found then
    insert into public.kitchen_state (restaurant_id, data, version, updated_by) values (p_rid, p_data, 1, auth.uid());
    v := 1;
  elsif cur.version <> coalesce(p_expected, 0) then
    return jsonb_build_object('ok', false, 'version', cur.version, 'data', cur.data);
  else
    update public.kitchen_state set data = p_data, version = cur.version + 1, updated_at = now(), updated_by = auth.uid()
      where restaurant_id = p_rid returning version into v;
  end if;

  -- Verlauf sparsam: höchstens eine Kopie pro Stunde; nach 2 Tagen nur die letzte Kopie jedes Tages; nach 60 Tagen weg.
  if not exists (select 1 from public.kitchen_state_history where restaurant_id = p_rid and saved_at > now() - interval '1 hour') then
    insert into public.kitchen_state_history (restaurant_id, version, data, saved_by) values (p_rid, v, p_data, auth.uid());
  else
    update public.kitchen_state_history set version = v, data = p_data, saved_at = now(), saved_by = auth.uid()
      where id = (select id from public.kitchen_state_history where restaurant_id = p_rid order by saved_at desc limit 1);
  end if;
  delete from public.kitchen_state_history h where h.restaurant_id = p_rid and h.saved_at < now() - interval '2 days'
    and exists (select 1 from public.kitchen_state_history n where n.restaurant_id = p_rid and n.saved_at::date = h.saved_at::date and n.saved_at > h.saved_at);
  delete from public.kitchen_state_history where restaurant_id = p_rid and saved_at < now() - interval '60 days';
  return jsonb_build_object('ok', true, 'version', v);
end $$;

revoke all on function public.my_memberships()                 from public, anon;
revoke all on function public.get_state(uuid)                  from public, anon;
revoke all on function public.get_version(uuid)                from public, anon;
revoke all on function public.save_state(uuid, jsonb, integer) from public, anon;
grant execute on function public.my_memberships()                 to authenticated;
grant execute on function public.get_state(uuid)                  to authenticated;
grant execute on function public.get_version(uuid)                to authenticated;
grant execute on function public.save_state(uuid, jsonb, integer) to authenticated;

-- ---------------------------------------------------------------------
-- Fotos: privater Speicher "photos", Ordner je Betrieb (<restaurant_id>/<foto>.jpg)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict (id) do nothing;

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists photos_update on storage.objects;
create policy photos_update on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
