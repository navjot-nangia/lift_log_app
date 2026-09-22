"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, ChevronLeft, Clock3, Dumbbell, History, Home, Minus, Pause, Play, Plus, RotateCcw, Settings2, TimerReset, Trash2, Trophy } from "lucide-react";
import { createEntry, LIFTS, loadEntries, saveEntries, type Lift, type LiftEntry } from "@/lib/workouts";

const INCREMENTS = [1, 2.5, 5, 10, 25, 45];
const ROUTINES: { name: string; detail: string; lifts: Lift[] }[] = [
  { name: "Upper body", detail: "3 exercises", lifts: ["Bench Press", "Overhead Press", "Barbell Row"] },
  { name: "Lower body", detail: "2 exercises", lifts: ["Back Squat", "Deadlift"] },
  { name: "Quick strength", detail: "3 exercises", lifts: ["Bench Press", "Back Squat", "Deadlift"] },
];
type View = "workout" | "active" | "history" | "progress";

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

function formatElapsed(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const padded = (value: number) => value.toString().padStart(2, "0");
  return hours > 0 ? `${padded(hours)}:${padded(minutes)}:${padded(seconds)}` : `${padded(minutes)}:${padded(seconds)}`;
}

export default function LiftLogApp() {
  const [view, setView] = useState<View>("workout");
  const [direction, setDirection] = useState(1);
  const [lift, setLift] = useState<Lift>("Bench Press");
  const [weight, setWeight] = useState(135);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(5);
  const [entries, setEntries] = useState<LiftEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [restElapsedMs, setRestElapsedMs] = useState(0);
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => { setEntries(loadEntries()); setReady(true); }, []);
  useEffect(() => { if (ready) saveEntries(entries); }, [entries, ready]);
  useEffect(() => {
    if (restStartedAt === null) return;
    const updateElapsed = () => setRestElapsedMs(Date.now() - restStartedAt);
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 250);
    return () => window.clearInterval(timer);
  }, [restStartedAt]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const bests = useMemo(() => Object.fromEntries(LIFTS.map((name) => [name, Math.max(0, ...entries.filter((item) => item.lift === name).map((item) => item.weight))])), [entries]);
  const volume = useMemo(() => entries.reduce((sum, item) => sum + item.weight * item.sets * item.reps, 0), [entries]);

  function navigate(next: View, backwards = false) {
    if (next === view) return;
    setDirection(backwards ? -1 : 1); setView(next); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function begin(lifts: Lift[]) {
    const selected = lifts[0]; setLift(selected);
    const last = entries.find((item) => item.lift === selected);
    if (last) { setWeight(last.weight); setSets(last.sets); setReps(last.reps); }
    navigate("active");
  }
  function logLift() {
    if (weight <= 0 || sets < 1 || reps < 1) { setNotice("Enter valid weight, sets, and reps."); return; }
    setEntries((current) => [createEntry(lift, weight, sets, reps), ...current]);
    setRestElapsedMs(0); setRestStartedAt(Date.now()); setNotice(`${lift} logged`);
  }
  function toggleRestStopwatch() {
    if (restStartedAt === null) { setRestStartedAt(Date.now() - restElapsedMs); return; }
    setRestElapsedMs(Date.now() - restStartedAt); setRestStartedAt(null);
  }
  function resetRestStopwatch() { setRestStartedAt(null); setRestElapsedMs(0); }

  return <main className="app-shell">
    {notice && <div className="notice" role="status">{notice}</div>}
    <div key={view} className={`page-stage ${direction < 0 ? "slide-back" : "slide-forward"}`}>
      {view === "workout" && <WorkoutHome entries={entries} begin={begin} />}
      {view === "active" && <ActiveWorkout lift={lift} setLift={setLift} weight={weight} setWeight={setWeight} sets={sets} setSets={setSets} reps={reps} setReps={setReps} best={bests[lift]} logLift={logLift} restElapsedMs={restElapsedMs} restRunning={restStartedAt !== null} toggleRest={toggleRestStopwatch} resetRest={resetRestStopwatch} close={() => navigate("workout", true)} />}
      {view === "history" && <HistoryView entries={entries} ready={ready} deleteEntry={(id) => setEntries((current) => current.filter((entry) => entry.id !== id))} />}
      {view === "progress" && <ProgressView entries={entries} bests={bests} volume={volume} />}
    </div>
    {view !== "active" && <nav className="bottom-nav" aria-label="Main navigation">
      <NavButton active={view === "workout"} icon={<Home />} label="Workout" onClick={() => navigate("workout", true)} />
      <NavButton active={view === "history"} icon={<History />} label="History" onClick={() => navigate("history")} />
      <button className="start-fab" onClick={() => begin(["Bench Press"])} aria-label="Start an empty workout"><Plus /></button>
      <NavButton active={view === "progress"} icon={<BarChart3 />} label="Progress" onClick={() => navigate("progress")} />
      <NavButton active={false} icon={<Settings2 />} label="More" onClick={() => setNotice("Settings are coming next.")} />
    </nav>}
  </main>;
}

