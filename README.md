# Hariram Rice Traders

Hariram Rice Traders is an Expo-based billing app for managing customers, preparing rice invoices, previewing PDFs, and keeping business data backed up locally and in Supabase.

## What the app does

- Stores customers, bills, and business settings locally with SQLite
- Builds invoice drafts with customer autofill, due dates, GST fields, and line items
- Previews, downloads, and shares invoice PDFs
- Imports contact details from the device address book
- Supports manual JSON backups and optional Supabase cloud backup and restore
- Includes light and dark themes for day-to-day use

## Tech stack

- Expo 54
- React Native 0.81
- React 19
- Expo SQLite for on-device persistence
- Supabase Storage for optional cloud backup

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the Expo dev server

```bash
npm start
```

### 3. Run the app

```bash
npm run android
```

```bash
npm run ios
```

### 4. Optional: configure Supabase backup

Create a `.env` file in the project root with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
EXPO_PUBLIC_SUPABASE_BACKUP_BUCKET=app-backups
```

Full setup steps are in [SUPABASE_BACKUP_SETUP.md](./SUPABASE_BACKUP_SETUP.md).

## Project structure

```text
.
├── App.js                      # Main app state and navigation flow
├── src/
│   ├── components/            # Screens, panels, cards, and editors
│   ├── backup.js              # Manual JSON backup export and import
│   ├── database.js            # SQLite schema and persistence helpers
│   ├── pdf.js                 # Invoice PDF generation and sharing
│   └── supabaseBackup.js      # Cloud backup account and storage helpers
├── assets/                    # App icons, logos, and splash screens
├── android/                   # Android native project
└── ios/                       # iOS native project
```

## Notes

- The app is local-first. Billing data stays on the device unless you export or upload a backup.
- Native permissions are used for contacts import on supported devices.
- If you change native dependencies or Expo plugins, rebuild the native app before testing those changes.
