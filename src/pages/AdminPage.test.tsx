import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AdminPage } from './AdminPage';
import { useAuth } from '../context/AuthContext';

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

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAuth = (userOverrides = {}) => {
    (useAuth as any).mockReturnValue({
      user: { role: 'admin', username: 'admin', ...userOverrides },
      logout: vi.fn(),
    });
  };

  describe('前端元素', () => {
    it('渲染管理員頁面', () => {
      setupAuth();
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
      
      expect(screen.getByText('← 返回')).toBeInTheDocument();
      expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '登出' })).toBeInTheDocument();
      expect(screen.getByText('管理員專屬頁面')).toBeInTheDocument();
    });

    it('根據角色顯示不同 Badge', () => {
      // Admin case
      setupAuth({ role: 'admin' });
      const { unmount } = render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
      expect(screen.getByText('管理員')).toBeInTheDocument();
      unmount();

      // User case
      setupAuth({ role: 'user' });
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
      expect(screen.getByText('一般用戶')).toBeInTheDocument();
    });
  });

  describe('function 邏輯', () => {
    it('點擊登出按鈕', async () => {
      setupAuth();
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      );
      
      const logoutBtn = screen.getByRole('button', { name: '登出' });
      await user.click(logoutBtn);
      
      const { logout } = useAuth();
      expect(logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
    });
  });
});
