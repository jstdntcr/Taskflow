import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, getTasks, moveTask, updateTask } from '../services/tasks';
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
