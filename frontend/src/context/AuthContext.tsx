import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthUser, LoginResponse } from "@/types/types"; 
import { AuthService, setLogoutHandler } from "@/services/api";

// Demo account credentials
const DEMO_EMAIL = "demo@joblog.com";
const DEMO_PASSWORD = "DemoPassword123!";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  refreshUser: (updates: Partial<AuthUser>) => void;
  demoEmail: string;
  demoPassword: string;
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
            
        const isDemoUser = parsedUser.email === DEMO_EMAIL;
        parsedUser.isDemo = isDemoUser;
        
        // Check if the demo session has expired locally
        if (isDemoUser && parsedUser.expiresAt && parsedUser.expiresAt <= Date.now()) {
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

  // Login method to set session data
  const login = async (email: string, password: string): Promise<string | null> => {
    setAuthLoading(true);
    try {
      const response: LoginResponse = await AuthService.login(email, password);

      const isDemoUser = email === DEMO_EMAIL;
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
    logout,
    isAuthenticated,
    authLoading,
    refreshUser,
    demoEmail: DEMO_EMAIL,
    demoPassword: DEMO_PASSWORD,
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