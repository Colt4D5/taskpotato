"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { Task } from "@/types";
import { msToHMS } from "@/lib/formatTime";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "#E8763A",
  "#4E9AF1",
  "#A78BFA",
  "#34D399",
  "#FB923C",
  "#60A5FA",
  "#F472B6",
  "#FBBF24",
  "#2DD4BF",
  "#C084FC",
];

interface PieChartProps {
  tasks: Task[];
  getLiveMs: (id: string) => number;
}

export default function PieChart({ tasks, getLiveMs }: PieChartProps) {
  const chartRef = useRef<ChartJS<"pie"> | null>(null);

  const eligible = tasks.filter((t) => getLiveMs(t.id) > 0);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  if (eligible.length === 0) return null;

  const data: ChartData<"pie"> = {
    labels: eligible.map((t) => t.title),
    datasets: [
      {
        data: eligible.map((t) => getLiveMs(t.id)),
        backgroundColor: eligible.map((_, i) => COLORS[i % COLORS.length]),
        borderColor: "#1a1a1a",
        borderWidth: 2,
      },
    ],
  };

  return (
    <details className="mb-8 group">
      <summary className="cursor-pointer text-gray-400 text-sm font-semibold uppercase tracking-wider hover:text-[#E8763A] transition-colors select-none list-none flex items-center gap-2">
        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
        Time Distribution
      </summary>
      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="w-64 h-64">
          <Pie
            ref={chartRef}
            data={data}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#9ca3af",
                    padding: 12,
                    font: { size: 12 },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const ms = ctx.raw as number;
                      return ` ${msToHMS(ms)}`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </details>
  );
}
