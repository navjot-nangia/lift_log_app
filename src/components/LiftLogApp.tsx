"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RoutineSetup, { WeekPlanner } from "./RoutineSetup";
import {
  BarChart3, Check, ChevronLeft, Clock3, Copy, Dumbbell, History, Home,
  Pause, Play, Plus, RotateCcw, Settings2, TimerReset, Trash2, Trophy, X,
} from "lucide-react";
import {
  DEFAULT_ROUTINES, DEFAULT_SETTINGS, allExerciseNames, completedSets, createSession,
  createWorkoutSet, estimatedOneRepMax, loadData, loadDraft, makeId,
  saveData, saveDraft, sessionDurationMinutes, sessionVolume,
  type LiftLogData, type Routine, type RoutineExercise, type SetType,
  type WorkoutExercise, type WorkoutSession, type WorkoutSet,
} from "@/lib/workouts";

type View = "workout" | "active" | "history" | "history-detail" | "progress" | "more" | "summary";
type WakeLockHandle = { release: () => Promise<void> };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTimer(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
}

function formatVolume(value: number) {
  return value >= 1000 ? (value / 1000).toFixed(1) + "k" : Math.round(value).toString();
}

function newData(): LiftLogData {
  return { sessions: [], routines: structuredClone(DEFAULT_ROUTINES), customExercises: [], settings: { ...DEFAULT_SETTINGS }, onboardingComplete: false, schedule: [] };
}

function convertSessionUnit(session: WorkoutSession, factor: number): WorkoutSession {
  return { ...session, exercises: session.exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ ...set, weight: Number((set.weight * factor).toFixed(2)) })) })) };
}

