import { format } from "date-fns";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import MonthDataCopy from "./MonthDataCopy";

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
  handleSaveAllPendingEdits?: (pendingEdits: Record<string, { metric: string; value: number }>) => Promise<boolean | void>;
  onCopyMonth?: (targetMonth: number, targetYear: number) => Promise<void>;
}

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
  onCopyMonth
}: MonthlyDataTabProps) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingEdits, setPendingEdits] = useState<{
    [key: string]: { metric: string; value: number; originalValue: number };
  }>({});
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
    
    // Format month start/end to YYYY-MM-DD for string comparison
    const monthStartStr = format(monthStart, "yyyy-MM");
    
    // Filter days to only include days from the selected month
    Object.entries(monthData.days).forEach(([dateStr, metrics]) => {
      // Check if the date belongs to the current month by comparing year-month
      if (dateStr.startsWith(monthStartStr)) {
        filteredDays[dateStr] = metrics;
      }
    });
    
    // If we don't have entries for all days in the month, fill in the missing ones
    const daysInMonth = monthEnd.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateStr = format(date, "yyyy-MM-dd");
      
      if (!filteredDays[dateStr]) {
        // Add empty data for this day
        filteredDays[dateStr] = {};
        
        // Initialize all metrics to zero
        graphs.forEach(metric => {
          filteredDays[dateStr][metric] = 0;
        });
      }
    }
    
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
    // Process Tab or Arrow key navigation
    if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        // Prevent default behavior for Tab and vertical arrows
        e.preventDefault();
      }
      
      // Save current cell value to pendingEdits but DON'T send to backend
      const currentValue = Math.round(parseFloat(dayValue));
      if (!isNaN(currentValue) && editingDay && editingMetric) {
        const key = `${editingDay}-${editingMetric}`;
        const originalValue = pendingEdits[key]?.originalValue || 
                            (monthData?.days[editingDay]?.[editingMetric] || 0);
        
        // Only track as pending edit if the value has changed
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
      
      // Get all the days and metrics to determine next/previous cell
      const days = Object.keys(getValidDays()).sort();
      const dayIndex = days.indexOf(day);
      const metricIndex = graphs.indexOf(metric);
      
      // Calculate next cell indices based on key pressed
      let nextDayIndex = dayIndex;
      let nextMetricIndex = metricIndex;
      
      if (e.key === 'Tab' && e.shiftKey) {
        // Shift+Tab - Move up
        if (dayIndex > 0) {
          // If not at the first day, go up one day in the same column
          nextDayIndex = dayIndex - 1;
        } else {
          // If at the first day of a column, go to the previous column's last day
          if (metricIndex > 0) {
            nextMetricIndex = metricIndex - 1;
            nextDayIndex = days.length - 1;
          } else {
            // If at the first day of the first column, wrap to the last day of the last column
            nextMetricIndex = graphs.length - 1;
            nextDayIndex = days.length - 1;
          }
        }
      } else if (e.key === 'Tab' || e.key === 'ArrowDown') {
        // Tab or Down Arrow - Move down
        if (dayIndex < days.length - 1) {
          // If not at the last day, go down one day in the same column
          nextDayIndex = dayIndex + 1;
        } else {
          // If at the last day of a column, go to the next column's first day
          if (metricIndex < graphs.length - 1) {
            nextMetricIndex = metricIndex + 1;
            nextDayIndex = 0;
          } else {
            // If at the last day of the last column, wrap to the first day of the first column
            nextMetricIndex = 0;
            nextDayIndex = 0;
          }
        }
      } else if (e.key === 'ArrowUp') {
        // Up Arrow - Move up
        if (dayIndex > 0) {
          nextDayIndex = dayIndex - 1;
        } else {
          // When at the top of a column, wrap to the bottom of the same column
          nextDayIndex = days.length - 1;
        }
      } else if (e.key === 'ArrowLeft') {
        // Left Arrow - Move to previous column, same row
        if (metricIndex > 0) {
          nextMetricIndex = metricIndex - 1;
        } else {
          // If at the first column, wrap to the last column
          nextMetricIndex = graphs.length - 1;
        }
      } else if (e.key === 'ArrowRight') {
        // Right Arrow - Move to next column, same row
        if (metricIndex < graphs.length - 1) {
          nextMetricIndex = metricIndex + 1;
        } else {
          // If at the last column, wrap to the first column
          nextMetricIndex = 0;
        }
      }
      
      // If we found a valid next cell
      if (nextDayIndex >= 0 && nextDayIndex < days.length && 
          nextMetricIndex >= 0 && nextMetricIndex < graphs.length) {
        const nextDay = days[nextDayIndex];
        const nextMetric = graphs[nextMetricIndex];
        
        // Move to the next cell without saving to backend
        const nextValue = Number(pendingEdits[`${nextDay}-${nextMetric}`]?.value) || 
                       Number(monthData?.days[nextDay]?.[nextMetric]) || 0;
                       
        handleDayEdit(nextDay, nextMetric, nextValue);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // On Enter, add to pending edits but don't save to backend yet
      const currentValue = Math.round(parseFloat(dayValue));
      if (!isNaN(currentValue) && editingDay && editingMetric) {
        const key = `${editingDay}-${editingMetric}`;
        const originalValue = pendingEdits[key]?.originalValue || 
                            (monthData?.days[editingDay]?.[editingMetric] || 0);
        
        // Only track as pending edit if the value has changed
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
        
        // Clear edit state but don't save to backend
        handleDayEdit("", "", 0);
      }
    } else if (e.key === 'Escape') {
      // Cancel editing on Escape key
      e.preventDefault();
      handleDayEdit("", "", 0);
    }
  };
  
  // Batch save all pending edits - triggered by the Save button
  const saveAllPendingEdits = async () => {
    console.log("saveAllPendingEdits called with:", pendingEdits);
    
    if (Object.keys(pendingEdits).length === 0) {
      console.log("No pending edits to save");
      return;
    }
    
    // If we're currently editing a cell, add it to pending edits
    if (editingDay && editingMetric) {
      const key = `${editingDay}-${editingMetric}`;
      const currentValue = Math.round(parseFloat(dayValue));
      if (!isNaN(currentValue)) {
        const originalValue = pendingEdits[key]?.originalValue || 
                            (monthData?.days[editingDay]?.[editingMetric] || 0);
                            
        if (currentValue !== originalValue) {
          // Clone the pendingEdits object to avoid direct state mutation
          const updatedPendingEdits = { ...pendingEdits };
          updatedPendingEdits[key] = {
            metric: editingMetric,
            value: currentValue,
            originalValue
          };
          setPendingEdits(updatedPendingEdits);
          console.log(`Added current edit for ${key}: ${currentValue}`);
        }
      }
      
      // Clear edit state
      handleDayEdit("", "", 0);
    }
    
    // Create a simplified version of pendingEdits without originalValue for parent component
    const simplifiedEdits: Record<string, { metric: string; value: number }> = {};
    
    for (const key in pendingEdits) {
      const { metric, value } = pendingEdits[key];
      simplifiedEdits[key] = { 
        metric, 
        value: Math.round(value) // Ensure all values are integers
      };
      console.log(`Preparing to save ${key}: ${metric} = ${Math.round(value)}`);
    }
    
    console.log("Processing edits:", simplifiedEdits);
    
    if (handleSaveAllPendingEdits) {
      try {
        console.log("Calling parent handleSaveAllPendingEdits with:", simplifiedEdits);
        // Pass the simplified edits to the parent function
        const saveSuccess = await handleSaveAllPendingEdits(simplifiedEdits);
        
        // Only clear pendingEdits after successful save
        if (saveSuccess !== false) {
          setPendingEdits({});
          setHasUnsavedChanges(false);
          console.log("All changes saved successfully via parent handler");
        } else {
          console.log("Some edits may have failed, keeping unsaved changes state");
        }
      } catch (error) {
        console.error("Error during save:", error);
        alert(`Failed to save changes: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
      }
    } else {
      console.error("No handleSaveAllPendingEdits provided by parent component");
      alert("Cannot save changes - save function not available");
    }
  };

  // Cell edit handler - should NOT save to backend, only update local state
  const handleCellEdit = (day: string, metric: string, currentValue: number) => {
    // If we're already editing a cell, save that edit first
    if (editingDay && editingMetric) {
      const key = `${editingDay}-${editingMetric}`;
      const value = parseFloat(dayValue);
      
      if (!isNaN(value)) {
        const originalValue = pendingEdits[key]?.originalValue || 
                           (monthData?.days[editingDay]?.[editingMetric] || 0);
                            
        // Only track as pending edit if the value has changed
        if (value !== originalValue) {
          setPendingEdits(prev => ({
            ...prev,
            [key]: {
              metric: editingMetric,
              value: value,
              originalValue
            }
          }));
          setHasUnsavedChanges(true);
        }
      }
    }
    
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
      const currentValue = Math.round(parseFloat(newValue));
      
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
  };

  return (
    <div className="tab-content bg-white shadow rounded-lg p-4 md:p-6">
      <div className="section-header mb-6">
        <h2 className="text-xl font-bold text-gray-800">Monthly Data</h2>
        <p className="text-gray-600 text-sm">
          View and edit data for an entire month
        </p>
      </div>

      <div className="month-selector mb-6 flex flex-wrap md:flex-nowrap items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Month
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={selectedMonth}
            onChange={(e) => handleMonthYearChange('month', Number(e.target.value))}
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
            Select Year
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={selectedYear}
            onChange={(e) => handleMonthYearChange('year', Number(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Data Copy Component */}
      {onCopyMonth && (
        <MonthDataCopy
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          availableYears={years}
          onCopyMonth={onCopyMonth}
        />
      )}

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
                Enter the total value for {getMonthName(
                  selectedMonth
                )} {selectedYear}. This value will be distributed evenly across all days of the month.
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
                    This will evenly distribute the total across all days in {getMonthName(selectedMonth)}.
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
                Click on any value in the table to edit it directly. Use Tab to navigate down through cells (moves to next column at the bottom). Use arrow keys for navigation in all directions.
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
                    {Object.entries(getValidDays())
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([day, metrics]) => (
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
                                  <div className="flex items-center">
                                    <input
                                      ref={(el) => { inputRefs.current[key] = el; }}
                                      type="number"
                                      className="w-24 p-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={dayValue}
                                      onChange={handleInputChange}
                                      onKeyDown={(e) => handleKeyDown(e, day, metric)}
                                      onBlur={() => {
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
                                      autoFocus
                                    />
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
              
              {/* Edits info section */}
              {(hasUnsavedChanges || Object.keys(pendingEdits).length > 0) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-blue-700">
                      <p className="font-medium">You have {Object.keys(pendingEdits).length} unsaved changes</p>
                      <p className="text-sm">Click on a cell to edit, press Tab to move between cells, Enter to confirm, or Escape to cancel.</p>
                    </div>
                    <button
                      onClick={saveAllPendingEdits}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MonthlyDataTab; 