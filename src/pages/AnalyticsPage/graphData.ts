// Assuming `yesterday` and `today` are defined as Date objects
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const today = new Date();

// Generate time labels (e.g., ["12 AM", "1 AM", "2 AM", ..., "11 PM"])
const timeLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour}:00 ${period}`;
});

// Raw data structure
export const graphRow1Data = {
    labels: timeLabels, // X-axis labels (time in hours)
    datasets: [
        {
            label: new Date(today).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", 12:00 AM", // Label for the dataset
            data: Array.from({ length: 24 }, () => 0), // Y-axis values (all 0 for now)
        },
        {
            label: new Date(yesterday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", 12:00 AM", // Label for the dataset
            data: Array.from({ length: 24 }, () => 0), // Y-axis values (all 0 for now)
        },
    ],
};

export const graphRow2Data = {
    labels: timeLabels,
    datasets: [
        {
            label: new Date(today).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", 12:00 AM", // Label for the dataset
            data: Array.from({ length: 24 }, () => 0), // Y-axis values (all 0 for now)
        },
        {
            label: new Date(yesterday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ", 12:00 AM", // Label for the dataset
            data: Array.from({ length: 24 }, () => 0), // Y-axis values (all 0 for now)
        },
    ],
};