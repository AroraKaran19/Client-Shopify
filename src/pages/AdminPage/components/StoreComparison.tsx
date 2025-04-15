import { useState } from "react";
import { compareStores } from "@/firebase/firebase";
import { format } from "date-fns";

interface StoreComparisonProps {
  storeId: string;
  availableStores: { id: string; name: string }[];
}

const StoreComparison = ({ storeId, availableStores }: StoreComparisonProps) => {
  const [loading, setLoading] = useState(false);
  const [comparisonStoreId, setComparisonStoreId] = useState("");
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!comparisonStoreId) {
      setError("Please select a store to compare with");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await compareStores(storeId, comparisonStoreId, startDate, endDate);
      setComparisonData(data);
    } catch (error) {
      console.error("Error comparing stores:", error);
      setError(`Error comparing stores: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Get store names for display
  const getStoreName = (id: string) => {
    const store = availableStores.find(store => store.id === id);
    return store ? store.name : id;
  };

  const currentStoreName = getStoreName(storeId);
  const comparisonStoreName = comparisonStoreId ? getStoreName(comparisonStoreId) : "";

  return (
    <div className="store-comparison mt-8 border border-gray-200 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">Store Data Comparison</h2>
      
      <div className="comparison-form space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Compare with store:
          </label>
          <select
            value={comparisonStoreId}
            onChange={(e) => setComparisonStoreId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a store</option>
            {availableStores
              .filter((store) => store.id !== storeId)
              .map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              max={endDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={startDate}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
        </div>
        
        <button
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          onClick={handleCompare}
          disabled={loading || !comparisonStoreId}
        >
          Compare Stores
        </button>
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="text-center py-2">
          <div className="inline-block h-6 w-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 mt-1">Comparing stores...</p>
        </div>
      )}
      
      {comparisonData && (
        <div className="comparison-results mt-4">
          <h3 className="text-md font-semibold mb-2">
            Comparison: {currentStoreName} vs {comparisonStoreName}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {currentStoreName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {comparisonStoreName}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Difference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(comparisonData).map(([metric, data]: [string, any]) => (
                  <tr key={metric} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {metric.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {data.store1Total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {data.store2Total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${data.difference > 0 ? 'text-green-600' : data.difference < 0 ? 'text-red-600' : ''}`}>
                      {data.difference > 0 ? '+' : ''}{data.difference.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${data.percentageDifference > 0 ? 'text-green-600' : data.percentageDifference < 0 ? 'text-red-600' : ''}`}>
                      {data.percentageDifference > 0 ? '+' : ''}{data.percentageDifference.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreComparison; 