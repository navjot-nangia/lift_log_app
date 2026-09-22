export const LIFTS = ["Bench Press", "Back Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull-up"] as const;
export type Lift = (typeof LIFTS)[number];

export type LiftEntry = {
  id: string;
  lift: Lift;
  weight: number;
  reps: number;
  sets: number;
  createdAt: string;
};

const STORAGE_KEY = "lift-log.entries.v1";

export function loadEntries(): LiftEntry[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as LiftEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveEntries(entries: LiftEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function createEntry(lift: Lift, weight: number, sets: number, reps: number): LiftEntry {
  return { id: crypto.randomUUID(), lift, weight, sets, reps, createdAt: new Date().toISOString() };
}
