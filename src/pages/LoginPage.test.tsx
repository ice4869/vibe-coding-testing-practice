import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '../context/AuthContext';

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAuth = (overrides = {}) => {
    (useAuth as any).mockReturnValue({
      login: vi.fn(),
      isAuthenticated: false,
      authExpiredMessage: '',
      clearAuthExpiredMessage: vi.fn(),
      ...overrides,
    });
  };

  describe('前端元素', () => {
    it('渲染登入表單', () => {
      setupAuth();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByText('歡迎回來')).toBeInTheDocument();
      expect(screen.getByLabelText('電子郵件')).toBeInTheDocument();
      expect(screen.getByLabelText('密碼')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
    });
  });

  describe('function 邏輯', () => {
    it('Email 格式驗證：輸入錯誤格式', async () => {
      setupAuth();
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText('電子郵件');
      await user.type(emailInput, 'invalid-email');

      const submitBtn = screen.getByRole('button', { name: '登入' });
      await user.click(submitBtn);

      expect(screen.getByText('請輸入有效的 Email 格式')).toBeInTheDocument();
      const { login } = useAuth();
      expect(login).not.toHaveBeenCalled();
    });

    it('密碼長度驗證：少於 8 個字元', async () => {
      setupAuth();
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText('電子郵件');
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText('密碼');
      await user.type(passwordInput, 'pwd12');

      const submitBtn = screen.getByRole('button', { name: '登入' });
      await user.click(submitBtn);

      expect(screen.getByText('密碼必須至少 8 個字元')).toBeInTheDocument();
      const { login } = useAuth();
      expect(login).not.toHaveBeenCalled();
    });

    it('密碼複雜度驗證：未包含英數', async () => {
      setupAuth();
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText('電子郵件');
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText('密碼');
      await user.type(passwordInput, '12345678');

      const submitBtn = screen.getByRole('button', { name: '登入' });
      await user.click(submitBtn);

      expect(screen.getByText('密碼必須包含英文字母,eitbrch和數字')).toBeInTheDocument();
      const { login } = useAuth();
      expect(login).not.toHaveBeenCalled();
    });
  });

  describe('Mock API', () => {
    it('登入成功', async () => {
      const loginMock = vi.fn().mockResolvedValue(undefined);
      setupAuth({ login: loginMock });
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText('電子郵件');
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText('密碼');
      await user.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: '登入' });
      await user.click(submitBtn);

      expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password123');
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('登入失敗', async () => {
      const loginMock = vi.fn().mockRejectedValue({
        response: { data: { message: '登入失敗，請稍後再試' } }
      });
      setupAuth({ login: loginMock });
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText('電子郵件');
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText('密碼');
      await user.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: '登入' });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('登入失敗，請稍後再試')).toBeInTheDocument();
      });
    });
  });

  describe('驗證權限', () => {
    it('已登入狀態導向', () => {
      setupAuth({ isAuthenticated: true });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('認證過期提示', () => {
      const clearAuthExpiredMessageMock = vi.fn();
      setupAuth({
        authExpiredMessage: '登入已過期',
        clearAuthExpiredMessage: clearAuthExpiredMessageMock
      });

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      expect(screen.getByText('登入已過期')).toBeInTheDocument();
      expect(clearAuthExpiredMessageMock).toHaveBeenCalled();
    });
  });
});