export default function LiftLogApp() {
  const [data, setData] = useState<LiftLogData>(newData);
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [view, setView] = useState<View>("workout");
  const [direction, setDirection] = useState(1);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [deleted, setDeleted] = useState<WorkoutSession | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [summarySession, setSummarySession] = useState<WorkoutSession | null>(null);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const wakeLock = useRef<WakeLockHandle | null>(null);

  useEffect(() => {
    setData(loadData());
    setActive(loadDraft());
    setReady(true);
  }, []);

  useEffect(() => { if (ready) saveData(data); }, [data, ready]);
  useEffect(() => { if (ready) saveDraft(active); }, [active, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (restEndsAt === null) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRestRemaining(left);
      if (left === 0) {
        setRestEndsAt(null);
        setNotice("Rest complete — ready for your next set");
        navigator.vibrate?.([120, 80, 120]);
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [restEndsAt]);

  useEffect(() => {
    if (restEndsAt === null) {
      wakeLock.current?.release().catch(() => undefined);
      wakeLock.current = null;
      return;
    }
    const request = async () => {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> } };
      try { if (nav.wakeLock && document.visibilityState === "visible") wakeLock.current = await nav.wakeLock.request("screen"); } catch { /* unsupported or denied */ }
    };
    const onVisibility = () => { if (document.visibilityState === "visible" && restEndsAt !== null) void request(); };
    void request();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      wakeLock.current?.release().catch(() => undefined);
      wakeLock.current = null;
    };
  }, [restEndsAt]);

  const exerciseNames = useMemo(() => allExerciseNames(data), [data]);

  function navigate(next: View, backwards = false) {
    if (next === view) return;
    setDirection(backwards ? -1 : 1);
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function beginRoutine(routine: Routine) {
    const previous = data.sessions.find((session) => session.routineId === routine.id);
    setActive(createSession(routine, previous));
    navigate("active");
  }

  function beginEmpty() {
    const routine: Routine = {
      id: "empty",
      name: "Empty workout",
      exercises: [{ name: exerciseNames[0] ?? "Bench Press", targetSets: 3, targetReps: 5, restSeconds: data.settings.defaultRestSeconds }],
    };
    setActive(createSession(routine, data.sessions.find((session) => session.exercises.some((exercise) => exercise.name === routine.exercises[0].name))));
    navigate("active");
  }

  function updateExercise(index: number, updater: (exercise: WorkoutExercise) => WorkoutExercise) {
    setActive((current) => current ? { ...current, exercises: current.exercises.map((exercise, itemIndex) => itemIndex === index ? updater(exercise) : exercise) } : current);
  }

  function updateSet(exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSet>) {
    updateExercise(exerciseIndex, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set, index) => index === setIndex ? { ...set, ...patch } : set),
    }));
  }

  function changeUnit(next: "lb" | "kg") {
    if (next === data.settings.unit) return;
    const factor = next === "kg" ? 1 / 2.2046226218 : 2.2046226218;
    setData((current) => ({ ...current, settings: { ...current.settings, unit: next, barWeight: Number((current.settings.barWeight * factor).toFixed(2)) }, sessions: current.sessions.map((session) => convertSessionUnit(session, factor)) }));
    setActive((current) => current ? convertSessionUnit(current, factor) : null);
    setSummarySession((current) => current ? convertSessionUnit(current, factor) : null);
    setDeleted((current) => current ? convertSessionUnit(current, factor) : null);
  }

  function toggleSet(exerciseIndex: number, setIndex: number) {
    if (!active) return;
    const set = active.exercises[exerciseIndex].sets[setIndex];
    const completing = !set.completed;
    updateSet(exerciseIndex, setIndex, { completed: completing, completedAt: completing ? new Date().toISOString() : undefined });
    if (completing) startRest(active.exercises[exerciseIndex].restSeconds);
  }

  function startRest(seconds: number) {
    setRestRemaining(seconds);
    setRestEndsAt(Date.now() + seconds * 1000);
  }

  function pauseRest() {
    if (restEndsAt === null) return;
    setRestRemaining(Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000)));
    setRestEndsAt(null);
  }

  function resumeRest() {
    if (restRemaining > 0) setRestEndsAt(Date.now() + restRemaining * 1000);
  }

  function finishWorkout() {
    if (!active || completedSets(active).length === 0) {
      setNotice("Complete at least one set before finishing.");
      return;
    }
    const finished = { ...active, finishedAt: new Date().toISOString() };
    setData((current) => ({ ...current, sessions: [finished, ...current.sessions] }));
    setSummarySession(finished);
    setActive(null);
    setRestEndsAt(null);
    setRestRemaining(0);
    navigate("summary");
  }

  function editSession(updated: WorkoutSession) {
    setData((current) => ({ ...current, sessions: current.sessions.map((session) => session.id === updated.id ? updated : session) }));
  }

  function deleteSession(session: WorkoutSession) {
    setData((current) => ({ ...current, sessions: current.sessions.filter((item) => item.id !== session.id) }));
    setDeleted(session);
    setNotice("Workout deleted");
    navigate("history", true);
  }

  function undoDelete() {
    if (!deleted) return;
    setData((current) => ({ ...current, sessions: [deleted, ...current.sessions] }));
    setDeleted(null);
    setNotice("Workout restored");
  }

  function duplicateSession(session: WorkoutSession) {
    const duplicate: WorkoutSession = {
      ...structuredClone(session),
      id: makeId(),
      routineName: session.routineName + " copy",
      startedAt: new Date().toISOString(),
      finishedAt: undefined,
      exercises: session.exercises.map((exercise) => ({
        ...exercise, id: makeId(), sets: exercise.sets.map((set) => ({ ...set, id: makeId(), completed: false, completedAt: undefined })),
      })),
    };
    setActive(duplicate);
    navigate("active");
  }

  function currentScreen() {
    if (view === "active" && active) return <ActiveWorkout
      session={active} unit={data.settings.unit} exerciseNames={exerciseNames} sessions={data.sessions}
      restRemaining={restRemaining} restRunning={restEndsAt !== null}
      updateSession={setActive} updateExercise={updateExercise} updateSet={updateSet} toggleSet={toggleSet}
      toggleUnit={() => changeUnit(data.settings.unit === "lb" ? "kg" : "lb")}
      startRest={startRest} pauseRest={pauseRest} resumeRest={resumeRest}
      resetRest={() => { setRestEndsAt(null); setRestRemaining(0); }}
      finish={finishWorkout} close={() => navigate("workout", true)}
    />;
    if (view === "history") return <HistoryView sessions={data.sessions} unit={data.settings.unit} open={(id) => { setSelectedSessionId(id); navigate("history-detail"); }} deleted={deleted} undoDelete={undoDelete} />;
    if (view === "history-detail") {
      const session = data.sessions.find((item) => item.id === selectedSessionId);
      return session ? <HistoryDetail session={session} unit={data.settings.unit} update={editSession} remove={() => deleteSession(session)} duplicate={() => duplicateSession(session)} back={() => navigate("history", true)} /> : <HistoryView sessions={data.sessions} unit={data.settings.unit} open={setSelectedSessionId} deleted={deleted} undoDelete={undoDelete} />;
    }
    if (view === "progress") return <ProgressView sessions={data.sessions} unit={data.settings.unit} exerciseNames={exerciseNames} />;
    if (view === "more") return <MoreView data={data} setData={setData} exerciseNames={exerciseNames} notify={setNotice} changeUnit={changeUnit} />;
    if (view === "summary" && summarySession) return <SummaryView session={summarySession} unit={data.settings.unit} done={() => navigate("workout", true)} />;
    return <WorkoutHome data={data} draft={active} begin={beginRoutine} beginEmpty={beginEmpty} resume={() => navigate("active")} />;
  }

  if (!ready) return <main className="app-shell" />;
  if (!data.onboardingComplete) return <main className="app-shell"><RoutineSetup initial={data} complete={(updated) => { setData(updated); navigate("workout"); }} /></main>;

  return <main className="app-shell">
    {notice && <div className="notice" role="status">{notice}{deleted && <button onClick={undoDelete}>Undo</button>}</div>}
    <div key={view} className={"page-stage " + (direction < 0 ? "slide-back" : "slide-forward")}>{currentScreen()}</div>
    {!["active", "history-detail", "summary"].includes(view) && <BottomNav view={view} navigate={navigate} beginEmpty={beginEmpty} />}
  </main>;
}

