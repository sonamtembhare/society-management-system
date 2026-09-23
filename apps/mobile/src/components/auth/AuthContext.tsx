import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../../types";
import { authService } from "../../services";
import { storage } from "../../utils";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = await storage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const response = await authService.getMe();
      if (response.success && response.data) {
        setUser(response.data as User);
      } else {
        await storage.clear();
      }
    } catch {
      await storage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    if (response.success && response.data) {
      const { user: userData, token } = response.data as { user: User; token: string };
      await storage.setToken(token);
      await storage.setUser(userData);
      setUser(userData);
    } else {
      throw new Error(response.message || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const response = await authService.register({ name, email, password, role });
    if (response.success && response.data) {
      const { user: userData, token } = response.data as { user: User; token: string };
      await storage.setToken(token);
      await storage.setUser(userData);
      setUser(userData);
    } else {
      throw new Error(response.message || "Registration failed");
    }
  };

  const logout = async () => {
    await storage.clear();
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
