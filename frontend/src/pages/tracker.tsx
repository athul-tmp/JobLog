import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Head from "next/head";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DashboardNavigation } from "@/components/DashboardNavigation"; 
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react"; 
import { Alert, AlertDescription } from "@/components/ui/alert"; 

import AddJobApplicationDialog from "@/components/tracker/AddJobApplicationDialog"; 
import EditJobApplicationDialog from "@/components/tracker/EditJobApplicationDialog";
import { JobApplicationService } from "@/services/api"; 
import { JobApplication } from "@/types/types"; 

import { JobApplicationTable } from "@/components/tracker/JobApplicationTable"; 
import { toast } from "sonner";
import { DemoAlert } from "@/components/DemoAlert";

// Sorting logic
const sortApplications = (applications: JobApplication[]): JobApplication[] => {
    return applications.sort((a, b) => {
        const dateA = new Date(a.dateApplied).getTime();
        const dateB = new Date(b.dateApplied).getTime();
        
        // Primary sort: Date applied
        const dateDiff = dateB - dateA;

        if (dateDiff !== 0) {
            return dateDiff; // Dates are different, use date sort
        }

        // Secondary sort (tie-breaker): Application no.
        return b.applicationNo - a.applicationNo; 
    });
};

// To fetch and manage application data
function useApplicationData() {
    const { isAuthenticated } = useAuth();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        if (isAuthenticated) {
            setIsLoading(true);
            setError(null);
            try {
                const data = await JobApplicationService.getAllJobApplications();
                // Sort the data
                const sortedData = sortApplications(data);
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
    }, [isAuthenticated]);

    // Run fetch once on mount
    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleJobAdded = useCallback((newJob: JobApplication) => {
        // Add the new job to the top of the list 
        setApplications(prev => sortApplications([newJob, ...prev]));
    }, []);

    const handleJobUpdated = useCallback((updatedJob: JobApplication) => {
        setApplications(prev => {
            const updatedList = prev.map(job => 
                job.id === updatedJob.id ? updatedJob : job
            ); 
            return sortApplications(updatedList); 
        }); 
    }, []);

    const handleUndoStatusChange = useCallback(async (jobId: number) => {
        try {
            const updatedJob = await JobApplicationService.undoStatusChange(jobId);
            handleJobUpdated(updatedJob);
            
            toast.success("Status Reverted", {
                description: `Application #${updatedJob.applicationNo} reverted to ${updatedJob.status}.`,
            });
        } catch (error) {
            const errorMessage = (error instanceof Error) 
                ? error.message 
                : typeof error === 'string' ? error : "Could not undo last status change.";
            
            toast.error("Undo Failed", {
                description: errorMessage,
            });
        }
    }, [handleJobUpdated]);

    return { applications, isLoading, error, handleJobAdded, handleJobUpdated, handleUndoStatusChange, fetchApplications };
}


export default function TrackerPage() {
    const { isAuthenticated, authLoading } = useAuth();
    const router = useRouter();
    const { applications, isLoading: isDataLoading, error: dataError, handleJobAdded,handleJobUpdated, handleUndoStatusChange } = useApplicationData();

    // State for managing the Edit Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedJobToEdit, setSelectedJobToEdit] = useState<JobApplication | null>(null);

    const handleOpenEditModal = useCallback((job: JobApplication) => {
        setSelectedJobToEdit(job);
        setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setSelectedJobToEdit(null);
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/");
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
                <title>Applications | JobLog</title>
            </Head>
            <Header />
            
            <main className="container mx-auto p-4 sm:p-8 min-h-[calc(100vh-128px)]">
                <DashboardNavigation currentPath={router.pathname} />
                <DemoAlert />
                <div className="space-y-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                            Applications
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
                                    <JobApplicationTable 
                                        data={applications} 
                                        onJobUpdated={handleJobUpdated} 
                                        onUndoStatusChange={handleUndoStatusChange}
                                        onOpenEditModal={handleOpenEditModal} 
                                    />
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
            
            {isEditModalOpen && selectedJobToEdit && (
                <EditJobApplicationDialog
                    job={selectedJobToEdit}
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onJobUpdated={handleJobUpdated}
                />
            )}
        </>
    );
}