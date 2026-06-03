import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBoard, deleteBoard, getBoards } from '../services/boards';
import { createDefaultColumns } from '../services/columns';

export function useBoards() {
  return useQuery({ queryKey: ['boards'], queryFn: getBoards });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const board = await createBoard(title);
      await createDefaultColumns(board.id);
      return board;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}
