import { useNavigate } from 'react-router-dom';
import type { Board } from '../../types';
import { formatDate } from '../../utils/date';
import styles from './BoardCard.module.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

function getBoardColor(id: string): string {
  return COLORS[id.charCodeAt(0) % COLORS.length];
}

interface Props {
  board: Board;
  isOwner: boolean;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, isOwner, onDelete }: Props) {
  const navigate = useNavigate();
  const color = getBoardColor(board.id);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Удалить доску «${board.title}»? Это действие нельзя отменить.`)) {
      onDelete(board.id);
    }
  };

  return (
    <div className={styles.card} onClick={() => navigate(`/board/${board.id}`)}>
      <div className={styles.accent} style={{ background: color }} />
      <div className={styles.body}>
        <h3 className={styles.title}>{board.title}</h3>
        <p className={styles.date}>Создана {formatDate(board.created_at)}</p>
      </div>
      {isOwner && (
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
          aria-label="Удалить доску"
          title="Удалить доску"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      )}
    </div>
  );
}
