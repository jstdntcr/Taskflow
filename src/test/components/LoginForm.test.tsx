import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../components/auth/LoginForm';

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../providers/AuthProvider', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
}));

function setup() {
  return {
    user: userEvent.setup(),
    ...render(<LoginForm />),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('LoginForm — рендер', () => {
  it('отображает поля email и пароль', () => {
    setup();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });

  it('отображает кнопку "Войти"', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('содержит ссылку на страницу регистрации', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toHaveAttribute('href', '/register');
  });
});

describe('LoginForm — валидация', () => {
  it('показывает ошибку при пустом email', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Введите email');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('показывает ошибку при некорректном email', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'notanemail');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByRole('alert')).toHaveTextContent('корректный email');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('показывает ошибку при пустом пароле', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Введите пароль');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('ошибка исчезает при изменении поля', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'a');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('LoginForm — отправка', () => {
  it('вызывает signIn с правильными аргументами', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('перенаправляет на "/" после успешного входа', async () => {
    mockSignIn.mockResolvedValue(undefined);
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('показывает ошибку от signIn', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid login credentials'));
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid login credentials')
    );
  });

  it('блокирует кнопку во время загрузки', async () => {
    mockSignIn.mockImplementation(() => new Promise((r) => setTimeout(r, 500)));
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(screen.getByRole('button', { name: 'Входим...' })).toBeDisabled();
  });
});
