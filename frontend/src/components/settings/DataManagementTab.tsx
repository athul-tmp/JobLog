import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; 
import { AlertCircle, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Label } from "../ui/label";
import { PasswordInput } from "../ui/PasswordInput";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { AuthService, JobApplicationService } from "@/services/api";

// Renders the status (success/error)
const StatusAlert = ({ status, message }: { status: 'success' | 'error' | null, message: string | null }) => {
    if (!status || !message) return null;
    
    return (
        <Alert variant={status === 'error' ? 'destructive' : 'default'} className={status === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-300 border-red-500 text-red-700'}>
            {status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription className={status === 'success' ? 'text-green-700' : ''}>{message}</AlertDescription>
        </Alert>
    );
};

// Interface for props
interface DataManagementTabProps {
    isDemoUser: boolean;
}

export const DataManagementTab = ({ isDemoUser }: DataManagementTabProps) => {
    const { refreshUser } = useAuth();
    
    const [clearPassword, setClearPassword] = useState('');
    const [clearLoading, setClearLoading] = useState(false);
    const [clearStatus, setClearStatus] = useState<'success' | 'error' | null>(null);
    const [clearMessage, setClearMessage] = useState<string | null>(null);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    const clearStatusMessages = () => {
        setClearStatus(null);
        setClearMessage(null);
    };

    // Password Verification
    const handleVerifyAndOpenClear = async () => {
        clearStatusMessages();
        
        if (!clearPassword) {
            setClearStatus('error');
            setClearMessage('Your current password is required for security confirmation.');
            return;
        }

        setClearLoading(true);

        try {
            await AuthService.verifyPassword({ currentPassword: clearPassword });

            // If successful, open the confirmation modal
            setIsClearModalOpen(true);
        } catch (error) {
            // If verification fails, show error on the card, do NOT open modal
            setClearStatus('error');
            setClearMessage(typeof error === 'string' ? error : 'Invalid current password. Please try again.');
        } finally {
            setClearLoading(false);
        }
    };
    
    // Data Deletion
    const confirmClearAction = async () => {
        setClearStatus(null);
        setClearMessage(null);
        setClearLoading(true);
        
        try {
            await JobApplicationService.deleteAllApplications({ currentPassword: clearPassword });

            // Show success toast
            toast.success("Data successfully cleared.", {
                description: "All job applications and analytics data have been deleted.",
                duration: 5000,
            });
            
            refreshUser({});

            // Close modal and clear password field
            setIsClearModalOpen(false); 
            setClearPassword('');
        } catch (error) {
            setClearStatus('error');
            setClearMessage(typeof error === 'string' ? error : 'Deletion failed due to a server error.');
            setIsClearModalOpen(true);
        } finally {
            setClearLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
            <Card className="border-red-500/50 bg-red-200 dark:bg-red-950/40">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Clear All Application Data</CardTitle>
                    <CardDescription  className="text-red-500 dark:text-red-300">
                        This action is permanent and cannot be undone. This is <strong>useful when starting a new job search phase</strong>. This will delete <strong>ALL</strong> applications and reset your tracker data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <StatusAlert status={clearStatus} message={clearMessage} />
                    
                    <div className="space-y-2 max-w-sm">
                        <Label htmlFor="clear-data-password" className="text-red-700 dark:text-red-400">Current Password (Required)</Label>
                        <PasswordInput
                            id="clear-data-password"
                            value={clearPassword}
                            disabled={isDemoUser}
                            onChange={(e) => {
                                setClearPassword(e.target.value);
                                clearStatusMessages();
                            }}
                            className="border-red-500 focus-visible:ring-red-500"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button 
                        onClick={handleVerifyAndOpenClear} 
                        variant="destructive"
                        disabled={clearLoading || !clearPassword || isDemoUser}
                    >
                        <Database className="h-4 w-4 mr-2" />
                        {clearLoading ? 'Verifying...' : 'Clear All Applications'}
                    </Button>
                </CardFooter>
            </Card>

            {/* Confirmation dialog */}
            <AlertDialog open={isClearModalOpen} onOpenChange={setIsClearModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center text-red-600">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Confirm Data Wipe
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Your password has been verified. This action cannot be undone. You are about to permanently delete <strong>ALL</strong> job application and tracker data associated with your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    {clearMessage && clearStatus === 'error' && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertDescription>{clearMessage}</AlertDescription>
                        </Alert>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            disabled={clearLoading} 
                            onClick={() => clearStatusMessages()} 
                        >
                            Cancel
                        </AlertDialogCancel>
                        <Button 
                            onClick={confirmClearAction} 
                            variant="destructive"
                            disabled={clearLoading}
                        >
                            {clearLoading ? 'Processing...' : 'Yes, Clear All Data'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};