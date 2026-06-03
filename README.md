# TaskFlow

Веб-приложение для управления задачами на канбан-досках с drag-and-drop. Аналог Jira-lite: доски → колонки → задачи, с авторизацией, комментариями и профилями пользователей.

**Тестовый аккаунт:**
```
Email:    demo@taskflow.app
Пароль:   demo123456
```

---

## Стек

| Категория | Технология |
| --- | --- |
| Фреймворк | React 19 + Vite |
| Язык | TypeScript (strict) |
| Backend / БД | Supabase (Postgres, Auth, Storage) |
| Стилизация | CSS Modules |
| State / data-fetching | TanStack Query (React Query) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Роутинг | React Router v7 |
| Тесты | Vitest + Testing Library |

---

## Реализованные уровни

### ✅ Уровень 1 — MVP
- **Аутентификация:** регистрация по email/паролю, вход/выход, защита роутов, клиентская валидация форм
- **Доски:** список своих досок, создание (с 3 колонками по умолчанию), переименование, удаление
- **Колонки:** добавление, переименование (двойной клик), удаление, **перетаскивание колонок** между собой
- **Задачи:** создание, drag-and-drop между колонками и внутри колонки с индикатором вставки, удаление
- **UI:** адаптивная вёрстка, скелетоны загрузки, обработка ошибок, понятная навигация

### ✅ Уровень 2 — Full
- **Детали задачи:** модальное окно с названием, описанием, приоритетом (low/medium/high), дедлайном и назначением исполнителя
- **Комментарии:** список с автором и временем, добавление/удаление
- **Профиль:** редактирование имени, загрузка аватара (Supabase Storage); аватар отображается в навбаре и комментариях

### ⏳ Не реализовано
- Realtime-обновления (Supabase Realtime)
- Приглашение участников по email (схема и роли owner/member готовы в БД)
- Бонус-уровень: фильтры, поиск, лог активности, тёмная тема, OAuth

---

## Запуск локально

```bash
git clone <repo-url>
cd taskflow
npm install
cp .env.example .env   # заполнить ключи Supabase (см. ниже)
npm run dev
```

Приложение поднимется на `http://localhost:5173`.

### Переменные окружения

`.env` (значения берутся в Supabase Dashboard → Settings → API):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Настройка Supabase

В **Supabase Dashboard → SQL Editor** выполнить скрипты из папки `supabase/` по порядку:

| Файл | Назначение |
| --- | --- |
| `schema.sql` | Таблицы, триггер автосоздания профиля |
| `policies.sql` | RLS-политики + RPC `create_board_with_defaults` (создание доски без рекурсии RLS) |
| `storage.sql` | Bucket `avatars` и политики хранилища |
| `fix_profile_trigger.sql` | Email как имя по умолчанию + backfill |

### Демо-данные (опционально)

1. **Authentication → Users → Add user** → создать `demo@taskflow.app` / `demo123456`, отметить ✅ **Auto confirm user**
2. Выполнить `supabase/seed.sql` — создаст 2 доски с задачами и комментарием

> Примечание: тестовый пользователь создаётся через Dashboard, а не SQL — GoTrue требует собственной процедуры регистрации.

---

## Скрипты

```bash
npm run dev        # дев-сервер
npm run build      # прод-сборка (tsc + vite build)
npm run preview    # предпросмотр сборки
npm run lint       # ESLint
npm run test       # тесты в watch-режиме
npm run test:run   # тесты однократно (51 тест)
```

---

## Архитектура

```
src/
├── components/
│   ├── auth/      # LoginForm, RegisterForm
│   ├── board/     # BoardCard, BoardList, Column, ColumnList, TaskCard
│   ├── task/      # TaskModal, CommentList, CommentItem
│   └── shared/    # Spinner, Modal, ProtectedRoute
├── pages/         # Login, Register, Boards, Board, Profile
├── hooks/         # useBoards, useColumns, useTasks, useComments, useProfile, useBoardMembers
├── services/      # Supabase API: boards, columns, tasks, comments, profiles
├── providers/     # AuthProvider, QueryProvider
├── types/         # TypeScript-типы
├── utils/         # cn, date
└── test/          # Vitest: utils, components, hooks
```

**Принципы:**
- Слой `services/` инкапсулирует все вызовы Supabase и нормализует ошибки (`PostgrestError` → `Error`)
- Хуки на TanStack Query — серверное состояние, кэширование, оптимистичные обновления для drag-and-drop
- Бизнес-логика drag-and-drop вынесена в `ColumnList`; позиции пересчитываются и в UI (оптимистично), и в БД

---

## Что улучшил бы при наличии времени

- **Realtime** через Supabase-подписки — сейчас данные обновляются только локально и по рефетчу
- **Приглашение участников по email** — таблица `board_members` и роли уже есть, не хватает UI и server-side поиска пользователей
- Перенести позиции задач/колонок на дробные индексы (`fractional-indexing`), чтобы не перенумеровывать всю колонку при каждом перемещении
- Больше тестов: компоненты доски и drag-and-drop, интеграционные тесты на сервисный слой
- Бонусы из ТЗ: поиск, фильтры по приоритету/исполнителю, тёмная тема, горячие клавиши
