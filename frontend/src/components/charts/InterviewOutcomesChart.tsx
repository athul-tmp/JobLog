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
                borderColor: themeKey === 'dark' ? '#1e293b' : '#ffffff',
                borderWidth: 2,
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
                    font: { size: 12 }
                },
            },
            tooltip: {
                callbacks: {
                    label: ({ label, raw }: TooltipItem<'pie'>) => {
                        return ` ${label}: ${raw} total`;
                    },
                },
            },
        },
    };

    return (
        <div className="flex flex-col w-full h-full min-h-[250px] max-h-[350px] overflow-hidden p-2">
            <div className="relative flex-1" style={{ minHeight: '180px' }}>
                <Pie data={chartData} options={options} />
            </div>
            
            <div className="mt-5 py-2 border-t border-border/50">
                <p className="text-center text-sm text-foreground">
                    Total Interview Outcomes: <span className="font-bold">{totalOutcomes}</span>
                </p>
            </div>
        </div>
    );
}