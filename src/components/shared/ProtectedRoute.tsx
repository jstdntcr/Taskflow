import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Spinner } from './Spinner';
import styles from './ProtectedRoute.module.css';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
