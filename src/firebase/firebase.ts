import { FirebaseError, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { differenceInDays } from "date-fns";
import { format } from "date-fns";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app);

// Store settings document ID
const STORE_SETTINGS_DOC_ID = "default";

const graphs = [
  "gross_sales",
  "returning_customer_rate",
  "orders_fulfilled",
  "orders",
  "total_sales_over_time",
  "conversion_rate_over_time",
  "average_order_value_over_time",
  "conversion_rate_breakdown"
];

// Interfaces
export interface Store {
  id: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Helper function to decide which collection path to use
function getCollectionPath(storeId?: string): string {
  if (!storeId) return "graphData";
  
  // If storeId is explicitly "default", use the main graphData collection
  if (storeId === "default") return "graphData";
  
  // Otherwise use the store-specific path
  return `stores/${storeId}/graphData`;
}

// Function to update store name
export async function updateStoreName(name: string, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const docRef = doc(db, "settings", storeId || STORE_SETTINGS_DOC_ID);
    
    // First check if the document exists
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // If it exists, update it
      await updateDoc(docRef, {
        storeName: name,
        updatedAt: new Date().toISOString()
      });
    } else {
      // If it doesn't exist, create it
      await setDoc(docRef, {
        storeName: name,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error updating store name:", e);
    }
    throw e;
  }
}

// Function to get store settings
export async function getStoreSettings(storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const docRef = doc(db, "settings", storeId || STORE_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Initialize default settings if none exist
      const defaultSettings = {
        storeName: "My Shopify Store",
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting store settings:", e);
    }
    throw e;
  }
}

export async function addDayData(
  date: string,
  value: number,
  graph: GraphType,
  storeId?: string,
  dailyMode: boolean = true
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Ensure value is an integer
    value = Math.round(value);

    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    const docRef = doc(db, collectionPath, date);
    
    console.log(`Firebase: addDayData called for date=${date}, graph=${graph}, value=${value}, storeId=${storeId || 'default'}, dailyMode=${dailyMode}`);
    
    const docSnap = await getDoc(docRef);

    // Simplified approach: always create an equal distribution of values
    // across all 24 hours, regardless of whether the document exists or not
    if (dailyMode) {
      // For exact even distribution, we use the exact value divided by 24
      // and ensure each hour gets an equal amount (with potential tiny floating point differences)
      const exactValuePerHour = value / 24;
      
      // Create the array with the exact hourly values
      const newValues = Array(24).fill(0).map(() => exactValuePerHour);
      
      // Ensure the array totals exactly to the input value by adjusting the last hour if needed
      const sum = newValues.reduce((a, b) => a + b, 0);
      if (sum !== value) {
        const difference = value - sum;
        newValues[23] += difference; // Add any tiny rounding difference to the last hour
      }
      
      console.log(`Firebase: Setting ${graph} with exact equal distribution`);
      
      // Update the document with the new values
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          [graph]: newValues.map(v => Number(v.toFixed(6))) // Fix to 6 decimal places to avoid floating point issues
        });
      } else {
        // Create the document first, then update with our graph data
        await addData(date, storeId);
        await updateDoc(docRef, {
          [graph]: newValues.map(v => Number(v.toFixed(6)))
        });
      }
    } else {
      // Non-daily mode (updating existing pattern)
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        let existingArray = existingData[graph];
        
        if (!Array.isArray(existingArray) || existingArray.length !== 24) {
          // If no valid array, create an equal distribution
          const exactValuePerHour = value / 24;
          const newValues = Array(24).fill(0).map(() => exactValuePerHour);
          
          // Ensure the array totals exactly to the input value
          const sum = newValues.reduce((a, b) => a + b, 0);
          if (sum !== value) {
            const difference = value - sum;
            newValues[23] += difference;
          }
          
          await updateDoc(docRef, {
            [graph]: newValues.map(v => Number(v.toFixed(6)))
          });
        } else {
          // We have a valid array, preserve pattern but scale to new total
          const currentTotal = existingArray.reduce((sum, val) => sum + (val || 0), 0);
          
          if (currentTotal === 0) {
            // If current total is 0, use equal distribution
            const exactValuePerHour = value / 24;
            const newValues = Array(24).fill(0).map(() => exactValuePerHour);
            
            const sum = newValues.reduce((a, b) => a + b, 0);
            if (sum !== value) {
              const difference = value - sum;
              newValues[23] += difference;
            }
            
            await updateDoc(docRef, {
              [graph]: newValues.map(v => Number(v.toFixed(6)))
            });
          } else {
            // Scale proportionally, maintaining the pattern
            const scalingFactor = value / currentTotal;
            const newValues = existingArray.map(hourValue => hourValue * scalingFactor);
            
            // Ensure the array totals exactly to the input value
            const sum = newValues.reduce((a, b) => a + b, 0);
            if (Math.abs(sum - value) > 0.0001) { // Using a small epsilon for floating point comparison
              const difference = value - sum;
              newValues[23] += difference;
            }
            
            await updateDoc(docRef, {
              [graph]: newValues.map(v => Number(v.toFixed(6)))
            });
          }
        }
      } else {
        // Document doesn't exist, create it with equal distribution
        await addData(date, storeId);
        
        const exactValuePerHour = value / 24;
        const newValues = Array(24).fill(0).map(() => exactValuePerHour);
        
        // Ensure the array totals exactly to the input value
        const sum = newValues.reduce((a, b) => a + b, 0);
        if (sum !== value) {
          const difference = value - sum;
          newValues[23] += difference;
        }
        
        await updateDoc(docRef, {
          [graph]: newValues.map(v => Number(v.toFixed(6)))
        });
      }
    }
    
    console.log(`Firebase: Successfully updated ${graph} for ${date}`);
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error adding day data:", e);
    }
    throw e;
  }
}

