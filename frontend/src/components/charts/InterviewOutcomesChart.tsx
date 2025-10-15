import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

const OUTCOME_COLORS = [
    '#00c951', // Green (Offer)
    '#fb2c36', // Red (Rejected)
    '#6a7282', // Gray (Ghosted)
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
    const theme = useTheme();
    const themeColors = THEME_COLORS[theme];

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