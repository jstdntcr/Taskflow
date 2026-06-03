import { useQuery } from '@tanstack/react-query';
import { getBoardMembers } from '../services/boards';

export function useBoardMembers(boardId: string) {
  return useQuery({
    queryKey: ['board-members', boardId],
    queryFn: () => getBoardMembers(boardId),
    enabled: Boolean(boardId),
  });
}
