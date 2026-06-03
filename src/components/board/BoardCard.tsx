import { useState, useRef, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Board } from '../../types';
import { useUpdateBoard } from '../../hooks/useBoards';
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
  const updateBoard = useUpdateBoard();
  const color = getBoardColor(board.id);

  const [renaming, setRenaming] = useState(false);
  const [value, setValue] = useState(board.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return;
    setValue(board.title);
    setRenaming(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = (e: React.MouseEvent | React.FocusEvent) => {
    e.stopPropagation?.();
    const trimmed = value.trim();
    if (trimmed && trimmed !== board.title) {
      updateBoard.mutate({ id: board.id, title: trimmed });
    } else {
      setValue(board.title);
    }
    setRenaming(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.currentTarget.blur(); }
    if (e.key === 'Escape') { setValue(board.title); setRenaming(false); }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Удалить доску «${board.title}»? Это действие нельзя отменить.`)) {
      onDelete(board.id);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={() => !renaming && navigate(`/board/${board.id}`)}
    >
      <div className={styles.accent} style={{ background: color }} />

      <div className={styles.body}>
        {renaming ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            onClick={(e) => e.stopPropagation()}
            className={styles.renameInput}
            autoFocus
            maxLength={100}
          />
        ) : (
          <h3
            className={styles.title}
            onDoubleClick={startRename}
            title={isOwner ? 'Двойной клик для переименования' : undefined}
          >
            {board.title}
          </h3>
        )}
        <p className={styles.date}>Создана {formatDate(board.created_at)}</p>
      </div>

      {isOwner && !renaming && (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={startRename}
            aria-label="Переименовать доску"
            title="Переименовать"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            aria-label="Удалить доску"
            title="Удалить"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
