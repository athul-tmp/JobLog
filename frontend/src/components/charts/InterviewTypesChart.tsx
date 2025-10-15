import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { InterviewBreakdown } from '@/types/types';
import { useTheme } from '@/hooks/useTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_COLORS = [
    // '#9d4edd', // OA Interview
    // '#7400d3ff', // Mid-stage Interview
    // '#3e036fff', // Final Interview
    '#bedbff',
    '#2b7fff',
    '#1447e6',

];

const THEME_COLORS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#ffffff',
  },
};

interface InterviewTypesChartProps {
    data: InterviewBreakdown[];
}

export default function InterviewTypesChart({ data }: InterviewTypesChartProps) {
    const theme = useTheme();
    const themeColors = THEME_COLORS[theme];

    // Shows if no active interviews
    const totalActiveInterviews = data.reduce((sum, item) => sum + item.count, 0);
    if (totalActiveInterviews === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-center text-muted-foreground">
                    No active interviews to track.
                </p>
            </div>
        );
    }

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
                backgroundColor: TYPE_COLORS,
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