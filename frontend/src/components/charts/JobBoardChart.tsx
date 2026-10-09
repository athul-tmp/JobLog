import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, TooltipItem } from 'chart.js';
import { SourceBreakdown } from '@/types/types';
import { useTheme } from 'next-themes';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const THEME_COLORS = {
  light: { textColor: '#000000', gridColor: '#e5e5e5' },
  dark: { textColor: '#ffffff', gridColor: '#3a3a3a' },
};

interface JobBoardChartProps {
    data: SourceBreakdown[];
}

export default function JobBoardChart({ data }: JobBoardChartProps) {
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full min-h-[200px]">
                <p className="text-center text-muted-foreground">
                    Add job posting links to your applications to see which job boards you use.
                </p>
            </div>
        );
    }

    const chartData = {
        labels: data.map(s => s.source),
        datasets: [
            {
                label: 'Applications',
                data: data.map(s => s.applications),
                backgroundColor: '#7e22ce',
                borderRadius: 4,
            },
            {
                label: 'Reached interview',
                data: data.map(s => s.interviews),
                backgroundColor: '#2b7fff',
                borderRadius: 4,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false as const,
        scales: {
            x: {
                beginAtZero: true,
                ticks: { precision: 0, color: themeColors.textColor },
                grid: { color: themeColors.gridColor },
            },
            y: {
                ticks: { color: themeColors.textColor },
                grid: { display: false },
            },
        },
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { color: themeColors.textColor, boxWidth: 12 },
            },
            tooltip: {
                callbacks: {
                    label: ({ dataset, raw }: TooltipItem<'bar'>) => ` ${dataset.label}: ${raw}`,
                },
            },
        },
    };

    // Grow with the number of job boards so bars never get squashed
    const height = Math.max(220, data.length * 56 + 70);

    return (
        <div className="relative w-full" style={{ height }}>
            <Bar data={chartData} options={options} />
        </div>
    );
}