export type GraphType = 
  | "gross_sales"
  | "returning_customer_rate"
  | "orders_fulfilled"
  | "orders"
  | "total_sales_over_time"
  | "conversion_rate_over_time"
  | "average_order_value_over_time"
  | "conversion_rate_breakdown";

export async function readDayData(
  date: string,
  graph: GraphType,
  storeId?: string
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    const docRef = doc(db, collectionPath, date);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const graphData = docSnap.data()[graph];

      if (Array.isArray(graphData)) {
        return Math.round(graphData.reduce((acc: number, curr: number) => acc + curr, 0));
      }
    }
    
    return 0;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error reading day data:", e);
    }
    throw e;
  }
}

async function addData(date: string, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    
    await setDoc(doc(db, collectionPath, date), {
      gross_sales: new Array(24).fill(0),
      returning_customer_rate: new Array(24).fill(0),
      orders_fulfilled: new Array(24).fill(0),
      orders: new Array(24).fill(0),
      total_sales_over_time: new Array(24).fill(0),
      conversion_rate_over_time: new Array(24).fill(0),
      average_order_value_over_time: new Array(24).fill(0),
      conversion_rate_breakdown: new Array(24).fill(0),
    });
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error adding initial data:", e);
    }
    throw e;
  }
}

type dataReturnType = {
  gross_sales?: { time: string; value: number }[];
  returning_customer_rate?: { time: string; value: number }[];
  orders_fulfilled?: { time: string; value: number }[];
  orders?: { time: string; value: number }[];
  total_sales_over_time?: { time: string; value: number }[];
  conversion_rate_over_time?: { time: string; value: number }[];
  average_order_value_over_time?: { time: string; value: number }[];
  conversion_rate_breakdown?: { time: string; value: number }[];
};

async function getData(date: string, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    var result: dataReturnType = {};
    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    
    await getDocs(collection(db, collectionPath)).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        if (doc.id === date) {
          result = doc.data();
        }
      });
    });
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting data:", e);
    }
    throw e;
  }
}

