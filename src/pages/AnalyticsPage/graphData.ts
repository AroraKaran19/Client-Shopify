import { differenceInDays } from "date-fns";

// Generate time labels (e.g., ["12 AM", "1 AM", "2 AM", ..., "11 PM"])
const timeLabels = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 === 0 ? 12 : i % 12;
  const period = i < 12 ? "AM" : "PM";
  return `${hour}:00 ${period}`;
});

const generateDataset = (date: Date) => {
  const label = `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;
  const data = Array.from({ length: 24 }, () => 0);
  return {
    label: label,
    data: data,
  };
};


function generateDatasets(date1: Date, date2: Date) {
    const datasets = [];
    const startDate = new Date(date1);
    const endDate = new Date(date2);
    const diff = differenceInDays(endDate, startDate) + 1;
    for (let i = 0; i < diff; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        datasets.push(generateDataset(date));
    }
    return datasets;
}

export function generateData(date1: Date, date2: Date) {
  const graphLabels = timeLabels;
  const dataset = generateDatasets(date1, date2);
  return {
    labels: graphLabels,
    datasets: dataset,
  };
}