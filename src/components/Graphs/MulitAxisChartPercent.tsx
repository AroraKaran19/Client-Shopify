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
}: {
  data: ChartData;
  showLabel?: boolean;
}) => {
  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, _) => ({
      label: dataset.label,
      data: dataset.data,
      fill: false,
      backgroundColor: "#fff",
      borderColor: "#4eb5e2",
    })),
  };

  const options = {
    responsive: true,
    stacked: false,
    plugins: {
      legend: {
        display: true,
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
        min: 0,
        max: 100,
        grid: {
          display: true,
          color: "#ddd",
        },
        ticks: {
          stepSize: 50,
          beginAtZero: true,
          font: {
            size: 11,
            color: "#70707b",
          },
          color: "#aaa",
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
      x: {
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
      className="max-w-full max-h-full"
    />
  );
};

export default MulitAxisChartPercent;
