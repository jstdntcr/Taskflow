import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useProfile } from '../hooks/useProfile';
import { BoardList } from '../components/board/BoardList';
import styles from './BoardsPage.module.css';

export function BoardsPage() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const initial = (profile?.name ?? user?.email ?? '?')[0].toUpperCase();

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
        <BoardList />
      </main>
    </div>
  );
}
