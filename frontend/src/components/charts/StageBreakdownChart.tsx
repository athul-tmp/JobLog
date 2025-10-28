import React from 'react';
import { Pie } from 'react-chartjs-2'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from 'next-themes';

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
    '#00a63e', // Offer
    '#155dfc', // Interview
    '#d08700', // Applied
    '#e7000b', // Rejected
    '#4a5565', // Ghosted
];

const THEME_COLORS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#ffffff',
  },
};

interface StageBreakdownChartProps {
    data: DashboardAnalytics;
}

export default function StageBreakdownChart({ data }: StageBreakdownChartProps) {
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

    // Shows if no applications
    if (data.totalApplications === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-center text-muted-foreground">
                    No applications yet. Apply to jobs to see this breakdown.
                </p>
            </div>
        ); 
    }

    const chartData = {
        labels: [
            'Offers',
            'Interviews',
            'Applied',
            'Rejections',
            'Ghosted'
        ],
        datasets: [
            {
                label: 'Applications by Stage',
                data: [
                    data.totalOffers,
                    data.totalInterviews,
                    data.totalPending,
                    data.totalRejections,
                    data.totalGhosted
                ],
                backgroundColor: CHART_COLORS,
                borderColor: ['#000000'],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false as const,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    color: themeColors.textColor,
                },
            },
            tooltip: {
                callbacks: {
                    label: ({ label, raw }: TooltipItem<'pie'>) => {
                        const count = raw as number; 
                        return `${label}: ${count} jobs`;
                    },
                },
            },
        },
    };

    return <Pie data={chartData} options={options} />;
}