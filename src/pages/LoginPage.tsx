import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { LoginForm } from '../components/auth/LoginForm';
import { Spinner } from '../components/shared/Spinner';
import styles from './auth.page.module.css';

export function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return <LoginForm />;
}
