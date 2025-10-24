import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";

// Helper function to format milliseconds into MM:SS
const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const DemoAlert = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  // Initialise time and track user change (e.g., on login)
  useEffect(() => {
    if (user?.isDemo && user.expiresAt) {
        const initialTime = user.expiresAt - Date.now();
        setTimeLeftMs(initialTime);
    } else {
        setTimeLeftMs(0);
    }
  }, [user]);

  // Function to handle manual/automatic logout
  const handleLogout = useCallback(() => {
    logout(); 
    router.push("/");
  }, [logout, router]);

  // Countdown Effect
  useEffect(() => {
    if (!user?.isDemo || !user.expiresAt) {
        return;
    }

    const interval = setInterval(() => {
        const remaining = user.expiresAt! - Date.now();
        
        if (remaining <= 1000) { 
            clearInterval(interval);
            setTimeLeftMs(0);
            handleLogout(); // Auto-logout
        } else {
            setTimeLeftMs(remaining);
        }
    }, 1000); 

    return () => clearInterval(interval);

  }, [user, handleLogout]); 

  if (!user?.isDemo) {
    return null;
  }

  const timeLeftText = formatTime(timeLeftMs);
  const isExpired = timeLeftMs <= 1000;
  const logoutText = isExpired ? "Session Expired. Logging out..." : "Log Out Demo";

  return (
    <Alert className="mb-6 bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-600 flex justify-between items-center p-4">
      <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-blue-700 dark:text-blue-300" />
          <AlertDescription className="text-blue-700 dark:text-blue-300 font-medium">
              You are on the Demo Account. Feel free to explore all features. Please note that data is shared; you may see applications added or changed by other users demoing at the same time. All changes will be automatically reset when a new session starts. <strong>Your session expires in {timeLeftText}</strong>
          </AlertDescription>
      </div>
      <Button 
          onClick={handleLogout} 
          variant="link" 
          className="ml-4 flex-shrink-0 text-bg"
          disabled={isExpired} 
      >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutText}
      </Button>
    </Alert>
  );
};