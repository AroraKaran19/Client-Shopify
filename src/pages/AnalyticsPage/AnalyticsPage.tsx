import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./analytics-page.css";
import ActionBtns from "./components/ActionBtns";
import GraphContent from "./components/GraphContent";
import OverviewGraphs from "./components/OverviewGraphs";
import PageHeading from "./components/PageHeading";
import { getStoreById } from "@/firebase/firebase";
import { useStore } from "@/StoreContext";

const AnalyticsPage = () => {
  const { storeId } = useParams<{ storeId?: string }>();
  const [focus, setFocus] = useState(false);
  const [localStoreId, setLocalStoreId] = useState<string | undefined>(undefined);
  
  // Get store context to sync with global state
  const { setCurrentStoreId } = useStore();
  
  // Use a ref to track if store has been initialized
  const storeInitializedRef = useRef<boolean>(false);
  // Use a ref to track the previous storeId to prevent redundant updates
  const prevStoreIdRef = useRef<string | undefined>(undefined);

  // Handle storeId from URL - get store or create if it doesn't exist
  useEffect(() => {
    // Skip if storeId hasn't changed
    if (prevStoreIdRef.current === storeId && storeInitializedRef.current) {
      return;
    }
    
    // Update the previous storeId ref
    prevStoreIdRef.current = storeId;
    
    const initializeStore = async () => {
      if (storeId) {
        try {
          // This will either get the existing store or create a new one with this ID
          const store = await getStoreById(storeId);
          setLocalStoreId(store.id);
          
          // Update global store context
          setCurrentStoreId(store.id);
          // Note: We don't need to call refreshStoreInfo here since setCurrentStoreId does that in StoreContext
        } catch (error) {
          console.error("Error initializing store:", error);
        }
      } else {
        // If no storeId, set global context to null to use default
        setCurrentStoreId(null);
        // The context will handle refreshing automatically
      }
      
      // Mark as initialized
      storeInitializedRef.current = true;
    };

    initializeStore();
  }, [storeId, setCurrentStoreId]);

  return (
    <div className={`analytics-page p-6 pb-5 flex flex-col gap-5 ${focus ? "absolute top-0 left-0 w-full h-max z-[2000] bg-[#f1f1f1] transition-all duration-150 ease-in-out" : ""}`}>
      <PageHeading focus={focus} setFocus={setFocus} />
      <ActionBtns />
      <OverviewGraphs storeId={localStoreId} />
      <GraphContent storeId={localStoreId} />
      <p className="text-center text-[13px] leading-4">Learn more about <a href="https://help.shopify.com/manual/reports-and-analytics/shopify-reports/new-analytics" className="text-[rgb(0,91,211)] underline">analytics</a></p>
    </div>
  )
}

export default AnalyticsPage;