function WorkoutHome({ data, draft, begin, beginEmpty, resume }: { data: LiftLogData; draft: WorkoutSession | null; begin: (routine: Routine) => void; beginEmpty: () => void; resume: () => void }) {
  const weekStart = Date.now() - 604800000;
  const thisWeek = data.sessions.filter((session) => new Date(session.startedAt).getTime() >= weekStart).length;
  return <div className="screen">
    <header className="topbar"><div><p className="eyebrow">LIFT LOG</p><h1>Start a workout</h1></div><div className="brand-mark"><BarbellLogo /></div></header>
    {draft && <button className="resume-card" onClick={resume}><Play /><span><strong>Resume {draft.routineName}</strong><small>{completedSets(draft).length} completed sets</small></span></button>}
    <section className="week-card"><div><span>This week</span><strong>{thisWeek}</strong><small>completed workouts</small></div><div className="week-bars">{[38,72,50,92,61,28,46].map((height,index) => <i key={index} style={{ height: height + "%" }} />)}</div></section>
    {data.schedule?.length ? <section className="today-card"><span>Today · {new Date().toLocaleDateString(undefined, { weekday: "long" })}</span>{(() => { const today = (new Date().getDay() + 6) % 7; const id = data.schedule?.find((item) => item.day === today)?.routineId; const routine = data.routines.find((item) => item.id === id); return routine ? <button onClick={() => begin(routine)}>Start {routine.name} <Plus /></button> : <strong>Rest day</strong>; })()}</section> : null}
    <div className="section-heading"><h2>My routines</h2><button onClick={beginEmpty}>Empty workout</button></div>
    <div className="routine-list">{data.routines.map((routine) => <button className="routine-card" key={routine.id} onClick={() => begin(routine)}><div className="routine-icon"><Dumbbell /></div><div><strong>{routine.name}</strong><span>{routine.exercises.length} exercises · {routine.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0)} sets</span></div><Plus /></button>)}</div>
    {data.sessions[0] && <><div className="section-heading"><h2>Last workout</h2><span>{formatDate(data.sessions[0].startedAt)}</span></div><button className="last-card session-link"><strong>{data.sessions[0].routineName}</strong><p>{data.sessions[0].exercises.length} exercises · {completedSets(data.sessions[0]).length} sets · {sessionDurationMinutes(data.sessions[0])} min</p></button></>}
  </div>;
}

type ActiveProps = {
  session: WorkoutSession; unit: string; exerciseNames: string[]; sessions: WorkoutSession[];
  toggleUnit: () => void;
  restRemaining: number; restRunning: boolean;
  updateSession: React.Dispatch<React.SetStateAction<WorkoutSession | null>>;
  updateExercise: (index: number, updater: (exercise: WorkoutExercise) => WorkoutExercise) => void;
  updateSet: (exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSet>) => void;
  toggleSet: (exerciseIndex: number, setIndex: number) => void;
  startRest: (seconds: number) => void; pauseRest: () => void; resumeRest: () => void; resetRest: () => void;
  finish: () => void; close: () => void;
};

