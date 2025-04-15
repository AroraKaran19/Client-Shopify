import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./analytics-page.css";
import ActionBtns from "./components/ActionBtns";
import GraphContent from "./components/GraphContent";
import OverviewGraphs from "./components/OverviewGraphs";
import PageHeading from "./components/PageHeading";
import { getStoreById } from "@/firebase/firebase";

const AnalyticsPage = () => {
  const { storeId } = useParams<{ storeId?: string }>();
  const [focus, setFocus] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<string | undefined>(undefined);
  const [storeName, setStoreName] = useState<string | undefined>(undefined);

  // Handle storeId from URL - get store or create if it doesn't exist
  useEffect(() => {
    const initializeStore = async () => {
      if (storeId) {
        try {
          // This will either get the existing store or create a new one with this ID
          const store = await getStoreById(storeId);
          setCurrentStoreId(store.id);
          setStoreName(store.name);
        } catch (error) {
          console.error("Error initializing store:", error);
        }
      }
    };

    initializeStore();
  }, [storeId]);

  return (
    <div className={`analytics-page p-6 pb-5 flex flex-col gap-5 ${focus ? "absolute top-0 left-0 w-full h-max z-[2000] bg-[#f1f1f1] transition-all duration-150 ease-in-out" : ""}`}>
      {storeId && storeName && (
        <div className="store-indicator bg-blue-50 p-3 rounded-lg border border-blue-200 mb-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-blue-700 font-medium">Store: {storeName}</span>
              <span className="text-sm text-blue-500 ml-2">(ID: {storeId})</span>
            </div>
            <Link to="/admin" className="text-blue-600 hover:text-blue-800 text-sm hover:underline">
              Manage Stores →
            </Link>
          </div>
        </div>
      )}
      
      <PageHeading focus={focus} setFocus={setFocus} />
      <ActionBtns />
      <OverviewGraphs storeId={currentStoreId} />
      <GraphContent storeId={currentStoreId} />
      <p className="text-center text-[13px] leading-4">Learn more about <a href="https://help.shopify.com/manual/reports-and-analytics/shopify-reports/new-analytics" className="text-[rgb(0,91,211)] underline">analytics</a></p>
    </div>
  )
}

export default AnalyticsPage;