import XMarkIcon from "@/assets/svg/XMarkIcon";
import {
  addDayData,
  fetchData,
  readDayData,
  updateDateData,
  getStoreSettings,
  updateStoreName,
  getAllStores,
  getStoreById,
  setDefaultAnalyticsStore,
  getDefaultAnalyticsStore,
  updateStoreImage,
  removeDefaultAnalyticsStore,
  GraphType,
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
import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/StoreContext";

// Import the StoreSelector component
import StoreSelector from "./components/StoreSelector";
import MonthlyDataTab from "./components/MonthlyDataTab";

// Constants
const GRAPHS = [
  "gross_sales",
  "returning_customer_rate",
  "orders_fulfilled",
  "orders",
  "total_sales_over_time",
  "conversion_rate_over_time",
  "average_order_value_over_time",
  "conversion_rate_breakdown",
] as const;

const GRAPH_LABELS = [
  "Gross Sales",
  "Returning Customer Rate",
  "Orders Fulfilled",
  "Orders",
  "Total Sales Over Time",
  "Conversion Rate Over Time",
  "Average Order Value Over Time",
  "Conversion Rate Breakdown",
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
  conversion_rate_breakdown: { time: string; value: number }[];
}

type DayData = {
  [K in GraphType]?: number;
};

interface StoreSettings {
  storeName: string;
  updatedAt: string;
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

  // Get store context with renamed function to avoid conflicts
  const { setCurrentStoreId: setGlobalStoreId, refreshStoreInfo } = useStore();

  // Store management states
  const [availableStores, setAvailableStores] = useState<
    { id: string; name: string }[]
  >([]);
  const [currentStoreId, setCurrentStoreId] = useState<string>("");
  const [isEditingDefault, setIsEditingDefault] = useState<boolean>(false);

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

  // Date calculations
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  const currentDayOfMonth = today.getDate();
  const isCurrentMonth =
    selectedMonth === currentMonth && selectedYear === currentYear;

  // For current month, only include days up to today
  // Settings states
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null
  );
  const [newStoreName, setNewStoreName] = useState<string>("");
  const [defaultAnalyticsStoreId, setDefaultAnalyticsStoreId] =
    useState<string>("");

  // Create a stable reference to timeLabels
  const timeLabelsRef = useRef(
    Array.from({ length: 24 }, (_, i) => {
      const hour = i % 12 === 0 ? 12 : i % 12;
      const period = i < 12 ? "AM" : "PM";
      return `${hour}:00 ${period}`;
    })
  );

  // References
  const modalRef = useRef<HTMLDivElement>(null);

  // Add state for editing individual days
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingMetric, setEditingMetric] = useState<string | null>(null);
  const [dayValue, setDayValue] = useState<string>("");

  // New image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Function to handle tab change
  const handleTabChange = (tab: TabType) => {
    if (tab !== activeTab) {
      setActiveTab(tab);

      // Make sure we restore scrolling when switching tabs
      const main = document.querySelector("main");
      if (main) {
        main.style.overflowY = "auto";
      }

      // Don't set loading here since each tab's useEffect will handle it
    }
  };

  // Initialize store settings
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        setLoading(true);
        // Only fetch store settings if we're not in default mode
        if (!isEditingDefault) {
          const settings = await getStoreSettings(currentStoreId || undefined);
          setStoreSettings(settings as StoreSettings);
          setNewStoreName(settings.storeName);
          
          // Update the global store context
          setGlobalStoreId(currentStoreId);
        } else {
          // Set default values for the default analytics page
          setStoreSettings({
            storeName: "Default Analytics Page",
            updatedAt: new Date().toISOString(),
          });
          setNewStoreName("Default Analytics Page");
          
          // Update the global store context
          setGlobalStoreId(null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching store settings:", error);
        setLoading(false);
      }
    };

    if (currentStoreId || isEditingDefault) {
      fetchStoreSettings();
    }
  }, [currentStoreId, isEditingDefault, setGlobalStoreId]);

  // Fetch available stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const stores = await getAllStores();
        setAvailableStores(stores);

        // Get default analytics store
        const defaultStoreId = await getDefaultAnalyticsStore();
        if (defaultStoreId) {
          setDefaultAnalyticsStoreId(defaultStoreId);
        }

        // If a store name is provided in the URL, find the matching store
        if (storeId) {
          if (storeId.toLowerCase() === "default") {
            setIsEditingDefault(true);
            setCurrentStoreId("default");
          } else {
            // Make URL comparison more flexible
            const formattedUrlName = storeId.toLowerCase();
            const matchingStore = stores.find((store) => {
              // Check direct name match
              if (store.name.toLowerCase() === formattedUrlName) return true;

              // Check URL-friendly version of the name
              const urlFriendlyName = store.name
                .toLowerCase()
                .replace(/\s+/g, "-");
              return urlFriendlyName === formattedUrlName;
            });

            if (matchingStore) {
              setCurrentStoreId(matchingStore.id);
              setIsEditingDefault(false);
            } else {
              // If no matching store, try to create the store with this ID
              try {
                const newStore = await getStoreById(storeId);
                setAvailableStores((prevStores) => [...prevStores, newStore]);
                setCurrentStoreId(newStore.id);
                setIsEditingDefault(false);
              } catch (error) {
                console.error("Error creating store from URL:", error);
                // If creation fails, redirect to main admin page
                navigate("/admin");
              }
            }
          }
        } else if (stores.length > 0) {
          // If no store specified but stores exist, select the first one
          setCurrentStoreId(stores[0].id);
          setIsEditingDefault(false);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching stores:", error);
        setLoading(false);
      }
    };

    fetchStores();
    // Only run this on mount and when storeId changes, removing navigate from dependencies
  }, [storeId]);

  // Fetch data for the day when date or entry method changes
  useEffect(() => {
    // Only fetch day data for the selected date regardless of entry method
    if (!date || (!currentStoreId && !isEditingDefault)) return;

    // If we're in daily mode, let's get the total values for each metric
    const fetchDailyTotals = async () => {
      try {
        setLoading(true);
        const dailyTotals: DayData = {};

        // Fetch all metrics in parallel for better performance
        const fetchPromises = GRAPHS.map((metric) =>
          readDayData(
            date,
            metric,
            isEditingDefault ? "default" : currentStoreId || undefined
          ).then((result) => {
            dailyTotals[metric] = result || 0;
          })
        );

        await Promise.all(fetchPromises);
        setDayData(dailyTotals);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching daily totals:", error);
        setLoading(false);
      }
    };

    fetchDailyTotals();
  }, [date, currentStoreId, isEditingDefault]);

  // Handle entry method change - fetch hourly data when switching to hourly view
  useEffect(() => {
    if (entryMethod === "hour") {
      fetchHourlyData();
    }
  }, [entryMethod, date, currentStoreId, isEditingDefault]);

  // Function to fetch hourly data - separate function to be called when needed
  const fetchHourlyData = async () => {
    if (!date) return;

    setLoading(true);

    try {
      // Fetch complete document from Firebase
      const rawData = await fetchData(
        date,
        isEditingDefault ? "default" : currentStoreId || undefined
      );

      if (!rawData) {
        // If no data, create empty time-value arrays for all metrics
        const emptyHourlyData: DateData = {} as DateData;

        GRAPHS.forEach((metric) => {
          emptyHourlyData[metric as keyof DateData] = timeLabelsRef.current.map(
            (time) => ({
              time,
              value: 0,
            })
          );
        });

        setHourlyData(emptyHourlyData);
        if (selectedMetric) {
          setEditableHourlyData(new Array(24).fill(0));
        }
        setLoading(false);
        return;
      }

      // Transform raw data into the DateData format
      const formattedData: DateData = {} as DateData;

      GRAPHS.forEach((metric) => {
        // Check if this metric has data in the Firebase document
        const metricData = rawData[metric];

        if (Array.isArray(metricData) && metricData.length > 0) {
          // Create a normalized array of exactly 24 values
          const normalizedData = [...metricData];
          while (normalizedData.length < 24) normalizedData.push(0);

          // Transform to time-value pairs
          formattedData[metric as keyof DateData] = timeLabelsRef.current.map(
            (time, index) => ({
              time,
              value: index < normalizedData.length ? normalizedData[index] : 0,
            })
          );
        } else {
          // Create empty time-value pairs if no data
          formattedData[metric as keyof DateData] = timeLabelsRef.current.map(
            (time) => ({
              time,
              value: 0,
            })
          );
        }
      });

      // Update state with formatted data
      setHourlyData(formattedData);

      // If a metric is selected, update editable data
      if (selectedMetric && rawData[selectedMetric]) {
        const metricValues = rawData[selectedMetric];
        if (Array.isArray(metricValues)) {
          // Ensure we have exactly 24 values by padding or truncating
          const normalizedValues = [...metricValues];
          while (normalizedValues.length < 24) normalizedValues.push(0);
          setEditableHourlyData(normalizedValues.slice(0, 24));
        } else {
          setEditableHourlyData(new Array(24).fill(0));
        }
      }
    } catch (error) {
      console.error("Error fetching hourly data:", error);
      // Create empty data on error to prevent UI issues
      const fallbackData: DateData = {} as DateData;

      GRAPHS.forEach((metric) => {
        fallbackData[metric as keyof DateData] = timeLabelsRef.current.map(
          (time) => ({
            time,
            value: 0,
          })
        );
      });

      setHourlyData(fallbackData);
      setEditableHourlyData(new Array(24).fill(0));
    } finally {
      setLoading(false);
    }
  };

  // Update editable data when selected metric changes in hourly mode
  useEffect(() => {
    if (entryMethod === "hour" && selectedMetric && hourlyData) {
      const metricData = hourlyData[selectedMetric as keyof DateData];
      if (metricData && metricData.length > 0) {
        // Extract just the values from the time-value pairs
        setEditableHourlyData(metricData.map((item) => item.value));
      } else {
        setEditableHourlyData(new Array(24).fill(0));
      }
    }
  }, [selectedMetric, hourlyData, entryMethod]);

  // Fetch month data
  useEffect(() => {
    const fetchMonthData = async () => {
      if ((!currentStoreId && !isEditingDefault) || activeTab !== "monthly")
        return;

      try {
        setLoading(true);

        // Create date range for the selected month
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));
        const monthEnd = endOfMonth(monthStart);

        // If we're in the current month, only get days up to today
        const effectiveEndDate = isCurrentMonth ? today : monthEnd;

        // Get all days in the month (or up to today if current month)
        const daysInMonth = eachDayOfInterval({
          start: monthStart,
          end: effectiveEndDate,
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
          const dayData = await fetchData(
            dateStr,
            isEditingDefault ? "default" : currentStoreId
          );

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
  }, [
    selectedMonth,
    selectedYear,
    currentStoreId,
    isEditingDefault,
    isCurrentMonth,
    activeTab,
  ]);

  // Modal handling
  const openModal = (type: "day" | "hour" | "month", metric: string) => {
    // Set these states first to prevent UI flickers
    setSelectedMetric(metric);
    setModalType(type);

    // Only fetch hourly data if we're opening the hourly modal and don't have data yet
    if (
      type === "hour" &&
      (!hourlyData || !hourlyData[metric as keyof DateData]?.length)
    ) {
      setLoading(true);

      // Fetch the data, then open modal
      fetchHourlyData()
        .then(() => {
          // Initialize editable data based on the fetched hourly data
          if (hourlyData && hourlyData[metric as keyof DateData]?.length > 0) {
            setEditableHourlyData(
              hourlyData[metric as keyof DateData].map((item) => item.value)
            );
          } else {
            setEditableHourlyData(new Array(24).fill(0));
          }

          // Now open the modal
          setModalOpen(true);
        })
        .catch((error) => {
          console.error("Error loading hourly data for modal:", error);
          // Open modal with empty data in case of error
          setEditableHourlyData(new Array(24).fill(0));
          setModalOpen(true);
        });

      return; // Don't open modal yet - wait for data
    }

    // Prepare editable data for the modal
    if (type === "hour" && hourlyData?.[metric as keyof DateData]) {
      setEditableHourlyData(
        hourlyData[metric as keyof DateData].map((item) => item.value)
      );
    } else if (type === "day" && dayData) {
      const value = dayData[metric as keyof DayData] || 0;
      setBulkMonthValue(value.toString());
    } else if (type === "month" && monthData) {
      const value = monthData.totals[metric] || 0;
      setBulkMonthValue(value.toString());
    } else if (type === "hour") {
      // Fallback for hourly view if data not available
      setEditableHourlyData(new Array(24).fill(0));
    }

    // Open the modal
    setModalOpen(true);
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
      await addDayData(
        date,
        value,
        selectedMetric as keyof DayData,
        isEditingDefault ? "default" : currentStoreId || undefined
      );

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
    if (!selectedMetric || !date) {
      console.error("Cannot save hourly data: missing metric or date");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Get the current data to ensure we don't overwrite other metrics
      const currentData =
        (await fetchData(
          date,
          isEditingDefault ? "default" : currentStoreId || undefined
        )) || {};

      // Step 2: Create a complete data object for saving
      const dataToSave = { ...currentData };

      // Step 3: Update the selected metric with our edited values
      // Make sure we have exactly 24 values
      const normalizedValues = [...editableHourlyData];
      while (normalizedValues.length < 24) normalizedValues.push(0);
      dataToSave[selectedMetric] = normalizedValues.slice(0, 24);

      // Step 4: Save to Firebase
      await updateDateData(
        date,
        dataToSave,
        isEditingDefault ? "default" : currentStoreId || undefined
      );

      // Step 5: Update local state
      // Update hourly data display
      if (hourlyData) {
        const updatedHourlyData = { ...hourlyData };
        updatedHourlyData[selectedMetric as keyof DateData] =
          timeLabelsRef.current.map((time, index) => ({
            time,
            value: normalizedValues[index] || 0,
          }));
        setHourlyData(updatedHourlyData);
      }

      // Update day total for this metric
      const dayTotal = normalizedValues.reduce(
        (sum, val) => sum + (val || 0),
        0
      );
      setDayData((prev) => ({
        ...prev,
        [selectedMetric]: dayTotal,
      }));

      // Success - close modal and finish
      closeModal();
    } catch (error) {
      console.error("Error saving hourly data:", error);
      alert("Failed to save hourly data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Save monthly data (distribute value across days that have passed)
  const saveMonthlyData = async () => {
    if (!selectedMetric || !monthData) return;

    const totalValue = parseFloat(bulkMonthValue);
    if (isNaN(totalValue)) return;

    try {
      setLoading(true);

      // Get days in the month
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));

      // If we're in the current month, only distribute to days up to today
      const effectiveEndDate = isCurrentMonth ? today : endOfMonth(monthStart);

      const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: effectiveEndDate,
      });

      // Calculate value per day based on actual days to distribute to
      // Round to 2 decimal places to avoid floating point errors
      const valuePerDay = parseFloat((totalValue / daysInMonth.length).toFixed(2));
      
      // Handle any rounding errors by adding the difference to the first day
      const roundingError = totalValue - (valuePerDay * daysInMonth.length);
      
      // Update each day
      for (let i = 0; i < daysInMonth.length; i++) {
        const day = daysInMonth[i];
        const dateStr = format(day, "yyyy-MM-dd");
        
        // Add any rounding difference to the first day to ensure total is exact
        const dayValue = i === 0 
          ? parseFloat((valuePerDay + roundingError).toFixed(2)) 
          : valuePerDay;
          
        await addDayData(
          dateStr,
          dayValue,
          selectedMetric as keyof DayData,
          isEditingDefault ? "default" : currentStoreId || undefined
        );
      }

      // Update local state
      const updatedMonthData = { ...monthData };

      // Update day values
      daysInMonth.forEach((day, index) => {
        const dateStr = format(day, "yyyy-MM-dd");
        if (!updatedMonthData.days[dateStr]) {
          updatedMonthData.days[dateStr] = {};
        }
        
        // Add any rounding difference to the first day
        const dayValue = index === 0 
          ? parseFloat((valuePerDay + roundingError).toFixed(2)) 
          : valuePerDay;
          
        updatedMonthData.days[dateStr][selectedMetric] = dayValue;
      });

      // Update total with original value to maintain accuracy
      updatedMonthData.totals[selectedMetric] = totalValue;

      setMonthData(updatedMonthData);
      closeModal();
      setLoading(false);
    } catch (error) {
      console.error("Error saving monthly data:", error);
      setLoading(false);
      
      // Check for Firebase quota errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("quota") || errorMessage.includes("resource-exhausted")) {
        alert("Firebase quota exceeded. Please try again later or contact support.");
      } else {
        alert("Failed to distribute monthly data. Please try again.");
      }
    }
  };

  // Save store settings
  const saveStoreSettings = async () => {
    if (
      isEditingDefault ||
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
      
      // Update global store context
      refreshStoreInfo();

      // Dispatch event to update navbar
      window.dispatchEvent(new Event('storeNameUpdated'));

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
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
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
      await addDayData(
        editingDay,
        value,
        editingMetric as keyof DayData,
        isEditingDefault ? "default" : currentStoreId || undefined
      );

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

  // Function to handle saving all pending edits
  const handleSaveAllPendingEdits = async (pendingEdits: Record<string, { metric: string; value: number }>) => {
    
    if (Object.keys(pendingEdits).length === 0 || !monthData) {
      return;
    }

    try {
      setLoading(true);
      
      // Track successful edits to return to the child component
      const successfulEdits: Record<string, boolean> = {};
      
      // Process edits one by one for better error handling
      for (const key in pendingEdits) {
        try {
          const [day, metric] = key.split("-");
          const { value } = pendingEdits[key];
          
          console.log(`Saving edit for ${day}, ${metric}: ${value}`);
          
          // Save to Firebase
          await addDayData(
            day,
            value,
            metric as keyof DayData,
            isEditingDefault ? "default" : currentStoreId || undefined
          );
          
          console.log(`Successfully saved to Firebase for ${day}, ${metric}`);
          
          // Mark as successful
          successfulEdits[key] = true;
          
          // Update local state
          const updatedMonthData = { ...monthData };
          
          // Calculate difference for the monthly total
          const oldValue = updatedMonthData.days[day]?.[metric] || 0;
          const difference = value - oldValue;
          
          console.log(`Updating local state, old: ${oldValue}, new: ${value}, diff: ${difference}`);
          
          // Update day value
          if (!updatedMonthData.days[day]) {
            updatedMonthData.days[day] = {};
          }
          updatedMonthData.days[day][metric] = value;
          
          // Update total
          updatedMonthData.totals[metric] =
            (updatedMonthData.totals[metric] || 0) + difference;
            
          setMonthData(updatedMonthData);
        } catch (error) {
          console.error(`Error saving edit for ${key}:`, error);
          // Continue with other edits even if one fails
        }
      }
      
      setLoading(false);
      
      // Show success message with count of successful edits
      const successCount = Object.keys(successfulEdits).length;
      const totalCount = Object.keys(pendingEdits).length;
      
      if (successCount === totalCount) {
        alert(`All ${totalCount} changes saved successfully!`);
      } else if (successCount > 0) {
        alert(`Saved ${successCount} out of ${totalCount} changes.`);
      } else {
        alert("Failed to save changes. Please try again.");
      }
    } catch (error) {
      console.error("Error in batch save operation:", error);
      setLoading(false);
      
      // Check for Firebase quota errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("quota") || errorMessage.includes("resource-exhausted")) {
        alert("Firebase quota exceeded. Please try again later or contact support.");
      } else {
        alert("Failed to save changes. Please try again.");
      }
    }
  };

  // Restore scrolling behavior when entry method is hour
  useEffect(() => {
    const main = document.querySelector("main");

    // Only when switching to hourly view
    if (entryMethod === "hour") {
      if (main) {
        // Don't set overflow to hidden, just smooth scroll to top
        main.scrollTo({ top: 0, behavior: "smooth" });
        main.style.overflowY = "auto"; // Ensure scrolling is enabled
      }
    }

    // Cleanup function to ensure we restore scrolling
    return () => {
      if (main) {
        main.style.overflowY = "auto"; // Always ensure overflow is restored
      }
    };
  }, [entryMethod]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !currentStoreId) return;

    try {
      // Here you would typically upload the image to a storage service
      // For now, we'll just use the preview URL as a placeholder
      await updateStoreImage(imagePreview || "", currentStoreId);
      console.log("Store image updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

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

  return (
    <div className="admin-page h-full w-full p-4 md:p-6 relative bg-gray-50">
      {/* Page Header */}
      <div className="page-header bg-white shadow rounded-lg p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Admin Dashboard{" "}
              {isEditingDefault ? "- Default Analytics Page" : ""}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditingDefault
                ? "Edit data displayed on the default analytics page (/analytics)"
                : "Manage your store data and settings"}
            </p>
          </div>

          {/* Store Selector */}
          <StoreSelector 
            availableStores={availableStores}
            currentStoreId={currentStoreId}
            isEditingDefault={isEditingDefault}
            defaultAnalyticsStoreId={defaultAnalyticsStoreId}
            onStoreChange={(storeId, isDefault) => {
              if (isDefault) {
                setIsEditingDefault(true);
                setCurrentStoreId("default");
                setGlobalStoreId(null); // Update global context
                navigate(`/admin/default`);
              } else {
                setIsEditingDefault(false);
                setCurrentStoreId(storeId);
                setGlobalStoreId(storeId); // Update global context
                navigate(`/admin/${storeId}`);
              }
            }}
            onSetDefaultStore={async (storeId) => {
              try {
                setLoading(true);
                await setDefaultAnalyticsStore(storeId);
                setDefaultAnalyticsStoreId(storeId);
                
                // Update global store context after setting default
                refreshStoreInfo();

                // Show success message
                alert(`Default analytics store set successfully!`);

                // Refresh the list of stores to update the UI
                const stores = await getAllStores();
                setAvailableStores(stores);
              } catch (error) {
                console.error("Error setting default analytics store:", error);
                alert(
                  `Failed to set default analytics store: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              } finally {
                setLoading(false);
              }
            }}
            onRemoveDefaultStore={async () => {
              try {
                if (!confirm("Are you sure you want to remove the current default analytics store?")) {
                  return;
                }
                
                setLoading(true);
                await removeDefaultAnalyticsStore();
                setDefaultAnalyticsStoreId("");
                
                // Update global store context after removing default
                refreshStoreInfo();

                // Show success message
                alert("Default analytics store removed successfully!");

                // Refresh the list of stores to update the UI
                const stores = await getAllStores();
                setAvailableStores(stores);
              } catch (error) {
                console.error("Error removing default analytics store:", error);
                alert(
                  `Failed to remove default analytics store: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              } finally {
                setLoading(false);
              }
            }}
          />
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

      {/* Monthly Tab */}
      {activeTab === "monthly" && (
        <MonthlyDataTab
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          monthData={monthData}
          monthlyViewMode={monthlyViewMode}
          setMonthlyViewMode={setMonthlyViewMode}
          bulkMonthValue={bulkMonthValue}
          setBulkMonthValue={setBulkMonthValue}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          isCurrentMonth={isCurrentMonth}
          currentDayOfMonth={currentDayOfMonth}
          years={years}
          months={months}
          graphs={GRAPHS}
          graphLabels={GRAPH_LABELS}
          formatNumberWithCommas={formatNumberWithCommas}
          getMonthName={getMonthName}
          openModal={openModal}
          handleDayEdit={handleDayEdit}
          editingDay={editingDay}
          editingMetric={editingMetric}
          dayValue={dayValue}
          setDayValue={setDayValue}
          saveDayEdit={saveDayEdit}
          handleSaveAllPendingEdits={handleSaveAllPendingEdits}
        />
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
                    This name will be displayed throughout your store's
                    dashboard and reports.
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

          <div className="settings-section">
            <h2>Store Settings</h2>
            <div className="store-image-section">
              <div className="image-preview">
                {imagePreview ? (
                  <img src={imagePreview} alt="Store preview" />
                ) : (
                  <div className="placeholder">No image selected</div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <button onClick={handleImageUpload}>Upload Image</button>
            </div>
          </div>
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
                onClick={closeModal}
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
                          onClick={() =>
                            modalType === "day"
                              ? saveDayData()
                              : saveMonthData()
                          }
                          disabled={!selectedMetric}
                        >
                          {modalType === "day" ? "Save" : "Distribute"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {modalType === "month" &&
                          `This will evenly distribute the total across ${
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
                        {timeLabelsRef.current.map((time, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {time}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                className="w-full p-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={editableHourlyData[index] || 0}
                                onChange={(e) =>
                                  handleHourlyDataChange(index, e.target.value)
                                }
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
                  if (modalType === "day") saveDayData();
                  else if (modalType === "hour") saveHourlyData();
                  else if (modalType === "month") saveMonthData();
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
