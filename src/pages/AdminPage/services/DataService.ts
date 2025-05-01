import {
  addDayData,
  fetchData,
  readDayData,
  updateDateData,
  getStoreSettings,
  updateStoreName,
  updateStoreImage,
  GraphType
} from "@/firebase/firebase";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

// Interface for hourly data
export interface DateData {
  gross_sales: { time: string; value: number }[];
  returning_customer_rate: { time: string; value: number }[];
  orders_fulfilled: { time: string; value: number }[];
  orders: { time: string; value: number }[];
  total_sales_over_time: { time: string; value: number }[];
  conversion_rate_over_time: { time: string; value: number }[];
  average_order_value_over_time: { time: string; value: number }[];
  conversion_rate_breakdown: { time: string; value: number }[];
}

// Interface for day data
export interface DayData {
  [key: string]: number | undefined;
}

// Interface for month data
export interface MonthData {
  days: {
    [date: string]: {
      [metric: string]: number;
    };
  };
  totals: {
    [metric: string]: number;
  };
}

// Interface for store settings
export interface StoreSettings {
  storeName: string;
  updatedAt: string;
}

// Class to handle data operations
export class DataService {
  // Fetch daily totals for all metrics
  static async fetchDailyTotals(date: string, storeId: string | null, isDefault: boolean): Promise<DayData> {
    try {
      const dailyTotals: DayData = {};
      
      // Prepare graphs for parallel fetching
      const graphs: GraphType[] = [
        "gross_sales",
        "returning_customer_rate",
        "orders_fulfilled",
        "orders",
        "total_sales_over_time",
        "conversion_rate_over_time",
        "average_order_value_over_time",
        "conversion_rate_breakdown"
      ];
      
      // Fetch all metrics in parallel for better performance
      const fetchPromises = graphs.map(metric => 
        readDayData(
          date,
          metric,
          isDefault ? "default" : storeId || undefined
        ).then(result => {
          dailyTotals[metric] = result || 0;
        })
      );
      
      await Promise.all(fetchPromises);
      return dailyTotals;
    } catch (error) {
      console.error("Error fetching daily totals:", error);
      throw error;
    }
  }

  // Fetch hourly data for a specific date
  static async fetchHourlyData(date: string, storeId: string | null, isDefault: boolean, timeLabels: string[]): Promise<DateData> {
    try {
      // Fetch complete document from Firebase
      const rawData = await fetchData(
        date,
        isDefault ? "default" : storeId || undefined
      );
      
      if (!rawData) {
        // If no data, create empty time-value arrays for all metrics
        const emptyHourlyData: DateData = {} as DateData;
        
        const graphs: GraphType[] = [
          "gross_sales",
          "returning_customer_rate",
          "orders_fulfilled",
          "orders",
          "total_sales_over_time",
          "conversion_rate_over_time",
          "average_order_value_over_time",
          "conversion_rate_breakdown"
        ];
        
        graphs.forEach(metric => {
          emptyHourlyData[metric as keyof DateData] = timeLabels.map(time => ({
            time,
            value: 0
          }));
        });
        
        return emptyHourlyData;
      }
      
      // Transform raw data into the DateData format
      const formattedData: DateData = {} as DateData;
      
      const graphs: GraphType[] = [
        "gross_sales",
        "returning_customer_rate",
        "orders_fulfilled",
        "orders",
        "total_sales_over_time",
        "conversion_rate_over_time",
        "average_order_value_over_time",
        "conversion_rate_breakdown"
      ];
      
      graphs.forEach(metric => {
        // Check if this metric has data in the Firebase document
        const metricData = rawData[metric];
        
        if (Array.isArray(metricData) && metricData.length > 0) {
          // Create a normalized array of exactly 24 values
          const normalizedData = [...metricData];
          while (normalizedData.length < 24) normalizedData.push(0);
          
          // Transform to time-value pairs
          formattedData[metric as keyof DateData] = timeLabels.map((time, index) => ({
            time,
            value: index < normalizedData.length ? normalizedData[index] : 0
          }));
        } else {
          // Create empty time-value pairs if no data
          formattedData[metric as keyof DateData] = timeLabels.map(time => ({
            time,
            value: 0
          }));
        }
      });
      
      return formattedData;
    } catch (error) {
      console.error("Error fetching hourly data:", error);
      throw error;
    }
  }

