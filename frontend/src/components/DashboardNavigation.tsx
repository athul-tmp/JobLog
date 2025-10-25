import { useRouter } from "next/router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardNavigation({ currentPath }: { currentPath: string }) {
    const router = useRouter();

    const navigate = (value: string) => {
        router.push(value === 'dashboard' ? '/dashboard' : '/applications');
    };

    // Determine the current active tab based on the path
    const activeTab = currentPath.includes('applications') ? 'applications' : 'dashboard';

    return (
        <div className="flex justify-center my-8 px-2 sm:px-0">
            <Tabs value={activeTab} onValueChange={navigate}>
                <TabsList
                className="
                    flex flex-wrap sm:flex-nowrap justify-center gap-2 sm:gap-4
                    p-1 sm:p-2 rounded-lg border-2 border-border bg-card
                    w-full max-w-md sm:max-w-none
                "
                >
                    <TabsTrigger
                    className="
                        flex-1 min-w-[140px] text-xs sm:text-sm md:text-base py-2 sm:py-3
                        data-[state=active]:border-2 data-[state=active]:border-border
                    "
                    value="dashboard"
                    >
                        Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                    className="
                        flex-1 min-w-[140px] text-xs sm:text-sm md:text-base py-2 sm:py-3
                        data-[state=active]:border-2 data-[state=active]:border-border
                    "
                    value="applications"
                    >
                    Applications
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}