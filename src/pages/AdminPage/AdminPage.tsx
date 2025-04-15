import XMarkIcon from "@/assets/svg/XMarkIcon";
import {
  addDayData,
  fetchData,
  readDayData,
  updateDateData,
  fetchAllData,
  getStoreSettings,
  updateStoreName,
  getAllStores,
  createStore,
  getStoreById,
} from "@/firebase/firebase";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getMonth,
  getYear,
} from "date-fns";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import StoreDataControls from "./components/StoreDataControls";
import StoreComparison from "./components/StoreComparison";

// Constants
const GRAPHS = [
  "gross_sales",
  "returning_customer_rate",
  "orders_fulfilled",
  "orders",
  "total_sales_over_time",
  "conversion_rate_over_time",
  "average_order_value_over_time",
];

const GRAPH_LABELS = [
  "Gross sales",
  "Returning customer rate",
  "Orders fulfilled",
  "Orders",
  "Total sales over time",
  "Conversion rate over time",
  "Average order value over time",
];

// Interfaces
interface DateData {
  gross_sales: { time: string; value: number }[];
  returning_customer_rate: { time: string; value: number }[];
  orders_fulfilled: { time: string; value: number }[];
  orders: { time: string; value: number }[];
  total_sales_over_time: { time: string; value: number }[];
  conversion_rate_over_time: { time: string; value: number }[];
  average_order_value_over_time: { time: string; value: number }[];
}

interface DayData {
  gross_sales?: number;
  returning_customer_rate?: number;
  orders_fulfilled?: number;
  orders?: number;
  total_sales_over_time?: number;
  conversion_rate_over_time?: number;
  average_order_value_over_time?: number;
}

interface StoreSettings {
  storeName: string;
  updatedAt: string;
}

interface DatasetItem {
  label: string;
  data: number[] | number;
}

interface RangeDataItem {
  dataset: DatasetItem[];
}

interface RangeData {
  [key: string]: RangeDataItem;
}

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

// Type for each tab in the admin interface
type TabType = "daily" | "monthly" | "settings";

