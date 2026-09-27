"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, CircleDot, Dumbbell, Grip, Plus, Trash2 } from "lucide-react";
import { BASE_EXERCISES, WEEKDAYS, makeId, type LiftLogData, type Routine, type ScheduledDay } from "@/lib/workouts";

type Split = "upper-lower" | "push-pull-legs" | "back-bi-legs" | "full-body" | "custom";
const defaults = { targetSets: 3, targetReps: 8, restSeconds: 90 };
const exercise = (name: string) => ({ name, ...defaults });
const templates: Record<Exclude<Split, "custom">, { name: string; exercises: string[] }[]> = {
  "upper-lower": [
    { name: "Upper body", exercises: ["Bench Press", "Overhead Press", "Barbell Row", "Pull-up"] },
    { name: "Lower body", exercises: ["Back Squat", "Deadlift"] },
  ],
  "push-pull-legs": [
    { name: "Push", exercises: ["Bench Press", "Overhead Press"] },
    { name: "Pull", exercises: ["Barbell Row", "Pull-up", "Deadlift"] },
    { name: "Legs", exercises: ["Back Squat", "Deadlift"] },
  ],
  "back-bi-legs": [
    { name: "Back & biceps", exercises: ["Barbell Row", "Pull-up"] },
    { name: "Chest & triceps", exercises: ["Bench Press", "Overhead Press"] },
    { name: "Legs", exercises: ["Back Squat", "Deadlift"] },
  ],
  "full-body": [
    { name: "Full body A", exercises: ["Back Squat", "Bench Press", "Barbell Row"] },
    { name: "Full body B", exercises: ["Deadlift", "Overhead Press", "Pull-up"] },
  ],
};

function proposedDays(count: number): ScheduledDay[] {
  const days = count === 2 ? [0, 1, 3, 4] : [0, 1, 2, 3, 4, 5];
  return WEEKDAYS.map((_, day) => ({ day, routineId: days.includes(day) ? String(days.indexOf(day) % count) : null }));
}

export function WeekPlanner({ data, update, compact = false }: { data: LiftLogData; update: (data: LiftLogData) => void; compact?: boolean }) {
  const schedule = WEEKDAYS.map((_, day) => data.schedule?.find((item) => item.day === day) ?? { day, routineId: null });
  const [dragged, setDragged] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newExercise, setNewExercise] = useState("");
  const names = [...new Set([...BASE_EXERCISES, ...data.customExercises])].sort();
  function setDay(day: number, routineId: string | null) { update({ ...data, schedule: schedule.map((item) => item.day === day ? { ...item, routineId } : item) }); }
  function swap(first: number, second: number) {
    if (second < 0 || second >= 7) return;
    update({ ...data, schedule: schedule.map((item) => item.day === first ? { ...item, routineId: schedule[second].routineId } : item.day === second ? { ...item, routineId: schedule[first].routineId } : item) });
  }
  function addRoutine() {
    const name = newName.trim();
    if (!name) return;
    const routine = { id: makeId(), name, exercises: [exercise(names[0] ?? "Bench Press")] };
    update({ ...data, routines: [...data.routines, routine], schedule: schedule.map((item) => item.day === schedule.find((day) => !day.routineId)?.day ? { ...item, routineId: routine.id } : item) });
    setNewName("");
  }
  return <div className="week-planner">
    {!compact && <p className="planner-hint">Suggested week · drag days to swap them, or choose a split for any day. Rest days can be changed too.</p>}
    {schedule.map((item, index) => <div className="planner-day" key={item.day} draggable onDragStart={(event) => { setDragged(index); event.dataTransfer.effectAllowed = "move"; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragged !== null) swap(dragged, index); setDragged(null); }} onDragEnd={() => setDragged(null)}>
      <Grip className="drag-handle" aria-hidden="true" /><strong>{WEEKDAYS[item.day]}</strong>
      <select aria-label={WEEKDAYS[item.day] + " workout"} value={item.routineId ?? ""} onChange={(event) => setDay(item.day, event.target.value || null)}><option value="">Rest day</option>{data.routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}</select>
      <div className="move-day"><button aria-label={"Move " + WEEKDAYS[item.day] + " up"} disabled={index === 0} onClick={() => swap(index, index - 1)}><ArrowUp /></button><button aria-label={"Move " + WEEKDAYS[item.day] + " down"} disabled={index === 6} onClick={() => swap(index, index + 1)}><ArrowDown /></button></div>
    </div>)}
    <div className="planner-add"><input aria-label="New split name" placeholder="Add another split (any name)" value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addRoutine(); }} /><button onClick={addRoutine}><Plus /> Add split</button></div>
    {data.routines.map((routine) => <details className="planner-routine" key={routine.id}><summary>{routine.name} <small>{routine.exercises.length} exercises · edit</small></summary><div className="planner-routine-body"><label>Split name<input value={routine.name} onChange={(event) => update({ ...data, routines: data.routines.map((item) => item.id === routine.id ? { ...item, name: event.target.value } : item) })} /></label>{routine.exercises.map((item, index) => <div className="planner-exercise" key={index}><select aria-label={routine.name + " exercise " + (index + 1)} value={item.name} onChange={(event) => update({ ...data, routines: data.routines.map((entry) => entry.id === routine.id ? { ...entry, exercises: entry.exercises.map((one, i) => i === index ? { ...one, name: event.target.value } : one) } : entry) })}>{!names.includes(item.name) && <option>{item.name}</option>}{names.map((name) => <option key={name}>{name}</option>)}</select><button aria-label={"Remove " + item.name} onClick={() => update({ ...data, routines: data.routines.map((entry) => entry.id === routine.id ? { ...entry, exercises: entry.exercises.filter((_, i) => i !== index) } : entry) })}><Trash2 /></button></div>)}<div className="planner-add"><input aria-label={"New exercise for " + routine.name} placeholder="Exercise name (e.g. Lat Pulldown)" value={newExercise} onChange={(event) => setNewExercise(event.target.value)} /><button onClick={() => { const name = newExercise.trim(); if (!name) return; update({ ...data, customExercises: names.some((item) => item.toLowerCase() === name.toLowerCase()) ? data.customExercises : [...data.customExercises, name], routines: data.routines.map((entry) => entry.id === routine.id ? { ...entry, exercises: [...entry.exercises, exercise(name)] } : entry) }); setNewExercise(""); }}><Plus /> Exercise</button></div><button className="planner-link danger-link" onClick={() => update({ ...data, routines: data.routines.filter((entry) => entry.id !== routine.id), schedule: schedule.map((day) => day.routineId === routine.id ? { ...day, routineId: null } : day) })}><Trash2 /> Remove split</button></div></details>)}
    <p className="planner-hint">For sets, reps, and rest times, use the Routine builder below in Settings.</p>
  </div>;
}

