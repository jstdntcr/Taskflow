import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumn, deleteColumn, getColumns, updateColumn } from '../services/columns';

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