function ActiveWorkout(props: ActiveProps) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [focusedSetId, setFocusedSetId] = useState<string | null>(null);
  const [weightStep, setWeightStep] = useState<number | null>(null);
  const [newExercise, setNewExercise] = useState(props.exerciseNames[0] ?? "Bench Press");
  const exercise = props.session.exercises[Math.min(exerciseIndex, props.session.exercises.length - 1)];
  const previous = props.sessions.find((session) => session.exercises.some((item) => item.name === exercise.name))?.exercises.find((item) => item.name === exercise.name);
  const nextSetIndex = Math.max(0, exercise.sets.findIndex((set) => !set.completed));
  const focusedIndex = exercise.sets.findIndex((set) => set.id === focusedSetId);
  const adjustmentSetIndex = focusedIndex >= 0 ? focusedIndex : exercise.sets.every((set) => set.completed) ? Math.max(0, exercise.sets.length - 1) : nextSetIndex;
  const steps = props.unit === "kg" ? [1, 2.5, 5, 10, 20] : [2.5, 5, 10, 25, 45];
  const step = weightStep && steps.includes(weightStep) ? weightStep : props.unit === "kg" ? 2.5 : 5;
  const selectedSet = exercise.sets[adjustmentSetIndex];
  function changeWeight(amount: number) {
    if (!selectedSet) return;
    props.updateSet(exerciseIndex, adjustmentSetIndex, { weight: Math.max(0, Number((selectedSet.weight + amount).toFixed(2))) });
  }

  function addExercise() {
    if (props.session.exercises.some((item) => item.name === newExercise)) return;
    props.updateSession((current) => current ? { ...current, exercises: [...current.exercises, { id: makeId(), name: newExercise, targetReps: 5, restSeconds: 90, notes: "", sets: [createWorkoutSet(0, 5), createWorkoutSet(0, 5), createWorkoutSet(0, 5)] }] } : current);
    setExerciseIndex(props.session.exercises.length);
  }

  function copyPrevious() {
    if (!previous) return;
    props.updateExercise(exerciseIndex, (current) => ({
      ...current,
      sets: previous.sets.map((set) => ({ ...set, id: makeId(), completed: false, completedAt: undefined })),
    }));
  }

  return <div className="screen active-screen">
    <header className="workout-header"><button className="icon-button" onClick={props.close} aria-label="Pause workout"><ChevronLeft /></button><div><p className="eyebrow">WORKOUT · {exerciseIndex + 1}/{props.session.exercises.length}</p><h1>{props.session.routineName}</h1></div></header>
    <RestTimer seconds={props.restRemaining} running={props.restRunning} start={() => props.startRest(exercise.restSeconds)} pause={props.pauseRest} resume={props.resumeRest} reset={props.resetRest} adjust={(amount) => props.startRest(Math.max(0, props.restRemaining + amount))} />
    <div className="exercise-tabs">{props.session.exercises.map((item, index) => <button key={item.id} className={index === exerciseIndex ? "active" : ""} onClick={() => { setExerciseIndex(index); setFocusedSetId(null); }}>{item.name}<small>{item.sets.filter((set) => set.completed).length}/{item.sets.length}</small></button>)}</div>
    <section className="lift-panel set-logger">
      <div className="exercise-heading"><div><span>Exercise</span><h2>{exercise.name}</h2></div><label>Rest<select value={exercise.restSeconds} onChange={(event) => props.updateExercise(exerciseIndex, (current) => ({ ...current, restSeconds: Number(event.target.value) }))}>{[30,45,60,90,120,150,180,240,300].map((seconds) => <option key={seconds} value={seconds}>{seconds < 60 ? seconds + " sec" : seconds / 60 + " min"}</option>)}</select></label></div>
      {previous && <div className="previous-strip"><span>Previous: {previous.sets.filter((set) => set.completed).map((set) => set.weight + "×" + set.reps).join(", ") || "No completed sets"}</span><button onClick={copyPrevious}><Copy />Copy</button></div>}
      {selectedSet && <div className="weight-control"><span className="weight-caption">Set {adjustmentSetIndex + 1} weight</span><div className="weight-main"><button type="button" onClick={() => changeWeight(-step)} aria-label={`Decrease set ${adjustmentSetIndex + 1} weight by ${step} ${props.unit}`}>−</button><label><input aria-label={`Set ${adjustmentSetIndex + 1} weight in ${props.unit}`} type="number" inputMode="decimal" min="0" step="any" value={selectedSet.weight} onChange={(event) => props.updateSet(exerciseIndex, adjustmentSetIndex, { weight: Math.max(0, Number(event.target.value)) })} /><span>{props.unit}</span></label><button type="button" onClick={() => changeWeight(step)} aria-label={`Increase set ${adjustmentSetIndex + 1} weight by ${step} ${props.unit}`}>+</button></div><div className="weight-step"><label>Change by <select value={step} onChange={(event) => setWeightStep(Number(event.target.value))}>{steps.map((amount) => <option key={amount} value={amount}>{amount} {props.unit}</option>)}</select></label><button type="button" className="unit-switch" onClick={props.toggleUnit}>Switch to {props.unit === "lb" ? "kg" : "lb"}</button></div></div>}
      <div className="set-list">{exercise.sets.map((set, setIndex) => <SetRow key={set.id} set={set} index={setIndex} unit={props.unit} selected={setIndex === adjustmentSetIndex} select={() => setFocusedSetId(set.id)} update={(patch) => props.updateSet(exerciseIndex, setIndex, patch)} toggle={() => { props.toggleSet(exerciseIndex, setIndex); setFocusedSetId(null); }} remove={() => { setFocusedSetId(null); props.updateExercise(exerciseIndex, (current) => ({ ...current, sets: current.sets.filter((_, index) => index !== setIndex) })); }} />)}</div>
      <button className="secondary-button" onClick={() => props.updateExercise(exerciseIndex, (current) => ({ ...current, sets: [...current.sets, createWorkoutSet(current.sets.at(-1)?.weight ?? 0, current.targetReps)] }))}><Plus />Add set</button>
      <label className="notes-field">Exercise notes<textarea value={exercise.notes} placeholder="Technique, pain, equipment…" onChange={(event) => props.updateExercise(exerciseIndex, (current) => ({ ...current, notes: event.target.value }))} /></label>
    </section>
    <section className="add-exercise-bar"><select value={newExercise} onChange={(event) => setNewExercise(event.target.value)}>{props.exerciseNames.map((name) => <option key={name}>{name}</option>)}</select><button onClick={addExercise}><Plus />Add exercise</button></section>
    <label className="notes-field workout-notes">Workout notes<textarea value={props.session.notes} placeholder="How did the workout feel?" onChange={(event) => props.updateSession((current) => current ? { ...current, notes: event.target.value } : current)} /></label>
    <button className="finish-workout-button" onClick={props.finish}><Check />Finish workout</button>
  </div>;
}

