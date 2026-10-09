import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { JobApplicationService } from "@/services/api"; 
import { DashboardAnalytics } from "@/types/types";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

import DailyTrendChart from "@/components/charts/DailyTrendChart";
import SankeyChart from "@/components/charts/SankeyChart";
import JobBoardChart from "@/components/charts/JobBoardChart";
import NeedsAttentionList from "@/components/dashboard/NeedsAttentionList";
import ResponseTimeSummary from "@/components/dashboard/ResponseTimeSummary";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import { DemoAlert } from "@/components/DemoAlert";

// Fetch Data 
function useDashboardData() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const stats = await JobApplicationService.getDashboardAnalytics();
      setData(stats);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
          setError(err.message);
      } else {
          setError("An unknown error occurred while fetching data.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if logged in
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Re-fetch in the background (e.g. after acting on a "Needs attention" item)
  return { data, isLoading, error, refresh: fetchData };
}

export default function DashboardPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();
    const { data: stats, isLoading: isDataLoading, error: dataError, refresh } = useDashboardData();

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, authLoading, router]);
    
    // Show loading state when logging out / data loading
    if (authLoading || !isAuthenticated || isDataLoading) {
        return <LoadingScreen />;
    }
    
    const isReady = !isDataLoading && stats;

    // Variables for retrieving month data 
    const realTimeMonth = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
    });

    const monthlyTrendArray = stats?.monthlyTrend ?? [];
    const lastEntry = monthlyTrendArray[monthlyTrendArray.length - 1];

    // Check if the database's latest entry matches the real-world month
    const isDataUpToDate = lastEntry?.monthYear === realTimeMonth;

    // If the DB is up to date, use the last entry. Otherwise, it's 0 apps for this month.
    const currentMonthCount = isDataUpToDate ? lastEntry.count : 0;
    const currentMonthName = realTimeMonth;

    // If the DB is up to date, the previous month is the 2nd to last item.
    // If the DB hasn't started this month yet, the "lastEntry" is the previous month.
    const previousMonthData = isDataUpToDate 
        ? (monthlyTrendArray[monthlyTrendArray.length - 2] ?? null)
        : lastEntry;

    const previousMonthCount = previousMonthData?.count ?? 0;
    const previousMonthName = previousMonthData?.monthYear ?? 'Previous Month';

    // Compare this month so far against the same days of last month (dates are UTC, like the backend)
    const now = new Date();
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const comparedDays = stats?.previousMonthToDateDays ?? now.getUTCDate(); // from the backend, which owns "today"
    const comparisonLabel = `${previousMonthStart.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })} 1–${comparedDays}`;
    const previousMonthToDateCount = stats?.previousMonthToDateCount ?? 0;

    // Month-to-date comparison as a plain difference in applications (percentages swing wildly on small counts)
    const monthlyDifference = currentMonthCount - previousMonthToDateCount;
    const MonthlyTrendIcon = monthlyDifference > 0 ? ArrowUp : monthlyDifference < 0 ? ArrowDown : Minus;
    const monthlyColor = monthlyDifference > 0 ? "text-green-600" : "text-muted-foreground"; // fewer isn't shown as a failure
    const monthlyComparison = monthlyDifference > 0
        ? `${monthlyDifference} more than ${comparisonLabel} (${previousMonthToDateCount})`
        : monthlyDifference < 0
            ? `${-monthlyDifference} fewer than ${comparisonLabel} (${previousMonthToDateCount})`
            : `Same as ${comparisonLabel} (${previousMonthToDateCount})`;
    
    return (
        <>
            <Head>
                <title>Dashboard | JobLog</title>
            </Head>
            <Header />
            
            <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[calc(100vh-128px)]">
                <DashboardNavigation currentPath={router.pathname} />
                <DemoAlert />
                {/* Dashboard Content for Analytics */}
                <div className="space-y-8">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-center sm:text-left">
                        Dashboard
                    </h1>
                    
                    {/* Error Display */}
                    {dataError && <Alert variant="destructive"><AlertDescription>{dataError}</AlertDescription></Alert>}

                    {/* First-time users: a getting-started card instead of empty stats and charts */}
                    {isReady && stats.totalApplications === 0 && <WelcomeCard />}

                    {isReady && stats.totalApplications > 0 && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                
                                {/* Total Applications Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm sm:text-base">Total Applications</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl sm:text-2xl font-bold text-primary dark:text-purple-400">{stats.totalApplications}</div>
                                        <p className="text-xs text-foreground mt-1">Total jobs applied to</p>
                                    </CardContent>
                                </Card>

                                {/* Awaiting Reply Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm sm:text-base">Awaiting Reply</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
                                        <p className="text-xs text-foreground mt-1">Applied, no response yet</p>
                                    </CardContent>
                                </Card>

                                {/* Active Interviews Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm sm:text-base">Active Interviews</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalInterviews}</div>
                                        <p className="text-xs text-foreground mt-1">Currently in the interview process</p>
                                    </CardContent>
                                </Card>
                                
                                {/* Total Offers Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm sm:text-base">Total Offers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalOffers}</div>
                                        <p className="text-xs text-foreground mt-1">Successful offers</p>
                                    </CardContent>
                                </Card>

                                {/* Total Ghosted Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm sm:text-base">Total Ghosted</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.totalGhosted}</div>
                                        <p className="text-xs text-foreground mt-1">No response after application/interview</p>
                                    </CardContent>
                                </Card>

                                {/* Total Rejections Card */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm sm:text-base">Total Rejections</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalRejections}</div>
                                        <p className="text-xs text-foreground mt-1">Rejected after application/interview</p>
                                    </CardContent>
                                </Card>
                                
                            </div>
                            
                            {/* Applications Flow (Sankey) */}
                            <div className="grid grid-cols-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm sm:text-base text-center sm:text-left">Applications Flow</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <SankeyChart data={stats.applicationFlow} />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Needs Attention + Job Boards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm sm:text-base text-center sm:text-left">
                                            Needs Attention{stats.needsAttention.length > 0 && ` (${stats.needsAttention.length})`}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-0 flex flex-col">
                                        <NeedsAttentionList items={stats.needsAttention} onChanged={refresh} />
                                    </CardContent>
                                </Card>

                                <div className="flex flex-col gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm sm:text-base text-center sm:text-left">Job Boards</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <JobBoardChart data={stats.sources} />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-sm sm:text-base text-center sm:text-left">Response Time</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponseTimeSummary data={stats.responseTimes} />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Daily Trend Chart  */}
                            <div className="grid grid-cols-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm sm:text-base text-center sm:text-left">Daily Application Trend ({currentMonthName})</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px] sm:h-[300px] mb-4">
                                            <DailyTrendChart 
                                                data={stats.applicationsPerDay} 
                                            />
                                        </div>
                                        
                                        {/* Comparison Text Summary with Percentage  */}
                                        <div className="text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border flex flex-col gap-2">
                                            {/* Current Month Total & Percentage Change */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
                                                <p className="text-base font-medium">
                                                    {currentMonthName} Total: 
                                                    <span className="font-bold text-foreground ml-1">{currentMonthCount}</span> applications
                                                </p>
                                                {/* Difference vs. the same days of last month, if there is any data */}
                                                {(currentMonthCount > 0 || previousMonthToDateCount > 0) && (
                                                <p className={`font-semibold flex items-center ${monthlyColor}`}>
                                                    <MonthlyTrendIcon className="w-4 h-4 mr-1" />
                                                    {monthlyComparison}
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
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}