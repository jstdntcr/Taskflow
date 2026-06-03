-- ============================================================
-- TaskFlow — Demo Seed Data
-- ============================================================
--
-- BEFORE running this script:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Click "Add user" → "Create new user"
--   3. Email: demo@taskflow.app  |  Password: demo123456
--   4. Check ✅ "Auto confirm user"
--   5. Then run this script in SQL Editor
--
-- Demo credentials:
--   Email:    demo@taskflow.app
--   Password: demo123456
--
-- Safe to re-run (idempotent).
-- ============================================================

do $$
declare
  v_uid   uuid;
  v_b1    uuid;
  v_b2    uuid;
  v_col   uuid;
  v_t1    uuid;
begin

  -- ── Resolve user ID ────────────────────────────────────────
  select id into v_uid
  from auth.users
  where email = 'demo@taskflow.app'
  limit 1;

  if v_uid is null then
    raise exception
      'Demo user not found. '
      'Create demo@taskflow.app via Dashboard → Authentication → Users first.';
  end if;

  -- Skip if already seeded
  if exists (select 1 from boards where owner_id = v_uid) then
    raise notice 'Demo data already exists for %. Skipping.', v_uid;
    return;
  end if;

  -- ── Profile ─────────────────────────────────────────────────
  insert into profiles (id, name)
  values (v_uid, 'Demo User')
  on conflict (id) do update set name = 'Demo User';

  -- ═══════════════════════════════════════════════════════════
  -- Board 1: Разработка продукта
  -- ═══════════════════════════════════════════════════════════
  insert into boards (title, owner_id)
  values ('Разработка продукта', v_uid)
  returning id into v_b1;

  insert into board_members (board_id, user_id, role)
  values (v_b1, v_uid, 'owner');

  -- To Do ──────────────────────────────────────────────────────
  insert into columns (board_id, title, position)
  values (v_b1, 'To Do', 0)
  returning id into v_col;

  insert into tasks
    (column_id, title, description, priority, due_date, position, created_by)
  values
    (v_col,
     'Написать техническое задание',
     'Описать архитектуру, стек технологий и схему БД. Согласовать с командой.',
     'high', current_date + 3, 0, v_uid),
    (v_col,
     'Настроить CI/CD pipeline',
     null, 'medium', null, 1, v_uid),
    (v_col,
     'Добавить тёмную тему',
     null, 'low', null, 2, v_uid);

  -- In Progress ────────────────────────────────────────────────
  insert into columns (board_id, title, position)
  values (v_b1, 'In Progress', 1)
  returning id into v_col;

  insert into tasks
    (column_id, title, description, priority, due_date, position, created_by)
  values
    (v_col,
     'Реализовать авторизацию',
     'Email/password через Supabase Auth. Защита роутов, редирект неавторизованных пользователей.',
     'high', current_date + 1, 0, v_uid),
    (v_col,
     'Drag-and-drop между колонками',
     null, 'medium', current_date - 1, 1, v_uid);

  -- Done ───────────────────────────────────────────────────────
  insert into columns (board_id, title, position)
  values (v_b1, 'Done', 2)
  returning id into v_col;

  insert into tasks
    (column_id, title, description, priority, due_date, position, created_by)
  values
    (v_col,
     'Настроить Supabase',
     'Создать проект, применить схему БД и RLS-политики.',
     'medium', null, 0, v_uid),
    (v_col,
     'Создать базу данных',
     null, 'low', null, 1, v_uid)
  returning id into v_t1;

  -- Комментарий ────────────────────────────────────────────────
  select id into v_t1
  from tasks
  where column_id = v_col and title = 'Создать базу данных'
  limit 1;

  insert into comments (task_id, user_id, content)
  values (v_t1, v_uid, 'Схема применена, RLS-политики проверены — всё работает.');

  -- ═══════════════════════════════════════════════════════════
  -- Board 2: Маркетинг
  -- ═══════════════════════════════════════════════════════════
  insert into boards (title, owner_id)
  values ('Маркетинг', v_uid)
  returning id into v_b2;

  insert into board_members (board_id, user_id, role)
  values (v_b2, v_uid, 'owner');

  -- To Do ──────────────────────────────────────────────────────
  insert into columns (board_id, title, position)
  values (v_b2, 'To Do', 0)
  returning id into v_col;

  insert into tasks
    (column_id, title, description, priority, due_date, position, created_by)
  values
    (v_col,
     'Написать пресс-релиз',
     null, 'high', current_date + 7, 0, v_uid),
    (v_col,
     'Подготовить публикации в соцсетях',
     null, 'medium', null, 1, v_uid);

  -- In Progress ────────────────────────────────────────────────
  insert into columns (board_id, title, position)
  values (v_b2, 'In Progress', 1)
  returning id into v_col;

  insert into tasks
    (column_id, title, description, priority, due_date, position, created_by)
  values
    (v_col,
     'Создать лендинг',
     'Дизайн и вёрстка главной страницы продукта. Адаптив обязателен.',
     'high', current_date + 14, 0, v_uid);

  -- Done ───────────────────────────────────────────────────────
  insert into columns (board_id, title, position)
  values (v_b2, 'Done', 2)
  returning id into v_col;

  insert into tasks
    (column_id, title, description, priority, due_date, position, created_by)
  values
    (v_col,
     'Провести анализ конкурентов',
     null, 'medium', null, 0, v_uid);

  raise notice 'Demo data seeded successfully for user %', v_uid;

end $$;
