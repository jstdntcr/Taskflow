import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBoard } from '../hooks/useBoards';
import { ColumnList } from '../components/board/ColumnList';
import { Spinner } from '../components/shared/Spinner';
import styles from './BoardPage.module.css';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { data: board, isLoading } = useBoard(boardId!);

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Назад к доскам">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <Link to="/" className={styles.logoLink}>TaskFlow</Link>
          {board && (
            <>
              <span className={styles.separator}>/</span>
              <span className={styles.boardName}>{board.title}</span>
            </>
          )}
          {isLoading && <Spinner size="sm" />}
        </div>
      </header>

      <main className={styles.main}>
        <ColumnList boardId={boardId!} />
      </main>
    </div>
  );
}