export async function fetchData(date: string, storeId?: string): Promise<any> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    const docRef = doc(db, collectionPath, date);
    const docSnap = await getDoc(docRef);

    let result;
    if (docSnap.exists()) {
      // If the document exists, fetch the data
      result = await getData(date, storeId);
    } else {
      // If the document does not exist, add the data and then fetch it
      await addData(date, storeId);
      result = await getData(date, storeId);
    }

    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting document:", e);
    }
    throw e;
  }
}

export async function updateDateData(date: string, data: dataReturnType, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    
    // Use await with setDoc to ensure the operation completes
    await setDoc(doc(db, collectionPath, date), data);
    
    return { success: true };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error updating date data:", e);
    }
    throw e;
  }
}

type fetchAllDataReturnType = {
  [key: string]: {
    dataset: {
      label: string;
      data: number[] | number;
    }[];
  };
};

export async function fetchAllData(date1: string, date2: string, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    var result: fetchAllDataReturnType = {
      gross_sales: { dataset: [] },
      returning_customer_rate: { dataset: [] },
      orders_fulfilled: { dataset: [] },
      orders: { dataset: [] },
      total_sales_over_time: { dataset: [] },
      conversion_rate_over_time: { dataset: [] },
      average_order_value_over_time: { dataset: [] },
      conversion_rate_breakdown: { dataset: [] },
    };
    if (date1 === "" || date2 === "") {
      return result;
    }
    const startDate = new Date(date1);
    const endDate = new Date(date2);
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const data = await fetchData(d.toISOString().split("T")[0], storeId);
      for (let de = 0; de < graphs.length; de++) {
        const graph = graphs[de];
        result[graph].dataset.push({
          label: date,
          data: data[graph] ?? [],
        });
      }
    }
    if (differenceInDays(new Date(date2), new Date(date1)) > 1) {
      const newLabel = `${new Date(date1).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })} - ${new Date(date2).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
      Object.entries(result).forEach(([_, value]) => {
        value.dataset = [
          {
            label: newLabel,
            data: value.dataset.map((data, index) => {
              for (
                let i = 0;
                i < differenceInDays(new Date(date2), new Date(date1)) + 1;
                i++
              ) {
                if (index == i) {
                  return Array.isArray(data.data)
                    ? data.data
                        .filter((d): d is number => d !== undefined)
                        .reduce((a, b) => a + b, 0)
                    : data.data;
                }
              }
              return 0;
            }),
          },
        ];
      });
    }
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error fetching all data:", e);
    }
    throw e;
  }
}

// Function to get all available stores
export async function getAllStores() {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const storesCollection = collection(db, "stores");
    const querySnapshot = await getDocs(storesCollection);
    
    const stores: Store[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stores.push({
        id: doc.id,
        name: data.name || "Unnamed Store",
        ...data
      });
    });
    
    return stores;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting stores:", e);
    }
    throw e;
  }
}

// Function to create a new store
export async function createStore(name: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Add a new document to the stores collection
    const storesCollection = collection(db, "stores");
    const newStoreRef = await addDoc(storesCollection, {
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Create default settings for the new store
    await setDoc(doc(db, "settings", newStoreRef.id), {
      storeName: name,
      updatedAt: new Date().toISOString()
    });
    
    // Return the new store object
    return {
      id: newStoreRef.id,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error creating store:", e);
    }
    throw e;
  }
}

// Function to get store by ID or create it if it doesn't exist
export async function getStoreById(storeId: string): Promise<Store> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Check if the store exists
    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);

    if (storeSnap.exists()) {
      // Return existing store data
      return {
        id: storeSnap.id,
        ...storeSnap.data(),
      } as Store;
    } else {
      // Create a new store with this ID
      const now = new Date().toISOString();
      const newStore = {
        name: storeId,
        createdAt: now,
        updatedAt: now
      };
      
      // Set the document with the provided ID
      await setDoc(storeRef, newStore);
      
      // Create default settings for the new store
      await setDoc(doc(db, "settings", storeId), {
        storeName: storeId,
        updatedAt: now
      });
      
      // Initialize empty data structure
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await addData(dateStr, storeId);
      
      // Return the new store
      return {
        id: storeId,
        ...newStore
      } as Store;
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting/creating store:", e);
    }
    throw e;
  }
}

// Function to add bulk data for a specific store
export async function addBulkStoreData(storeId: string, data: any, date: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Use store-specific collection path
    const collectionPath = `stores/${storeId}/graphData`;
    
    // Set the document with the provided data
    await setDoc(doc(db, collectionPath, date), data, { merge: true });
    
    return { success: true };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error adding bulk store data:", e);
    }
    throw e;
  }
}

// Function to get all data for a specific store in a date range
export async function getStoreDataByDateRange(storeId: string, startDate: string, endDate: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Use fetchAllData with the specific storeId
    return await fetchAllData(startDate, endDate, storeId);
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting store data by date range:", e);
    }
    throw e;
  }
}

// Function to get a summary of all metrics for a specific store
export async function getStoreSummary(storeId: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Get today's date formatted as YYYY-MM-DD
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Get data for a rolling 30-day period
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const formattedStartDate = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
    
    // Fetch data for the date range
    const rangeData = await fetchAllData(formattedStartDate, formattedDate, storeId);
    
    // Calculate totals for each metric
    const summary: Record<string, number> = {};
    
    for (const metric of graphs) {
      const dataPoints = rangeData[metric].dataset;
      let total = 0;
      
      for (const dataPoint of dataPoints) {
        if (Array.isArray(dataPoint.data)) {
          total += dataPoint.data.reduce((sum, value) => sum + value, 0);
        } else if (typeof dataPoint.data === 'number') {
          total += dataPoint.data;
        }
      }
      
      summary[metric] = total;
    }
    
    return summary;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting store summary:", e);
    }
    throw e;
  }
}

export interface CopyStoreOptions {
  copyType: 'all' | 'dateRange' | 'lastNDays';
  startDate?: string;
  endDate?: string;
  lastNDays?: number;
  overwriteExisting: boolean;
  copySettings: boolean;
  copyImages: boolean;
}

// Function to copy data from one store to another with advanced options
export async function copyStoreData(sourceStoreId: string, targetStoreId: string, options: CopyStoreOptions = {
  copyType: 'all',
  overwriteExisting: true,
  copySettings: false,
  copyImages: false
}) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    const results = {
      success: true,
      analyticsDataCopied: 0,
      settingsCopied: false,
      imagesCopied: 0,
      errors: [] as string[]
    };

    // Get source collection path
    const sourceCollectionPath = getCollectionPath(sourceStoreId);
    const targetCollectionPath = getCollectionPath(targetStoreId);
    
    // Determine which dates to copy
    let dateFilter: any = {};
    if (options.copyType === 'dateRange' && options.startDate && options.endDate) {
      dateFilter = query(
        collection(db, sourceCollectionPath),
        where("__name__", ">=", options.startDate),
        where("__name__", "<=", options.endDate)
      );
    } else if (options.copyType === 'lastNDays' && options.lastNDays) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - options.lastNDays);
      
      const endDateStr = format(endDate, "yyyy-MM-dd");
      const startDateStr = format(startDate, "yyyy-MM-dd");
      
      dateFilter = query(
        collection(db, sourceCollectionPath),
        where("__name__", ">=", startDateStr),
        where("__name__", "<=", endDateStr)
      );
    } else {
      // Copy all data
      dateFilter = collection(db, sourceCollectionPath);
    }
    
    // Get source data
    const sourceSnapshot = await getDocs(dateFilter);
    
    if (sourceSnapshot.empty) {
      throw new Error("No data found in source store for the specified criteria");
    }

    // Copy analytics data
    const analyticsPromises = [];
    
    for (const docSnapshot of sourceSnapshot.docs) {
      const sourceData = docSnapshot.data();
      const dateId = docSnapshot.id;
      
      if (!options.overwriteExisting) {
        // Check if target document exists
        const targetDocRef = doc(db, targetCollectionPath, dateId);
        const targetDoc = await getDoc(targetDocRef);
        
        if (targetDoc.exists()) {
          continue; // Skip if exists and not overwriting
        }
      }
      
      const targetDocRef = doc(db, targetCollectionPath, dateId);
      analyticsPromises.push(setDoc(targetDocRef, sourceData));
    }
    
    // Execute analytics data copy
    await Promise.all(analyticsPromises);
    results.analyticsDataCopied = analyticsPromises.length;

    // Copy store settings if requested
    if (options.copySettings) {
      try {
        const sourceSettingsRef = doc(db, "settings", sourceStoreId);
        const sourceSettings = await getDoc(sourceSettingsRef);
        
        if (sourceSettings.exists()) {
          const settingsData = sourceSettings.data();
          const targetSettingsRef = doc(db, "settings", targetStoreId);
          await setDoc(targetSettingsRef, {
            ...settingsData,
            updatedAt: new Date().toISOString()
          });
          results.settingsCopied = true;
        }
        
        // Also copy store document from stores collection
        const sourceStoreRef = doc(db, "stores", sourceStoreId);
        const sourceStore = await getDoc(sourceStoreRef);
        
        if (sourceStore.exists()) {
          const storeData = sourceStore.data();
          const targetStoreRef = doc(db, "stores", targetStoreId);
          await setDoc(targetStoreRef, {
            ...storeData,
            id: targetStoreId,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (error) {
        results.errors.push(`Failed to copy settings: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Copy store images if requested
    if (options.copyImages) {
      try {
        const sourceImages = await getAllStoreImages(sourceStoreId);
        
        for (const imageMetadata of sourceImages) {
          try {
            await saveStoreImageMetadata(targetStoreId, {
              ...imageMetadata,
              uploadedAt: new Date().toISOString()
            });
            results.imagesCopied++;
          } catch (error) {
            results.errors.push(`Failed to copy image ${imageMetadata.imageType}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      } catch (error) {
        results.errors.push(`Failed to retrieve source store images: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    
    return results;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error copying store data:", e);
    }
    throw e;
  }
}

// Function to clear all data for a specific store
export async function clearStoreData(storeId: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Get all graph data documents for the store
    const collectionPath = `stores/${storeId}/graphData`;
    const querySnapshot = await getDocs(collection(db, collectionPath));
    
    // Delete each document
    const promises = [];
    for (const docSnapshot of querySnapshot.docs) {
      promises.push(setDoc(doc(db, collectionPath, docSnapshot.id), {
        gross_sales: new Array(24).fill(0),
        returning_customer_rate: new Array(24).fill(0),
        orders_fulfilled: new Array(24).fill(0),
        orders: new Array(24).fill(0),
        total_sales_over_time: new Array(24).fill(0),
        conversion_rate_over_time: new Array(24).fill(0),
        average_order_value_over_time: new Array(24).fill(0),
      }));
    }
    
    // Execute all deletions
    await Promise.all(promises);
    
    return { success: true, count: promises.length };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error clearing store data:", e);
    }
    throw e;
  }
}

// Function to compare data between two stores
export async function compareStores(storeId1: string, storeId2: string, startDate: string, endDate: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Get data for both stores
    const store1Data = await fetchAllData(startDate, endDate, storeId1);
    const store2Data = await fetchAllData(startDate, endDate, storeId2);
    
    // Prepare comparison result
    const comparison: Record<string, { store1Total: number, store2Total: number, difference: number, percentageDifference: number }> = {};
    
    // Calculate totals and differences for each metric
    for (const metric of graphs) {
      let store1Total = 0;
      let store2Total = 0;
      
      // Calculate store1 total
      for (const dataPoint of store1Data[metric].dataset) {
        if (Array.isArray(dataPoint.data)) {
          store1Total += dataPoint.data.reduce((sum, value) => sum + value, 0);
        } else if (typeof dataPoint.data === 'number') {
          store1Total += dataPoint.data;
        }
      }
      
      // Calculate store2 total
      for (const dataPoint of store2Data[metric].dataset) {
        if (Array.isArray(dataPoint.data)) {
          store2Total += dataPoint.data.reduce((sum, value) => sum + value, 0);
        } else if (typeof dataPoint.data === 'number') {
          store2Total += dataPoint.data;
        }
      }
      
      // Calculate difference and percentage difference
      const difference = store1Total - store2Total;
      const percentageDifference = store2Total === 0 ? 
        (store1Total === 0 ? 0 : 100) : 
        (difference / store2Total) * 100;
      
      comparison[metric] = {
        store1Total,
        store2Total,
        difference,
        percentageDifference
      };
    }
    
    return comparison;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error comparing stores:", e);
    }
    throw e;
  }
}