function SetRow({ set, index, unit, selected, select, update, toggle, remove }: { set: WorkoutSet; index: number; unit: string; selected: boolean; select: () => void; update: (patch: Partial<WorkoutSet>) => void; toggle: () => void; remove: () => void }) {
  return <div className={"simple-set " + (set.completed ? "completed " : "") + (selected ? "selected" : "")}>
    <div className="simple-set-main"><strong className="set-badge">{index + 1}</strong><button className="set-weight-select" type="button" onClick={select} aria-label={`Adjust set ${index + 1} weight`}>{set.weight} <small>{unit}</small></button><label className="reps-field"><input aria-label={`Set ${index + 1} reps`} type="number" inputMode="numeric" min="0" max="99" value={set.reps} onChange={(event) => update({ reps: Math.max(0, Number(event.target.value)) })} /><small>reps</small></label><button className="set-check" type="button" onClick={toggle} aria-pressed={set.completed} aria-label={(set.completed ? "Reopen logged" : "Log") + " set " + (index + 1)}><Check aria-hidden="true" /><span>{set.completed ? "Logged" : "Log set"}</span></button></div>
    <details className="set-options"><summary>More set options</summary><div className="set-options-fields"><label>Type<select aria-label={`Set ${index + 1} type`} value={set.type} onChange={(event) => update({ type: event.target.value as SetType })}><option value="warm-up">Warm-up</option><option value="working">Main</option><option value="drop">Drop</option><option value="failure">Failure</option></select></label><label>RPE<input aria-label={`Set ${index + 1} RPE`} type="number" inputMode="decimal" min="1" max="10" step="0.5" placeholder="—" value={set.rpe ?? ""} onChange={(event) => update({ rpe: event.target.value ? Number(event.target.value) : undefined })} /></label><label>RIR<input aria-label={`Set ${index + 1} reps in reserve`} type="number" inputMode="numeric" min="0" max="10" placeholder="—" value={set.rir ?? ""} onChange={(event) => update({ rir: event.target.value ? Number(event.target.value) : undefined })} /></label><input className="set-note" aria-label={`Set ${index + 1} notes`} placeholder="Optional note" value={set.notes ?? ""} onChange={(event) => update({ notes: event.target.value })} /><button className="set-delete" onClick={remove}><Trash2 /> Remove set</button></div></details>
  </div>;
}

