import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { InterviewBreakdown } from '@/types/types';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_COLOURS = [
    '#9d4edd', // OA Interview
    '#7400d3ff', // Mid-stage Interview
    '#3e036fff', // Final Interview
];

const THEME_COLOURS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#f4f4f4',
  },
};

interface InterviewTypesChartProps {
    data: InterviewBreakdown[];
}

export default function InterviewTypesChart({ data }: InterviewTypesChartProps) {
    const theme = useTheme();
    const themeColours = THEME_COLOURS[theme];

    const chartData = {
        labels: [
            'OA',
            'Mid-stage',
            'Final'
        ],
        datasets: [
            {
                label: 'Interview Types',
                data: data.map(item => item.count),
                backgroundColor: TYPE_COLOURS,
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