import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner"
import { ArrowUp, ArrowDown } from "lucide-react"; 

// Placeholder Data for UI demo
const DUMMY_STATS = {
    TotalApplications: 45,
    TotalInterviews: 12,
    TotalRejections: 18,
    ApplicationsPending: 15,
    TotalOffers: 2,
    MonthlyIncrease: 20
};

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
    
    // TODO: Replace with actual data 
    const stats = DUMMY_STATS; 
    const MonthlyTrendIcon = stats.MonthlyIncrease > 0 ? ArrowUp : ArrowDown;
    const monthlyColor = stats.MonthlyIncrease > 0 ? "text-green-500" : "text-red-500";

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
                    
                    {/* Total Overview Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        
                        <Card className="ring-1 ring-primary/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Applied</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.TotalApplications}</div>
                                <p className={`text-xs ${monthlyColor} flex items-center mt-1`}>
                                    <MonthlyTrendIcon className="w-4 h-4 mr-1" />
                                    {stats.MonthlyIncrease > 0 ? `+${stats.MonthlyIncrease}` : stats.MonthlyIncrease}% vs. last month
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="ring-1 ring-primary/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Applications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.ApplicationsPending}</div>
                                <p className="text-xs text-muted-foreground mt-1">Jobs awaiting first contact</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="ring-1 ring-primary/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Interviews</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">{stats.TotalInterviews}</div>
                                <p className="text-xs text-muted-foreground mt-1">OA, Interview, Final Stages</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="ring-1 ring-primary/40">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Rejections</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">{stats.TotalRejections}</div>
                                <p className="text-xs text-muted-foreground mt-1">Including interviewed/rejected</p>
                            </CardContent>
                        </Card>
                        
                    </div>
                    
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-1 ring-1 ring-primary/40">
                            <CardHeader>
                                <CardTitle>Current Status Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center">
                                <p className="text-muted-foreground">Pie Chart (Charts.js)</p>
                            </CardContent>
                        </Card>

                        {/* Monthly Trend Chart Placeholder */}
                        <Card className="lg:col-span-2 ring-1 ring-primary/40">
                            <CardHeader>
                                <CardTitle>Application Trend (Last 2 Months)</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center">
                                <p className="text-muted-foreground">Line Chart (Charts.js)</p>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </main>

            <Footer />
        </>
    );
}