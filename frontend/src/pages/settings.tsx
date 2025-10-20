import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; 
import { KeyRound, Database, Zap, AlertTriangle, ArrowLeft } from "lucide-react"; 
import { JobApplicationService } from "@/services/api"; 
import { AuthUser } from "@/types/types";

// Configuration for sidebar 
const settingsNav = [
    { id: 'account', title: 'Manage Account', icon: KeyRound },
    { id: 'data', title: 'Data', icon: Database },
    { id: 'tools', title: 'Tools & Integrations', icon: Zap },
];

const ManageAccount = ({ user }: { user: AuthUser }) => {
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
                            <Button variant="outline" size="sm" disabled>Change Email (WIP)</Button>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className="flex items-center justify-between">
                        <Label className="text-base">Password</Label>
                        <div className="flex items-center space-x-2">
                            <span className="text-muted-foreground">••••••••</span>
                            <Button variant="outline" size="sm" disabled>Change Password (WIP)</Button>
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
                            <Button variant="destructive">Delete Account Permanently</Button>
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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button variant="destructive" disabled>Confirm Deletion (WIP)</Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
};

const DataManagement = () => {
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
                            <Button variant="destructive">Clear All Applications</Button>
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
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction asChild>
                                    <Button variant="destructive" onClick={handleClearAllData} disabled>Yes, Clear All Data</Button> 
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
};

const ToolsAndIntegrations = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Tools & Integrations</h2>
            <Card>
                <CardContent className="p-6">
                    <p className="text-lg font-semibold mb-2">Browser Extension (Coming Soon)</p>
                    <p className="text-muted-foreground">
                        A browser extension that will allow you to add job details directly from job board websites and save them straight into your JobLog account is coming soon. Stay tuned!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};


export default function SettingsPage() {
    const router = useRouter();
    const { isAuthenticated, authLoading, user } = useAuth();
    
    const activeTab = router.query.tab ? String(router.query.tab) : 'account';

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, authLoading, router]);

    // Show loading state while authenticating
    if (authLoading || !isAuthenticated || !user || !user.firstName) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="text-lg text-muted-foreground">Loading...</div> 
            </div>
        );
    }
    
    // Function to render the correct content
    const renderContent = () => {
        switch (activeTab) {
            case 'data':
                return <DataManagement />;
            case 'tools':
                return <ToolsAndIntegrations />;
            case 'account':
            default:
                return <ManageAccount user={user} />;
        }
    };
    
    // Function to handle sidebar navigation
    const handleNavigation = (tabId: string) => {
        router.replace({
            pathname: '/settings',
            query: { tab: tabId },
        }, undefined, { shallow: true });
    };

    return (
        <>
            <Head>
                <title>Settings | JobLog</title>
            </Head>
            <Header />
            
            <main className="container mx-auto min-h-[calc(100vh-128px)]">
                
                {/* Back Button */}
                <Button 
                    variant="outline"
                    onClick={() => router.back()} 
                    className="mb-4 mt-4 text-base"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>

                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-5"> Settings</h1>
                
                {/* Main Layout Container */}
                <div className="flex flex-col md:flex-row md:gap-8 min-h-[calc(100vh-300px)]">
                    
                    {/* Sidebar Navigation */}
                    <div className="w-full md:w-64 flex-shrink-0 bg-muted/50 dark:bg-muted/30 border border-border/80 rounded-lg mb-6 md:mb-0">
                        <nav className="flex flex-col space-y-1 p-4">
                            {settingsNav.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.id === activeTab;
                                
                                return (
                                    <Button
                                        key={item.id}
                                        variant={isActive ? 'secondary' : 'ghost'} 
                                        className="justify-start text-base"
                                        onClick={() => handleNavigation(item.id)}
                                    >
                                        <Icon className="h-5 w-5 mr-3" />
                                        {item.title}
                                    </Button>
                                );
                            })}
                        </nav>
                    </div>
                    
                    {/* Main Content Area */}
                    <div className="flex-1">
                        {renderContent()}
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}