// Function to generate sample data for a store
export async function generateSampleData(storeId: string, multiplier: number = 1) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Generate data for the last 30 days
    const today = new Date();
    const promises = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Generate random data for each metric
      const data: Record<string, number[]> = {};
      
      for (const metric of graphs) {
        // Create daily pattern with some randomness
        data[metric] = Array.from({ length: 24 }, (_, hour) => {
          // More activity during business hours (8am-6pm)
          const baseValue = (hour >= 8 && hour <= 18) ? 
            (5 + Math.random() * 15) * multiplier : 
            (1 + Math.random() * 5) * multiplier;
          
          return Math.round(baseValue * 100) / 100;
        });
      }
      
      // Add the data to Firebase
      promises.push(setDoc(doc(db, `stores/${storeId}/graphData`, dateStr), data));
    }
    
    // Execute all writes
    await Promise.all(promises);
    
    return { success: true, daysGenerated: 30 };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error generating sample data:", e);
    }
    throw e;
  }
}

// Function to set default store for analytics
export async function setDefaultAnalyticsStore(storeId: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Save the default store ID to a special settings document
    const docRef = doc(db, "settings", "appSettings");
    await setDoc(docRef, {
      defaultAnalyticsStore: storeId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return { success: true };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error setting default analytics store:", e);
    }
    throw e;
  }
}

