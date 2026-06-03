import type { Comment } from '../../types';
import { formatRelative } from '../../utils/date';
import styles from './comments.module.css';

interface Props {
  comment: Comment;
  currentUserId: string;
  onDelete: (id: string) => void;
}

export function CommentItem({ comment, currentUserId, onDelete }: Props) {
  const name = comment.profile?.name ?? 'Пользователь';
  const initial = name[0].toUpperCase();
  const isOwn = comment.user_id === currentUserId;

  return (
    <div className={styles.item}>
      <div className={styles.avatar}>
        {comment.profile?.avatar_url
          ? <img src={comment.profile.avatar_url} alt={name} className={styles.avatarImg} />
          : initial}
      </div>
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.author}>{name}</span>
          <span className={styles.time}>{formatRelative(comment.created_at)}</span>
          {isOwn && (
            <button
              className={styles.deleteBtn}
              onClick={() => onDelete(comment.id)}
              aria-label="Удалить комментарий"
            >
              Удалить
            </button>
          )}
        </div>
        <p className={styles.text}>{comment.content}</p>
      </div>
    </div>
  );
}
