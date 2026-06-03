import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBoard } from '../hooks/useBoards';
import { useAuth } from '../providers/AuthProvider';
import { useProfile } from '../hooks/useProfile';
import { ColumnList } from '../components/board/ColumnList';
import { TaskModal } from '../components/task/TaskModal';
import { Spinner } from '../components/shared/Spinner';
import type { Task } from '../types';
import styles from './BoardPage.module.css';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { data: board, isLoading } = useBoard(boardId!);
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const initial = (profile?.name ?? user?.email ?? '?')[0].toUpperCase();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Назад">
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

        <div className={styles.navRight}>
          <Link to="/profile" className={styles.profileLink}>
            <div className={styles.avatar}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" className={styles.avatarImg} />
                : initial}
            </div>
            <span className={styles.email}>{profile?.name ?? user?.email}</span>
          </Link>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <ColumnList boardId={boardId!} onTaskClick={setSelectedTask} />
      </main>

      <TaskModal
        task={selectedTask}
        boardId={boardId!}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
