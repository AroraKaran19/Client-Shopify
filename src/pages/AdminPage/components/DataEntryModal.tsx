import { format } from "date-fns";
import XMarkIcon from "@/assets/svg/XMarkIcon";

interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: "day" | "hour" | "month";
  selectedMetric: string;
  date: string;
  timeLabels: string[];
  dayData: Record<string, number>;
  hourlyData: any;
  editableHourlyData: number[];
  setEditableHourlyData: (data: number[]) => void;
  bulkMonthValue: string;
  setBulkMonthValue: (value: string) => void;
  selectedMonth: number;
  selectedYear: number;
  currentDayOfMonth: number;
  isCurrentMonth: boolean;
  saveDailyValue: () => void;
  saveHourlyData: () => void;
  saveMonthlyData: () => void;
  onSelectMetric: (metric: string) => void;
  graphLabels: string[];
  graphs: readonly string[];
  getMonthName: (month: number) => string;
}

const DataEntryModal = ({
  isOpen,
  onClose,
  modalType,
  selectedMetric,
  date,
  timeLabels,
  editableHourlyData,
  setEditableHourlyData,
  bulkMonthValue,
  setBulkMonthValue,
  selectedMonth,
  selectedYear,
  currentDayOfMonth,
  isCurrentMonth,
  saveDailyValue,
  saveHourlyData,
  saveMonthlyData,
  onSelectMetric,
  graphLabels,
  graphs,
  getMonthName
}: DataEntryModalProps) => {
  
  // Handle hourly data value change
  const handleHourlyDataChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    const newData = [...editableHourlyData];
    newData[index] = isNaN(numValue) ? 0 : numValue;
    setEditableHourlyData(newData);
  };

  // Save day data wrapper for modal
  const saveDayData = () => {
    saveDailyValue();
  };

  // Save monthly data wrapper for modal
  const saveMonthData = () => {
    saveMonthlyData();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-container bg-white w-full max-w-3xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="modal-header flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            {modalType === "day" &&
              `Edit Daily Total for ${selectedMetric
                .replace(/_/g, " ")
                .toUpperCase()}`}
            {modalType === "hour" &&
              `Edit Hourly Data for ${selectedMetric
                .replace(/_/g, " ")
                .toUpperCase()}`}
            {modalType === "month" &&
              `Edit Monthly Total for ${selectedMetric
                .replace(/_/g, " ")
                .toUpperCase()}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body p-4 overflow-y-auto">
          {/* Day/Month Value Editor */}
          {(modalType === "day" || modalType === "month") && (
            <div className="single-value-editor">
              <p className="mb-4 text-gray-600">
                {modalType === "day"
                  ? `Enter the total value for ${format(
                      new Date(date),
                      "MMMM d, yyyy"
                    )}.`
                  : isCurrentMonth
                  ? `Enter the total value for ${getMonthName(
                      selectedMonth
                    )} ${selectedYear} (first ${currentDayOfMonth} days only). This value will be distributed evenly across all days that have passed so far.`
                  : `Enter the total value for ${getMonthName(
                      selectedMonth
                    )} ${selectedYear}. This value will be distributed evenly across all days of the month.`}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Metric
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={selectedMetric}
                    onChange={(e) => onSelectMetric(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a metric
                    </option>
                    {graphs.map((metric, index) => (
                      <option key={metric} value={metric}>
                        {graphLabels[index]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Value
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={bulkMonthValue}
                      onChange={(e) => setBulkMonthValue(e.target.value)}
                      placeholder="Enter total value"
                      min="0"
                      step="0.01"
                    />
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      onClick={() => modalType === "day" ? saveDayData() : saveMonthData()}
                      disabled={!selectedMetric}
                    >
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {modalType === "month" && `This will evenly distribute the total across ${
                      isCurrentMonth
                        ? `only the first ${currentDayOfMonth} days`
                        : "all days"
                    } in ${getMonthName(selectedMonth)}.`}
                  </p>
                </div>
              </div>
            </div>
          )}
            
          {/* Hourly Data Editor */}
          {modalType === "hour" && (
            <div className="hourly-data-editor">
              <p className="mb-4 text-gray-600">
                Edit hourly values for {format(new Date(date), "MMMM d, yyyy")}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Time
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeLabels.map((time, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {time}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <input
                            type="number"
                            className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            value={editableHourlyData[index] || 0}
                            onChange={(e) => handleHourlyDataChange(index, e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="modal-footer flex justify-end gap-2 p-4 border-t">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataEntryModal; 