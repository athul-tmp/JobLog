import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from 'next-themes';

ChartJS.register(ArcElement, Tooltip, Legend);

const OUTCOME_COLORS = [
    '#00a63e', // Green (Offer)
    '#e7000b', // Red (Rejected)
    '#4a5565', // Gray (Ghosted)
];

const THEME_COLORS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#ffffff',
  },
};

interface InterviewOutcomesChartProps {
    data: DashboardAnalytics;
}

export default function InterviewOutcomesChart({ data }: InterviewOutcomesChartProps) {
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

    // Shows if no interviews
    const totalOutcomes = data.totalOffers + data.interviewedAndRejected + data.interviewedAndGhosted;
    if (totalOutcomes === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-center text-muted-foreground">
                    No interview outcomes to show yet.
                </p>
            </div>
        );
    }

    const chartData = {
        labels: [
          'Offers',
          'Rejected',
          'Ghosted',
        ],
        datasets: [
            {
                label: 'Interview Outcomes',
                data: [
                  data.totalOffers, 
                  data.interviewedAndRejected,
                  data.interviewedAndGhosted,
                ],
                backgroundColor: OUTCOME_COLORS,
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