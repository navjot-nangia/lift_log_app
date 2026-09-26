# Lift Log

A mobile-first Progressive Web App for logging strength workouts, reviewing history, and tracking personal records.

## Features

- Quick workout routines and empty workouts
- Weight increments of 1, 2.5, 5, 10, 25, and 45 lb
- Sets and reps tracking
- Rest stopwatch with start, pause, resume, and reset controls
- Workout history and personal records
- Offline-capable PWA with install support
- Data stored locally on the user's device
- 0.6-second directional page transitions

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
