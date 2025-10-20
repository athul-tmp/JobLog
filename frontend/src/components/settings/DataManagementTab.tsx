import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; 
import { AlertTriangle } from "lucide-react";
import { JobApplicationService } from "@/services/api"; 

export const DataManagementTab = () => {
    const handleClearAllData = async () => {
        alert("Clear All Data functionality is currently disabled (WIP).");
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/40">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Clear All Application Data</CardTitle>
                    <CardDescription  className="text-red-500 dark:text-red-300">
                        This is useful when starting a new job search phase. This will delete ALL applications and reset your tracker data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="cursor-pointer" variant="destructive">Clear All Applications</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Data Wipe</AlertDialogTitle>
                                <AlertDialogDescription>
                                    <div className="flex items-center text-red-500">
                                        <AlertTriangle className="h-5 w-5 mr-2" />
                                        <span>This action cannot be undone.</span>
                                    </div>
                                    <p className="mt-2 text-red-500">Are you sure you want to permanently delete ALL job applications and tracker data for your account?</p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button className="cursor-pointer" variant="destructive" onClick={handleClearAllData} disabled>Yes, Clear All Data</Button> 
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
};