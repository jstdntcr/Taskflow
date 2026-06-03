// TODO: grid of BoardCard + "Create board" button
import { useBoards, useCreateBoard, useDeleteBoard } from '../../hooks/useBoards';

export function BoardList() {
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  return null;
}
