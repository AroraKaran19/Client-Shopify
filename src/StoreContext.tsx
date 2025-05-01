import React, { createContext, useContext, useState, useEffect } from "react";
import { getStoreSettings, getDefaultAnalyticsStore } from "./firebase/firebase";

interface StoreContextType {
  currentStoreId: string | null;
  setCurrentStoreId: (id: string | null) => void;
  defaultStoreId: string | null;
  storeName: string;
  refreshStoreInfo: () => void;
}

export const StoreContext = createContext<StoreContextType>({
  currentStoreId: null,
  setCurrentStoreId: () => {},
  defaultStoreId: null,
  storeName: "My Shopify Store",
  refreshStoreInfo: () => {},
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [defaultStoreId, setDefaultStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>("My Shopify Store");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load the default store ID on initial render
  useEffect(() => {
    const loadDefaultStore = async () => {
      try {
        const defaultId = await getDefaultAnalyticsStore();
        setDefaultStoreId(defaultId);
        
        // If no current store is set, use the default
        if (!currentStoreId && defaultId) {
          setCurrentStoreId(defaultId);
        }
      } catch (error) {
        console.error("Error loading default store:", error);
      }
    };
    
    loadDefaultStore();
  }, []);

  // Fetch store info whenever the current ID changes or refresh is triggered
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        // Always use the current store ID if available
        const storeId = currentStoreId || defaultStoreId;
        
        const settings = await getStoreSettings(storeId || undefined);
        setStoreName(settings.storeName);
      } catch (error) {
        console.error("Error fetching store info:", error);
      }
    };

    fetchStoreInfo();
  }, [currentStoreId, defaultStoreId, refreshTrigger]);

  // Function to manually trigger a refresh
  const refreshStoreInfo = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Create a wrapped setCurrentStoreId function that automatically refreshes
  const handleSetCurrentStoreId = (id: string | null) => {
    setCurrentStoreId(id);
    // The refresh will happen automatically via the useEffect dependency
  };

  return (
    <StoreContext.Provider value={{ 
      currentStoreId, 
      setCurrentStoreId: handleSetCurrentStoreId,
      defaultStoreId,
      storeName, 
      refreshStoreInfo 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook to use the store context
export const useStore = () => useContext(StoreContext); 