function WorkoutHome({ entries, begin }: { entries: LiftEntry[]; begin: (lifts: Lift[]) => void }) {
  const thisWeek = entries.filter((item) => Date.now() - new Date(item.createdAt).getTime() < 604800000).length;
  return <div className="screen"><header className="topbar"><div><p className="eyebrow">LIFT LOG</p><h1>Start a workout</h1></div><div className="brand-mark"><Dumbbell /></div></header>
    <section className="week-card"><div><span>This week</span><strong>{thisWeek}</strong><small>logged lifts</small></div><div className="week-bars">{[38,72,50,92,61,28,46].map((height,index) => <i key={index} style={{ height: `${height}%` }} />)}</div></section>
    <div className="section-heading"><h2>My routines</h2><button onClick={() => begin(["Bench Press"])}>Empty workout</button></div>
    <div className="routine-list">{ROUTINES.map((routine) => <button className="routine-card" key={routine.name} onClick={() => begin(routine.lifts)}><div className="routine-icon"><Dumbbell /></div><div><strong>{routine.name}</strong><span>{routine.detail}</span></div><Plus /></button>)}</div>
    {entries[0] && <><div className="section-heading"><h2>Last workout</h2><span>Most recent</span></div><div className="last-card"><span>{formatDate(entries[0].createdAt)}</span><strong>{entries[0].lift}</strong><p>{entries[0].sets} sets × {entries[0].reps} reps · {entries[0].weight} lb</p></div></>}
  </div>;
}

