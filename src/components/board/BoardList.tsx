import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoards, useCreateBoard, useDeleteBoard } from '../../hooks/useBoards';
import { useAuth } from '../../providers/AuthProvider';
import { Modal } from '../shared/Modal';
import { BoardCard } from './BoardCard';
import styles from './BoardList.module.css';

export function BoardList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: boards, isLoading, error } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreateError(null);
    try {
      const board = await createBoard.mutateAsync(title.trim());
      setModalOpen(false);
      setTitle('');
      navigate(`/board/${board.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Не удалось создать доску');
    }
  };

  const handleDelete = (id: string) => {
    deleteBoard.mutate(id);
  };

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorText}>
        <p>Не удалось загрузить доски.</p>
        <pre className={styles.errorDetail}>{error.message}</pre>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.heading}>Мои доски</h2>
        <button className={styles.newBtn} onClick={() => setModalOpen(true)}>
          + Новая доска
        </button>
      </div>

      {boards?.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>У вас ещё нет досок</p>
          <p className={styles.emptyHint}>Создайте первую доску, чтобы начать работу</p>
          <button className={styles.newBtn} onClick={() => setModalOpen(true)}>
            Создать доску
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {boards?.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isOwner={board.owner_id === user?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setTitle(''); setCreateError(null); }} title="Новая доска">
        <form onSubmit={handleCreate} className={styles.form}>
          <label htmlFor="board-title" className={styles.label}>
            Название доски
          </label>
          <input
            id="board-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="например, Мой проект"
            autoFocus
            maxLength={100}
            className={styles.input}
          />
          {createError && <p className={styles.errorMsg}>{createError}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => { setModalOpen(false); setTitle(''); setCreateError(null); }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createBoard.isPending}
              className={styles.submitBtn}
            >
              {createBoard.isPending ? 'Создаём...' : 'Создать'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
