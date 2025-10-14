import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';
import { StatusBreakdown } from '@/types/types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define color palette for your dark/purple theme
const CHART_COLORS = [
    '#9d4edd', // Primary Purple
    '#5c1e9e', // Darker Purple
    '#f53c8a', // Pink (Offer/Success)
    '#ffc107', // Yellow (Ghosted)
    '#dc3545', // Red (Rejected)
    '#17a2b8', // Cyan (Interview)
    '#6c757d', // Gray (Pending)
];

interface StageBreakdownChartProps {
    data: StatusBreakdown[];
}

export default function StageBreakdownChart({ data }: StageBreakdownChartProps) {
    // Transform the analytics DTO data into the format Chart.js expects
    const chartData = {
        labels: data.map(item => item.status),
        datasets: [
            {
                label: 'Applications by Stage',
                data: data.map(item => item.count),
                backgroundColor: CHART_COLORS.slice(0, data.length),
                borderColor: ['#000000'], // Black border for contrast
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
                    color: 'rgba(244, 244, 244, 0.8)', 
                },
            },
            tooltip: {
                callbacks: {
                    label: ({ label, raw }: TooltipItem<'doughnut'>) => {
                        const count = raw as number; 
                        return `${label}: ${count} jobs`;
                    },
                },
            },
        },
    };

    return <Doughnut data={chartData} options={options} />;
}