function RestTimer({ seconds, running, start, pause, resume, reset, adjust }: { seconds: number; running: boolean; start: () => void; pause: () => void; resume: () => void; reset: () => void; adjust: (amount: number) => void }) {
  return <section className="rest-stopwatch" aria-label="Rest countdown">
    <div className="rest-stopwatch-heading"><div><span><TimerReset /> Rest countdown</span><small>Screen stays awake while timing</small></div><strong>{formatTimer(seconds)}</strong></div>
    <div className="timer-adjust"><button onClick={() => adjust(-15)}>−15s</button><button className="rest-toggle" onClick={running ? pause : seconds > 0 ? resume : start}>{running ? <><Pause />Pause</> : <><Play />{seconds > 0 ? "Resume" : "Start rest"}</>}</button><button onClick={() => adjust(15)}>+15s</button><button className="rest-reset" onClick={reset} disabled={seconds === 0}><RotateCcw /></button></div>
  </section>;
}

function SummaryView({ session, unit, done }: { session: WorkoutSession; unit: string; done: () => void }) {
  return <div className="screen"><header className="topbar"><div><p className="eyebrow">WORKOUT COMPLETE</p><h1>Strong work.</h1></div><Trophy /></header>
    <div className="summary-grid"><Metric label="Duration" value={sessionDurationMinutes(session) + " min"} /><Metric label="Exercises" value={String(session.exercises.length)} /><Metric label="Completed sets" value={String(completedSets(session).length)} /><Metric label="Volume" value={formatVolume(sessionVolume(session)) + " " + unit} /></div>
    <section className="summary-list"><h2>{session.routineName}</h2>{session.exercises.map((exercise) => <div key={exercise.id}><strong>{exercise.name}</strong><span>{exercise.sets.filter((set) => set.completed).map((set) => set.weight + "×" + set.reps).join(" · ") || "No completed sets"}</span></div>)}</section>
    {session.notes && <p className="summary-notes">{session.notes}</p>}
    <button className="primary-button" onClick={done}>Done</button>
  </div>;
}

function HistoryView({ sessions, unit, open, deleted, undoDelete }: { sessions: WorkoutSession[]; unit: string; open: (id: string) => void; deleted: WorkoutSession | null; undoDelete: () => void }) {
  return <div className="screen"><header className="topbar"><div><p className="eyebrow">TRAINING</p><h1>History</h1></div><Clock3 /></header>
    {deleted && <button className="undo-card" onClick={undoDelete}>Undo deleted workout</button>}
    {sessions.length === 0 ? <Empty title="No workouts yet" detail="Your completed workout sessions will appear here." /> : <div className="session-list">{sessions.map((session) => <button key={session.id} onClick={() => open(session.id)}><div><strong>{session.routineName}</strong><span>{formatDate(session.startedAt)} · {sessionDurationMinutes(session)} min</span><small>{session.exercises.length} exercises · {completedSets(session).length} sets</small></div><b>{formatVolume(sessionVolume(session))}<small> {unit}</small></b></button>)}</div>}
  </div>;
}

function HistoryDetail({ session, unit, update, remove, duplicate, back }: { session: WorkoutSession; unit: string; update: (session: WorkoutSession) => void; remove: () => void; duplicate: () => void; back: () => void }) {
  function patchSet(exerciseIndex: number, setIndex: number, patch: Partial<WorkoutSet>) {
    update({ ...session, exercises: session.exercises.map((exercise, index) => index === exerciseIndex ? { ...exercise, sets: exercise.sets.map((set, itemIndex) => itemIndex === setIndex ? { ...set, ...patch } : set) } : exercise) });
  }
  return <div className="screen"><header className="workout-header"><button className="icon-button" onClick={back}><ChevronLeft /></button><div><p className="eyebrow">{formatDate(session.startedAt)}</p><h1>{session.routineName}</h1></div></header>
    <div className="summary-grid"><Metric label="Duration" value={sessionDurationMinutes(session) + " min"} /><Metric label="Volume" value={formatVolume(sessionVolume(session)) + " " + unit} /></div>
    {session.exercises.map((exercise, exerciseIndex) => <section className="history-editor" key={exercise.id}><h2>{exercise.name}</h2>{exercise.sets.map((set, setIndex) => set.completed ? <div key={set.id}><span>{set.type}</span><input type="number" value={set.weight} onChange={(event) => patchSet(exerciseIndex, setIndex, { weight: Number(event.target.value) })} /><small>{unit}</small><input type="number" value={set.reps} onChange={(event) => patchSet(exerciseIndex, setIndex, { reps: Number(event.target.value) })} /><small>reps</small><input type="number" placeholder="RPE" value={set.rpe ?? ""} onChange={(event) => patchSet(exerciseIndex, setIndex, { rpe: event.target.value ? Number(event.target.value) : undefined })} /></div> : null)}</section>)}
    <label className="notes-field">Workout notes<textarea value={session.notes} onChange={(event) => update({ ...session, notes: event.target.value })} /></label>
    <div className="detail-actions"><button onClick={duplicate}><Copy />Duplicate</button><button className="danger-button" onClick={remove}><Trash2 />Delete</button></div>
  </div>;
}

