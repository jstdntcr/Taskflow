-- Store email as default display name when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, new.email)
  on conflict (id) do update
    set name = coalesce(profiles.name, excluded.name);
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing users who have null name
update profiles p
set name = u.email
from auth.users u
where p.id = u.id
  and p.name is null;
