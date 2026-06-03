-- Boards
create table boards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz default now()
);

-- Board members
create table board_members (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

-- Columns
create table columns (
  id        uuid primary key default gen_random_uuid(),
  board_id  uuid not null references boards(id) on delete cascade,
  title     text not null,
  position  integer not null default 0
);

-- Tasks
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references columns(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date    date,
  assignee_id uuid references auth.users(id),
  position    integer not null default 0,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz default now()
);

-- Comments
create table comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- User profiles
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  avatar_url text
);

-- Auto-create profile on sign up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;
alter table profiles enable row level security;

-- Boards: visible to members
create policy "Members can view boards"
  on boards for select
  using (id in (select board_id from board_members where user_id = auth.uid()));

create policy "Authenticated users can create boards"
  on boards for insert
  with check (owner_id = auth.uid());

create policy "Owner can update board"
  on boards for update
  using (owner_id = auth.uid());

create policy "Owner can delete board"
  on boards for delete
  using (owner_id = auth.uid());

-- Board members: auto-insert owner
create policy "Members can view board_members"
  on board_members for select
  using (board_id in (select board_id from board_members where user_id = auth.uid()));

create policy "Owner can manage board_members"
  on board_members for all
  using (board_id in (select id from boards where owner_id = auth.uid()));

-- Columns: members of the board
create policy "Members can view columns"
  on columns for select
  using (board_id in (select board_id from board_members where user_id = auth.uid()));

create policy "Members can manage columns"
  on columns for all
  using (board_id in (select board_id from board_members where user_id = auth.uid()));

-- Tasks
create policy "Members can view tasks"
  on tasks for select
  using (column_id in (
    select id from columns where board_id in (
      select board_id from board_members where user_id = auth.uid()
    )
  ));

create policy "Members can manage tasks"
  on tasks for all
  using (column_id in (
    select id from columns where board_id in (
      select board_id from board_members where user_id = auth.uid()
    )
  ));

-- Comments
create policy "Members can view comments"
  on comments for select
  using (task_id in (
    select id from tasks where column_id in (
      select id from columns where board_id in (
        select board_id from board_members where user_id = auth.uid()
      )
    )
  ));

create policy "Members can add comments"
  on comments for insert
  with check (user_id = auth.uid());

create policy "Users can delete own comments"
  on comments for delete
  using (user_id = auth.uid());

-- Profiles: public read, own write
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());
