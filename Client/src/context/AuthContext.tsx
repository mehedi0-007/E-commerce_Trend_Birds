import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, getAccessToken, setAccessToken, setCsrfToken } from '../api/client';

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface AuthenticatedUser {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  gender?: string;
  avatar?: string;
  active: boolean;
  roleId: string;
  role: UserRole;
  userPermissions: string[];
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionName: string) => boolean;
  canWatch: (moduleName: string) => boolean;
  refetchSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUser = (userData: any): AuthenticatedUser => {
    return {
      ...userData,
      userPermissions: userData.userPermissions || userData.permissions || [],
    };
  };

  const fetchSession = async () => {
    try {
      if (!getAccessToken()) {
        try {
          await apiClient.post('/auth/refresh');
        } catch {
          // If refresh fails, user is unauthenticated
          setUser(null);
          setIsLoading(false);
          return;
        }
      }

      const response = await apiClient.get('/auth/session');
      const payload = response.data?.data || response.data;
      if (payload?.user) {
        setUser(normalizeUser(payload.user));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const payload = response.data?.data || response.data;
      if (payload?.accessToken) {
        setAccessToken(payload.accessToken);
      }
      if (payload?.csrfToken) {
        setCsrfToken(payload.csrfToken);
      }
      if (payload?.user) {
        setUser(normalizeUser(payload.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
    } finally {
      setUser(null);
      setAccessToken(null);
      setCsrfToken(null);
    }
  };

  const hasPermission = (permissionName: string): boolean => {
    if (!user) return false;
    return user.userPermissions?.includes(permissionName) ?? false;
  };

  const canWatch = (moduleName: string): boolean => {
    if (!user) return false;
    const watchPermission = `${moduleName.toLowerCase()}:watch`;
    return user.userPermissions?.includes(watchPermission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        hasPermission,
        canWatch,
        refetchSession: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
