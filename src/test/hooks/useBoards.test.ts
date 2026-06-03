import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useBoards, useCreateBoard, useDeleteBoard } from '../../hooks/useBoards';
import type { Board } from '../../types';

vi.mock('../../services/boards', () => ({
  getBoards: vi.fn(),
  createBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));

import { getBoards, createBoard, deleteBoard } from '../../services/boards';

const BOARDS: Board[] = [
  { id: '1', title: 'Alpha', owner_id: 'u1', created_at: '2024-01-01T00:00:00Z' },
  { id: '2', title: 'Beta',  owner_id: 'u1', created_at: '2024-02-01T00:00:00Z' },
];

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => vi.clearAllMocks());

describe('useBoards', () => {
  it('возвращает список досок', async () => {
    vi.mocked(getBoards).mockResolvedValue(BOARDS);
    const { result } = renderHook(() => useBoards(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(BOARDS);
  });

  it('переходит в состояние ошибки при сбое', async () => {
    vi.mocked(getBoards).mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => useBoards(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCreateBoard', () => {
  it('вызывает createBoard с заголовком', async () => {
    const newBoard: Board = { id: '3', title: 'Gamma', owner_id: 'u1', created_at: '2024-03-01T00:00:00Z' };
    vi.mocked(getBoards).mockResolvedValue([...BOARDS, newBoard]);
    vi.mocked(createBoard).mockResolvedValue(newBoard);

    const { result } = renderHook(() => useCreateBoard(), { wrapper: wrapper() });
    await act(() => result.current.mutateAsync('Gamma'));
    // TQ v5 passes mutation context as second arg — verify only the user data
    expect(vi.mocked(createBoard).mock.calls[0][0]).toBe('Gamma');
  });

  it('возвращает созданную доску', async () => {
    const newBoard: Board = { id: '3', title: 'Gamma', owner_id: 'u1', created_at: '2024-03-01T00:00:00Z' };
    vi.mocked(createBoard).mockResolvedValue(newBoard);
    vi.mocked(getBoards).mockResolvedValue([]);

    const { result } = renderHook(() => useCreateBoard(), { wrapper: wrapper() });
    const created = await act(() => result.current.mutateAsync('Gamma'));
    expect(created).toEqual(newBoard);
  });

  it('выбрасывает ошибку при сбое создания', async () => {
    vi.mocked(createBoard).mockRejectedValue(new Error('RLS violation'));
    const { result } = renderHook(() => useCreateBoard(), { wrapper: wrapper() });
    await expect(act(() => result.current.mutateAsync('Fail'))).rejects.toThrow('RLS violation');
  });
});

describe('useDeleteBoard', () => {
  it('вызывает deleteBoard с id доски', async () => {
    vi.mocked(deleteBoard).mockResolvedValue(undefined);
    vi.mocked(getBoards).mockResolvedValue([]);

    const { result } = renderHook(() => useDeleteBoard(), { wrapper: wrapper() });
    await act(() => result.current.mutateAsync('1'));
    expect(vi.mocked(deleteBoard).mock.calls[0][0]).toBe('1');
  });
});