// AdminPage Component
const AdminPage = () => {
  // Get store name from URL parameter
  const { storeId } = useParams<{ storeId?: string }>();
  const navigate = useNavigate();
  
  // Store management states
  const [availableStores, setAvailableStores] = useState<{id: string, name: string}[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string>("");
  
  // State for tab navigation
  const [activeTab, setActiveTab] = useState<TabType>("daily");

  // Common states
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"day" | "hour" | "month">("day");
  
  // Daily data states
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [entryMethod, setEntryMethod] = useState<"day" | "hour">("day");
  const [dayData, setDayData] = useState<DayData>({});
  const [hourlyData, setHourlyData] = useState<DateData | null>(null);
  const [editableHourlyData, setEditableHourlyData] = useState<number[]>([]);

  // Monthly data states
  const [selectedMonth, setSelectedMonth] = useState<number>(
    getMonth(new Date())
  );
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [bulkMonthValue, setBulkMonthValue] = useState<string>("");
  const [monthlyViewMode, setMonthlyViewMode] = useState<"breakdown" | "bulk">(
    "breakdown"
  );

  // Range data states
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });
  const [rangeData, setRangeData] = useState<RangeData | null>(null);

  // Settings states
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null
  );
  const [newStoreName, setNewStoreName] = useState<string>("");

  // Time labels for hourly data
  const timeLabels = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const period = i < 12 ? "AM" : "PM";
    return `${hour}:00 ${period}`;
  });

  // References
  const modalRef = useRef<HTMLDivElement>(null);
  
  // State for new store modal
  const [showNewStoreModal, setShowNewStoreModal] = useState<boolean>(false);

  // Add state for editing individual days
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [dayValue, setDayValue] = useState<string>("");

  // Function to handle tab change
  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      
      // Trigger a refresh of the relevant data
      if (currentStoreId) {
        if (tab === "settings") {
          // Refresh settings data
          const refreshSettings = async () => {
            try {
              setLoading(true);
              const settings = await getStoreSettings(currentStoreId);
              setStoreSettings(settings as StoreSettings);
              setNewStoreName(settings.storeName);
              setLoading(false);
            } catch (error) {
              console.error("Error refreshing settings:", error);
              setLoading(false);
            }
          };
          refreshSettings();
        } else if (tab === "daily") {
          // For daily data, toggle the entry method to force a refresh
          setLoading(true);
          const currentMethod = entryMethod;
          setEntryMethod(currentMethod === "day" ? "hour" : "day");
          setTimeout(() => {
            setEntryMethod(currentMethod);
            setLoading(false);
          }, 10);
        } else if (tab === "monthly") {
          // For monthly data, trigger a refresh by toggling the month temporarily
          setLoading(true);
          const currentMonth = selectedMonth;
          const nextMonth = (currentMonth + 1) % 12;
          setSelectedMonth(nextMonth);
          setTimeout(() => {
            setSelectedMonth(currentMonth);
            setLoading(false);
          }, 10);
        }
      }
    }
  };

  // Initialize store settings
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        setLoading(true);
        const settings = await getStoreSettings(currentStoreId || undefined);
        setStoreSettings(settings as StoreSettings);
        setNewStoreName(settings.storeName);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching store settings:", error);
        setLoading(false);
      }
    };

    if (currentStoreId || !storeId) {
      fetchStoreSettings();
    }
  }, [currentStoreId]);

  // Fetch available stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const stores = await getAllStores();
        setAvailableStores(stores);
        
        // If a store name is provided in the URL, find the matching store
        if (storeId) {
          // Make URL comparison more flexible
          const formattedUrlName = storeId.toLowerCase();
          const matchingStore = stores.find(store => {
            // Check direct name match
            if (store.name.toLowerCase() === formattedUrlName) return true;
            
            // Check URL-friendly version of the name
            const urlFriendlyName = store.name.toLowerCase().replace(/\s+/g, '-');
            return urlFriendlyName === formattedUrlName;
          });
          
          if (matchingStore) {
            setCurrentStoreId(matchingStore.id);
          } else {
            // If no matching store, try to create the store with this ID
            try {
              const newStore = await getStoreById(storeId);
              setAvailableStores(prevStores => [...prevStores, newStore]);
              setCurrentStoreId(newStore.id);
            } catch (error) {
              console.error("Error creating store from URL:", error);
              // If creation fails, redirect to main admin page
              navigate('/admin');
            }
          }
        } else if (stores.length > 0) {
          // If no store specified but stores exist, select the first one
          setCurrentStoreId(stores[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stores:", error);
        setLoading(false);
      }
    };
    
    fetchStores();
  }, [storeId, navigate]);

  useEffect(() => {
    if (date && entryMethod === "hour") {
      const main = document.querySelector("main");
      if (main) {
          main.style.overflowY = "hidden";
          main.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
  }, [date, entryMethod]);

  useEffect(() => {
    if (date && entryMethod === "day") {
    const fetchDayDataAsync = async () => {
        return readDayData(date, selectedMetric as keyof DayData, currentStoreId || undefined);
    };

      fetchDayDataAsync().then((result) => {
        setDayData({ [selectedMetric as keyof DayData]: result });
      });
    }
  }, [date, selectedMetric, currentStoreId]);

  useEffect(() => {
    if (date && entryMethod === "hour") {
      setLoading(true);
      const fetchDataAsync = async () => {
        return fetchData(date, currentStoreId || undefined);
      };

      fetchDataAsync()
        .then((result) => {
          const transformData = (metricKey: keyof typeof result) => {
          return timeLabels.map((time, index) => ({
            time,
              value: result[metricKey]?.[index] || 0,
          }));
        };

          // Create a full DateData object instead of a partial one
          const updatedHourlyData = hourlyData || {
            gross_sales: [],
            returning_customer_rate: [],
            orders_fulfilled: [],
            orders: [],
            total_sales_over_time: [],
            conversion_rate_over_time: [],
            average_order_value_over_time: [],
          };

          // Update only the selected metric
          updatedHourlyData[selectedMetric as keyof DateData] = transformData(
            selectedMetric as keyof typeof result
          );

          setHourlyData(updatedHourlyData);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          setLoading(false);
        });
    }
  }, [date, selectedMetric, currentStoreId]);

  useEffect(() => {
    const fetchRangeDataAsync = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      try {
        setLoading(true);
        const result = await fetchAllData(
          dateRange.startDate,
          dateRange.endDate,
          currentStoreId || undefined
        );
        setRangeData(result);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching range data:", error);
        setLoading(false);
      }
    };

    fetchRangeDataAsync();
  }, [dateRange.startDate, dateRange.endDate, currentStoreId]);

  // Fetch month data
  useEffect(() => {
    const fetchMonthData = async () => {
      if (!currentStoreId) return;
      
      try {
        setLoading(true);

        // Create date range for the selected month
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
        const monthEnd = endOfMonth(monthStart);

        // Get all days in the month
        const daysInMonth = eachDayOfInterval({
          start: monthStart,
          end: monthEnd,
        });

        // Initialize month data structure
        const newMonthData: MonthData = {
          days: {},
          totals: {},
        };

        // Initialize totals with zeros
        GRAPHS.forEach((metric) => {
          newMonthData.totals[metric] = 0;
        });

        // Fetch data for each day and aggregate
        for (const day of daysInMonth) {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayData = await fetchData(dateStr, currentStoreId);

          // Store day data
          newMonthData.days[dateStr] = {};

          // Process each metric
          for (const metric of GRAPHS) {
            // Calculate day total for this metric
            const metricData = dayData[metric] || new Array(24).fill(0);
            const dayTotal = Array.isArray(metricData)
              ? metricData.reduce(
                  (sum, val) => sum + (typeof val === "number" ? val : 0),
                  0
                )
              : 0;

            // Add to daily record
            newMonthData.days[dateStr][metric] = dayTotal;

            // Add to monthly total
            newMonthData.totals[metric] += dayTotal;
          }
        }

        setMonthData(newMonthData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching monthly data:", error);
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [selectedMonth, selectedYear, currentStoreId]);

  // Modal handling
  const openModal = (type: "day" | "hour" | "month", metric: string) => {
    setSelectedMetric(metric);
    setModalType(type);
    setModalOpen(true);

    // Initialize editable data based on modal type
    if (type === "hour" && hourlyData) {
      setEditableHourlyData(
        hourlyData[metric as keyof DateData].map((item) => item.value)
      );
    } else if (type === "day" && dayData) {
      const value = dayData[metric as keyof DayData] || 0;
      setBulkMonthValue(value.toString());
    } else if (type === "month" && monthData) {
      const value = monthData.totals[metric] || 0;
      setBulkMonthValue(value.toString());
    }

    // Prevent background scrolling
    const main = document.querySelector("main");
    if (main) {
      main.style.overflowY = "hidden";
    }
  };

  const closeModal = () => {
    setModalOpen(false);

    // Restore background scrolling
    const main = document.querySelector("main");
    if (main) {
      main.style.overflowY = "auto";
    }
  };

  // Save daily data (single value)
  const saveDailyValue = async () => {
    if (!selectedMetric || !date) return;

    const value = parseInt(bulkMonthValue);
    if (isNaN(value)) return;

    try {
      setLoading(true);
      await addDayData(date, value, selectedMetric as keyof DayData, currentStoreId || undefined);

      // Update local state
      setDayData((prev) => ({
        ...prev,
        [selectedMetric]: value,
      }));

      closeModal();
      setLoading(false);
    } catch (error) {
      console.error("Error saving daily value:", error);
      setLoading(false);
    }
  };

  // Save hourly data (24 values)
  const saveHourlyData = async () => {
    if (!selectedMetric || !date || !hourlyData) return;

    try {
      setLoading(true);

      // Create updated hourly data
      const updatedHourlyData = { ...hourlyData };
      updatedHourlyData[selectedMetric as keyof DateData] = timeLabels.map(
        (time, index) => ({
          time,
          value: editableHourlyData[index] || 0,
        })
      );

      // Convert to Firebase format
      const dataToSave: Record<string, number[]> = {};

      // Extract just the values from each time entry
      Object.entries(updatedHourlyData).forEach(([key, timeEntries]) => {
        dataToSave[key] = timeEntries.map((entry) => entry.value);
      });

      // Save to Firebase
      await updateDateData(date, dataToSave as any, currentStoreId || undefined);

      // Update local state
      setHourlyData(updatedHourlyData);

      // Update day totals
      const dayTotal = editableHourlyData.reduce((sum, val) => sum + val, 0);
      setDayData((prev) => ({
        ...prev,
        [selectedMetric]: dayTotal,
      }));

      closeModal();
      setLoading(false);
    } catch (error) {
      console.error("Error saving hourly data:", error);
      setLoading(false);
    }
  };

  // Save monthly data (distribute value across all days)
  const saveMonthlyData = async () => {
    if (!selectedMetric || !monthData) return;

    const totalValue = parseInt(bulkMonthValue);
    if (isNaN(totalValue)) return;

    try {
      setLoading(true);

      // Get days in the month
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
      const monthEnd = endOfMonth(monthStart);
      const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
      });

      // Calculate value per day
      const valuePerDay = totalValue / daysInMonth.length;

      // Update each day
      for (const day of daysInMonth) {
        const dateStr = format(day, "yyyy-MM-dd");
        await addDayData(dateStr, valuePerDay, selectedMetric as keyof DayData, currentStoreId || undefined);
      }

      // Update local state
      const updatedMonthData = { ...monthData };

      // Update day values
      daysInMonth.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        if (!updatedMonthData.days[dateStr]) {
          updatedMonthData.days[dateStr] = {};
        }
        updatedMonthData.days[dateStr][selectedMetric] = valuePerDay;
      });

      // Update total
      updatedMonthData.totals[selectedMetric] = totalValue;

      setMonthData(updatedMonthData);
      closeModal();
      setLoading(false);
    } catch (error) {
      console.error("Error saving monthly data:", error);
      setLoading(false);
    }
  };

  // Save store settings
  const saveStoreSettings = async () => {
    if (
      !storeSettings ||
      newStoreName === storeSettings.storeName ||
      !newStoreName.trim()
    )
      return;

    try {
      setLoading(true);

      // Save the new store name to Firebase
      await updateStoreName(newStoreName.trim(), currentStoreId);

      // Update local state with new values
      setStoreSettings({
        ...storeSettings,
        storeName: newStoreName.trim(),
        updatedAt: new Date().toISOString(),
      });

      // Show success message using alert (could be replaced with a toast notification in a real app)
      alert(`Store name successfully updated to "${newStoreName.trim()}"`);

      setLoading(false);
    } catch (error) {
      console.error("Error updating store name:", error);
      setLoading(false);

      // Show error message
      alert(
        `Failed to update store name: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // UI Helpers
  const formatNumberWithCommas = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month).toLocaleString("default", { month: "long" });
  };

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Function to handle new store creation
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;
    
    try {
      setLoading(true);
      const newStore = await createStore(newStoreName.trim());
      
      // Add to available stores
      setAvailableStores(prevStores => [...prevStores, newStore]);
      
      // Switch to the new store
      setCurrentStoreId(newStore.id);
      navigate(`/admin/${newStore.id}`);
      
      // Close modal and reset form
      setShowNewStoreModal(false);
      setNewStoreName("");
      setLoading(false);
      
      // Show success message using alert
      alert(`Store "${newStore.name}" successfully created!`);
    } catch (error) {
      console.error("Error creating store:", error);
      setLoading(false);
      alert(`Failed to create store: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Function to handle individual day editing in table
  const handleDayEdit = (day: string, metric: string, currentValue: number) => {
    setEditingDay(day);
    setEditingMetric(metric);
    setDayValue(currentValue.toString());
  };

  // Function to save individual day edit
  const saveDayEdit = async () => {
    if (!editingDay || !editingMetric || !monthData) return;

    const value = parseFloat(dayValue);
    if (isNaN(value)) return;

    try {
      setLoading(true);

      // Save to Firebase
      await addDayData(editingDay, value, editingMetric as keyof DayData, currentStoreId || undefined);

      // Update local state
      const updatedMonthData = { ...monthData };

      // Calculate difference for the monthly total
      const oldValue = updatedMonthData.days[editingDay]?.[editingMetric] || 0;
      const difference = value - oldValue;

      // Update day value
      if (!updatedMonthData.days[editingDay]) {
        updatedMonthData.days[editingDay] = {};
      }
      updatedMonthData.days[editingDay][editingMetric] = value;

      // Update total
      updatedMonthData.totals[editingMetric] =
        (updatedMonthData.totals[editingMetric] || 0) + difference;

      setMonthData(updatedMonthData);
      setEditingDay(null);
      setEditingMetric(null);
      setDayValue("");
      setLoading(false);
    } catch (error) {
      console.error("Error saving day value:", error);
      setLoading(false);
    }
  };

  return (
    <div className="admin-page h-full w-full p-4 md:p-6 relative bg-gray-50">
      {/* Page Header */}
      <div className="page-header bg-white shadow rounded-lg p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your store data and settings
            </p>
      </div>
          
          {/* Store Selector */}
          {availableStores.length > 0 && (
            <div className="store-selector flex items-center gap-3">
              <div>
                <label htmlFor="store-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Store
                </label>
                <select
                  id="store-select"
                  className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={currentStoreId}
                  onChange={(e) => {
                    const selectedStoreId = e.target.value;
                    setCurrentStoreId(selectedStoreId);
                    // Navigate directly to the store ID URL for consistent routing
                    navigate(`/admin/${selectedStoreId}`);
                  }}
                >
                  {availableStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="mt-5 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                onClick={() => setShowNewStoreModal(true)}
              >
                Add Store
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
            <div className="loading-spinner size-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="text-gray-800 font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs flex flex-wrap md:flex-nowrap mb-6 gap-2">
        <button
          className={`tab-btn px-4 py-2 rounded-lg flex-1 font-medium transition-all ${
            activeTab === "daily"
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => handleTabChange("daily")}
        >
          Daily Data
        </button>
        <button
          className={`tab-btn px-4 py-2 rounded-lg flex-1 font-medium transition-all ${
            activeTab === "monthly"
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => handleTabChange("monthly")}
        >
          Monthly Data
        </button>
        <button
          className={`tab-btn px-4 py-2 rounded-lg flex-1 font-medium transition-all ${
            activeTab === "settings"
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
          onClick={() => handleTabChange("settings")}
        >
          Store Settings
        </button>
      </div>

      {/* Daily Data Tab */}
      {activeTab === "daily" && (
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
              {GRAPHS.map((metric, index) => (
                <div
                  key={metric}
                  className="metric-card p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                  onClick={() => openModal(entryMethod, metric)}
                >
                  <h3 className="text-lg font-medium text-gray-800 capitalize">
                    {GRAPH_LABELS[index]}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatNumberWithCommas(
                      dayData[metric as keyof DayData] || 0
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
      )}

      {/* Monthly Data Tab */}
      {activeTab === "monthly" && (
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
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
                {GRAPHS.map((metric, index) => (
                  <div
                    key={metric}
                    className="metric-card p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => openModal("month", metric)}
                  >
                    <h3 className="text-lg font-medium text-gray-800 capitalize">
                      {GRAPH_LABELS[index]}
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
                    onClick={() => setMonthlyViewMode("bulk")}
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
                    onClick={() => setMonthlyViewMode("breakdown")}
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
                    Select a metric and enter a value to distribute evenly
                    across all days in the month.
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
                        {GRAPHS.map((metric, index) => (
                          <option key={metric} value={metric}>
                            {GRAPH_LABELS[index]}
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
                        onClick={() => {
                            if (selectedMetric)
                              openModal("month", selectedMetric);
                          }}
                          disabled={!selectedMetric}
                        >
                          Distribute
                      </button>
                </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This will evenly distribute the total across all{" "}
                        {Object.keys(monthData.days).length} days in the month.
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
                    Click on any value in the table to edit it directly.
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
                          {GRAPH_LABELS.map((label) => (
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
                        {Object.entries(monthData.days).map(
                          ([day, metrics]) => (
                            <tr key={day} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {format(new Date(day), "MMM d, yyyy")}
                              </td>
                              {GRAPHS.map((metric) => (
                                <td
                                  key={`${day}-${metric}`}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {editingDay === day &&
                                  editingMetric === metric ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        className="w-24 p-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={dayValue}
                                        onChange={(e) =>
                                          setDayValue(e.target.value)
                                        }
                                        autoFocus
                                      />
                <button
                                        className="p-1 text-green-600 hover:text-green-800"
                                        onClick={saveDayEdit}
                                        title="Save"
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
                                          setEditingDay(null);
                                          setEditingMetric(null);
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
                                        handleDayEdit(
                                          day,
                                          metric,
                                          metrics[metric] || 0
                                        )
                                      }
                                    >
                                      <span className="cursor-pointer">
                                        {formatNumberWithCommas(
                                          metrics[metric] || 0
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
                              ))}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="tab-content bg-white shadow rounded-lg p-4 md:p-6">
          <div className="section-header mb-6">
            <h2 className="text-xl font-bold text-gray-800">Store Settings</h2>
            <p className="text-gray-600 text-sm">
              Manage your store configuration
            </p>
          </div>

          {storeSettings ? (
            <div>
              <div className="settings-form max-w-md">
                <div className="form-group mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="Enter your store name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name will be displayed throughout your store's dashboard
                    and reports.
                  </p>
                </div>

                <div className="form-group mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Updated
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    value={new Date(storeSettings.updatedAt).toLocaleString()}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The timestamp when your store settings were last modified.
                  </p>
                </div>

                <div className="form-actions space-y-2">
                  <button
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    onClick={saveStoreSettings}
                    disabled={
                      newStoreName === storeSettings.storeName ||
                      !newStoreName.trim()
                    }
                  >
                    Save Changes
                  </button>

                  <button
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    onClick={() => setNewStoreName(storeSettings.storeName)}
                    disabled={newStoreName === storeSettings.storeName}
                  >
                    Reset Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-8">
              <p>Loading store settings...</p>
            </div>
          )}
        </div>
      )}

      {/* Data Entry Modal */}
      {modalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className="modal-container bg-white w-full max-w-3xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
          >
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
                className="text-gray-500 hover:text-gray-700"
                onClick={closeModal}
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
                        )}`
                      : `Enter the total value for ${getMonthName(
                          selectedMonth
                        )} ${selectedYear}. This value will be distributed evenly across all days of the month.`}
                  </p>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Value
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      value={bulkMonthValue}
                      onChange={(e) => setBulkMonthValue(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {/* Hourly Data Editor */}
              {modalType === "hour" && (
                <div className="hourly-data-editor">
                  <p className="mb-4 text-gray-600">
                    Edit hourly values for{" "}
                    {format(new Date(date), "MMMM d, yyyy")}
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
                              onChange={(e) => {
                                  const newValue = parseFloat(e.target.value);
                                  const newData = [...editableHourlyData];
                                  newData[index] = isNaN(newValue)
                                    ? 0
                                    : newValue;
                                  setEditableHourlyData(newData);
                                }}
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
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                onClick={() => {
                  if (modalType === "day") saveDailyValue();
                  else if (modalType === "hour") saveHourlyData();
                  else if (modalType === "month") saveMonthlyData();
                }}
              >
                Save Changes
            </button>
            </div>
          </div>
        </div>
      )}

      {/* New Store Modal */}
      {showNewStoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Store</h2>
            <div className="mb-4">
              <label htmlFor="new-store-name" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                id="new-store-name"
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Enter store name"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setShowNewStoreModal(false);
                  setNewStoreName('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                onClick={handleCreateStore}
                disabled={!newStoreName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