// Function to get default analytics store
export async function getDefaultAnalyticsStore() {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const docRef = doc(db, "settings", "appSettings");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().defaultAnalyticsStore) {
      return docSnap.data().defaultAnalyticsStore;
    } else {
      return null; // No default store set
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting default analytics store:", e);
    }
    throw e;
  }
}

// Interface for store image metadata
export interface StoreImageMetadata {
  url: string;
  publicId: string;
  imageType: 'default-device-session' | 'default-rate-breakdown' | string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  uploadedAt: string;
}

// Function to update store image with Cloudinary metadata
export async function updateStoreImage(imageUrl: string, storeId: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const storeRef = doc(db, "stores", storeId);
    
    // Check if store document exists first
    const storeSnap = await getDoc(storeRef);
    if (storeSnap.exists()) {
      // Update existing document
    await updateDoc(storeRef, {
      imageUrl,
      updatedAt: new Date().toISOString()
    });
    } else {
      // Create new store document
      await setDoc(storeRef, {
        id: storeId,
        name: storeId === "default" ? "Default Store" : `Store ${storeId}`,
        imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error updating store image:", e);
    }
    throw e;
  }
}

// Function to save store image metadata to Firestore
export async function saveStoreImageMetadata(
  storeId: string,
  imageMetadata: StoreImageMetadata
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Create the document path: images/stores/{storeId}/{imageType}
    const imageDocRef = doc(db, "images", "stores", storeId, imageMetadata.imageType);
    
    // Save the metadata
    await setDoc(imageDocRef, {
      ...imageMetadata,
      storeId,
      updatedAt: new Date().toISOString()
    });

    // Also update the store document with the main image URL (for backward compatibility)
    const storeRef = doc(db, "stores", storeId);
    
    // Check if store document exists first
    const storeSnap = await getDoc(storeRef);
    if (storeSnap.exists()) {
      // Update existing document
      await updateDoc(storeRef, {
        imageUrl: imageMetadata.url,
        updatedAt: new Date().toISOString()
      });
    } else {
      // Create new store document
      await setDoc(storeRef, {
        id: storeId,
        name: storeId === "default" ? "Default Store" : `Store ${storeId}`,
        imageUrl: imageMetadata.url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return { success: true };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error saving store image metadata:", e);
    }
    throw e;
  }
}

// Function to get store image metadata
export async function getStoreImageMetadata(
  storeId: string,
  imageType: string
): Promise<StoreImageMetadata | null> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const imageDocRef = doc(db, "images", "stores", storeId, imageType);
    const imageSnap = await getDoc(imageDocRef);

    if (imageSnap.exists()) {
      return imageSnap.data() as StoreImageMetadata;
    }
    return null;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting store image metadata:", e);
    }
    throw e;
  }
}

