-- ──────────────────────────────────────────────────────────────────────────
-- Helper: returns board_ids for current user WITHOUT triggering RLS on
-- board_members (SECURITY DEFINER bypasses row-level policies on that table)
-- ──────────────────────────────────────────────────────────────────────────
create or replace function auth_user_board_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select board_id from board_members where user_id = auth.uid()
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- Atomic board creation: board + owner member + 3 default columns.
-- Runs as SECURITY DEFINER so no RLS chicken-and-egg on board_members.
-- ──────────────────────────────────────────────────────────────────────────
create or replace function create_board_with_defaults(p_title text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  insert into boards (title, owner_id)
  values (p_title, auth.uid())
  returning id into v_board_id;

  insert into board_members (board_id, user_id, role)
  values (v_board_id, auth.uid(), 'owner');

  insert into columns (board_id, title, position) values
    (v_board_id, 'To Do',       0),
    (v_board_id, 'In Progress', 1),
    (v_board_id, 'Done',        2);

  return v_board_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- Drop all old policies
-- ──────────────────────────────────────────────────────────────────────────
drop policy if exists "boards_select"          on boards;
drop policy if exists "boards_insert"          on boards;
drop policy if exists "boards_update"          on boards;
drop policy if exists "boards_delete"          on boards;
drop policy if exists "Members can view boards"              on boards;
drop policy if exists "Authenticated users can create boards" on boards;
drop policy if exists "Owner can update board"               on boards;
drop policy if exists "Owner can delete board"               on boards;

drop policy if exists "board_members_select"   on board_members;
drop policy if exists "board_members_insert"   on board_members;
drop policy if exists "board_members_delete"   on board_members;
drop policy if exists "Members can view board_members"  on board_members;
drop policy if exists "Owner can manage board_members"  on board_members;

drop policy if exists "columns_all"            on columns;
drop policy if exists "Members can view columns"   on columns;
drop policy if exists "Members can manage columns" on columns;

drop policy if exists "tasks_all"              on tasks;
drop policy if exists "Members can view tasks"    on tasks;
drop policy if exists "Members can manage tasks"  on tasks;

drop policy if exists "comments_select"        on comments;
drop policy if exists "comments_insert"        on comments;
drop policy if exists "comments_delete"        on comments;
drop policy if exists "Members can view comments" on comments;
drop policy if exists "Members can add comments"  on comments;
drop policy if exists "Users can delete own comments" on comments;

drop policy if exists "profiles_select"        on profiles;
drop policy if exists "profiles_insert"        on profiles;
drop policy if exists "profiles_update"        on profiles;
drop policy if exists "Profiles are publicly readable" on profiles;
drop policy if exists "Users can update own profile"   on profiles;

-- ──────────────────────────────────────────────────────────────────────────
-- boards
-- ──────────────────────────────────────────────────────────────────────────
create policy "boards_select" on boards for select
  using (id in (select auth_user_board_ids()));

create policy "boards_insert" on boards for insert
  with check (owner_id = auth.uid());

create policy "boards_update" on boards for update
  using (owner_id = auth.uid());

create policy "boards_delete" on boards for delete
  using (owner_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- board_members  (no self-reference — uses auth_user_board_ids())
-- ──────────────────────────────────────────────────────────────────────────
create policy "board_members_select" on board_members for select
  using (board_id in (select auth_user_board_ids()));

-- insert handled entirely inside create_board_with_defaults (SECURITY DEFINER)
-- but keep a permissive policy so owner can invite others later
create policy "board_members_insert" on board_members for insert
  with check (board_id in (select id from boards where owner_id = auth.uid()));

create policy "board_members_delete" on board_members for delete
  using (board_id in (select id from boards where owner_id = auth.uid()));

-- ──────────────────────────────────────────────────────────────────────────
-- columns
-- ──────────────────────────────────────────────────────────────────────────
create policy "columns_all" on columns for all
  using      (board_id in (select auth_user_board_ids()))
  with check (board_id in (select auth_user_board_ids()));

-- ──────────────────────────────────────────────────────────────────────────
-- tasks
-- ──────────────────────────────────────────────────────────────────────────
create policy "tasks_all" on tasks for all
  using (column_id in (
    select id from columns where board_id in (select auth_user_board_ids())
  ))
  with check (column_id in (
    select id from columns where board_id in (select auth_user_board_ids())
  ));

-- ──────────────────────────────────────────────────────────────────────────
-- comments
-- ──────────────────────────────────────────────────────────────────────────
create policy "comments_select" on comments for select
  using (task_id in (
    select t.id from tasks t
    join columns c on c.id = t.column_id
    where c.board_id in (select auth_user_board_ids())
  ));

create policy "comments_insert" on comments for insert
  with check (user_id = auth.uid());

create policy "comments_delete" on comments for delete
  using (user_id = auth.uid());

-- ──────────────────────────────────────────────────────────────────────────
-- profiles  (public read, own write)
-- ──────────────────────────────────────────────────────────────────────────
create policy "profiles_select" on profiles for select using (true);

create policy "profiles_insert" on profiles for insert
  with check (id = auth.uid());

create policy "profiles_update" on profiles for update
  using (id = auth.uid());
