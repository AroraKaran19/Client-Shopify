import { useState } from "react";
import { 
  generateSampleData, 
  clearStoreData, 
  copyStoreData,
  getStoreSummary
} from "@/firebase/firebase";

interface StoreDataControlsProps {
  storeId: string;
  availableStores: {id: string, name: string}[];
}

const StoreDataControls = ({ storeId, availableStores }: StoreDataControlsProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [targetStoreId, setTargetStoreId] = useState("");
  const [dataMultiplier, setDataMultiplier] = useState(1);
  const [storeSummary, setStoreSummary] = useState<Record<string, number> | null>(null);

  const handleGenerateSampleData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const result = await generateSampleData(storeId, dataMultiplier);
      
      if (result.success) {
        setMessage({
          text: `Successfully generated sample data for ${result.daysGenerated} days`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Error generating sample data:", error);
      setMessage({
        text: `Error generating sample data: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearStoreData = async () => {
    try {
      if (!confirm("Are you sure you want to clear all data for this store? This action cannot be undone.")) {
        return;
      }
      
      setLoading(true);
      setMessage(null);
      
      const result = await clearStoreData(storeId);
      
      if (result.success) {
        setMessage({
          text: `Successfully cleared data for ${result.count} days`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Error clearing store data:", error);
      setMessage({
        text: `Error clearing store data: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyStoreData = async () => {
    if (!targetStoreId) {
      setMessage({
        text: "Please select a target store",
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setMessage(null);
      
      const result = await copyStoreData(storeId, targetStoreId, {
        copyType: 'all',
        overwriteExisting: true,
        copySettings: false,
        copyImages: false
      });
      
      if (result.success) {
        setMessage({
          text: `Successfully copied ${result.analyticsDataCopied} days of data to the target store`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error("Error copying store data:", error);
      setMessage({
        text: `Error copying store data: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSummary = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const summary = await getStoreSummary(storeId);
      setStoreSummary(summary);
      
    } catch (error) {
      console.error("Error loading store summary:", error);
      setMessage({
        text: `Error loading store summary: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-data-controls mt-6 border border-gray-200 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Store Data Management</h2>
      
      {/* Sample Data Generation */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Generate Sample Data</h3>
        <div className="flex items-center gap-2 mb-2">
          <label className="whitespace-nowrap">Data Multiplier:</label>
          <input 
            type="number" 
            min="0.1" 
            max="10" 
            step="0.1" 
            value={dataMultiplier}
            onChange={(e) => setDataMultiplier(parseFloat(e.target.value))}
            className="border border-gray-300 rounded p-1 w-24"
          />
          <span className="text-sm text-gray-500">Higher values = more data</span>
        </div>
        <button
          className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          onClick={handleGenerateSampleData}
          disabled={loading}
        >
          Generate 30 Days of Sample Data
        </button>
      </div>
      
      {/* Copy Store Data */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Copy Store Data</h3>
        <div className="flex items-center gap-2 mb-2">
          <label className="whitespace-nowrap">Target Store:</label>
          <select
            value={targetStoreId}
            onChange={(e) => setTargetStoreId(e.target.value)}
            className="border border-gray-300 rounded p-1.5 flex-grow"
          >
            <option value="">Select a store</option>
            {availableStores
              .filter(store => store.id !== storeId)
              .map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))
            }
          </select>
        </div>
        <button
          className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          onClick={handleCopyStoreData}
          disabled={loading || !targetStoreId}
        >
          Copy Data to Selected Store
        </button>
      </div>
      
      {/* Store Summary */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Store Data Summary (Last 30 Days)</h3>
        <button
          className="px-3 py-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:pointer-events-none mb-2"
          onClick={handleLoadSummary}
          disabled={loading}
        >
          Load Summary
        </button>
        
        {storeSummary && (
          <div className="mt-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(storeSummary).map(([metric, value]) => (
                <div key={metric} className="p-2 bg-white rounded border border-gray-200">
                  <div className="font-medium">{metric.replace(/_/g, ' ')}</div>
                  <div className="text-lg">{value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Clear Store Data */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Clear Store Data</h3>
        <button
          className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          onClick={handleClearStoreData}
          disabled={loading}
        >
          Clear All Store Data
        </button>
        <p className="text-sm text-gray-500 mt-1">Warning: This action cannot be undone!</p>
      </div>
      
      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      {loading && (
        <div className="text-center py-2">
          <div className="inline-block h-6 w-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-1">Processing...</p>
        </div>
      )}
    </div>
  );
};

export default StoreDataControls; 