function ProgressView({ sessions, unit, exerciseNames }: { sessions: WorkoutSession[]; unit: string; exerciseNames: string[] }) {
  const volume = sessions.reduce((sum, session) => sum + sessionVolume(session), 0);
  const weekStart = Date.now() - 604800000;
  const weeklySets = sessions.filter((session) => new Date(session.startedAt).getTime() >= weekStart).reduce((sum, session) => sum + completedSets(session).length, 0);
  const records = exerciseNames.map((name) => {
    const sets = sessions.flatMap((session) => session.exercises.filter((exercise) => exercise.name === name).flatMap((exercise) => exercise.sets.filter((set) => set.completed)));
    const best = sets.reduce<WorkoutSet | null>((winner, set) => !winner || estimatedOneRepMax(set.weight, set.reps) > estimatedOneRepMax(winner.weight, winner.reps) ? set : winner, null);
    return { name, best, frequency: sessions.filter((session) => session.exercises.some((exercise) => exercise.name === name && exercise.sets.some((set) => set.completed))).length };
  }).filter((record) => record.best);
  return <div className="screen"><header className="topbar"><div><p className="eyebrow">OVERVIEW</p><h1>Progress</h1></div><Trophy /></header>
    <div className="summary-grid"><Metric label="Workouts" value={String(sessions.length)} /><Metric label="Weekly sets" value={String(weeklySets)} /><Metric label="Total volume" value={formatVolume(volume) + " " + unit} /><Metric label="Exercises trained" value={String(records.length)} /></div>
    <section className="progress-card"><div className="section-heading"><h2>Strength records</h2><span>Estimated 1RM</span></div>{records.length === 0 ? <p className="muted-copy">Complete workouts to build your records.</p> : records.map((record) => <div className="record-row" key={record.name}><div><strong>{record.name}</strong><small>{record.best?.weight}×{record.best?.reps} · trained {record.frequency} times</small></div><b>{Math.round(estimatedOneRepMax(record.best!.weight, record.best!.reps))}<small> {unit}</small></b></div>)}</section>
  </div>;
}

function MoreView({ data, setData, exerciseNames, notify, changeUnit }: { data: LiftLogData; setData: React.Dispatch<React.SetStateAction<LiftLogData>>; exerciseNames: string[]; notify: (message: string) => void; changeUnit: (unit: "lb" | "kg") => void }) {
  const [customName, setCustomName] = useState("");
  const [newRoutineName, setNewRoutineName] = useState("");

  function addCustom() {
    const clean = customName.trim();
    if (!clean || exerciseNames.some((name) => name.toLowerCase() === clean.toLowerCase())) return;
    setData((current) => ({ ...current, customExercises: [...current.customExercises, clean] }));
    setCustomName("");
    notify("Custom exercise added");
  }

  function addRoutine() {
    const clean = newRoutineName.trim();
    if (!clean) return;
    setData((current) => ({ ...current, routines: [...current.routines, { id: makeId(), name: clean, exercises: [{ name: exerciseNames[0], targetSets: 3, targetReps: 5, restSeconds: current.settings.defaultRestSeconds }] }] }));
    setNewRoutineName("");
  }

  return <div className="screen"><header className="topbar"><div><p className="eyebrow">SETTINGS</p><h1>More</h1></div><Settings2 /></header>
    <section className="settings-card"><h2>Training settings</h2><div className="settings-grid"><label>Units<select value={data.settings.unit} onChange={(event) => changeUnit(event.target.value as "lb" | "kg")}><option value="lb">Pounds (lb)</option><option value="kg">Kilograms (kg)</option></select></label><label>Bar weight<input type="number" value={data.settings.barWeight} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, barWeight: Number(event.target.value) } }))} /></label><label>Default rest<select value={data.settings.defaultRestSeconds} onChange={(event) => setData((current) => ({ ...current, settings: { ...current.settings, defaultRestSeconds: Number(event.target.value) } }))}>{[30,60,90,120,180,240].map((seconds) => <option key={seconds} value={seconds}>{seconds} sec</option>)}</select></label></div></section>
    <section className="settings-card"><h2>Weekly routine schedule</h2><p className="muted-copy">Drag days to swap them, or select a split for each day.</p><WeekPlanner data={data} update={setData} compact /><div className="schedule-exercises"><h3>Add your own exercise</h3><p className="muted-copy">Create an exercise here, then open a routine below to add it to that workout.</p><div className="add-line"><input value={customName} placeholder="Exercise name" aria-label="New exercise name" onChange={(event) => setCustomName(event.target.value)} /><button onClick={addCustom}><Plus />Add</button></div>{data.customExercises.length > 0 && <div className="tag-list">{data.customExercises.map((name) => <span key={name}>{name}<button aria-label={`Remove ${name}`} onClick={() => setData((current) => ({ ...current, customExercises: current.customExercises.filter((item) => item !== name) }))}><X /></button></span>)}</div>}</div></section>
    <section className="settings-card"><h2>Routine builder</h2><div className="add-line"><input value={newRoutineName} placeholder="New routine name" onChange={(event) => setNewRoutineName(event.target.value)} /><button onClick={addRoutine}><Plus />Create</button></div>{data.routines.map((routine, index) => <RoutineEditor key={routine.id} routine={routine} exerciseNames={exerciseNames} update={(updated) => setData((current) => ({ ...current, routines: current.routines.map((item, itemIndex) => itemIndex === index ? updated : item) }))} remove={() => setData((current) => ({ ...current, routines: current.routines.filter((item) => item.id !== routine.id) }))} />)}</section>
  </div>;
}

