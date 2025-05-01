import { format } from "date-fns";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface MonthData {
  days: {
    [date: string]: {
      [metric: string]: number;
    };
  };
  totals: {
    [metric: string]: number;
  };
}

interface MonthlyDataTabProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  monthData: MonthData | null;
  monthlyViewMode: "breakdown" | "bulk";
  setMonthlyViewMode: (mode: "breakdown" | "bulk") => void;
  bulkMonthValue: string;
  setBulkMonthValue: (value: string) => void;
  selectedMetric: string;
  setSelectedMetric: (metric: string) => void;
  isCurrentMonth: boolean;
  currentDayOfMonth: number;
  years: number[];
  months: number[];
  graphs: readonly string[];
  graphLabels: string[];
  formatNumberWithCommas: (num: number) => string;
  getMonthName: (month: number) => string;
  openModal: (type: "month", metric: string) => void;
  handleDayEdit: (day: string, metric: string, currentValue: number) => void;
  editingDay: string | null;
  editingMetric: string | null;
  dayValue: string;
  setDayValue: (value: string) => void;
  saveDayEdit: () => void;
  handleSaveAllPendingEdits?: (pendingEdits: Record<string, { metric: string; value: number }>) => Promise<void>;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

// Helper function to check for Firebase quota errors
const isFirebaseQuotaError = (error: unknown): boolean => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes("quota") || 
         errorMessage.includes("resource-exhausted") || 
         errorMessage.includes("429") ||  // HTTP 429 Too Many Requests
         errorMessage.includes("limit exceeded");
};

