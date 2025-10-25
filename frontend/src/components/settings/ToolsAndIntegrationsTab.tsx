import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const ToolsAndIntegrationsTab = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Extension</h2>
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