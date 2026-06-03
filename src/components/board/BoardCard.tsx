// TODO: card with board title, click → navigate, delete button for owner
import type { Board } from '../../types';

interface Props {
  board: Board;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, onDelete }: Props) {
  return null;
}
