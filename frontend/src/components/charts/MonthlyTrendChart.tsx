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
} from 'chart.js';
import { MonthlyApplications } from '@/types/types';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface MonthlyTrendChartProps {
    data: MonthlyApplications[];
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
    const chartData = {
        labels: data.map(item => item.monthYear),
        datasets: [
            {
                label: 'Applications Sent',
                data: data.map(item => item.count),
                borderColor: '#9d4edd', // Primary Purple line
                backgroundColor: 'rgba(157, 77, 237, 0.2)', // Light fill under the line
                tension: 0.3, // Curve the line
                pointRadius: 5,
                pointBackgroundColor: '#9d4edd',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false as const,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1, // Ensure whole numbers for counts
                    color: 'rgba(244, 244, 244, 0.7)',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)', // Light grid lines for dark mode
                },
                title: {
                    display: true,
                    text: 'Total Applications',
                    color: 'rgba(244, 244, 244, 0.9)',
                }
            },
            x: {
                ticks: {
                    color: 'rgba(244, 244, 244, 0.7)',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(244, 244, 244, 0.8)',
                },
            },
            title: {
                display: false,
            },
        },
    };

    return <Line data={chartData} options={options} />;
}