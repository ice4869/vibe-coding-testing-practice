import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { DashboardPage } from './DashboardPage';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../api/productApi';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../api/productApi', () => ({
  productApi: {
    getProducts: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAuth = (userOverrides = {}) => {
    (useAuth as any).mockReturnValue({
      user: { role: 'user', username: 'John', ...userOverrides },
      logout: vi.fn(),
    });
  };

  const mockGetProducts = (mockPromise: Promise<any>) => {
    (productApi.getProducts as any).mockReturnValue(mockPromise);
  };

  describe('前端元素', () => {
    it('渲染儀表板頁面與使用者名稱', async () => {
      setupAuth();
      mockGetProducts(new Promise(() => {})); // pending promise
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      expect(screen.getByText('Welcome, John 👋')).toBeInTheDocument();
      expect(screen.getByText('一般用戶')).toBeInTheDocument();
    });

    it('管理員角色顯示後台連結', async () => {
      setupAuth({ role: 'admin' });
      mockGetProducts(new Promise(() => {}));
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      expect(screen.getByText('🛠️ 管理後台')).toBeInTheDocument();
    });

    it('一般用戶不顯示後台連結', async () => {
      setupAuth({ role: 'user' });
      mockGetProducts(new Promise(() => {}));
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      expect(screen.queryByText('🛠️ 管理後台')).not.toBeInTheDocument();
    });
  });

  describe('function 邏輯', () => {
    it('點擊登出按鈕', async () => {
      setupAuth();
      mockGetProducts(new Promise(() => {}));
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      const logoutBtn = screen.getByRole('button', { name: '登出' });
      await user.click(logoutBtn);
      
      const { logout } = useAuth();
      expect(logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: null });
    });
  });

  describe('Mock API', () => {
    it('初始載入商品中', async () => {
      setupAuth();
      mockGetProducts(new Promise(() => {}));
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      expect(screen.getByText('載入商品中...')).toBeInTheDocument();
    });

    it('商品載入成功', async () => {
      setupAuth();
      mockGetProducts(Promise.resolve([
        { id: 1, name: '測試商品', description: '這是測試描述', price: 100 }
      ]));
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('測試商品')).toBeInTheDocument();
      });
      expect(screen.getByText('這是測試描述')).toBeInTheDocument();
      expect(screen.getByText('NT$ 100')).toBeInTheDocument();
    });

    it('商品載入失敗', async () => {
      setupAuth();
      mockGetProducts(Promise.reject({
        response: { data: { message: '伺服器錯誤' } }
      }));
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('伺服器錯誤')).toBeInTheDocument();
      });
    });

    it('Token 過期 (401 錯誤)', async () => {
      setupAuth();
      mockGetProducts(Promise.reject({
        response: { status: 401, data: { message: 'Unauthorized' } }
      }));
      
      render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.queryByText('載入商品中...')).not.toBeInTheDocument();
      });
      expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
      expect(screen.queryByText('無法載入商品資料')).not.toBeInTheDocument();
    });
  });
});
