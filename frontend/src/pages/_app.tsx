import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Head from "next/head";
import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect, useState } from "react";

function FaviconUpdater() {
  const { resolvedTheme } = useTheme(); 
  
  const [faviconUrl, setFaviconUrl] = useState('');
  
  useEffect(() => {
    if (resolvedTheme) {
      const newUrl = resolvedTheme === 'dark' ? '/favicon.svg' : '/favicon_light.svg';
      setFaviconUrl(newUrl);
    }
  }, [resolvedTheme]);


  return (
    <Head>
      {faviconUrl && (
        <link 
          rel="icon" 
          type="image/svg+xml" 
          href={faviconUrl} 
          key="dynamic-favicon"
        />
      )}
    </Head>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return ( 
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <FaviconUpdater />
      <Component {...pageProps} />
      </ThemeProvider>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
