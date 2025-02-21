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
    data: number[];
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

const MultiAxisChart = ({ data, minMax, steps }: { data: ChartData, minMax?: { min: number; max: number }, steps?: number }) => {
  const chartData = {
    labels: data.labels, // Use the time labels from the raw data
    datasets: data.datasets.map((dataset, _) => ({
        label: dataset.label, // Use the date as the label
        data: dataset.data, // Use the y-axis values
        fill: false,
        backgroundColor: "#fff",
        borderColor: "#4eb5e2",
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
        display: true,
        position: 'bottom' as const,
        labels: {
          font: {
            size: 11,
            color: "#70707b",
          },
        },
      },
    },
    scales: {
      y: {
        min: minMax?.min ?? 0,
        max: minMax?.max ?? undefined,
        grid: {
          display: true,
          color: "#ddd",
        },
        ticks: {
          stepSize: steps ?? 5,
          beginAtZero: true,
          font: {
            size: 11,
            color: "#70707b",
          },
          color: "#aaa",
          callback: function(value: any) {
            return '₹' + value; // Add the rupee symbol before the value
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

export default MultiAxisChart;