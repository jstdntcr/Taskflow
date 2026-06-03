import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useProfile, useUpdateProfile, useUploadAvatar } from '../hooks/useProfile';
import { Spinner } from '../components/shared/Spinner';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setName(profile.name ?? '');
  }, [profile?.name]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ name: name.trim() || null });
    setSavedMsg('Сохранено');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const initial = (profile?.name ?? user?.email ?? '?')[0].toUpperCase();

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Мои доски
        </button>
        <button className={styles.signOutBtn} onClick={async () => { await signOut(); navigate('/login'); }}>
          Выйти
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.heading}>Настройки профиля</h1>

          {isLoading ? (
            <div className={styles.spinnerWrap}><Spinner size="md" /></div>
          ) : (
            <>
              {/* Avatar */}
              <div className={styles.avatarSection}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                  title="Нажмите для загрузки фото"
                >
                  {uploadAvatar.isPending ? (
                    <div className={styles.avatarSpinner}><Spinner size="md" /></div>
                  ) : profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Аватар" className={styles.avatarImg} />
                  ) : (
                    <div className={styles.avatarInitial}>{initial}</div>
                  )}
                  <div className={styles.avatarOverlay}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.fileInput}
                  onChange={handleAvatarChange}
                />
                <p className={styles.avatarHint}>Нажмите на аватар для загрузки фото</p>
                {avatarError && <p className={styles.errorMsg}>{avatarError}</p>}
              </div>

              {/* Name form */}
              <form onSubmit={handleSave} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="name" className={styles.label}>Отображаемое имя</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setSavedMsg(''); }}
                    placeholder="Ваше имя"
                    maxLength={100}
                    className={styles.input}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    className={`${styles.input} ${styles.readOnly}`}
                  />
                </div>

                <div className={styles.formFooter}>
                  {savedMsg && <span className={styles.savedMsg}>✓ {savedMsg}</span>}
                  {updateProfile.isError && (
                    <span className={styles.errorMsg}>
                      {updateProfile.error instanceof Error ? updateProfile.error.message : 'Ошибка'}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className={styles.saveBtn}
                  >
                    {updateProfile.isPending ? 'Сохраняем...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
