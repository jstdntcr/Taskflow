import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBoard, deleteBoard, getBoards } from '../services/boards';

export function useBoards() {
  return useQuery({ queryKey: ['boards'], queryFn: getBoards });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
    select: (boards) => boards.find((b) => b.id === boardId),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBoard,
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
