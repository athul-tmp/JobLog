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
import { ArrowUp, ArrowDown } from "lucide-react";

import StageBreakdownChart from "@/components/charts/StageBreakdownChart";
import InterviewOutcomesChart from "@/components/charts/InterviewOutcomesChart";
import InterviewTypesChart from "@/components/charts/InterviewTypesChart";
import DailyTrendChart from "@/components/charts/DailyTrendChart";
import SankeyChart from "@/components/charts/SankeyChart";

// Fetch Data 
function useDashboardData() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if logged in
    if (isAuthenticated) {
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
  }, [isAuthenticated]);

  return { data, isLoading, error };
}

export default function DashboardPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();
    const { data: stats, isLoading: isDataLoading, error: dataError } = useDashboardData();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/");
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

    // Variables for retrieving month data 
    const monthlyTrendArray = stats?.monthlyTrend ?? [];
    const monthlyTrendLength = monthlyTrendArray.length;

    const currentMonthData = monthlyTrendLength > 0 ? monthlyTrendArray[monthlyTrendLength - 1] : null;
    const previousMonthData = monthlyTrendLength > 1 ? monthlyTrendArray[monthlyTrendLength - 2] : null;

    const currentMonthName = currentMonthData?.monthYear ?? 'Current Month';
    const previousMonthName = previousMonthData?.monthYear ?? 'Previous Month';
    const currentMonthCount = currentMonthData?.count ?? 0;
    const previousMonthCount = previousMonthData?.count ?? 0;

    // Monthly Increase Calculation 
    const MonthlyIncrease = previousMonthCount > 0
        ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100
        : currentMonthCount > 0 ? 100 : 0;

    const MonthlyTrendIcon = MonthlyIncrease > 0 ? ArrowUp : ArrowDown;
    const monthlyColor = MonthlyIncrease > 0 ? "text-green-600" : "text-red-600";
    

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
                                        <div className="text-2xl font-bold text-primary">{stats.totalApplications}</div>
                                        <p className="text-xs text-foreground mt-1">Total jobs applied to</p>
                                    </CardContent>
                                </Card>

                                {/* Total Pending Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Applied</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
                                        <p className="text-xs text-foreground mt-1">Applied but pending reply</p>
                                    </CardContent>
                                </Card>

                                {/* Total Interviews Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Interviews</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">{stats.totalInterviews}</div>
                                        <p className="text-xs text-foreground mt-1">Interviews completed but pending reply</p>
                                    </CardContent>
                                </Card>
                                
                                {/* Total Offers Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Offers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">{stats.totalOffers}</div>
                                        <p className="text-xs text-foreground mt-1">Successful offers</p>
                                    </CardContent>
                                </Card>

                                {/* Total Ghosted Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Ghosted</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-gray-600">{stats.totalGhosted}</div>
                                        <p className="text-xs text-foreground mt-1">No response after application/interview</p>
                                    </CardContent>
                                </Card>

                                {/* Total Rejections Card */}
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle>Total Rejections</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">{stats.totalRejections}</div>
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
                                        <CardTitle>All Interview Outcomes</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        <InterviewOutcomesChart data={stats} /> 
                                    </CardContent>
                                </Card>

                                {/* Interview Types */}
                                <Card className="lg:col-span-1 ring-1 ring-primary/40">
                                    <CardHeader>
                                        <CardTitle>Active Interview Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="h-[300px] flex items-center justify-center">
                                        <InterviewTypesChart data={stats.interviewTypeBreakdown} /> 
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Daily Trend Chart  */}
                            <div className="grid grid-cols-1">
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader>
                                        <CardTitle>Daily Application Trend ({currentMonthName})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] mb-4">
                                            <DailyTrendChart 
                                                data={stats.applicationsPerDay} 
                                            />
                                        </div>
                                        
                                        {/* Comparison Text Summary with Percentage  */}
                                        <div className="text-sm text-muted-foreground pt-2 border-t border-border flex flex-col gap-2">
                                        
                                            
                                            {/* Current Month Total & Percentage Change */}
                                            <div className="flex justify-between items-baseline">
                                                <p className="text-base font-medium">
                                                    {currentMonthName} Total: 
                                                    <span className="font-bold text-foreground ml-1">{currentMonthCount}</span> applications
                                                </p>
                                                {/* Display the Monthly Increase/Decrease if theres enough data */}
                                                {(currentMonthCount > 0 || previousMonthCount > 0) && (
                                                <p className={`text-base font-semibold flex items-center ${monthlyColor}`}>
                                                    <MonthlyTrendIcon className="w-4 h-4 mr-1" />
                                                    {MonthlyIncrease.toFixed(0)}% vs. {previousMonthName}
                                                </p>
                                                )}
                                            </div>
                                            
                                            {/* Previous Month Total (for reference) */}
                                            <p className="text-xs text-foreground/80">
                                                {previousMonthName} Total: <span className="font-semibold">{previousMonthCount}</span> applications
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* All Outcomes Sankey Chart */}
                            <div className="grid grid-cols-1">
                                <Card className="ring-1 ring-primary/40">
                                    <CardHeader>
                                        <CardTitle>All Past Applications Flow</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <SankeyChart data={stats} />
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