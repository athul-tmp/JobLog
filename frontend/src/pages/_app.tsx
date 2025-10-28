import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Head from "next/head";
import { useTheme } from "@/hooks/useTheme";

export default function App({ Component, pageProps }: AppProps) {
  const theme = useTheme();
  return ( 
    <AuthProvider>
      <Head>{theme === "dark" ? <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> : <link rel="icon" type="image/svg+xml" href="/favicon_light.svg" />}</Head>
      <Component {...pageProps} />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
