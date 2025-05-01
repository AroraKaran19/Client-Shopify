# AdminPage Component Structure

This document outlines the component structure for the AdminPage in the Shopify client application. The goal of this organization is to improve code maintainability without changing the UI.

## Components

### Main Tabs

- **DailyDataTab**: Handles the display and interaction for the daily data view, including the date selector, entry method switcher, and metric cards.
- **MonthlyDataTab**: Handles the display and interaction for monthly data, including month/year selection, totals display, and the daily breakdown table.
- **SettingsTab**: Handles the store settings interface, including store name editing and image upload.

### Modal Components

- **DataEntryModal**: A reusable modal component that handles all data entry scenarios (daily, hourly, and monthly).

## Services

- **DataService**: A service that handles all data operations, including fetching, saving, and processing data. This service abstracts away the Firebase implementation details from the components.

## Types and Interfaces

The data structures and interfaces are defined in the DataService file:

- **DateData**: Interface for hourly data with time-value pairs.
- **DayData**: Interface for day data totals.
- **MonthData**: Interface for monthly data with days and totals.
- **StoreSettings**: Interface for store settings.

## Component Hierarchy

```
AdminPage
├── DailyDataTab
├── MonthlyDataTab
├── SettingsTab
└── DataEntryModal (shared)
```

## Benefits of This Structure

1. **Separation of Concerns**: Each component has a specific responsibility.
2. **Improved Maintainability**: Changes to one feature (like daily data) won't affect other features.
3. **Code Reusability**: The DataEntryModal is reused across different tab types.
4. **Business Logic Separation**: The DataService separates data operations from UI components.
5. **Type Safety**: Well-defined interfaces ensure type safety throughout the application.

## File Structure

```
src/pages/AdminPage/
├── AdminPage.tsx (main component)
├── components/
│   ├── DailyDataTab.tsx
│   ├── MonthlyDataTab.tsx
│   ├── SettingsTab.tsx
│   └── DataEntryModal.tsx
└── services/
    └── DataService.ts
``` 