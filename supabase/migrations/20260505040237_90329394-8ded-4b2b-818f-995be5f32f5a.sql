-- Attach trigger to auth.users for handle_new_user (function already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing users who don't have one
insert into public.profiles (user_id, full_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url'
from auth.users u
left join public.profiles p on p.user_id = u.id
where p.user_id is null;

-- Backfill: if no super_admin exists yet, promote the earliest user
insert into public.user_roles (user_id, organization_id, role)
select u.id, null, 'super_admin'
from auth.users u
where not exists (select 1 from public.user_roles where role = 'super_admin')
order by u.created_at asc
limit 1;