const MonthlyDataTab = ({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  monthData,
  monthlyViewMode,
  setMonthlyViewMode,
  bulkMonthValue,
  setBulkMonthValue,
  selectedMetric,
  setSelectedMetric,
  isCurrentMonth,
  currentDayOfMonth,
  years,
  months,
  graphs,
  graphLabels,
  formatNumberWithCommas,
  getMonthName,
  openModal,
  handleDayEdit,
  editingDay,
  editingMetric,
  dayValue,
  setDayValue,
  handleSaveAllPendingEdits,
  setLoading
}: MonthlyDataTabProps) => {
  // Local state for unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [pendingEdits, setPendingEdits] = useState<Record<string, {
    metric: string;
    value: number;
    originalValue: number;
  }>>({});
  
  // Local loading state for the button
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Fix the ref definition to use React.RefCallback
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // Effect to warn users about changing month with unsaved changes
  useEffect(() => {
    // Reset unsaved changes when month/year changes
    setHasUnsavedChanges(false);
    setPendingEdits({});
  }, [selectedMonth, selectedYear]);
  
  // Effect to focus the input when editingDay/editingMetric changes
  useEffect(() => {
    if (editingDay && editingMetric) {
      const key = `${editingDay}-${editingMetric}`;
      setTimeout(() => {
        if (inputRefs.current[key]) {
          inputRefs.current[key]?.focus();
        }
      }, 10);
    }
  }, [editingDay, editingMetric]);
  
  // Filter valid days in the month to prevent invalid dates like Jan 1, 2025
  const getValidDays = () => {
    if (!monthData) return {};
    
    const monthStart = new Date(selectedYear, selectedMonth, 1);
    const monthEnd = new Date(selectedYear, selectedMonth + 1, 0); // Last day of month
    
    const filteredDays: {[key: string]: {[key: string]: number}} = {};
    
    Object.entries(monthData.days).forEach(([dateStr, metrics]) => {
      const date = new Date(dateStr);
      // Only include dates that belong to the selected month and year
      if (date >= monthStart && date <= monthEnd) {
        filteredDays[dateStr] = metrics;
      }
    });
    
    return filteredDays;
  };
  
  // Handle month or year change with confirmation if there are unsaved changes
  const handleMonthYearChange = (type: 'month' | 'year', value: number) => {
    if (hasUnsavedChanges || Object.keys(pendingEdits).length > 0) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to switch to a different month?");
      if (!confirmed) return;
    }
    
    if (type === 'month') {
      setSelectedMonth(value);
    } else {
      setSelectedYear(value);
    }
    
    // Reset edits
    setPendingEdits({});
    setHasUnsavedChanges(false);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, day: string, metric: string) => {
    // Handle key navigation in the table
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Find current position in the table
      const cellKeys = Object.keys(getValidDays()).flatMap(day => 
        graphs.map(metric => `${day}-${metric}`)
      );
      
      const currentKey = `${day}-${metric}`;
      const currentIndex = cellKeys.indexOf(currentKey);
      
      // Save current value to pending edits if changed
      const currentValue = parseFloat(dayValue);
      if (!isNaN(currentValue) && editingDay && editingMetric) {
        const key = `${editingDay}-${editingMetric}`;
        const originalValue = pendingEdits[key]?.originalValue || 
                            (monthData?.days[editingDay]?.[editingMetric] || 0);
                            
        if (currentValue !== originalValue) {
          setPendingEdits(prev => ({
            ...prev,
            [key]: {
              metric: editingMetric,
              value: currentValue,
              originalValue
            }
          }));
          setHasUnsavedChanges(true);
        }
      }
      
      // Determine next cell based on shift key (backwards or forwards)
      let nextIndex;
      if (e.shiftKey) {
        // Move backwards
        nextIndex = currentIndex > 0 ? currentIndex - 1 : cellKeys.length - 1;
      } else {
        // Move forwards
        nextIndex = currentIndex < cellKeys.length - 1 ? currentIndex + 1 : 0;
      }
      
      // Get next cell coordinates
      const nextKey = cellKeys[nextIndex];
      const [nextDay, nextMetric] = nextKey.split('-');
      
      // Move to next cell
      handleDayEdit(nextDay, nextMetric, monthData?.days[nextDay]?.[nextMetric] || 0);
      
      // Focus the next input after a short delay to allow React to render
      setTimeout(() => {
        const input = inputRefs.current[nextKey];
        if (input) input.focus();
      }, 10);
    } 
    else if (e.key === 'Enter') {
      e.preventDefault();
      
      // Save current value to pending edits
      const currentValue = parseFloat(dayValue);
      if (!isNaN(currentValue) && editingDay && editingMetric) {
        const key = `${editingDay}-${editingMetric}`;
        const originalValue = pendingEdits[key]?.originalValue || 
                             (monthData?.days[editingDay]?.[editingMetric] || 0);
                             
        if (currentValue !== originalValue) {
          setPendingEdits(prev => ({
            ...prev,
            [key]: {
              metric: editingMetric,
              value: currentValue,
              originalValue
            }
          }));
          setHasUnsavedChanges(true);
        }
      }
      
      // Clear edit state without saving to backend
      handleDayEdit("", "", 0);
    }
    else if (e.key === 'Escape') {
      // Cancel editing without saving
      handleDayEdit("", "", 0);
    }
  };
  
  // Batch save all pending edits - ONLY triggered by Save All Changes button
  const saveAllPendingEdits = async () => {
    const pendingEditsCount = Object.keys(pendingEdits).length;
    if (pendingEditsCount === 0) {
      alert("No changes to save");
      return;
    }

    try {
      // First ensure we're not in editing mode
      if (editingDay && editingMetric) {
        // Add current edit to pending edits before saving
        const currentValue = parseFloat(dayValue);
        if (!isNaN(currentValue)) {
          const key = `${editingDay}-${editingMetric}`;
          const originalValue = monthData?.days[editingDay]?.[editingMetric] || 0;
          
          pendingEdits[key] = {
            metric: editingMetric,
            value: currentValue,
            originalValue
          };
          
          // Clear edit state
          handleDayEdit("", "", 0);
        }
      }
      
      // Set loading states - both local and parent
      setIsSaving(true);
      if (setLoading) setLoading(true);
      
      // Format the pending edits for the parent handler
      const formattedEdits: Record<string, { metric: string; value: number }> = {};
      
      // Track edits being sent for better user feedback
      console.log(`Preparing to save ${Object.keys(pendingEdits).length} changes`);
      
      for (const [key, edit] of Object.entries(pendingEdits)) {
        formattedEdits[key] = {
          metric: edit.metric,
          value: edit.value
        };
        console.log(`Edit for ${key}: ${edit.value} (was ${edit.originalValue})`);
      }
      
      // Call the parent's handler to save changes to the backend
      if (!handleSaveAllPendingEdits) {
        throw new Error("Save function not available");
      }
      
      // Wait for all changes to be saved
      await handleSaveAllPendingEdits(formattedEdits);
      
      // Clear pending edits and reset state after successful save
      setPendingEdits({});
      setHasUnsavedChanges(false);
      
      console.log("All changes saved successfully!");
      
      setIsSaving(false);
      if (setLoading) setLoading(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      setIsSaving(false);
      if (setLoading) setLoading(false);
      
      // Provide specific error messages
      if (isFirebaseQuotaError(error)) {
        alert("Firebase quota exceeded. Please try again later or contact support.");
      } else {
        alert(`Failed to save changes: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  // Cell edit handler - should NOT save to backend, only update local state
  const handleCellEdit = (day: string, metric: string, currentValue: number) => {
    // If we already have a pending edit for this cell, use that value
    const pendingValue = pendingEdits[`${day}-${metric}`]?.value;
    
    // Call the parent's handleDayEdit to update editing state
    handleDayEdit(day, metric, pendingValue !== undefined ? pendingValue : currentValue);
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDayValue(newValue);
    
    // Update pending edits if we're editing a cell
    if (editingDay && editingMetric) {
      const key = `${editingDay}-${editingMetric}`;
      const currentValue = parseFloat(newValue);
      
      if (!isNaN(currentValue)) {
        const originalValue = pendingEdits[key]?.originalValue || 
                             (monthData?.days[editingDay]?.[editingMetric] || 0);
                             
        // Only mark as changed if value is different from original
        if (currentValue !== originalValue) {
          setPendingEdits(prev => ({
            ...prev,
            [key]: {
              metric: editingMetric,
              value: currentValue,
              originalValue
            }
          }));
          setHasUnsavedChanges(true);
        } else {
          // If value is back to original, remove from pending edits
          if (pendingEdits[key]) {
            const newPendingEdits = {...pendingEdits};
            delete newPendingEdits[key];
            setPendingEdits(newPendingEdits);
            
            // Only clear unsaved changes flag if no pending edits remain
            if (Object.keys(newPendingEdits).length === 0) {
              setHasUnsavedChanges(false);
            }
          }
        }
      }
    }
  };

  // Save a single day edit
  const saveDayEdit = () => {
    if (!editingDay || !editingMetric) return;
    
    const currentValue = parseFloat(dayValue);
    if (isNaN(currentValue)) {
      alert("Please enter a valid number");
      return;
    }
    
    try {
      // Add the current edit to pending edits
      const key = `${editingDay}-${editingMetric}`;
      const originalValue = monthData?.days[editingDay]?.[editingMetric] || 0;
      
      if (currentValue !== originalValue) {
        setPendingEdits(prev => ({
          ...prev,
          [key]: {
            metric: editingMetric,
            value: currentValue,
            originalValue
          }
        }));
        setHasUnsavedChanges(true);
      }
      
      // Clear editing state but don't save to backend yet
      handleDayEdit("", "", 0);
    } catch (error) {
      console.error("Error saving day edit:", error);
      alert("Failed to save edit. Please try again.");
    }
  };

  return (
    <div className="tab-content bg-white shadow rounded-lg p-4 md:p-6">
      <div className="section-header mb-6">
        <h2 className="text-xl font-bold text-gray-800">Monthly Data</h2>
        <p className="text-gray-600 text-sm">
          View and edit data for an entire month
        </p>
      </div>

      <div className="month-select mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Month
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={selectedMonth}
            onChange={(e) => handleMonthYearChange('month', parseInt(e.target.value))}
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Year
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={selectedYear}
            onChange={(e) => handleMonthYearChange('year', parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {monthData && (
        <div className="month-data">
          <h3 className="text-lg font-semibold mb-4">
            Monthly Totals for {getMonthName(selectedMonth)} {selectedYear}
          </h3>

          <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {graphs.map((metric, index) => (
              <div
                key={metric}
                className="metric-card p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                onClick={() => openModal("month", metric)}
              >
                <h3 className="text-lg font-medium text-gray-800 capitalize">
                  {graphLabels[index]}
                </h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatNumberWithCommas(monthData.totals[metric] || 0)}
                </p>
                <div className="text-right mt-3">
                  <button className="text-sm text-blue-500 hover:text-blue-700">
                    Edit Monthly Total
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-switcher mb-4 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">
              View Mode:
            </div>
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border ${
                  monthlyViewMode === "bulk"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                } rounded-l-lg focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-blue-700`}
                onClick={() => {
                  if (hasUnsavedChanges || Object.keys(pendingEdits).length > 0) {
                    const confirmed = window.confirm("You have unsaved changes. Are you sure you want to switch views?");
                    if (!confirmed) return;
                  }
                  setMonthlyViewMode("bulk");
                  setPendingEdits({});
                  setHasUnsavedChanges(false);
                }}
              >
                Bulk Distribution
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium border ${
                  monthlyViewMode === "breakdown"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                } rounded-r-lg focus:z-10 focus:ring-2 focus:ring-blue-500 focus:text-blue-700`}
                onClick={() => {
                  if (hasUnsavedChanges || Object.keys(pendingEdits).length > 0) {
                    const confirmed = window.confirm("You have unsaved changes. Are you sure you want to switch views?");
                    if (!confirmed) return;
                  }
                  setMonthlyViewMode("breakdown");
                  setPendingEdits({});
                  setHasUnsavedChanges(false);
                }}
              >
                Daily Breakdown
              </button>
            </div>
          </div>

          {monthlyViewMode === "bulk" ? (
            <div className="bulk-distribution-view mt-8">
              <h3 className="text-lg font-semibold mb-4">
                Bulk Distribution
              </h3>
              <p className="text-gray-600 mb-4">
                {isCurrentMonth
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
                    onChange={(e) => setSelectedMetric(e.target.value)}
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
                      onClick={() => openModal("month", selectedMetric)}
                      disabled={!selectedMetric}
                    >
                      Distribute
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This will evenly distribute the total across{" "}
                    {isCurrentMonth
                      ? `only the first ${currentDayOfMonth} days`
                      : "all days"}{" "}
                    in {getMonthName(selectedMonth)}.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="daily-breakdown mt-8">
              <h3 className="text-lg font-semibold mb-4">
                Daily Breakdown
              </h3>
              <p className="text-gray-600 mb-4">
                Click on any value in the table to edit it directly. Use Tab to navigate between cells.
                {hasUnsavedChanges && (
                  <span className="ml-2 text-blue-600 font-medium">
                    <span className="inline-block w-3 h-3 bg-blue-600 rounded-full animate-pulse mr-1 align-middle"></span>
                    You have unsaved changes
                  </span>
                )}
              </p>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      {graphLabels.map((label) => (
                        <th
                          key={label}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(getValidDays()).map(
                      ([day, metrics]) => (
                        <tr key={day} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {format(new Date(day), "MMM d, yyyy")}
                          </td>
                          {graphs.map((metric) => {
                            const key = `${day}-${metric}`;
                            return (
                              <td
                                key={key}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {editingDay === day &&
                                editingMetric === metric ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      ref={(el) => { inputRefs.current[key] = el; }}
                                      type="number"
                                      className="w-24 p-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={dayValue}
                                      onChange={handleInputChange}
                                      onKeyDown={(e) => handleKeyDown(e, day, metric)}
                                      autoFocus
                                    />
                                    <button
                                      className="p-1 text-green-600 hover:text-green-800"
                                      onClick={() => {
                                        // Add current edit to pending edits
                                        const currentValue = parseFloat(dayValue);
                                        if (!isNaN(currentValue) && editingDay && editingMetric) {
                                          const key = `${editingDay}-${editingMetric}`;
                                          const originalValue = pendingEdits[key]?.originalValue || 
                                                           (monthData?.days[editingDay]?.[editingMetric] || 0);
                                                           
                                          if (currentValue !== originalValue) {
                                            setPendingEdits(prev => ({
                                              ...prev,
                                              [key]: {
                                                metric: editingMetric,
                                                value: currentValue,
                                                originalValue
                                              }
                                            }));
                                            setHasUnsavedChanges(true);
                                          }
                                        }
                                        
                                        // Clear edit state without saving to backend
                                        handleDayEdit("", "", 0);
                                      }}
                                      title="Add to pending changes"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      className="p-1 text-red-600 hover:text-red-800"
                                      onClick={() => {
                                        // Reset editing state
                                        handleDayEdit("", "", 0);
                                      }}
                                      title="Cancel"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    className="flex items-center group"
                                    onClick={() =>
                                      handleCellEdit(
                                        day,
                                        metric,
                                        metrics[metric] || 0
                                      )
                                    }
                                  >
                                    <span className={`cursor-pointer ${pendingEdits[`${day}-${metric}`] ? 'text-blue-600 font-semibold' : ''}`}>
                                      {formatNumberWithCommas(
                                        pendingEdits[`${day}-${metric}`]?.value !== undefined
                                          ? pendingEdits[`${day}-${metric}`].value
                                          : metrics[metric] || 0
                                      )}
                                    </span>
                                    <button
                                      className="ml-2 p-1 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Edit"
                                    >
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Instructions for users */}
              <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">How to edit values:</h3>
                    <div className="mt-2 text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Click on any value to edit it</li>
                        <li>Press <span className="font-bold">Enter</span> or click the checkmark to confirm the edit</li>
                        <li>Press <span className="font-bold">Tab</span> to navigate between cells</li>
                        <li>Press <span className="font-bold">Escape</span> to cancel the edit</li>
                        <li>Modified values will appear in <span className="text-blue-600 font-medium">blue</span></li>
                        <li>Click <span className="font-bold">SAVE ALL CHANGES</span> to submit all edits to the server</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Common Submit Button */}
              {(hasUnsavedChanges || Object.keys(pendingEdits).length > 0) && (
                <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
                  <div className="container mx-auto flex justify-between items-center">
                    <div className="font-medium text-gray-700">
                      <span className="text-blue-600 font-bold">{Object.keys(pendingEdits).length}</span> unsaved {Object.keys(pendingEdits).length === 1 ? 'change' : 'changes'}
                    </div>
                    <button
                      onClick={saveAllPendingEdits}
                      disabled={isSaving}
                      className={`px-8 py-3 rounded-md transition-all font-bold text-lg shadow-lg flex items-center
                        ${isSaving
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          SAVING CHANGES...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          SAVE ALL CHANGES
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Add padding at bottom when save button is shown for better UX */}
              {(hasUnsavedChanges || Object.keys(pendingEdits).length > 0) && (
                <div className="h-20"></div> // Space to prevent content from being hidden behind fixed button
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyDataTab; 