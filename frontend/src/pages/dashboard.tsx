import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; 

// Component to handle navigation between Dashboard and JobBoard
function DashboardNavigation({ currentPath }: { currentPath: string }) {
    const router = useRouter();

    const navigate = (value: string) => {
        router.push(value === 'dashboard' ? '/dashboard' : '/tracker');
    };

    // Determine the current active tab based on the path
    const activeTab = currentPath.includes('tracker') ? 'tracker' : 'dashboard';

    return (
        <div className="flex justify-center my-8">
            <Tabs value={activeTab} onValueChange={navigate}>
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="tracker">Tracker</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}

export default function DashboardPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);
    
    // Show loading state or nothing while session check is pending
    if (authLoading || !isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen bg-background text-foreground">
                <p className="text-xl">Checking session...</p>
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