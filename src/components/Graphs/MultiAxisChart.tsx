import { formatCurrency } from "@/pages/AnalyticsPage/utils";
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

export type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[] | number;
  }[];
};

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const MultiAxisChart = ({
  data,
  minMax,
  steps,
  smallGraph,
  className,
  showTooltip=true,
  showLabel=false,
}: {
  data: ChartData;
  minMax?: { min?: number; max?: number };
  steps?: number;
  smallGraph?: boolean;
  className?: string;
  showTooltip?: boolean;
  showLabel?: boolean;
}) => {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, _) => ({
      label: dataset.label, // Use the date as the label
      data: dataset.data, // Use the y-axis values
      fill: false,
      backgroundColor: "#fff",
      borderColor: "#4eb5e2",
      tension: 0.2,
      pointRadius: 0,
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    interaction: {
      intersect: false,
    },
    stacked: false,
    plugins: {
      legend: {
        display: smallGraph ? false : true,
        position: "bottom" as const,
        labels: {
          font: {
            size: 11,
            color: "#70707b",
          },
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        enabled: showTooltip,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              if (showLabel) {
                label = " ";
              } else {
                label += ": ";
              }
            }
            if (context.parsed.y !== null) {
              label += Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        display: smallGraph ? false : true,
        min: minMax?.min ?? 0,
        max: minMax?.max ?? undefined,
        grid: {
          display: smallGraph ? false : true,
          color: "#ddd",
        },
        ticks: {
          stepSize: steps || undefined,
          beginAtZero: true,
          font: {
            size: 11,
            color: "#70707b",
          },
          color: "#aaa",
          callback: function (value: any) {
            return formatCurrency(value); // Add the rupee symbol before the value
          },
        },
      },
      x: {
        display: smallGraph ? false : true,
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 11,
          },
        },
        offset: false,
      },
    },
  };

  return (
    <Line
      data={chartData}
      height={100}
      width={100}
      options={{ ...options, maintainAspectRatio: false }}
      className={"max-w-full max-h-full " + className}
    />
  );
};

export default MultiAxisChart;
