// TODO: list of CommentItem + textarea to add new comment
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, createComment, deleteComment } from '../../services/comments';

interface Props {
  taskId: string;
}

export function CommentList({ taskId }: Props) {
  return null;
}
