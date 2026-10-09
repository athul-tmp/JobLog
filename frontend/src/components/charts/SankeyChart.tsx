import React from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, Tooltip, TooltipItem } from "chart.js";
import { SankeyController, Flow, SankeyDataPoint } from "chartjs-chart-sankey";
import { FlowLink } from '@/types/types';
import { useTheme } from "next-themes";

ChartJS.register(SankeyController, Flow, LinearScale, Tooltip);

// Base node keys (from the analytics API), display labels and colours.
// No-interview outcomes are lighter shades of the after-interview ones.
const NODE_LABELS: Record<string, string> = {
    applications: 'Total Applications',
    awaiting: 'Awaiting Reply',
    rejectedNoInterview: 'Rejected (No Interview)',
    ghostedNoInterview: 'Ghosted (No Interview)',
    screening: 'Screening',
    midStage: 'Mid-stage',
    final: 'Final',
    offer: 'Offer',
    rejected: 'Rejected',
    ghosted: 'Ghosted',
    inProgress: 'In Progress',
};

const NODE_COLORS: Record<string, string> = {
    applications: '#7e22ce',
    awaiting: '#d08700',
    rejectedNoInterview: '#ff6467',
    ghostedNoInterview: '#99a1af',
    screening: '#51a2ff',
    midStage: '#2b7fff',
    final: '#155dfc',
    offer: '#00a63e',
    rejected: '#e7000b',
    ghosted: '#4a5565',
    inProgress: '#00b8db',
};

// Column of each node that other nodes flow out of; exits sit one column to the right of their source
const SOURCE_COLUMNS: Record<string, number> = { applications: 0, screening: 1, midStage: 2, final: 3 };

// Outcomes reached from several stages get one node per stage (e.g. "rejected@screening"),
// so every flow only travels to the next column and flows never cross each other
const PER_STAGE_OUTCOMES = ['offer', 'rejected', 'ghosted', 'inProgress'];

// Top-to-bottom order within a column: the next interview stage first, then exits
const BASE_PRIORITY: Record<string, number> = {
    screening: 0, midStage: 0, final: 0,
    offer: 1, awaiting: 2, inProgress: 3, rejected: 4, rejectedNoInterview: 4, ghosted: 5, ghostedNoInterview: 5,
};

// Flows smaller than this share of all applications are drawn at this size so they stay readable
const MIN_FLOW_SHARE = 0.04;

const baseKey = (key: string) => key.split('@')[0];

const THEME_COLORS = {
  light: {
    textColor: '#000000',
  },
  dark: {
    textColor: '#ffffff',
  },
};

// Chart data point: `flow` is the drawn size, `count` the real number of applications
type DisplayFlow = SankeyDataPoint & { count: number };

interface SankeyChartProps {
    data: FlowLink[];
}

export default function SankeyChart({ data }: SankeyChartProps) {
    const { resolvedTheme } = useTheme();
    const themeKey = (resolvedTheme || 'dark') as 'light' | 'dark';
    const themeColors = THEME_COLORS[themeKey];

    const links = data
        .filter(l => l.count > 0)
        .map(l => ({
            from: l.from,
            to: PER_STAGE_OUTCOMES.includes(l.to) ? `${l.to}@${l.from}` : l.to,
            count: l.count,
        }));

    // Check if there is any flow to visualise
    if (links.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-[300px]">
                <p className="text-center text-muted-foreground">
                    Not enough data to visualise application flow. Apply to jobs to see the journey.
                </p>
            </div>
        );
    }

    // Columns and in-column order for every node
    const nodeKeys = Array.from(new Set(links.flatMap(l => [l.from, l.to])));
    const columns: Record<string, number> = {};
    for (const key of nodeKeys) {
        columns[key] = key in SOURCE_COLUMNS
            ? SOURCE_COLUMNS[key]
            : SOURCE_COLUMNS[links.find(l => l.to === key)!.from] + 1;
    }
    const priority = Object.fromEntries(nodeKeys.map(key => [key, BASE_PRIORITY[baseKey(key)] ?? 0]));

    // Display sizes: floor small exits, then size each upstream flow from what flows out of its target,
    // working right to left so every node's inflow still equals its outflow
    const total = links.filter(l => columns[l.from] === 0).reduce((sum, l) => sum + l.count, 0);
    const minFlow = Math.max(1, total * MIN_FLOW_SHARE);
    const display = new Map<typeof links[number], number>();
    const byColumnDesc = [...nodeKeys].sort((a, b) => columns[b] - columns[a]);
    for (const key of byColumnDesc) {
        const incoming = links.filter(l => l.to === key);
        const outgoing = links.filter(l => l.from === key);
        if (outgoing.length === 0) {
            incoming.forEach(l => display.set(l, Math.max(l.count, minFlow)));
        } else {
            const displayedOut = outgoing.reduce((sum, l) => sum + (display.get(l) ?? l.count), 0);
            const realIn = incoming.reduce((sum, l) => sum + l.count, 0);
            incoming.forEach(l => display.set(l, displayedOut * (l.count / realIn)));
        }
    }

    const flows: DisplayFlow[] = links.map(l => ({ from: l.from, to: l.to, flow: display.get(l) ?? l.count, count: l.count }));

    // Labels use real counts: the larger of what flows in and out of each node
    const labels = Object.fromEntries(nodeKeys.map(key => {
        const inflow = links.filter(l => l.to === key).reduce((sum, l) => sum + l.count, 0);
        const outflow = links.filter(l => l.from === key).reduce((sum, l) => sum + l.count, 0);
        return [key, `${NODE_LABELS[baseKey(key)]} (${Math.max(inflow, outflow)})`];
    }));

    const chartData = {
        datasets: [
            {
                label: 'Application Flow',
                data: flows,
                labels,
                priority,
                column: columns,
                colorFrom: (ctx: { raw: SankeyDataPoint }) => NODE_COLORS[baseKey(ctx.raw.from)],
                colorTo: (ctx: { raw: SankeyDataPoint }) => NODE_COLORS[baseKey(ctx.raw.to)],
                colorMode: 'gradient' as const,
                alpha: 0.6,
                borderWidth: 0,
                nodeWidth: 12,
                nodePadding: 20,
                nodeLabels: {
                    color: themeColors.textColor,
                    font: { size: 13 },
                },
                parsing: { from: 'from', to: 'to', flow: 'flow' },
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false as const,
        plugins: {
            tooltip: {
                callbacks: {
                    title: () => '',
                    // Swatch shows the destination node's colour (the plugin leaves it white)
                    labelColor: ({ raw }: TooltipItem<'sankey'>) => {
                        const color = NODE_COLORS[baseKey((raw as DisplayFlow).to)];
                        return { backgroundColor: color, borderColor: color };
                    },
                    label: ({ raw }: TooltipItem<'sankey'>) => {
                        const { from, to, count } = raw as DisplayFlow;
                        return ` ${NODE_LABELS[baseKey(from)]} → ${NODE_LABELS[baseKey(to)]}: ${count}`;
                    },
                },
            },
        },
    };

    return (
        <div className="relative w-full h-[400px]">
            <Chart type="sankey" data={chartData} options={options} />
        </div>
    );
}
