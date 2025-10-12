import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 
import { Spinner } from "@/components/ui/spinner"

export default function DashboardPage() {
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
            <div className="flex justify-center items-center h-screen bg-background">
                <Spinner className="size-15"/>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Dashboard | JobLog</title>
            </Head>
            <Header />
            
            <main className="container mx-auto p-4 sm:p-8 min-h-[calc(100vh-128px)]">
                <DashboardNavigation currentPath={router.pathname} />

                {/* Dashboard Content for Analytics */}
                <div className="space-y-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Dashboard
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Placeholder Cards for Key Stats */}
                        <Card className="ring-2 ring-primary/40">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-muted-foreground">Total Applied</CardTitle>
                            </CardHeader>
                            <CardContent className="text-3xl font-bold">
                                0
                            </CardContent>
                        </Card>
                        <Card className="ring-2 ring-primary/40">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-muted-foreground">Total Interviews</CardTitle>
                            </CardHeader>
                            <CardContent className="text-3xl font-bold text-green-500">
                                0
                            </CardContent>
                        </Card>
                         <Card className="ring-2 ring-primary/40">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-muted-foreground">Total Rejections</CardTitle>
                            </CardHeader>
                            <CardContent className="text-3xl font-bold text-red-500">
                                0
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Placeholder for Charts */}
                    <div className="p-4 border border-border rounded-lg h-[400px] flex items-center justify-center ring-2 ring-primary/40 dark:bg-card">
                        <p className="text-muted-foreground">Charts go here</p>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}