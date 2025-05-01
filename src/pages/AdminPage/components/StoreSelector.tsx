import { useState } from "react";

interface Store {
  id: string;
  name: string;
}

interface StoreSelectorProps {
  availableStores: Store[];
  currentStoreId: string;
  isEditingDefault: boolean;
  defaultAnalyticsStoreId: string;
  onStoreChange: (storeId: string, isDefault: boolean) => void;
  onSetDefaultStore: (storeId: string) => Promise<void>;
  onRemoveDefaultStore: () => Promise<void>;
}

const StoreSelector = ({
  availableStores,
  currentStoreId,
  isEditingDefault,
  defaultAnalyticsStoreId,
  onStoreChange,
  onSetDefaultStore,
  onRemoveDefaultStore
}: StoreSelectorProps) => {
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [isRemovingDefault, setIsRemovingDefault] = useState(false);

  const handleSetDefaultStore = async () => {
    if (!currentStoreId || isEditingDefault) return;
    
    try {
      setIsSettingDefault(true);
      await onSetDefaultStore(currentStoreId);
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleRemoveDefaultStore = async () => {
    try {
      setIsRemovingDefault(true);
      await onRemoveDefaultStore();
    } finally {
      setIsRemovingDefault(false);
    }
  };

  if (availableStores.length === 0) return null;

  return (
    <div className="store-selector flex items-center gap-3">
      <div>
        <label
          htmlFor="store-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Store
        </label>
        <div className="flex items-center gap-2">
          <select
            id="store-select"
            className="w-full md:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={isEditingDefault ? "default" : currentStoreId}
            onChange={(e) => {
              const selectedValue = e.target.value;
              onStoreChange(
                selectedValue, 
                selectedValue === "default"
              );
            }}
          >
            <option value="default" className="font-semibold">
              Default Analytics Page
            </option>
            {availableStores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}{" "}
                {store.id === defaultAnalyticsStoreId
                  ? "(Default Analytics)"
                  : ""}
              </option>
            ))}
          </select>
          
          {/* Set as default button */}
          {currentStoreId &&
            !isEditingDefault &&
            currentStoreId !== defaultAnalyticsStoreId && (
              <button
                className="p-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors whitespace-nowrap disabled:opacity-70"
                onClick={handleSetDefaultStore}
                title="Set as default store for analytics page"
                disabled={isSettingDefault}
              >
                {isSettingDefault ? "Setting..." : "Set Default"}
              </button>
            )}
          
          {/* Remove current default button */}
          {defaultAnalyticsStoreId && (
            <button
              className="p-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors whitespace-nowrap disabled:opacity-70"
              onClick={handleRemoveDefaultStore}
              title="Remove current default analytics store"
              disabled={isRemovingDefault}
            >
              {isRemovingDefault ? "Removing..." : "Remove Default"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreSelector; 