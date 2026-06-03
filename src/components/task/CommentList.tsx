import { useState, type FormEvent } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { useComments, useCreateComment, useDeleteComment } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';
import { Spinner } from '../shared/Spinner';
import styles from './comments.module.css';

interface Props {
  taskId: string;
}

export function CommentList({ taskId }: Props) {
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [text, setText] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await createComment.mutateAsync(text.trim());
    setText('');
  };

  return (
    <div className={styles.section}>
      <h4 className={styles.heading}>Комментарии {comments.length > 0 && `(${comments.length})`}</h4>

      {isLoading ? (
        <div className={styles.spinnerWrap}><Spinner size="sm" /></div>
      ) : comments.length === 0 ? (
        <p className={styles.empty}>Комментариев пока нет</p>
      ) : (
        <div className={styles.list}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id ?? ''}
              onDelete={(id) => deleteComment.mutate(id)}
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as FormEvent); } }}
          placeholder="Написать комментарий... (Enter — отправить)"
          rows={3}
          className={styles.textarea}
        />
        <button
          type="submit"
          disabled={!text.trim() || createComment.isPending}
          className={styles.submitBtn}
        >
          {createComment.isPending ? 'Отправляем...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
}
