import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button'; 
import { Moon, Sun, LogOut } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const THEME_KEY = "joblog-theme";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isMounted, setIsMounted] = useState(false);

  // Theme Loading
  useEffect(() => {
    setIsMounted(true); 
    // Check local storage for saved preference
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme) {
      setTheme(storedTheme as 'light' | 'dark');
    }
  }, []);

  // Theme Application
  useEffect(() => {
    if (!isMounted) return; 

    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    localStorage.setItem(THEME_KEY, theme);

  }, [theme, isMounted]); 

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };
  
  // Theme Toggle Button
  const ThemeToggleButton = (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      className="text-foreground/80 hover:text-primary transition duration-200"
      aria-label="Toggle dark mode"
      // Show Moon icon if current theme is dark, Sun if light
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Navigation for logo*/}
        {isAuthenticated ? (
          <>
            {/* Authenticated State */}
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              JobLog 
            </span>
          </>
        ) : (
          <>
            {/* Unauthenticated State */}
            <Link href="/" className="text-3xl font-extrabold tracking-tight text-foreground">
              JobLog
            </Link>
          </>
        )}

        {/* Navigation */}
        <nav className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              {/* Authenticated State */}
              {ThemeToggleButton}
              
              <Button onClick={logout} variant="link" className="text-foreground/80 text-base hover:text-primary"> 
                Log Out
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {/* Unauthenticated State */}
              {ThemeToggleButton}

              <Link href="/login" passHref>
                <Button variant="link" className="text-foreground/80 text-base hover:text-primary">
                  Log In
                </Button>
              </Link>
              <Link href="/register" passHref>
                <Button variant="link" className="text-foreground/80 text-base hover:text-primary"> 
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}