// Function to get all store images
export async function getAllStoreImages(storeId: string): Promise<StoreImageMetadata[]> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const imagesQuery = query(collection(db, "images", "stores", storeId));
    const querySnapshot = await getDocs(imagesQuery);
    
    const images: StoreImageMetadata[] = [];
    querySnapshot.forEach((doc) => {
      images.push(doc.data() as StoreImageMetadata);
    });

    return images;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting all store images:", e);
    }
    throw e;
  }
}

// Function to delete store image metadata
export async function deleteStoreImageMetadata(
  storeId: string,
  imageType: string
): Promise<void> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const imageDocRef = doc(db, "images", "stores", storeId, imageType);
    await deleteDoc(imageDocRef);
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error deleting store image metadata:", e);
    }
    throw e;
  }
}

// Function to get store image
export async function getStoreImage(storeId: string): Promise<string | null> {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const storeRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeRef);

    if (storeSnap.exists()) {
      return storeSnap.data().imageUrl || null;
    }
    return null;
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error getting store image:", e);
    }
    throw e;
  }
}

// Function to remove default analytics store
export async function removeDefaultAnalyticsStore() {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Update the appSettings document to remove the default store ID
    const docRef = doc(db, "settings", "appSettings");
    await updateDoc(docRef, {
      defaultAnalyticsStore: null,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error removing default analytics store:", e);
    }
    throw e;
  }
}

