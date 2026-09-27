# Lift Log

A mobile-first Progressive Web App for logging strength workouts, reviewing history, and tracking personal records.

## Features

- Editable workout routines and empty workouts
- Individual set logging with set type, weight, reps, RPE, RIR, and notes
- Quick weight adjustments of ±1, 2.5, 5, 10, 25, and 45
- Previous-performance copying and automatic draft recovery
- Configurable rest countdown with screen wake lock
- Workout summaries, editable session history, duplication, and delete undo
- Progress metrics, estimated one-rep-max records, and weekly set totals
- Custom exercises, pound/kilogram settings, and a plate calculator
- JSON backup and restore
- Offline-capable PWA with install support
- Data stored locally on the user's device
- 0.8-second directional page transitions

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Web deployment

The PWA deploys automatically to GitHub Pages whenever `main` changes:

**https://navjot-nangia.github.io/lift_log_app/**

In the repository, select **Settings → Pages → Source: GitHub Actions** once to enable publishing.

## Android app

The same static build is packaged as an Android app with Capacitor. To synchronize the web app into the Android project:

```bash
npm run android:sync
```

To create a test APK:

```bash
npm run android:debug
```

The APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`. A signed Android App Bundle will be configured later for Google Play publishing.

## Storage

Workout history is stored in browser `localStorage`. It remains on the same browser/device and is not uploaded to a server.
