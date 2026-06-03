import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumn, deleteColumn, getColumns, reorderColumns, updateColumn } from '../services/columns';
import type { Column } from '../types';

export function useColumns(boardId: string) {
  return useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => getColumns(boardId),
    enabled: Boolean(boardId),
  });
}

export function useCreateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ title, position }: { title: string; position: number }) =>
      createColumn(boardId, title, position),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['columns', boardId] }),
  });
}

export function useUpdateColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateColumn(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['columns', boardId] }),
  });
}

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteColumn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['columns', boardId] }),
  });
}

export function useMoveColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reorderColumns,
    // Optimistic update: reorder locally before server responds
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: ['columns', boardId] });
      const prev = qc.getQueryData<Column[]>(['columns', boardId]);
      qc.setQueryData<Column[]>(['columns', boardId], (old = []) =>
        old
          .map((col) => {
            const u = updates.find((x) => x.id === col.id);
            return u ? { ...col, position: u.position } : col;
          })
          .sort((a, b) => a.position - b.position)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['columns', boardId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['columns', boardId] }),
  });
}
