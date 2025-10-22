import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, LoginResponse } from "@/types/types"; 
import { AuthService } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  refreshUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for localStorage keys
const USER_KEY = "joblog_user_data";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true); 
  
  const isAuthenticated = !!user;

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY); 

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        localStorage.removeItem(USER_KEY);
      }
    }
    setAuthLoading(false);
  }, []);

  // Login method to set session data
  const login = async (email: string, password: string): Promise<string | null> => {
    setAuthLoading(true);
    try {
      const response: LoginResponse = await AuthService.login(email, password);

      const userData: AuthUser = {
        firstName: response.firstName,
        email: response.email,
      };

      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      
      setUser(userData);
      
      return null; 

    } catch (error) {
      console.error("Login attempt failed:", error);
      
      if (typeof error === 'string') {
        return error; 
      }
      return "An unknown error occurred."; 
      
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout method to clear session data and call the backend to clear the HttpOnly cookie
  const logout = () => {
    setAuthLoading(true);
    localStorage.removeItem(USER_KEY);
    AuthService.logout();
    setUser(null);
    setAuthLoading(false);
  };

  // Function to refresh stored user
  const refreshUser = (updates: Partial<AuthUser>) => {
      setUser(currentUser => {
          if (!currentUser) return null;

          const updatedUser = { ...currentUser, ...updates };
          localStorage.setItem(USER_KEY, JSON.stringify(updatedUser)); 

          return updatedUser;
      });
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    authLoading,
    refreshUser,
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