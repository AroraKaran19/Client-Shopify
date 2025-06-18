import { useState } from "react";
import { format } from "date-fns";
import { CopyStoreOptions } from "@/firebase/firebase";

interface StoreDataCopyProps {
  currentStoreId: string;
  availableStores: { id: string; name: string }[];
  onCopyStoreData: (sourceStoreId: string, targetStoreId: string, options: CopyStoreOptions) => Promise<void>;
}

const StoreDataCopy = ({
  currentStoreId,
  availableStores,
  onCopyStoreData,
}: StoreDataCopyProps) => {
  const [targetStoreId, setTargetStoreId] = useState<string>("");
  const [copyType, setCopyType] = useState<'all' | 'dateRange' | 'lastNDays'>('all');
  const [startDate, setStartDate] = useState<string>(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [lastNDays, setLastNDays] = useState<number>(30);
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(true);
  const [copySettings, setCopySettings] = useState<boolean>(false);
  const [copyImages, setCopyImages] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState(false);

  const getStoreName = (storeId: string) => {
    if (storeId === 'default') return 'Default Store';
    const store = availableStores.find(store => store.id === storeId);
    return store ? store.name : storeId;
  };

  const handleCopyStoreData = async () => {
    if (!targetStoreId) {
      alert("Please select a target store");
      return;
    }

    if (targetStoreId === currentStoreId) {
      alert("Source and target stores cannot be the same");
      return;
    }

    const sourceStoreName = getStoreName(currentStoreId);
    const targetStoreName = getStoreName(targetStoreId);

    let confirmMessage = `Are you sure you want to copy data from "${sourceStoreName}" to "${targetStoreName}"?`;
    
    if (copyType === 'dateRange') {
      confirmMessage += `\n\nDate Range: ${startDate} to ${endDate}`;
    } else if (copyType === 'lastNDays') {
      confirmMessage += `\n\nLast ${lastNDays} days`;
    } else {
      confirmMessage += `\n\nAll available data`;
    }

    const additionalOptions = [];
    if (copySettings) additionalOptions.push("Store Settings");
    if (copyImages) additionalOptions.push("Store Images");
    if (additionalOptions.length > 0) {
      confirmMessage += `\n\nAdditional items: ${additionalOptions.join(", ")}`;
    }

    if (overwriteExisting) {
      confirmMessage += `\n\n⚠️ This will OVERWRITE any existing data in the target store.`;
    } else {
      confirmMessage += `\n\n📝 This will only copy data for dates that don't exist in the target store.`;
    }

    confirmMessage += `\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsCopying(true);
      
      const options: CopyStoreOptions = {
        copyType,
        startDate: copyType === 'dateRange' ? startDate : undefined,
        endDate: copyType === 'dateRange' ? endDate : undefined,
        lastNDays: copyType === 'lastNDays' ? lastNDays : undefined,
        overwriteExisting,
        copySettings,
        copyImages,
      };

      await onCopyStoreData(currentStoreId, targetStoreId, options);
    } finally {
      setIsCopying(false);
    }
  };

  const filteredStores = availableStores.filter(store => store.id !== currentStoreId);

  return (
    <div className="store-data-copy p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Copy Store Data</h3>
      <p className="text-sm text-gray-600 mb-4">
        Copy data from "{getStoreName(currentStoreId)}" to another store
      </p>

      <div className="space-y-4">
        {/* Target Store Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Store
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={targetStoreId}
            onChange={(e) => setTargetStoreId(e.target.value)}
          >
            <option value="">Select target store</option>
            {filteredStores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
            {currentStoreId !== 'default' && (
              <option value="default">Default Store</option>
            )}
          </select>
        </div>

        {/* Copy Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data to Copy
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="copyType"
                value="all"
                checked={copyType === 'all'}
                onChange={(e) => setCopyType(e.target.value as 'all')}
                className="mr-2"
              />
              All available data
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="copyType"
                value="lastNDays"
                checked={copyType === 'lastNDays'}
                onChange={(e) => setCopyType(e.target.value as 'lastNDays')}
                className="mr-2"
              />
              Last N days
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="copyType"
                value="dateRange"
                checked={copyType === 'dateRange'}
                onChange={(e) => setCopyType(e.target.value as 'dateRange')}
                className="mr-2"
              />
              Specific date range
            </label>
          </div>
        </div>

        {/* Last N Days Input */}
        {copyType === 'lastNDays' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Days
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={lastNDays}
              onChange={(e) => setLastNDays(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        )}

        {/* Date Range Inputs */}
        {copyType === 'dateRange' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Copy Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Copy Options
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="mr-2"
              />
              Overwrite existing data in target store
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={copySettings}
                onChange={(e) => setCopySettings(e.target.checked)}
                className="mr-2"
              />
              Copy store settings (name, etc.)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={copyImages}
                onChange={(e) => setCopyImages(e.target.checked)}
                className="mr-2"
              />
              Copy store images (if any)
            </label>
          </div>
        </div>

        {/* Copy Button */}
        <div className="pt-2">
          <button
            className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            onClick={handleCopyStoreData}
            disabled={isCopying || !targetStoreId}
          >
            {isCopying ? "Copying Store Data..." : "Copy Store Data"}
          </button>
        </div>

        {/* Info Text */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md">
          <p className="font-medium mb-1">ℹ️ Important Notes:</p>
          <ul className="space-y-1">
            <li>• Analytics data includes all metrics (sales, orders, conversion rates, etc.)</li>
            <li>• Store settings include the store name and configuration</li>
            <li>• Store images include logos, banners, and custom analytics images</li>
            <li>• This operation may take some time for stores with large amounts of data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StoreDataCopy; 