import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { InterviewBreakdown } from '@/types/types';
import { useTheme } from 'next-themes';

ChartJS.register(ArcElement, Tooltip, Legend);

const HISTORICAL_COLORS = [
    '#93c5fd',
    '#3b82f6',
    '#1e3a8a',
];

const THEME_COLORS = {
  light: { textColor: '#000000' },
  dark: { textColor: '#ffffff' },
};

interface HistoricalInterviewsChartProps {
    data: InterviewBreakdown[];
}

export default function HistoricalInterviewsChart({ data }: HistoricalInterviewsChartProps) {
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

    // Calculate total historical interviews
    const totalHistory = data.reduce((sum, item) => sum + item.count, 0);

    if (totalHistory === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-center text-muted-foreground text-sm">
                    No interview history recorded yet.
                </p>
            </div>
        );
    }

    const historyMap = new Map<string, number>();
    data.forEach(item => {
        historyMap.set(item.type, item.count);
    });

    const stages = [
        { key: 'Screening Interview', label: 'Screening' },
        { key: 'Mid-stage Interview', label: 'Mid-stage' },
        { key: 'Final Interview', label: 'Final' },
    ];

    const chartData = {
        labels: stages.map(s => s.label),
        datasets: [
            {
                label: 'Total Interviews Conducted',
                data: stages.map(s => historyMap.get(s.key) || 0),
                backgroundColor: HISTORICAL_COLORS,
                borderColor: themeKey === 'dark' ? '#1e293b' : '#ffffff',
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                    Total Interviews: <span className="font-bold">{totalHistory}</span>
                </p>
            </div>
        </div>
    );
}