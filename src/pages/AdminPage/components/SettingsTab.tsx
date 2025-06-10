import { useState } from 'react';
import ImageManagement from './ImageManagement';

interface StoreSettings {
  storeName: string;
  updatedAt: string;
}

interface SettingsTabProps {
  storeSettings: StoreSettings | null;
  newStoreName: string;
  setNewStoreName: (name: string) => void;
  saveStoreSettings: () => void;
  isLoading: boolean;
  storeId: string;
}

const SettingsTab = ({
  storeSettings,
  newStoreName,
  setNewStoreName,
  saveStoreSettings,
  isLoading,
  storeId
}: SettingsTabProps) => {
  const [imageLoading, setImageLoading] = useState(false);
  return (
    <div className="tab-content bg-white shadow rounded-lg p-4 md:p-6">
      <div className="section-header mb-6">
        <h2 className="text-xl font-bold text-gray-800">Store Settings</h2>
        <p className="text-gray-600 text-sm">
          Manage your store configuration
        </p>
      </div>

      {storeSettings ? (
        <div>
          <div className="settings-form max-w-md">
            <div className="form-group mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Enter your store name"
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be displayed throughout your store's
                dashboard and reports.
              </p>
            </div>

            <div className="form-group mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                value={new Date(storeSettings.updatedAt).toLocaleString()}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                The timestamp when your store settings were last modified.
              </p>
            </div>

            <div className="form-actions space-y-2">
              <button
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={saveStoreSettings}
                disabled={
                  newStoreName === storeSettings.storeName ||
                  !newStoreName.trim() ||
                  isLoading
                }
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>

              <button
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                onClick={() => setNewStoreName(storeSettings.storeName)}
                disabled={newStoreName === storeSettings.storeName || isLoading}
              >
                Reset Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center p-8">
          <p>Loading store settings...</p>
        </div>
      )}

      <div className="settings-section mt-8">      
        <ImageManagement 
          storeId={storeId}
          isLoading={imageLoading}
          setIsLoading={setImageLoading}
        />
      </div>
    </div>
  );
};

export default SettingsTab; 