import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { BoardList } from '../components/board/BoardList';
import styles from './BoardsPage.module.css';

export function BoardsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <span className={styles.logo}>TaskFlow</span>
        <div className={styles.navRight}>
          <Link to="/profile" className={styles.profileLink}>
            <div className={styles.avatar}>
              {user?.email?.[0].toUpperCase() ?? '?'}
            </div>
            <span className={styles.email}>{user?.email}</span>
          </Link>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <BoardList />
      </main>
    </div>
  );
}
