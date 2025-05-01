import { format } from "date-fns";
import { useState } from "react";

interface DailyDataTabProps {
  date: string;
  setDate: (date: string) => void;
  entryMethod: "day" | "hour";
  setEntryMethod: (method: "day" | "hour") => void;
  dayData: Record<string, number>;
  graphs: readonly string[];
  graphLabels: string[];
  formatNumberWithCommas: (num: number) => string;
  openModal: (type: "day" | "hour", metric: string) => void;
}

const DailyDataTab = ({
  date,
  setDate,
  entryMethod,
  setEntryMethod,
  dayData,
  graphs,
  graphLabels,
  formatNumberWithCommas,
  openModal
}: DailyDataTabProps) => {
  return (
    <div className="tab-content bg-white shadow rounded-lg p-4 md:p-6">
      <div className="section-header mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Daily Data Entry
        </h2>
        <p className="text-gray-600 text-sm">
          Enter data for a specific day
        </p>
      </div>

      <div className="date-select mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Date
        </label>
        <input
          type="date"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={format(new Date(), "yyyy-MM-dd")}
        />
      </div>

      <div className="entry-method mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Entry Method
        </label>
        <div className="flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-500"
              name="entryMethod"
              checked={entryMethod === "day"}
              onChange={() => setEntryMethod("day")}
            />
            <span className="ml-2">Daily Totals</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-blue-500"
              name="entryMethod"
              checked={entryMethod === "hour"}
              onChange={() => setEntryMethod("hour")}
            />
            <span className="ml-2">Hourly Breakdown</span>
          </label>
        </div>
      </div>

      {date && (
        <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {graphs.map((metric, index) => (
            <div
              key={metric}
              className="metric-card p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
              onClick={() => openModal(entryMethod, metric)}
            >
              <h3 className="text-lg font-medium text-gray-800 capitalize">
                {graphLabels[index]}
              </h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatNumberWithCommas(
                  dayData[metric] || 0
                )}
              </p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">
                  {format(new Date(date), "MMMM d, yyyy")}
                </span>
                <button className="text-sm text-blue-500 hover:text-blue-700">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyDataTab; 