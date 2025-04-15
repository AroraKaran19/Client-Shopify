import { FirebaseError, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc, updateDoc, addDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { differenceInDays } from "date-fns";

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
const STORE_SETTINGS_DOC_ID = "storeSettings";

const graphs = [
  "gross_sales",
  "returning_customer_rate",
  "orders_fulfilled",
  "orders",
  "total_sales_over_time",
  "conversion_rate_over_time",
  "average_order_value_over_time",
];

// Interfaces
export interface Store {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// Function to update store name
export async function updateStoreName(name: string, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);

    const docRef = doc(db, "settings", storeId || STORE_SETTINGS_DOC_ID);
    await updateDoc(docRef, {
      storeName: name,
      updatedAt: new Date().toISOString()
    });
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
  graph:
    | "gross_sales"
    | "returning_customer_rate"
    | "orders_fulfilled"
    | "orders"
    | "total_sales_over_time"
    | "conversion_rate_over_time"
    | "average_order_value_over_time",
  storeId?: string
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    const dividedValue = value / 24;
    const data = new Array(24).fill(dividedValue);

    // Use store-specific collection path if storeId is provided
    const collectionPath = storeId ? `stores/${storeId}/graphData` : "graphData";
    
    await setDoc(
      doc(db, collectionPath, date),
      {
        [graph]: data,
      },
      { merge: true }
    );
  } catch (e) {
    if (e instanceof FirebaseError) {
      console.log(`Firebase Error: (${e.code})`);
    } else {
      console.error("Error adding day data:", e);
    }
    throw e;
  }
}

export async function readDayData(
  date: string,
  graph:
    | "gross_sales"
    | "returning_customer_rate"
    | "orders_fulfilled"
    | "orders"
    | "total_sales_over_time"
    | "conversion_rate_over_time"
    | "average_order_value_over_time",
  storeId?: string
) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Use store-specific collection path if storeId is provided
    const collectionPath = storeId ? `stores/${storeId}/graphData` : "graphData";
    const querySnapshot = await getDocs(collection(db, collectionPath));

    for (const doc of querySnapshot.docs) {
      if (doc.id === date) {
        const graphData = doc.data()[graph];

        if (Array.isArray(graphData)) {
          return Math.round(graphData.reduce((acc: number, curr: number) => acc + curr, 0));
        }
        return 0;
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
    
    // Use store-specific collection path if storeId is provided
    const collectionPath = storeId ? `stores/${storeId}/graphData` : "graphData";
    
    await setDoc(doc(db, collectionPath, date), {
      gross_sales: new Array(24).fill(0),
      returning_customer_rate: new Array(24).fill(0),
      orders_fulfilled: new Array(24).fill(0),
      orders: new Array(24).fill(0),
      total_sales_over_time: new Array(24).fill(0),
      conversion_rate_over_time: new Array(24).fill(0),
      average_order_value_over_time: new Array(24).fill(0),
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
};

async function getData(date: string, storeId?: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    var result: dataReturnType = {};
    // Use store-specific collection path if storeId is provided
    const collectionPath = storeId ? `stores/${storeId}/graphData` : "graphData";
    
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

    // Use store-specific collection path if storeId is provided
    const collectionPath = storeId ? `stores/${storeId}/graphData` : "graphData";
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

export function updateDateData(date: string, data: dataReturnType, storeId?: string) {
  try {
    // Use store-specific collection path if storeId is provided
    const collectionPath = storeId ? `stores/${storeId}/graphData` : "graphData";
    setDoc(doc(db, collectionPath, date), data);
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

// Function to copy data from one store to another
export async function copyStoreData(sourceStoreId: string, targetStoreId: string) {
  try {
    // Sign in anonymously
    await signInAnonymously(auth);
    
    // Get all graph data from the source store
    const sourceCollectionPath = `stores/${sourceStoreId}/graphData`;
    const querySnapshot = await getDocs(collection(db, sourceCollectionPath));
    
    // Create a batch to write all data to the target store
    const promises = [];
    
    // Copy each document to the target store
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const targetDocRef = doc(db, `stores/${targetStoreId}/graphData`, docSnapshot.id);
      promises.push(setDoc(targetDocRef, data));
    }
    
    // Execute all writes
    await Promise.all(promises);
    
    return { success: true, count: promises.length };
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
