import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react"; 

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ScreenshotCarousel } from "@/components/ScreenshotCarousel";

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
          {/* Two-column layout */}
          <section className="container mx-auto flex-1 flex items-center justify-center text-center p-6 bg-background py-16">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center text-left">
                
                {/* Left Column: Text */}
                <div className="space-y-6 mx-auto md:order-1 order-2 md:text-left text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground leading-tight">
                        Stay Organised
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 block">
                            Throughout Your Job Hunt.
                        </span>
                    </h1>
                    
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        JobLog helps you stay organised and focused while you apply for jobs. 
                        Track every application, stay on top of interviews, and turn your job search into a clear, data-driven journey.
                    </p>
                    
                    <div className="mt-8 flex justify-center md:justify-start space-x-4">
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

                {/* Right Column: Images */}
                <div className="w-full md:order-2 order-1">
                    <ScreenshotCarousel />
                </div>

            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  );
}