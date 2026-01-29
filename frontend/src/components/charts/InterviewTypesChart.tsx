import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { InterviewBreakdown } from '@/types/types';
import { useTheme } from 'next-themes';

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_COLORS = [
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
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

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

    const interviewMap = new Map<string, number>();
        data.forEach(item => {
            interviewMap.set(item.type, item.count);
    });

    const properOrder = [
        { key: 'Screening Interview', label: 'Screening' },
        { key: 'Mid-stage Interview', label: 'Mid-stage' },
        { key: 'Final Interview', label: 'Final' },
    ];

    const properCount = properOrder.map(p => {
        return interviewMap.get(p.key) || 0;
    });

    const chartData = {
        labels: properOrder.map(p => p.label),
        datasets: [
            {
                label: 'Interview Types',
                data: properCount,
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