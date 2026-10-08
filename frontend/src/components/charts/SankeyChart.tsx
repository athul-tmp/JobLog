import React from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, Tooltip, TooltipItem } from "chart.js";
import { SankeyController, Flow, SankeyDataPoint } from "chartjs-chart-sankey";
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from "next-themes";

ChartJS.register(SankeyController, Flow, LinearScale, Tooltip);

// Node keys, display labels and colours
const NODE_LABELS: Record<string, string> = {
    applications: 'Total Applications',
    rejectedNoInterview: 'Rejected (No Interview)',
    ghostedNoInterview: 'Ghosted (No Interview)',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    ghosted: 'Ghosted',
};

const NODE_COLORS: Record<string, string> = {
    applications: '#7e22ce',
    rejectedNoInterview: '#e7000b',
    ghostedNoInterview: '#4a5565',
    interview: '#155dfc',
    offer: '#00a63e',
    rejected: '#e7000b',
    ghosted: '#4a5565',
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
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];
    // Calculations for chart
    const rejectedNoInterview = data.totalRejections - data.interviewedAndRejected;
    const ghostedNoInterview = data.totalGhosted - data.interviewedAndGhosted;

    const flows: SankeyDataPoint[] = [
        { from: 'applications', to: 'rejectedNoInterview', flow: rejectedNoInterview },
        { from: 'applications', to: 'ghostedNoInterview', flow: ghostedNoInterview },
        { from: 'applications', to: 'interview', flow: data.totalPastInterviews },
        { from: 'interview', to: 'offer', flow: data.totalOffers },
        { from: 'interview', to: 'rejected', flow: data.interviewedAndRejected },
        { from: 'interview', to: 'ghosted', flow: data.interviewedAndGhosted },
    ].filter(f => f.flow > 0); // Colours are keyed by node, so empty flows can simply be dropped

    // Check if there is any flow to visualise
    if (flows.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-[300px]">
                <p className="text-center text-muted-foreground">
                    Not enough data to visualise application flow. Apply to jobs to see the journey.
                </p>
            </div>
        );
    }

    const chartData = {
        datasets: [
            {
                label: 'Application Flow',
                data: flows,
                labels: NODE_LABELS,
                colorFrom: (ctx: { raw: SankeyDataPoint }) => NODE_COLORS[ctx.raw.from],
                colorTo: (ctx: { raw: SankeyDataPoint }) => NODE_COLORS[ctx.raw.to],
                colorMode: 'gradient' as const,
                alpha: 0.6,
                borderWidth: 0,
                nodeWidth: 12,
                nodePadding: 20,
                nodeLabels: {
                    color: themeColors.textColor,
                    font: { size: 14 },
                },
                parsing: { from: 'from', to: 'to', flow: 'flow' },
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false as const,
        plugins: {
            tooltip: {
                callbacks: {
                    title: () => '',
                    label: ({ raw }: TooltipItem<'sankey'>) => {
                        const { from, to, flow } = raw as SankeyDataPoint;
                        return ` ${NODE_LABELS[from]} → ${NODE_LABELS[to]}: ${flow}`;
                    },
                },
            },
        },
    };

    return (
        <div className="relative w-full h-[350px]">
            <Chart type="sankey" data={chartData} options={options} />
        </div>
    );
}