function RoutineEditor({ routine, exerciseNames, update, remove }: { routine: Routine; exerciseNames: string[]; update: (routine: Routine) => void; remove: () => void }) {
  const [addName, setAddName] = useState(exerciseNames[0]);
  function patchExercise(index: number, patch: Partial<RoutineExercise>) { update({ ...routine, exercises: routine.exercises.map((exercise, itemIndex) => itemIndex === index ? { ...exercise, ...patch } : exercise) }); }
  return <details className="routine-editor"><summary><span>{routine.name}<small>{routine.exercises.length} exercises</small></span></summary><div className="routine-editor-body"><input className="routine-name-input" value={routine.name} onChange={(event) => update({ ...routine, name: event.target.value })} />{routine.exercises.map((exercise, index) => <div className="routine-exercise-row" key={exercise.name + index}><select value={exercise.name} onChange={(event) => patchExercise(index, { name: event.target.value })}>{exerciseNames.map((name) => <option key={name}>{name}</option>)}</select><label>Sets<input type="number" min="1" max="10" value={exercise.targetSets} onChange={(event) => patchExercise(index, { targetSets: Number(event.target.value) })} /></label><label>Reps<input type="number" min="1" max="50" value={exercise.targetReps} onChange={(event) => patchExercise(index, { targetReps: Number(event.target.value) })} /></label><label>Rest<input type="number" min="15" step="15" value={exercise.restSeconds} onChange={(event) => patchExercise(index, { restSeconds: Number(event.target.value) })} /></label><button onClick={() => update({ ...routine, exercises: routine.exercises.filter((_, itemIndex) => itemIndex !== index) })}><X /></button></div>)}<div className="add-line"><select value={addName} onChange={(event) => setAddName(event.target.value)}>{exerciseNames.map((name) => <option key={name}>{name}</option>)}</select><button onClick={() => update({ ...routine, exercises: [...routine.exercises, { name: addName, targetSets: 3, targetReps: 5, restSeconds: 90 }] })}><Plus />Exercise</button></div><button className="danger-button compact-danger" onClick={remove}><Trash2 />Delete routine</button></div></details>;
}

function BottomNav({ view, navigate, beginEmpty }: { view: View; navigate: (view: View, backwards?: boolean) => void; beginEmpty: () => void }) {
  return <nav className="bottom-nav" aria-label="Main navigation"><NavButton active={view === "workout"} icon={<Home />} label="Workout" onClick={() => navigate("workout", true)} /><NavButton active={view === "history"} icon={<History />} label="History" onClick={() => navigate("history")} /><button className="start-fab" onClick={beginEmpty} aria-label="Start an empty workout"><Plus /></button><NavButton active={view === "progress"} icon={<BarChart3 />} label="Progress" onClick={() => navigate("progress")} /><NavButton active={view === "more"} icon={<Settings2 />} label="More" onClick={() => navigate("more")} /></nav>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button>; }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="empty"><Dumbbell /><h2>{title}</h2><p>{detail}</p></div>; }
function BarbellLogo() { return <svg className="barbell-logo" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 28v8M14 22v20M20 26v12M20 32h24M44 26v12M50 22v20M56 28v8" /></svg>; }
