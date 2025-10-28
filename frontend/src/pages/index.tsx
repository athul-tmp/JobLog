import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react"; 

import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ScreenshotCarousel } from "@/components/ScreenshotCarousel";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

export default function LandingPage() {
  const { isAuthenticated, authLoading, login, demoEmail, demoPassword } = useAuth();
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
        <Spinner className="size-15"/>
      </div>
    );
  }

  // Auto-login handler for the demo
  const handleDemoLogin = async () => {
    const errorMessage = await login(demoEmail, demoPassword);

    if (errorMessage) {
        toast.error("Demo Login Failed", {
            description: errorMessage,
        });
        return; 
    }
    // Success redirects to /dashboard
    router.push("/dashboard");
  };
  
  return (
    <>
      <Head>
        <title>JobLog</title>
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          {/* Two-column layout */}
          <section className="container mx-auto flex-1 flex items-center justify-center text-center p-6 bg-background lg:py-25">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center text-left">
                
                {/* Left Column: Text */}
                <div className="space-y-6 mx-auto md:order-1 order-2 md:text-left text-center">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter text-foreground leading-tight">
                        Stay Organised
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 block">
                            Throughout Your Job Hunt.
                        </span>
                    </h1>
                    
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        JobLog is a job application tracker with detailed analytics that helps you stay organised and focused while you apply for jobs. 
                        Track every application, stay on top of interviews, and turn your job search into a clear, data-driven journey.
                    </p>
                    
                    <div className="mt-8 flex justify-center md:justify-start space-x-4">
                        <Link href="/register" passHref>
                            <Button size="lg" className="h-12 text-lg px-8 shadow-lg transition duration-200 cursor-pointer">
                                Get Started
                            </Button>
                        </Link>
                        <Button 
                            size="lg" 
                            variant="outline" 
                            className="h-12 text-lg px-8 border-border transition duration-200 cursor-pointer"
                            onClick={handleDemoLogin}
                            disabled={authLoading}
                        >
                            Try Demo
                            <ArrowUpRight className="ml-2 h-5 w-5" />
                        </Button>
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