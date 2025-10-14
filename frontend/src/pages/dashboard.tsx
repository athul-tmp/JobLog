import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import { JobApplicationService } from "@/services/api"; 
import { DashboardAnalytics } from "@/types/types";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert";

import StageBreakdownChart from "@/components/charts/StageBreakdownChart";
import InterviewOutcomesChart from "@/components/charts/InterviewOutcomesChart";
import InterviewTypesChart from "@/components/charts/InterviewTypesChart";

// Fetch Data 
function useDashboardData() {
  const { token, isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if logged in
    if (isAuthenticated && token) {
      const fetchData = async () => {
        try {
          const stats = await JobApplicationService.getDashboardAnalytics();
          setData(stats);
          
        } catch (err) {
          if (err instanceof Error) {
              setError(err.message);
          } else {
              setError("An unknown error occurred while fetching data.");
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, token]);

  return { data, isLoading, error };
}

export default function DashboardPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();
    const { data: stats, isLoading: isDataLoading, error: dataError } = useDashboardData();

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
    
    const isReady = !isDataLoading && stats;

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
                    
                    {/* Error Display */}
                    {dataError && <Alert variant="destructive"><AlertDescription>{dataError}</AlertDescription></Alert>}

                    {/* Data Loading Spinner */}
                    {isDataLoading && (
                       <div className="flex justify-center items-center h-32">
                           <p className="text-lg text-muted-foreground">Loading data...</p>
                           <Spinner/>
                       </div>
                    )}

                    {isReady && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                
                                {/* Total Applied Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Applications</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.totalApplications}</div>
                                        <p className="text-xs text-foreground mt-1">Total jobs applied to</p>
                                    </CardContent>
                                </Card>

                                {/* Total Pending Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Applied</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-500">{stats.totalPending}</div>
                                        <p className="text-xs text-foreground mt-1">Applied but pending reply</p>
                                    </CardContent>
                                </Card>

                                {/* Total Interviews Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Interviews</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-primary">{stats.totalInterviews}</div>
                                        <p className="text-xs text-foreground mt-1">Interviews completed but pending reply</p>
                                    </CardContent>
                                </Card>
                                
                                {/* Total Offers Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Offers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-500">{stats.totalOffers}</div>
                                        <p className="text-xs text-foreground mt-1">Successful offers</p>
                                    </CardContent>
                                </Card>

                                {/* Total Ghosted Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Ghosted</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-gray-500">{stats.totalGhosted}</div>
                                        <p className="text-xs text-foreground mt-1">No response after application/interview</p>
                                    </CardContent>
                                </Card>

                                {/* Total Rejections Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Rejections</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-500">{stats.totalRejections}</div>
                                        <p className="text-xs text-foreground mt-1">Rejected after application/interview</p>
                                    </CardContent>
                                </Card>
                                
                            </div>
                            
                            {/* Pie Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Application Breakdown Chart */}
                                <Card className="lg:col-span-1 ring-1 ring-primary/40">
                                    <CardHeader>
                                        <CardTitle>Application Stages Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        <StageBreakdownChart data={stats} />
                                    </CardContent>
                                </Card>

                                {/* Interview Outcomes Chart */}
                                <Card className="lg:col-span-1 ring-1 ring-primary/40">
                                    <CardHeader>
                                        <CardTitle>Interview Outcomes</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        <InterviewOutcomesChart data={stats} /> 
                                    </CardContent>
                                </Card>

                                {/* Interview Types */}
                                <Card className="lg:col-span-1 ring-1 ring-primary/40">
                                    <CardHeader>
                                        <CardTitle>Interview Types</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        <InterviewTypesChart data={stats.interviewTypeBreakdown} /> 
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}