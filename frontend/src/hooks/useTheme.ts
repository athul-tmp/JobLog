import { useState, useEffect } from 'react';

// Returns theme
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); 
  const [isMounted, setIsMounted] = useState(false); 

  useEffect(() => {
    setIsMounted(true);
    
    // Function to check the current theme class
    const checkTheme = () => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    };

    // Initial check
    setTheme(checkTheme());

    // Observer to watch the <html> element for class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check if 'class' attribute was changed
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          setTheme(checkTheme());
        }
      });
    });

    // Observe the <html> tag
    observer.observe(document.documentElement, { attributes: true });

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  // Return a safe default while mounting
  if (!isMounted) return 'dark'; 

  return theme;
};