type ActiveProps = { lift: Lift; setLift: (value: Lift) => void; weight: number; setWeight: React.Dispatch<React.SetStateAction<number>>; sets: number; setSets: (value: number) => void; reps: number; setReps: (value: number) => void; best: number; logLift: () => void; restElapsedMs: number; restRunning: boolean; toggleRest: () => void; resetRest: () => void; close: () => void };
function ActiveWorkout(props: ActiveProps) {
  return <div className="screen"><header className="workout-header"><button className="icon-button" onClick={props.close} aria-label="Back"><ChevronLeft /></button><div><p className="eyebrow">WORKOUT</p><h1>Log set</h1></div><button className="finish-button" onClick={props.close}>Finish</button></header>
    <section className="rest-stopwatch" aria-label="Rest stopwatch">
      <div className="rest-stopwatch-heading"><div><span><TimerReset /> Rest stopwatch</span><small>Track your time between sets</small></div><strong aria-label={`${Math.floor(props.restElapsedMs / 1000)} seconds elapsed`}>{formatElapsed(props.restElapsedMs)}</strong></div>
      <div className="rest-stopwatch-controls"><button className="rest-toggle" onClick={props.toggleRest}>{props.restRunning ? <><Pause />Pause</> : <><Play />{props.restElapsedMs > 0 ? "Resume" : "Start rest"}</>}</button><button className="rest-reset" onClick={props.resetRest} disabled={props.restElapsedMs === 0 && !props.restRunning} aria-label="Reset rest stopwatch"><RotateCcw /></button></div>
    </section>
    <section className="lift-panel"><label>Exercise<select value={props.lift} onChange={(event) => props.setLift(event.target.value as Lift)}>{LIFTS.map((item) => <option key={item}>{item}</option>)}</select></label>
      {props.best > 0 && <div className="best-chip"><Trophy /> Personal best {props.best} lb</div>}
      <div className="weight-block"><div className="weight-label"><span>Weight</span><button onClick={() => props.setWeight(0)}><RotateCcw /> Reset</button></div><div className="weight-input"><input type="number" inputMode="decimal" min="0" value={props.weight} onChange={(event) => props.setWeight(Math.max(0, Number(event.target.value)))} /><span>lb</span></div></div>
      <div className="increment-grid">{INCREMENTS.map((amount) => <button key={amount} onClick={() => props.setWeight((current) => Number((current + amount).toFixed(1)))}>+{amount}</button>)}</div>
      <div className="counter-grid"><Counter label="Sets" value={props.sets} onChange={props.setSets} /><Counter label="Reps" value={props.reps} onChange={props.setReps} /></div>
      <button className="primary-button" onClick={props.logLift}><Check />Complete set</button>
    </section></div>;
}

function HistoryView({ entries, ready, deleteEntry }: { entries: LiftEntry[]; ready: boolean; deleteEntry: (id: string) => void }) {
  const grouped = entries.reduce<Record<string, LiftEntry[]>>((result, entry) => { const key = formatDate(entry.createdAt); (result[key] ||= []).push(entry); return result; }, {});
  return <div className="screen"><header className="topbar"><div><p className="eyebrow">TRAINING</p><h1>History</h1></div><Clock3 /></header>{!ready ? <div className="skeleton-list">{[1,2,3].map((item) => <i key={item} />)}</div> : entries.length === 0 ? <Empty /> : Object.entries(grouped).map(([date,items]) => <section className="history-group" key={date}><h2>{date}</h2><div className="history-card">{items.map((entry) => <article key={entry.id}><div><strong>{entry.lift}</strong><span>{entry.sets} sets × {entry.reps} reps</span></div><b>{entry.weight} <small>lb</small></b><button onClick={() => deleteEntry(entry.id)} aria-label={`Delete ${entry.lift}`}><Trash2 /></button></article>)}</div></section>)}</div>;
}

function ProgressView({ entries, bests, volume }: { entries: LiftEntry[]; bests: Record<string, number>; volume: number }) {
  const max = Math.max(1, ...Object.values(bests));
  return <div className="screen"><header className="topbar"><div><p className="eyebrow">OVERVIEW</p><h1>Progress</h1></div><Trophy /></header><div className="metric-grid"><div><span>Workouts</span><strong>{entries.length}</strong></div><div><span>Total volume</span><strong>{volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : volume}</strong><small>lb</small></div></div><section className="progress-card"><div className="section-heading"><h2>Personal records</h2><span>All time</span></div>{LIFTS.map((name) => <div className="record-row" key={name}><div><strong>{name}</strong><span style={{ width: `${(bests[name] / max) * 100}%` }} /></div><b>{bests[name] || "—"}{bests[name] > 0 && <small> lb</small>}</b></div>)}</section></div>;
}

function Counter({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <div className="counter"><span>{label}</span><div><button onClick={() => onChange(Math.max(1,value-1))} aria-label={`Decrease ${label}`}><Minus /></button><strong>{value}</strong><button onClick={() => onChange(Math.min(99,value+1))} aria-label={`Increase ${label}`}><Plus /></button></div></div>; }
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button>; }
function Empty() { return <div className="empty"><Dumbbell /><h2>No workouts yet</h2><p>Your completed lifts will appear here.</p></div>; }
