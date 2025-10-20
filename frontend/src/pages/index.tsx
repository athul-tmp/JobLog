import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react"; 

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { isAuthenticated, authLoading } = useAuth();
  const router = useRouter();

  // Redirect Logic
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-foreground">
        <p className="text-xl">Loading Session...</p>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>JobLog</title>
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          <section className="container mx-auto h-[calc(100vh-64px-64px)] flex items-center justify-center text-center p-6 bg-background">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-foreground leading-tight">
                Stay Organised
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 block">
                  Throughout Your Job Hunt.
                </span>
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                JobLog helps you stay organised and focused while you apply for jobs. 
                Track every application, stay on top of interviews, and turn your job search into a clear, data-driven journey.
              </p>
              
              <div className="mt-10 flex justify-center space-x-4">
                <Link href="/register" passHref>
                  <Button size="lg" className="h-12 text-lg px-8 shadow-lg transition duration-200 cursor-pointer">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login" passHref>
                  <Button size="lg" variant="outline" className="h-12 text-lg px-8 border-border transition duration-200 cursor-pointer">
                    Log In
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
}