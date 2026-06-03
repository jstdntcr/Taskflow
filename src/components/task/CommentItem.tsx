// TODO: avatar, author name, timestamp, content, delete button (own comments only)
import type { Comment } from '../../types';

interface Props {
  comment: Comment;
  currentUserId: string;
  onDelete: (id: string) => void;
}

export function CommentItem({ comment, currentUserId, onDelete }: Props) {
  return null;
}
