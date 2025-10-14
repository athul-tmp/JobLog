import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation"; 
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react"; 

export default function TrackerPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);
    
    // Show loading state when logging out
    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen bg-background text-foreground">
                <Spinner className="size-15"/>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Application Tracker | JobLog</title>
            </Head>
            <Header />
            
            <main className="container mx-auto p-4 sm:p-8 min-h-[calc(100vh-128px)]">
                <DashboardNavigation currentPath={router.pathname} />

                <div className="space-y-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                            Application Tracker
                        </h1>
                        <Button className="text-base shadow-md">
                            + Add New Application
                        </Button>
                    </div>

                    {/* Placeholder for Table */}
                    <Card className="ring-1 ring-primary/40">
                        <CardContent className="pt-6">
                            <div className="p-4 border border-border rounded-lg min-h-[300px] flex items-center justify-center dark:bg-card">
                                <p className="text-muted-foreground">Table goes here</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </>
    );
}