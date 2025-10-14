import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { DashboardAnalytics } from '@/types/types';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

const OUTCOME_COLOURS = [
    '#00c951', // Green (Offer)
    '#fb2c36', // Red (Rejected)
    '#6a7282', // Gray (Ghosted)
];

const THEME_COLOURS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#f4f4f4',
  },
};

interface InterviewOutcomesChartProps {
    data: DashboardAnalytics;
}

export default function InterviewOutcomesChart({ data }: InterviewOutcomesChartProps) {
    const theme = useTheme();
    const themeColours = THEME_COLOURS[theme];

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
                backgroundColor: OUTCOME_COLOURS,
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
                    color: themeColours.textColor,
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