  // Save hourly data
  static async saveHourlyData(
    date: string, 
    storeId: string | null, 
    isDefault: boolean, 
    selectedMetric: string, 
    editableHourlyData: number[]
  ): Promise<void> {
    try {
      // Step 1: Get the current data to ensure we don't overwrite other metrics
      const currentData = await fetchData(
        date,
        isDefault ? "default" : storeId || undefined
      ) || {};
      
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
        isDefault ? "default" : storeId || undefined
      );
    } catch (error) {
      console.error("Error saving hourly data:", error);
      throw error;
    }
  }

  // Save daily value
  static async saveDailyValue(
    date: string, 
    storeId: string | null, 
    isDefault: boolean, 
    selectedMetric: string, 
    value: number
  ): Promise<void> {
    try {
      await addDayData(
        date,
        value,
        selectedMetric as GraphType,
        isDefault ? "default" : storeId || undefined
      );
    } catch (error) {
      console.error("Error saving daily value:", error);
      throw error;
    }
  }

  // Fetch monthly data
  static async fetchMonthData(
    selectedMonth: number,
    selectedYear: number,
    storeId: string | null,
    isDefault: boolean,
    isCurrentMonth: boolean,
    today: Date
  ): Promise<MonthData> {
    try {
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
      const graphs: GraphType[] = [
        "gross_sales",
        "returning_customer_rate",
        "orders_fulfilled",
        "orders",
        "total_sales_over_time",
        "conversion_rate_over_time",
        "average_order_value_over_time",
        "conversion_rate_breakdown"
      ];
      
      graphs.forEach((metric) => {
        newMonthData.totals[metric] = 0;
      });

      // Fetch data for each day and aggregate
      for (const day of daysInMonth) {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayData = await fetchData(
          dateStr,
          isDefault ? "default" : storeId || undefined
        );

        // Store day data
        newMonthData.days[dateStr] = {};

        // Process each metric
        for (const metric of graphs) {
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

      return newMonthData;
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      throw error;
    }
  }

  // Save monthly data (distributes value across days)
  static async saveMonthlyData(
    selectedMonth: number,
    selectedYear: number,
    storeId: string | null,
    isDefault: boolean,
    selectedMetric: string,
    value: number,
    isCurrentMonth: boolean,
    today: Date
  ): Promise<void> {
    try {
      // Get days in the month
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth));

      // If we're in the current month, only distribute to days up to today
      const effectiveEndDate = isCurrentMonth ? today : endOfMonth(monthStart);

      const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: effectiveEndDate,
      });

      // Calculate value per day based on actual days to distribute to
      const valuePerDay = value / daysInMonth.length;

      // Update each day
      for (const day of daysInMonth) {
        const dateStr = format(day, "yyyy-MM-dd");
        await addDayData(
          dateStr,
          valuePerDay,
          selectedMetric as GraphType,
          isDefault ? "default" : storeId || undefined
        );
      }
    } catch (error) {
      console.error("Error saving monthly data:", error);
      throw error;
    }
  }

  // Save day edit (for direct cell editing in monthly view)
  static async saveDayEdit(
    day: string,
    metric: string,
    value: number,
    storeId: string | null,
    isDefault: boolean
  ): Promise<void> {
    try {
      await addDayData(
        day,
        value,
        metric as GraphType,
        isDefault ? "default" : storeId || undefined
      );
    } catch (error) {
      console.error("Error saving day edit:", error);
      throw error;
    }
  }

  // Get store settings
  static async getStoreSettings(
    storeId: string | null,
    isDefault: boolean
  ): Promise<StoreSettings> {
    try {
      // Only fetch store settings if we're not in default mode
      if (!isDefault) {
        const settings = await getStoreSettings(storeId || undefined);
        return settings as StoreSettings;
      } else {
        // Set default values for the default analytics page
        return {
          storeName: "Default Analytics Page",
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
      throw error;
    }
  }

  // Update store name
  static async updateStoreName(
    storeId: string | null,
    name: string
  ): Promise<void> {
    try {
      await updateStoreName(name.trim(), storeId || undefined);
    } catch (error) {
      console.error("Error updating store name:", error);
      throw error;
    }
  }

  // Upload store image
  static async uploadStoreImage(
    storeId: string,
    imageUrl: string
  ): Promise<void> {
    try {
      await updateStoreImage(imageUrl, storeId);
    } catch (error) {
      console.error("Error uploading store image:", error);
      throw error;
    }
  }
} 