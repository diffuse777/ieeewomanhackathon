import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearAdminToken, getAdminToken, setAdminToken } from '../utils/authStorage';
import { getCurrentAdmin, loginAdmin, logoutAdmin } from '../services/adminAuthService';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => getAdminToken());
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    function onExpired() {
      clearAdminToken();
      setToken(null);
      setAdmin(null);
    }

    window.addEventListener('admin-auth-expired', onExpired);
    return () => window.removeEventListener('admin-auth-expired', onExpired);
  }, []);

  const value = useMemo(() => {
    async function login(credentials) {
      const result = await loginAdmin(credentials);
      const nextToken = result.data?.token;
      if (!nextToken) {
        throw new Error('Login did not return a session token.');
      }
      setAdminToken(nextToken);
      setToken(nextToken);
      setAdmin(result.data.admin || null);
      return result.data;
    }

    async function logout() {
      try {
        if (getAdminToken()) {
          await logoutAdmin();
        }
      } finally {
        clearAdminToken();
        setToken(null);
        setAdmin(null);
      }
    }

    async function refresh() {
      if (!getAdminToken()) {
        setAdmin(null);
        return null;
      }
      try {
        const result = await getCurrentAdmin();
        setAdmin(result.data || null);
        return result.data;
      } catch (error) {
        if (error?.status === 401) {
          clearAdminToken();
          setToken(null);
          setAdmin(null);
          return null;
        }
        throw error;
      }
    }

    return {
      token,
      admin,
      isAuthenticated: Boolean(token),
      login,
      logout,
      refresh,
    };
  }, [token, admin]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
