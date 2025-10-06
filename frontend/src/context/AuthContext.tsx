import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, LoginResponse } from "@/types/types"; 
import { AuthService } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for localStorage keys
const TOKEN_KEY = "joblog_jwt_token";
const USER_KEY = "joblog_user_data";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true); 
  
  const isAuthenticated = !!token;

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY); 

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        logout();
      }
    }
    setAuthLoading(false);
  }, []);

  // Login method to set session data
  const login = async (email: string, password: string): Promise<void> => {
    setAuthLoading(true);
    try {
      const response: LoginResponse = await AuthService.login(email, password);

      const userData: AuthUser = {
        userId: response.userId,
        email: response.email,
      };

      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      setToken(response.token);
      setUser(userData);

    } catch (error) {
      console.error("Login attempt failed:", error);
      throw error; 
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout method to clear session data
  const logout = () => {
    setAuthLoading(true);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setAuthLoading(false);
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    authLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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