// Function to delete a store and all its related data
export async function deleteStore(storeId: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Check if this is the default analytics store
    const defaultStoreId = await getDefaultAnalyticsStore();
    if (defaultStoreId === storeId) {
      // Remove it as the default store first
      await removeDefaultAnalyticsStore();
    }

    // Delete the store document from the stores collection
    const storeRef = doc(db, "stores", storeId);
    await deleteDoc(storeRef);

    // Delete the store settings document
    const settingsRef = doc(db, "settings", storeId);
    await deleteDoc(settingsRef);

    // Delete any analytics data for this store
    // Get all analytics docs for this store
    const analyticsQuery = query(collection(db, "analytics"), where("storeId", "==", storeId));
    const analyticsSnapshot = await getDocs(analyticsQuery);
    
    // Delete each analytics document
    const deletionPromises = analyticsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletionPromises);
    
    return { success: true };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error deleting store:", e);
    }
    throw e;
  }
}

// Function to copy data from one month to another month
export async function copyMonthData(
  sourceMonth: number,
  sourceYear: number,
  targetMonth: number,
  targetYear: number,
  storeId?: string
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Create date ranges for source and target months
    const sourceMonthStart = new Date(sourceYear, sourceMonth, 1);
    const sourceMonthEnd = new Date(sourceYear, sourceMonth + 1, 0); // Last day of source month
    
    const targetMonthEnd = new Date(targetYear, targetMonth + 1, 0); // Last day of target month

    // Get collection path for the store
    const collectionPath = getCollectionPath(storeId);
    
    // Get the source month data
    const sourceData: Record<string, any> = {};
    const sourceDatesQuery = query(
      collection(db, collectionPath),
      where("__name__", ">=", format(sourceMonthStart, "yyyy-MM-dd")),
      where("__name__", "<=", format(sourceMonthEnd, "yyyy-MM-dd"))
    );
    
    const sourceQuerySnapshot = await getDocs(sourceDatesQuery);
    sourceQuerySnapshot.forEach((doc) => {
      sourceData[doc.id] = doc.data();
    });

    // If no source data found, throw error
    if (Object.keys(sourceData).length === 0) {
      throw new Error(`No data found for ${sourceMonthStart.toLocaleString('default', { month: 'long' })} ${sourceYear}`);
    }

    // Prepare batch operations for copying data to target month
    const batch = [];
    
    // Get days in source month
    const daysInSourceMonth = sourceMonthEnd.getDate();
    // Get days in target month
    const daysInTargetMonth = targetMonthEnd.getDate();
    
    // For each day in the target month, find corresponding source day
    for (let day = 1; day <= daysInTargetMonth; day++) {
      const targetDate = new Date(targetYear, targetMonth, day);
      const targetDateStr = format(targetDate, "yyyy-MM-dd");
      
      // Find the closest matching day from source month
      // For simple 1:1 mapping, we just use the same day number if it exists
      let sourceDay = day;
      
      // If target month has more days than source month, reuse the last day
      if (sourceDay > daysInSourceMonth) {
        sourceDay = daysInSourceMonth;
      }
      
      const sourceDate = new Date(sourceYear, sourceMonth, sourceDay);
      const sourceDateStr = format(sourceDate, "yyyy-MM-dd");
      
      // If source data exists for this day, copy it to target
      if (sourceData[sourceDateStr]) {
        batch.push({
          targetDate: targetDateStr,
          data: sourceData[sourceDateStr]
        });
      }
    }
    
    // Execute all the write operations
    const writePromises = batch.map(item => 
      setDoc(doc(db, collectionPath, item.targetDate), item.data)
    );
    
    await Promise.all(writePromises);
    
    return { 
      success: true, 
      copyCount: writePromises.length,
      sourceDays: Object.keys(sourceData).length,
      targetDays: daysInTargetMonth
    };
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error copying month data:", e);
    }
    throw e;
  }
}

