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
import { ChartData } from "./MultiAxisChart";
import { useMemo } from "react";

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

const MulitAxisChartPercent = ({
  data,
  showLabel,
  showTooltip,
  smallGraph,
  className,
}: {
  data: ChartData;
  showLabel?: boolean;
  showTooltip?: boolean;
  smallGraph?: boolean;
  className?: string;
}) => {
  // Calculate dynamic max and step values
  const { dynamicMax, stepSize } = useMemo(() => {
    // Extract all data values from datasets
    const allValues: number[] = [];
    data.datasets.forEach(dataset => {
      if (Array.isArray(dataset.data)) {
        allValues.push(...dataset.data);
      } else {
        allValues.push(dataset.data);
      }
    });

    if (allValues.length === 0) {
      return { dynamicMax: 100, stepSize: 10 };
    }

    const maxValue = Math.max(...allValues);
    
    // Calculate dynamic max with 100 as super max
    let calculatedMax;
    if (maxValue >= 100) {
      calculatedMax = 100;
    } else {
      calculatedMax = Math.min(100, maxValue + 2);
    }

    // Calculate step size based on the range
    const range = calculatedMax;
    let calculatedStepSize;
    if (range <= 10) {
      calculatedStepSize = 1;
    } else if (range <= 20) {
      calculatedStepSize = 2;
    } else if (range <= 50) {
      calculatedStepSize = 5;
    } else {
      calculatedStepSize = 50;
    }

    return { dynamicMax: calculatedMax, stepSize: calculatedStepSize };
  }, [data]);

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, _) => ({
      label: dataset.label,
      data: dataset.data,
      fill: false,
      backgroundColor: "#fff",
      borderColor: "#4eb5e2",
      tension: 0.4,
      pointRadius: 0,
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
          pointStyle: "line",
        },
      },
      tooltip: {
        enabled: showTooltip ?? true,
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
              label += context.parsed.y + "%";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        display: smallGraph ? false : true,
        min: 0,
        max: dynamicMax,
        grid: {
          display: smallGraph ? false : true,
          color: "#ddd",
        },
        ticks: {
          beginAtZero: true,
          stepSize: stepSize,
          font: {
            size: 11,
            color: "#70707b",
          },
          color: "#aaa",
          callback: function (value: any) {
            return Math.round(value) + "%";
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
      height={smallGraph ? 30 : 100}
      width={100}
      options={{ ...options, maintainAspectRatio: false }}
      className={`max-w-full max-h-full ${className}`}
    />
  );
};

export default MulitAxisChartPercent;
