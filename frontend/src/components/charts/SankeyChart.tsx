import React from "react";
import { Chart } from "react-google-charts"; 
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from '@/hooks/useTheme';

// Outcome colors
const NODE_COLORS = {
    '1': '#7e22ce',
    '2': '#e7000b', 
    '3': '#4a5565', 
    '4': '#155dfc',       
    '5': '#00a63e',         
    '6': '#e7000b',        
    '7': '#4a5565',         
};

const THEME_COLORS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#ffffff',
  },
};

interface SankeyChartProps {
    data: DashboardAnalytics;
}

export default function SankeyChart({ data }: SankeyChartProps) {
    const theme = useTheme();
    const themeColors = THEME_COLORS[theme];

    // Calculations for chart
    const rejectedNoInterview = data.totalRejections - data.interviewedAndRejected;
    const ghostedNoInterview = data.totalGhosted - data.interviewedAndGhosted;

    // Check if there is any flow to visualise
    const totalFlow = rejectedNoInterview + ghostedNoInterview + data.totalPastInterviews + data.totalOffers + data.interviewedAndRejected + data.interviewedAndGhosted;
    if (totalFlow === 0) {
        return (
            <div className="flex items-center justify-center w-full h-[300px]">
                <p className="text-center text-muted-foreground">
                    Not enough data to visualise application flow. Apply to jobs to see the journey.
                </p>
            </div>
        );
    }

    const safeValue = (val: number) => (val > 0 ? val : 0.0001);

    const chartData = [
    ["From", "To", "Count"],
    ["Total Applications", "Rejected (No Interview)", safeValue(rejectedNoInterview)], 
    ["Total Applications", "Ghosted (No Interview)", safeValue(ghostedNoInterview)],   
    ["Total Applications", "Interview", safeValue(data.totalPastInterviews)], 
    ["Interview", "Offer", safeValue(data.totalOffers)],
    ["Interview", "Rejected", safeValue(data.interviewedAndRejected)],
    ["Interview", "Ghosted", safeValue(data.interviewedAndGhosted)],
    ];
    
    // Color options configurations
    const options = {
        sankey: {
            node: {
                colors: Object.values(NODE_COLORS),
                label: {
                    color: themeColors.textColor, 
                    fontSize: 14,
                },
                nodePadding: 20, 
            },
            link: {
                colorMode: 'gradient' as const, 
            },
        },
        backgroundColor: {
            fill: 'transparent',
            stroke: 'transparent', 
            strokeWidth: 0,       
        },
    };

    return (
        <Chart
            chartType="Sankey"
            width="100%"
            height="350px" 
            data={chartData}
            options={options}
        />
    );
}