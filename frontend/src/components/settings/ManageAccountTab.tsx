import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; 
import { AlertTriangle } from "lucide-react";
import { AuthUser } from "@/types/types"; 

export const ManageAccountTab = ({ user }: { user: AuthUser }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Account Information</h2>
            <Card>
                <CardContent className="space-y-4">
                    
                    {/* Name */}
                    <div className="flex items-center justify-between">
                        <Label className="text-base">First Name</Label>
                        <span className="text-foreground font-semibold">{user.firstName}</span>
                    </div>

                    {/* Email Field */}
                    <div className="flex items-center justify-between">
                        <Label className="text-base">Email Address</Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">{user.email}</span>
                            <Button className="cursor-pointer" variant="outline" size="sm" disabled>Change Email (WIP)</Button>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="flex items-center justify-between">
                        <Label className="text-base">Password</Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">••••••••</span>
                            <Button className="cursor-pointer" variant="outline" size="sm" disabled>Change Password (WIP)</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Deletion Card */}
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/40">
                <CardHeader>
                    <CardTitle className="text-red-600 dark:text-red-400">Delete Account</CardTitle>
                    <CardDescription className="text-red-500 dark:text-red-300">
                        Permanently delete your account and all associated data. This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="cursor-pointer">Delete Account Permanently</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    <div className="flex items-center text-red-500">
                                        <AlertTriangle className="h-5 w-5 mr-2" />
                                        <span>This action cannot be undone.</span>
                                    </div>
                                    <p className="mt-2 text-red-500">This will permanently delete your account, including all job applications and analytics data.</p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="cursor-pointer" >Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button className="cursor-pointer" variant="destructive" disabled>Confirm Deletion (WIP)</Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
};