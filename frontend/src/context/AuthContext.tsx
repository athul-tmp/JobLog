import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthUser, LoginResponse } from "@/types/types"; 
import { AuthService, setLogoutHandler } from "@/services/api";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<string | null>;
  startDemo: () => Promise<string | null>;
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

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem(USER_KEY); 
    let loadedUser: AuthUser | null = null;

    if (storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        
        // Check if the demo session has expired locally
        if (parsedUser.isDemo && parsedUser.expiresAt && parsedUser.expiresAt <= Date.now()) {
            localStorage.removeItem(USER_KEY);
        } else {
            loadedUser = parsedUser;
        }
      } catch (e) {
        console.error("Failed to parse user data from localStorage:", e);
        localStorage.removeItem(USER_KEY);
      }
    }
    
    setUser(loadedUser);
  };

  useEffect(() => {
    loadUserFromStorage();
    setAuthLoading(false);

    // Cross-tab synchronisation
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_KEY) {
        loadUserFromStorage(); 
        console.log(`Auth state updated via storage event. New state: ${event.newValue ? 'Authenticated' : 'Logged Out'}`);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    
  }, []);

  // Starts a session from a login or demo response
  const startSession = async (request: () => Promise<LoginResponse>): Promise<string | null> => {
    setAuthLoading(true);
    try {
      const response: LoginResponse = await request();

      const isDemoUser = response.isDemo === true;
      let expiresAt: number | undefined = undefined;

      if (isDemoUser && response.tokenExpiration) {
          // Convert ISO string from backend into a timestamp 
          expiresAt = new Date(response.tokenExpiration).getTime();
      }

      const userData: AuthUser = {
        firstName: response.firstName,
        email: response.email,
        isDemo: isDemoUser,
        expiresAt: expiresAt,
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

  // Login method to set session data
  const login = (email: string, password: string) => startSession(() => AuthService.login(email, password));

  // Starts a private demo session with its own sample data
  const startDemo = () => startSession(() => AuthService.startDemo());

  // Logout method to clear session data and call the backend to clear the HttpOnly cookie
  const logout = useCallback(() => {
    setAuthLoading(true);
    localStorage.removeItem(USER_KEY);
    AuthService.logout();
    setUser(null);
    setAuthLoading(false);
  }, [setAuthLoading, setUser]);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

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
    startDemo,
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