import React, { createContext, useCallback, useContext, useState } from 'react';
import { API_URL } from '../constants';

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  linkedBank: boolean;
  role?: 'user' | 'admin' | 'restaurant';
  restaurantId?: number;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  linkBank: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Lỗi đăng nhập' };
      }
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Không thể kết nối đến máy chủ.' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await response.json();
      if (!data.success) {
        return { success: false, error: data.error || 'Lỗi đăng ký' };
      }
      setUser(data.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Không thể kết nối đến máy chủ.' };
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const linkBank = useCallback(() => {
    if (user) setUser({ ...user, linkedBank: true });
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAdmin: user?.role === 'admin', login, register, logout, linkBank }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
