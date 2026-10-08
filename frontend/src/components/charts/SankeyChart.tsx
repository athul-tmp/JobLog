import React from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, Tooltip, TooltipItem } from "chart.js";
import { SankeyController, Flow, SankeyDataPoint } from "chartjs-chart-sankey";
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from "next-themes";

ChartJS.register(SankeyController, Flow, LinearScale, Tooltip);

// Node keys, display labels and colours (no-interview outcomes are lighter shades)
const NODE_LABELS: Record<string, string> = {
    applications: 'Total Applications',
    awaiting: 'Awaiting Reply',
    rejectedNoInterview: 'Rejected (No Interview)',
    ghostedNoInterview: 'Ghosted (No Interview)',
    interview: 'Interviewed',
    inProgress: 'In Progress',
    offer: 'Offer',
    rejected: 'Rejected',
    ghosted: 'Ghosted',
};

const NODE_COLORS: Record<string, string> = {
    applications: '#7e22ce',
    awaiting: '#d08700',
    rejectedNoInterview: '#ff6467',
    ghostedNoInterview: '#99a1af',
    interview: '#155dfc',
    inProgress: '#51a2ff',
    offer: '#00a63e',
    rejected: '#e7000b',
    ghosted: '#4a5565',
};

// Columns: outcomes without an interview end beside "Interviewed",
// so only post-interview outcomes share the last column
const NODE_COLUMNS: Record<string, number> = {
    applications: 0,
    awaiting: 1, rejectedNoInterview: 1, ghostedNoInterview: 1, interview: 1,
    offer: 2, rejected: 2, ghosted: 2, inProgress: 2,
};

// Top-to-bottom order of nodes within each column. "Interviewed" sits at the top of
// its column so its outcomes line up beside it instead of flowing across the chart
const NODE_PRIORITY: Record<string, number> = {
    interview: 0, awaiting: 1, rejectedNoInterview: 2, ghostedNoInterview: 3,
    offer: 4, rejected: 5, ghosted: 6, inProgress: 7,
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
    // Every flow counts applications, so each node's inflow equals its outflow
    const rejectedNoInterview = data.totalRejections - data.interviewedAndRejected;
    const ghostedNoInterview = data.totalGhosted - data.interviewedAndGhosted;
    const offersNoInterview = data.totalOffers - data.offersAfterInterview;

    const flows: SankeyDataPoint[] = [
        { from: 'applications', to: 'awaiting', flow: data.totalPending },
        { from: 'applications', to: 'rejectedNoInterview', flow: rejectedNoInterview },
        { from: 'applications', to: 'ghostedNoInterview', flow: ghostedNoInterview },
        { from: 'applications', to: 'offer', flow: offersNoInterview },
        { from: 'applications', to: 'interview', flow: data.interviewedApplications },
        { from: 'interview', to: 'offer', flow: data.offersAfterInterview },
        { from: 'interview', to: 'rejected', flow: data.interviewedAndRejected },
        { from: 'interview', to: 'ghosted', flow: data.interviewedAndGhosted },
        { from: 'interview', to: 'inProgress', flow: data.totalInterviews },
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
                priority: NODE_PRIORITY,
                column: NODE_COLUMNS,
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
                    // Swatch shows the destination node's colour (the plugin leaves it white)
                    labelColor: ({ raw }: TooltipItem<'sankey'>) => {
                        const color = NODE_COLORS[(raw as SankeyDataPoint).to];
                        return { backgroundColor: color, borderColor: color };
                    },
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