export default function RoutineSetup({ initial, complete }: { initial: LiftLogData; complete: (data: LiftLogData) => void }) {
  const [step, setStep] = useState<"welcome" | "split" | "week" | "ready">("welcome");
  const [draft, setDraft] = useState(initial);
  const [customName, setCustomName] = useState("");
  function choose(split: Split) {
    const choices = split === "custom" ? [{ name: customName.trim() || "My split", exercises: [BASE_EXERCISES[0]] }] : templates[split];
    const routines: Routine[] = choices.map((item) => ({ id: makeId(), name: item.name, exercises: item.exercises.map(exercise) }));
    const suggested = proposedDays(routines.length).map((day) => ({ ...day, routineId: day.routineId === null ? null : routines[Number(day.routineId)].id }));
    setDraft({ ...draft, routines, schedule: suggested });
    setStep("week");
  }
  return <div className="setup-shell"><div key={step} className="setup-page slide-forward">
    {step === "welcome" && <><div className="setup-copy"><p className="eyebrow">WELCOME TO</p><h1>Lift Log</h1><p>Build your routine. Track your sets. See your strength grow.</p></div><OrbitArt /><button className="primary-button setup-cta" onClick={() => setStep("split")}>Let’s get started</button></>}
    {step === "split" && <><button className="setup-back" onClick={() => setStep("welcome")}><ChevronLeft /> Back</button><p className="eyebrow">STEP 1 OF 2</p><h1>Let’s build your routine</h1><p className="setup-intro">Choose a split to start with. You can customize every day and exercise next.</p><div className="split-options"><button onClick={() => choose("upper-lower")}><strong>Upper / lower</strong><small>Four days · alternate upper and lower body</small></button><button onClick={() => choose("push-pull-legs")}><strong>Push / pull / legs</strong><small>Six days · two rounds of each split</small></button><button onClick={() => choose("back-bi-legs")}><strong>Back & biceps / chest & triceps / legs</strong><small>Six days · classic muscle groups</small></button><button onClick={() => choose("full-body")}><strong>Full body</strong><small>Four days · alternate two sessions</small></button><div className="custom-choice"><strong>Custom split</strong><input aria-label="Custom split name" placeholder="Name your split" value={customName} onChange={(event) => setCustomName(event.target.value)} /><button onClick={() => choose("custom")}>Build custom split</button></div></div></>}
    {step === "week" && <><button className="setup-back" onClick={() => setStep("split")}><ChevronLeft /> Back</button><p className="eyebrow">STEP 2 OF 2</p><h1>Plan your week</h1><p className="setup-intro">Here’s a suggested schedule. Tap any day to change its split or make it a rest day. Open a split below to add exercises.</p><WeekPlanner data={draft} update={setDraft} /><button className="primary-button" onClick={() => setStep("ready")}>Done</button></>}
    {step === "ready" && <div className="ready-screen"><div className="big-barbell"><svg viewBox="0 0 260 100" role="img" aria-label="Animated barbell"><rect x="25" y="45" width="210" height="10" rx="5"/><rect x="42" y="25" width="15" height="50" rx="4"/><rect x="62" y="35" width="11" height="30" rx="3"/><rect x="187" y="35" width="11" height="30" rx="3"/><rect x="203" y="25" width="15" height="50" rx="4"/></svg></div><h1>Let’s lift.</h1><p>Your week is ready. Change your schedule and routines any time in More → Settings.</p><button className="primary-button setup-cta" onClick={() => complete({ ...draft, onboardingComplete: true })}>Start logging</button></div>}
  </div></div>;
}

function OrbitArt() {
  return <div className="orbit-art" aria-hidden="true"><div className="orbit-ring orbit-one"><span><Dumbbell /></span><span><CircleDot /></span><TreadmillIcon /></div><div className="orbit-ring orbit-two"><span><Grip /></span><SquatRackIcon /><span><Dumbbell /></span></div><div className="orbit-core"><svg viewBox="0 0 64 64"><path d="M8 28v8M14 22v20M20 26v12M20 32h24M44 26v12M50 22v20M56 28v8" /></svg><strong>LIFT LOG</strong></div></div>;
}

function TreadmillIcon() { return <span><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M5 8h9l4 12h9M3 25h24M6 25l3-13M22 25l4-5" /></svg></span>; }
function SquatRackIcon() { return <span><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 27V5h20v22M3 12h26M10 9v6M22 9v6M4 27h7m10 0h7" /></svg></span>; }
