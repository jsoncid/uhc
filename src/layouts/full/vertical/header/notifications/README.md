# Module Notifications Structure

This folder contains the modular notification system for the application. Each module (1-5) has its own isolated notification data, ensuring no conflicts between modules.

## Folder Structure

```
notifications/
├── index.ts              # Aggregates all module notifications
├── module-1/
│   └── data.ts          # Module 1 notifications
├── module-2/
│   └── data.ts          # Module 2 notifications
├── module-3/
│   └── data.ts          # Module 3 notifications
├── module-4/
│   └── data.ts          # Module 4 notifications
└── module-5/
    └── data.ts          # Module 5 notifications
```

## How It Works

1. **Each Module Has Its Own Data File**: Located in `module-*/data.ts`
2. **No Conflicts Between Modules**: Each module manages notifications independently
3. **Central Aggregation**: `index.ts` imports all module notifications and combines them
4. **Main Component**: `Messages.tsx` imports from `index.ts` and displays all notifications organized by module

## Adding/Editing Notifications

### To add a notification to a specific module:

1. Edit the corresponding file (e.g., `module-1/data.ts`)
2. Add an object to the module's notification array:

```typescript
export const module1Notifications: ModuleNotification[] = [
  {
    id: 'm1-1',
    avatar: avatar1,
    title: 'Notification Title',
    subtitle: 'Notification Details',
    timestamp: '5 mins ago',
  },
  // Add new notifications here
];
```

3. The main notification component will automatically pick up the changes

## Module Isolation

Each module's notifications are completely isolated:

- ✅ Module 1 notifications don't affect Module 2
- ✅ Each module tracks its own notification count
- ✅ Notifications are displayed under their respective module sections
- ✅ Empty modules show "No notifications" message

## Types

All module notification files export:

- `ModuleNotification` - Interface for individual notifications
- `moduleXNotifications` - Array of notifications for that module

The `index.ts` file exports:

- `ModuleType` - Interface for the aggregated module structure
- `allModuleNotifications` - Array of all modules with their notifications
