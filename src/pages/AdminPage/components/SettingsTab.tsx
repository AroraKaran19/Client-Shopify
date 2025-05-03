interface StoreSettings {
  storeName: string;
  updatedAt: string;
}

interface SettingsTabProps {
  storeSettings: StoreSettings | null;
  newStoreName: string;
  setNewStoreName: (name: string) => void;
  saveStoreSettings: () => void;
  selectedImage: File | null;
  imagePreview: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageUpload: () => void;
  isLoading: boolean;
}

const SettingsTab = ({
  storeSettings,
  newStoreName,
  setNewStoreName,
  saveStoreSettings,
  selectedImage,
  imagePreview,
  handleImageChange,
  handleImageUpload,
  isLoading
}: SettingsTabProps) => {
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Store Image</h2>
        <div className="store-image-section">
          <div className="image-preview mb-4 border rounded-lg p-4 bg-gray-50 flex items-center justify-center h-48 w-full max-w-md">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Store preview" 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="placeholder text-gray-400">No image selected</div>
            )}
          </div>
          <div className="flex flex-col gap-3 max-w-md">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
            <button 
              onClick={handleImageUpload}
              disabled={!selectedImage || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Uploading..." : "Upload Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab; 