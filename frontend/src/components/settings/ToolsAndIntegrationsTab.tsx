import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { ExternalLink } from "lucide-react";

const CHROME_WEB_STORE_LINK = "https://chromewebstore.google.com/detail/mbbminokbdldbonjhceefnjncgadogcj?utm_source=item-share-cb";

export const ToolsAndIntegrationsTab = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Extension</h2>
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold mb-2">
                                JobLog: Quick Add Browser Extension
                            </p>
                            <p className="text-muted-foreground mb-4 md:mb-0 max-w-xl">
                                Instantly capture job title, company, and URL from supported job boards (LinkedIn, Seek, Indeed) with a single click. Add new applications to your JobLog account in seconds without leaving the job page.
                            </p>
                        </div>
                        
                        <div className="mt-4 md:mt-0 flex-shrink-0">
                            <Button asChild>
                                <a 
                                    href={CHROME_WEB_STORE_LINK} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    Install on Chrome Web Store
                                    <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};