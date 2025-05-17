import { useState } from "react";

interface MonthDataCopyProps {
  selectedMonth: number;
  selectedYear: number;
  availableYears: number[];
  onCopyMonth: (targetMonth: number, targetYear: number) => Promise<void>;
}

const MonthDataCopy = ({
  selectedMonth,
  selectedYear,
  availableYears,
  onCopyMonth,
}: MonthDataCopyProps) => {
  const [targetMonth, setTargetMonth] = useState<number>(
    selectedMonth === 11 ? 0 : selectedMonth + 1
  );
  const [targetYear, setTargetYear] = useState<number>(
    selectedMonth === 11 ? selectedYear + 1 : selectedYear
  );
  const [isCopying, setIsCopying] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => i);

  const getMonthName = (month: number) => {
    return new Date(2000, month).toLocaleString("default", { month: "long" });
  };

  const handleCopyMonth = async () => {
    if (
      (targetMonth === selectedMonth && targetYear === selectedYear) ||
      !window.confirm(
        `Are you sure you want to copy all data from ${getMonthName(
          selectedMonth
        )} ${selectedYear} to ${getMonthName(
          targetMonth
        )} ${targetYear}? This will overwrite any existing data in the target month.`
      )
    ) {
      return;
    }

    try {
      setIsCopying(true);
      await onCopyMonth(targetMonth, targetYear);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="month-data-copy p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Copy Month Data</h3>
      <p className="text-sm text-gray-600 mb-4">
        Copy all data from {getMonthName(selectedMonth)} {selectedYear} to
        another month
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Month
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={targetMonth}
            onChange={(e) => setTargetMonth(Number(e.target.value))}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Year
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleCopyMonth}
            disabled={
              isCopying ||
              (targetMonth === selectedMonth && targetYear === selectedYear)
            }
          >
            {isCopying ? "Copying..." : "Copy Month Data"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthDataCopy; 