// Function to directly update a daily total with proper error handling
export async function updateDailyTotal(
  date: string,
  value: number,
  graph: GraphType,
  storeId?: string
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    // Ensure value is an integer
    value = Math.round(value);

    console.log(`Firebase: updateDailyTotal called for date=${date}, graph=${graph}, value=${value}, storeId=${storeId || 'default'}`);

    // Use helper function to get the correct path
    const collectionPath = getCollectionPath(storeId);
    const docRef = doc(db, collectionPath, date);
    
    const docSnap = await getDoc(docRef);

    // For consistency with addDayData, always use exact equal distribution
    // Calculate the exact value per hour
    const exactValuePerHour = value / 24;
    
    // Create an array with exactly equal values
    const newValues = Array(24).fill(0).map(() => exactValuePerHour);
    
    // Ensure the total is exactly the input value
    const sum = newValues.reduce((a, b) => a + b, 0);
    if (sum !== value) {
      const difference = value - sum;
      newValues[23] += difference; // Add any tiny rounding difference to the last hour
    }
    
    console.log(`Firebase: Setting ${graph} with exact equal distribution`);
    
    try {
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          [graph]: newValues.map(v => Number(v.toFixed(6))) // Fix to 6 decimal places to avoid floating point issues
        });
      } else {
        // Document doesn't exist, create it with equal distribution
        await addData(date, storeId);
        await updateDoc(docRef, {
          [graph]: newValues.map(v => Number(v.toFixed(6)))
        });
      }
      
      console.log(`Firebase: Successfully updated ${graph} for ${date} to total ${value}`);
      return { success: true };
    } catch (updateError) {
      console.error(`Firebase: Error updating document: ${updateError}`);
      throw updateError;
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code}): ${e.message}`);
    } else {
      console.error("Error updating daily total:", e);
    }
    throw e;
  }
}
