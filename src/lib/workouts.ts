export const BASE_EXERCISES = ["Bench Press", "Back Squat", "Deadlift", "Overhead Press", "Barbell Row", "Pull-up"];

export type Unit = "lb" | "kg";
export type SetType = "warm-up" | "working" | "drop" | "failure";

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  type: SetType;
  completed: boolean;
  completedAt?: string;
  rpe?: number;
  rir?: number;
  notes?: string;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  targetReps: number;
  restSeconds: number;
  notes: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  routineId?: string;
  routineName: string;
  startedAt: string;
  finishedAt?: string;
  notes: string;
  exercises: WorkoutExercise[];
};

export type RoutineExercise = {
  name: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
};

export type Routine = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
};

export type AppSettings = {
  unit: Unit;
  barWeight: number;
  defaultRestSeconds: number;
};

export type ScheduledDay = { day: number; routineId: string | null };

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type LiftLogData = {
  onboardingComplete?: boolean;
  schedule?: ScheduledDay[];
  sessions: WorkoutSession[];
  routines: Routine[];
  customExercises: string[];
  settings: AppSettings;
};

type LegacyEntry = {
  id: string;
  lift: string;
  weight: number;
  reps: number;
  sets: number;
  createdAt: string;
};

const DATA_KEY = "lift-log.data.v2";
const DRAFT_KEY = "lift-log.active-workout.v2";
const LEGACY_KEY = "lift-log.entries.v1";

export const DEFAULT_SETTINGS: AppSettings = { unit: "lb", barWeight: 45, defaultRestSeconds: 90 };

export const DEFAULT_ROUTINES: Routine[] = [
  { id: "upper-body", name: "Upper body", exercises: [
    { name: "Bench Press", targetSets: 3, targetReps: 5, restSeconds: 120 },
    { name: "Overhead Press", targetSets: 3, targetReps: 8, restSeconds: 90 },
    { name: "Barbell Row", targetSets: 3, targetReps: 8, restSeconds: 90 },
  ] },
  { id: "lower-body", name: "Lower body", exercises: [
    { name: "Back Squat", targetSets: 3, targetReps: 5, restSeconds: 150 },
    { name: "Deadlift", targetSets: 3, targetReps: 5, restSeconds: 180 },
  ] },
  { id: "quick-strength", name: "Quick strength", exercises: [
    { name: "Bench Press", targetSets: 3, targetReps: 5, restSeconds: 120 },
    { name: "Back Squat", targetSets: 3, targetReps: 5, restSeconds: 150 },
    { name: "Deadlift", targetSets: 3, targetReps: 5, restSeconds: 180 },
  ] },
];

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createWorkoutSet(weight = 0, reps = 5, type: SetType = "working"): WorkoutSet {
  return { id: makeId(), weight, reps, type, completed: false };
}

export function createSession(routine: Routine, previous?: WorkoutSession): WorkoutSession {
  return {
    id: makeId(),
    routineId: routine.id,
    routineName: routine.name,
    startedAt: new Date().toISOString(),
    notes: "",
    exercises: routine.exercises.map((exercise) => {
      const previousExercise = previous?.exercises.find((item) => item.name === exercise.name);
      return {
        id: makeId(),
        name: exercise.name,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        notes: "",
        sets: Array.from({ length: exercise.targetSets }, (_, index) => {
          const oldSet = previousExercise?.sets[index] ?? previousExercise?.sets.at(-1);
          return createWorkoutSet(oldSet?.weight ?? 0, oldSet?.reps ?? exercise.targetReps, oldSet?.type ?? "working");
        }),
      };
    }),
  };
}

export function completedSets(session: WorkoutSession) {
  return session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed);
}

export function sessionVolume(session: WorkoutSession) {
  return completedSets(session).reduce((sum, set) => sum + set.weight * set.reps, 0);
}

export function sessionDurationMinutes(session: WorkoutSession) {
  const end = session.finishedAt ? new Date(session.finishedAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - new Date(session.startedAt).getTime()) / 60000));
}

export function estimatedOneRepMax(weight: number, reps: number) {
  return reps > 0 ? weight * (1 + reps / 30) : 0;
}

export function allExerciseNames(data: LiftLogData) {
  return Array.from(new Set([...BASE_EXERCISES, ...data.customExercises])).sort((a, b) => a.localeCompare(b));
}

function migrateLegacy(entries: LegacyEntry[]): WorkoutSession[] {
  return entries.map((entry) => ({
    id: `legacy-${entry.id}`,
    routineName: "Imported workout",
    startedAt: entry.createdAt,
    finishedAt: entry.createdAt,
    notes: "Imported from the original Lift Log format.",
    exercises: [{
      id: makeId(),
      name: entry.lift,
      targetReps: entry.reps,
      restSeconds: 90,
      notes: "",
      sets: Array.from({ length: Math.max(1, entry.sets) }, () => ({
        ...createWorkoutSet(entry.weight, entry.reps), completed: true, completedAt: entry.createdAt,
      })),
    }],
  }));
}

export function loadData(): LiftLogData {
  try {
    const saved = localStorage.getItem(DATA_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<LiftLogData>;
      return {
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        onboardingComplete: parsed.onboardingComplete === true,
        schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [],
        routines: Array.isArray(parsed.routines) && parsed.routines.length ? parsed.routines : structuredClone(DEFAULT_ROUTINES),
        customExercises: Array.isArray(parsed.customExercises) ? parsed.customExercises : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]") as LegacyEntry[];
    return { sessions: migrateLegacy(legacy), onboardingComplete: false, schedule: [], routines: structuredClone(DEFAULT_ROUTINES), customExercises: [], settings: { ...DEFAULT_SETTINGS } };
  } catch {
    return { sessions: [], onboardingComplete: false, schedule: [], routines: structuredClone(DEFAULT_ROUTINES), customExercises: [], settings: { ...DEFAULT_SETTINGS } };
  }
}

export function saveData(data: LiftLogData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadDraft(): WorkoutSession | null {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as WorkoutSession | null; } catch { return null; }
}

export function saveDraft(session: WorkoutSession | null) {
  if (session) localStorage.setItem(DRAFT_KEY, JSON.stringify(session));
  else localStorage.removeItem(DRAFT_KEY);
}

export function parseImport(value: string): LiftLogData {
  const parsed = JSON.parse(value) as LiftLogData;
  if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.routines) || !parsed.settings) throw new Error("Invalid Lift Log backup");
  return { sessions: parsed.sessions, onboardingComplete: parsed.onboardingComplete ?? true, schedule: Array.isArray(parsed.schedule) ? parsed.schedule : [], routines: parsed.routines, customExercises: parsed.customExercises ?? [], settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
}
