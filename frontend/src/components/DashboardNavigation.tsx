import { useRouter } from "next/router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardNavigation({ currentPath }: { currentPath: string }) {
    const router = useRouter();

    const navigate = (value: string) => {
        router.push(value === 'dashboard' ? '/dashboard' : '/tracker');
    };

    // Determine the current active tab based on the path
    const activeTab = currentPath.includes('tracker') ? 'tracker' : 'dashboard';

    return (
        <div className="flex justify-center my-8">
            <Tabs value={activeTab} onValueChange={navigate}>
                <TabsList>
                    <TabsTrigger className={activeTab !== 'dashboard' ? 'cursor-pointer' : ''} value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger className={activeTab !== 'tracker' ? 'cursor-pointer' : ''} value="tracker">Application Tracker</TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}