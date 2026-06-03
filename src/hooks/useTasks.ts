import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, getTasks, moveTask, reorderTasks, updateTask } from '../services/tasks';
import type { Task } from '../types';

export function useTasks(boardId: string) {
  return useQuery({
    queryKey: ['tasks', boardId],
    queryFn: () => getTasks(boardId),
    enabled: Boolean(boardId),
  });
}

export function useCreateTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, title, position }: { columnId: string; title: string; position: number }) =>
      createTask(columnId, title, position),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', boardId] }),
  });
}

export function useUpdateTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      updateTask(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', boardId] }),
  });
}

export function useMoveTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, columnId, position }: { id: string; columnId: string; position: number }) =>
      moveTask(id, columnId, position),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', boardId] }),
  });
}

export function useDeleteTask(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', boardId] }),
  });
}

export function useReorderTasks(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reorderTasks,
    // Apply new column_id/position locally before the server responds
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: ['tasks', boardId] });
      const prev = qc.getQueryData<Task[]>(['tasks', boardId]);
      const map = new Map(updates.map((u) => [u.id, u]));
      qc.setQueryData<Task[]>(['tasks', boardId], (old = []) =>
        old.map((t) => {
          const u = map.get(t.id);
          return u ? { ...t, column_id: u.column_id, position: u.position } : t;
        })
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tasks', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['tasks', boardId] }),
  });
}
