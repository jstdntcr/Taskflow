import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useTasks, useCreateTask, useMoveTask, useDeleteTask } from '../../hooks/useTasks';
import type { Task } from '../../types';

vi.mock('../../services/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  moveTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import { getTasks, createTask, moveTask, deleteTask } from '../../services/tasks';

const BOARD_ID = 'board-1';
const COL_ID   = 'col-1';

const TASKS: Task[] = [
  {
    id: 't1', column_id: COL_ID, title: 'Task A', description: null,
    priority: 'medium', due_date: null, assignee_id: null,
    position: 0, created_by: 'u1', created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't2', column_id: COL_ID, title: 'Task B', description: null,
    priority: 'high', due_date: null, assignee_id: null,
    position: 1, created_by: 'u1', created_at: '2024-01-02T00:00:00Z',
  },
];

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useTasks', () => {
  it('возвращает задачи доски', async () => {
    vi.mocked(getTasks).mockResolvedValue(TASKS);
    const { result } = renderHook(() => useTasks(BOARD_ID), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(TASKS);
    expect(getTasks).toHaveBeenCalledWith(BOARD_ID);
  });

  it('не запускает запрос если boardId пустой', () => {
    const { result } = renderHook(() => useTasks(''), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTasks).not.toHaveBeenCalled();
  });

  it('переходит в isError при сбое', async () => {
    vi.mocked(getTasks).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useTasks(BOARD_ID), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateTask', () => {
  it('вызывает createTask с правильными аргументами', async () => {
    const newTask = { ...TASKS[0], id: 't3', title: 'New Task', position: 2 };
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(createTask).mockResolvedValue(newTask);

    const { result } = renderHook(() => useCreateTask(BOARD_ID), { wrapper: wrapper() });
    await act(() =>
      result.current.mutateAsync({ columnId: COL_ID, title: 'New Task', position: 2 })
    );
    expect(createTask).toHaveBeenCalledWith(COL_ID, 'New Task', 2);
  });

  it('возвращает созданную задачу', async () => {
    const newTask = { ...TASKS[0], id: 't3', title: 'Created' };
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(createTask).mockResolvedValue(newTask);

    const { result } = renderHook(() => useCreateTask(BOARD_ID), { wrapper: wrapper() });
    const task = await act(() =>
      result.current.mutateAsync({ columnId: COL_ID, title: 'Created', position: 0 })
    );
    expect(task).toEqual(newTask);
  });

  it('выбрасывает ошибку при сбое', async () => {
    vi.mocked(createTask).mockRejectedValue(new Error('RLS'));
    const { result } = renderHook(() => useCreateTask(BOARD_ID), { wrapper: wrapper() });
    await expect(
      act(() => result.current.mutateAsync({ columnId: COL_ID, title: 'X', position: 0 }))
    ).rejects.toThrow('RLS');
  });
});

describe('useMoveTask', () => {
  it('вызывает moveTask с id, колонкой и позицией', async () => {
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(moveTask).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMoveTask(BOARD_ID), { wrapper: wrapper() });
    await act(() =>
      result.current.mutateAsync({ id: 't1', columnId: 'col-2', position: 0 })
    );
    expect(moveTask).toHaveBeenCalledWith('t1', 'col-2', 0);
  });
});

describe('useDeleteTask', () => {
  it('вызывает deleteTask с id задачи', async () => {
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(deleteTask).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTask(BOARD_ID), { wrapper: wrapper() });
    await act(() => result.current.mutateAsync('t1'));
    expect(vi.mocked(deleteTask).mock.calls[0][0]).toBe('t1');
  });
});
