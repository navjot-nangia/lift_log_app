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

## Railway deployment

1. Create a new Railway project.
2. Choose **Deploy from GitHub repo**.
3. Select `navjot-nangia/lift_log_app`.
4. Deploy the `main` branch.
5. Generate a Railway domain under **Settings → Networking**.

Railway will use `railway.toml` to run `npm run build` and `npm start`. No environment variables or database are required for this version.

## Storage

Workout history is stored in browser `localStorage`. It remains on the same browser/device and is not uploaded to a server.
