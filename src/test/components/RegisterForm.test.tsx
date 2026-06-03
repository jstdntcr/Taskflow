import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../../components/auth/RegisterForm';

const mockSignUp = vi.fn();

vi.mock('../../providers/AuthProvider', () => ({
  useAuth: () => ({ signUp: mockSignUp }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<RegisterForm />),
  };
}

async function fillForm(
  u: ReturnType<typeof userEvent.setup>,
  email = 'new@example.com',
  password = 'secret123',
  confirm = 'secret123'
) {
  if (email)    await u.type(screen.getByLabelText('Email'), email);
  if (password) await u.type(screen.getByLabelText('Пароль'), password);
  if (confirm)  await u.type(screen.getByLabelText('Подтвердите пароль'), confirm);
}

beforeEach(() => vi.clearAllMocks());

describe('RegisterForm — рендер', () => {
  it('отображает три поля ввода', () => {
    setup();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByLabelText('Подтвердите пароль')).toBeInTheDocument();
  });

  it('содержит ссылку на страницу входа', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/login');
  });
});

describe('RegisterForm — валидация', () => {
  it('показывает ошибку при пустом email', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Введите email');
  });

  it('показывает ошибку при некорректном email', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'bademail');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    expect(screen.getByRole('alert')).toHaveTextContent('корректный email');
  });

  it('показывает ошибку если пароль короче 6 символов', async () => {
    const { user } = setup();
    await fillForm(user, 'a@b.com', '123', '123');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    expect(screen.getByRole('alert')).toHaveTextContent('не менее 6 символов');
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('показывает ошибку если пароли не совпадают', async () => {
    const { user } = setup();
    await fillForm(user, 'a@b.com', 'password1', 'password2');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    expect(screen.getByRole('alert')).toHaveTextContent('не совпадают');
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('ровно 6 символов в пароле проходит валидацию', async () => {
    mockSignUp.mockResolvedValue(undefined);
    const { user } = setup();
    await fillForm(user, 'a@b.com', 'abc123', 'abc123');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
  });

  it('ошибка сбрасывается при изменении поля', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('RegisterForm — отправка', () => {
  it('вызывает signUp с email и паролем', async () => {
    mockSignUp.mockResolvedValue(undefined);
    const { user } = setup();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith('new@example.com', 'secret123')
    );
  });

  it('показывает экран подтверждения после успешной регистрации', async () => {
    mockSignUp.mockResolvedValue(undefined);
    const { user } = setup();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    await waitFor(() =>
      expect(screen.getByText('Почти готово!')).toBeInTheDocument()
    );
    expect(screen.getByText(/new@example\.com/)).toBeInTheDocument();
  });

  it('показывает ошибку от signUp', async () => {
    mockSignUp.mockRejectedValue(new Error('User already registered'));
    const { user } = setup();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('User already registered')
    );
  });

  it('блокирует кнопку во время загрузки', async () => {
    mockSignUp.mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
    const { user } = setup();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    expect(screen.getByRole('button', { name: 'Создаём аккаунт...' })).toBeDisabled();
  });
});
