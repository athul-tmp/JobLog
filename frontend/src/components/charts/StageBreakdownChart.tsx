import React from 'react';
import { Pie } from 'react-chartjs-2'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
    '#00c951', // Offer
    '#17a2b8', // Interview
    '#f0b100', // Applied
    '#fb2c36', // Rejected
    '#6a7282', // Ghosted
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
    const theme = useTheme();
    const themeColors = THEME_COLORS[theme];

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