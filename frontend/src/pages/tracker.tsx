import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation"; 
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react"; 
import { Alert, AlertDescription } from "@/components/ui/alert"; 

import AddJobApplicationDialog from "@/components/AddJobApplicationDialog"; 
import { JobApplicationService } from "@/services/api"; 
import { JobApplication } from "@/types/types"; 

import { JobApplicationTable } from "@/components/JobApplicationTable"; 

// To fetch and manage application data
function useApplicationData() {
    const { token, isAuthenticated } = useAuth();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        if (isAuthenticated && token) {
            setIsLoading(true);
            setError(null);
            try {
                const data = await JobApplicationService.getAllJobApplications();
                // Sort the data by DateApplied desc
                const sortedData = data.sort((a, b) => 
                    new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
                );
                setApplications(sortedData);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unknown error occurred while fetching job applications.");
                }
            } finally {
                setIsLoading(false);
            }
        }
    }, [isAuthenticated, token]);

    // Run fetch once on mount
    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleJobAdded = useCallback((newJob: JobApplication) => {
        // Add the new job to the top of the list 
        setApplications(prev => [newJob, ...prev]);
    }, []);

    return { applications, isLoading, error, handleJobAdded, fetchApplications };
}


export default function TrackerPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();
    const { applications, isLoading: isDataLoading, error: dataError, handleJobAdded } = useApplicationData();

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

    // Only render the main content if authentication and data are ready
    const isReady = !isDataLoading && !authLoading && isAuthenticated;

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
                        <AddJobApplicationDialog onJobAdded={handleJobAdded} /> 
                    </div>

                    {/* Error Display */}
                    {dataError && <Alert variant="destructive"><AlertDescription>{dataError}</AlertDescription></Alert>}

                    {/* Data Loading Spinner */}
                    {isDataLoading && (
                       <div className="flex justify-center items-center h-32">
                           <p className="text-lg text-muted-foreground">Loading applications...</p>
                           <Spinner/>
                       </div>
                    )}
                    
                    {/* Job Applications Table */}
                    {isReady && (
                        <Card className="ring-1 ring-primary/40">
                            <CardContent>
                                {applications.length > 0 ? (
                                    <JobApplicationTable data={applications} />
                                ) : (
                                    <div className="p-10 border border-border rounded-lg flex flex-col items-center justify-center dark:bg-card">
                                        <Search className="w-8 h-8 text-muted-foreground mx-auto mb-4"/>
                                        <h3 className="text-lg font-semibold text-foreground">No Applications Found</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Click &quot;+ Add New Application&quot; to start tracking your job search!
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}