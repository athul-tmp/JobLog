import React, { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound, Database, AlertTriangle } from "lucide-react"; 
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ManageAccountTab } from "@/components/settings/ManageAccountTab"; 
import { DataManagementTab } from "@/components/settings/DataManagementTab"; 
import { ToolsAndIntegrationsTab } from "@/components/settings/ToolsAndIntegrationsTab"; 
import { DemoAlert } from "@/components/DemoAlert";

// Configuration for sidebar 
const settingsNav = [
    { id: 'account', title: 'Manage Account', icon: KeyRound },
    { id: 'data', title: 'Data', icon: Database },
    // Will be added in later
    // { id: 'tools', title: 'Tools & Integrations', icon: Zap }, 
];


export default function SettingsPage() {
    const router = useRouter();
    const { isAuthenticated, authLoading, user } = useAuth();
    const isDemoUser = user?.isDemo ?? false;

    const activeTab = router.query.tab ? String(router.query.tab) : 'account';

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, authLoading, router]);

    // Show loading state while authenticating
    if (authLoading || !isAuthenticated || !user || !user.firstName) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <Spinner className="size-15"/>
            </div>
        );
    }
    
    // Function to render the correct content
    const renderContent = () => {
        switch (activeTab) {
            case 'data':
                return <DataManagementTab isDemoUser={isDemoUser} />;
            case 'tools':
                return <ToolsAndIntegrationsTab />;
            case 'account':
            default:
                return <ManageAccountTab isDemoUser={isDemoUser} />;
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
                    className="mb-4 mt-4 text-base cursor-pointer"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>

                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-5"> Settings</h1>

                {isDemoUser && (
                    <>
                    <DemoAlert />
                    <Alert variant="destructive" className="mb-6 bg-red-100 border-red-500 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-red-700 dark:text-red-300 font-bold">
                            You are on the Demo Account. Settings changes are disabled to preserve the demo experience for others.
                        </AlertDescription>
                    </Alert>
                    </>
                )}
                
                {/* Main Layout Container */}
                <div className="flex flex-col md:flex-row md:gap-8 min-h-[calc(100vh-300px)]">
                    
                    {/* Sidebar Navigation Wrapper */}
                    <div className="w-full md:w-64 flex-shrink-0 bg-muted/50 dark:bg-muted/30 border border-border/80 rounded-lg mb-6 md:mb-0">
                        <nav className="flex flex-col space-y-1 p-4">
                            {settingsNav.map((item) => {
                                const Icon = item.icon;
                                const isActive = item.id === activeTab;
                                
                                return (
                                    <Button
                                        key={item.id}
                                        variant={isActive ? 'secondary' : 'ghost'} 
                                        className={isActive? "justify-start text-base": "cursor-pointer justify-start text-base"}
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