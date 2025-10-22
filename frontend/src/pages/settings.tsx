import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, KeyRound, Database, Zap } from "lucide-react"; 

import { ManageAccountTab } from "@/components/settings/ManageAccountTab"; 
import { DataManagementTab } from "@/components/settings/DataManagementTab"; 
import { ToolsAndIntegrationsTab } from "@/components/settings/ToolsAndIntegrationsTab"; 
import { Spinner } from "@/components/ui/spinner";


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
                return <DataManagementTab />;
            case 'tools':
                return <ToolsAndIntegrationsTab />;
            case 'account':
            default:
                return <ManageAccountTab />;
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