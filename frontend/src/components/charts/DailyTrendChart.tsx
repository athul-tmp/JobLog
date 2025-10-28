import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { ApplicationsPerDay } from '@/types/types';
import { useTheme } from 'next-themes';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
);

const THEME_COLORS = {
  light: {
    textColor: '#000000',
    gridColor: '#494949ff'
    
  },
  dark: {
    textColor: '#ffffff',
    gridColor: '#585858ff'
  },
};

interface DailyTrendChartProps {
    data: ApplicationsPerDay[];
}

export default function DailyTrendChart({ data }: DailyTrendChartProps) {    
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

    // Shows if no applications this month
    const totalApplicationsThisMonth = data.reduce((sum, item) => sum + item.count, 0);
    if (totalApplicationsThisMonth === 0) {
        return (
            <div className="flex items-center justify-center w-full h-[300px]">
                <p className="text-center text-muted-foreground">
                    No applications submitted this month.
                </p>
            </div>
        );
    }

    const chartData = {
        labels: data.map(item => item.date), 
        datasets: [
            {
                label: 'Applications Sent',
                data: data.map(item => item.count),
                borderColor: '#7e22ce',
                tension: 0.4, 
                pointRadius: 5,
                pointBackgroundColor: '#7e22ce',
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false as const,
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: themeColors.textColor, },
                grid: { color: themeColors.gridColor, },
            },
            x: {
                ticks: { color: themeColors.textColor, },
                grid: { color: themeColors.gridColor, },
            }
        },
        plugins: {
            legend: { display: false },
        },
    };

    return <Line data={chartData} options={options} />;
}