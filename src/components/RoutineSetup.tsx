"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, Grip, Plus, Trash2 } from "lucide-react";
import { FitnessIcon, LiftingPerson } from "./FitnessArt";
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
    { name: "Legs", exercises: ["Back Squat", "Leg Press", "Lunge"] },
  ],
  "back-bi-legs": [
    { name: "Back & biceps", exercises: ["Barbell Row", "Lat Pulldown", "Biceps Curl", "Hammer Curl"] },
    { name: "Chest & triceps", exercises: ["Bench Press", "Overhead Press", "Triceps Pushdown"] },
    { name: "Legs", exercises: ["Back Squat", "Leg Press", "Lunge"] },
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

export function WeekPlanner({ data, update }: { data: LiftLogData; update: (data: LiftLogData) => void; compact?: boolean }) {
  const schedule = WEEKDAYS.map((_, day) => data.schedule?.find((item) => item.day === day) ?? { day, routineId: null });
  const [dragged, setDragged] = useState<number | null>(null);
  function setDay(day: number, routineId: string | null) {
    update({ ...data, schedule: schedule.map((item) => item.day === day ? { ...item, routineId } : item) });
  }
  function swap(first: number, second: number) {
    if (second < 0 || second >= WEEKDAYS.length) return;
    update({ ...data, schedule: schedule.map((item) => item.day === first ? { ...item, routineId: schedule[second].routineId } : item.day === second ? { ...item, routineId: schedule[first].routineId } : item) });
  }
  return <div className="week-planner">
    <div className="week-grid">{schedule.map((item, index) => <section className="planner-day" key={item.day} draggable onDragStart={(event) => { setDragged(index); event.dataTransfer.effectAllowed = "move"; }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragged !== null) swap(dragged, index); setDragged(null); }} onDragEnd={() => setDragged(null)}>
      <div className="day-heading"><strong>{WEEKDAYS[item.day]}</strong><Grip className="drag-handle" aria-hidden="true" /></div>
      <select aria-label={WEEKDAYS[item.day] + " workout"} value={item.routineId ?? ""} onChange={(event) => setDay(item.day, event.target.value || null)}><option value="">Rest day</option>{data.routines.map((routine) => <option key={routine.id} value={routine.id}>{routine.name}</option>)}</select>
      <div className="move-day"><button type="button" aria-label={"Move " + WEEKDAYS[item.day] + " workout earlier"} disabled={index === 0} onClick={() => swap(index, index - 1)}><ArrowUp /> Earlier</button><button type="button" aria-label={"Move " + WEEKDAYS[item.day] + " workout later"} disabled={index === 6} onClick={() => swap(index, index + 1)}><ArrowDown /> Later</button></div>
    </section>)}</div>
  </div>;
}

function ReviewSplits({ data, update }: { data: LiftLogData; update: (data: LiftLogData) => void }) {
  const [newSplit, setNewSplit] = useState("");
  const names = [...new Set([...BASE_EXERCISES, ...data.customExercises])].sort();
  function patchRoutine(id: string, updater: (routine: Routine) => Routine) {
    update({ ...data, routines: data.routines.map((routine) => routine.id === id ? updater(routine) : routine) });
  }
  function addSplit() {
    const name = newSplit.trim();
    if (!name) return;
    update({ ...data, routines: [...data.routines, { id: makeId(), name, exercises: [] }] });
    setNewSplit("");
  }
  return <div className="split-review">
    {data.routines.map((routine) => <RoutineReviewCard key={routine.id} routine={routine} names={names} update={(updater) => patchRoutine(routine.id, updater)} addCustom={(name) => update({ ...data, customExercises: [...data.customExercises, name], routines: data.routines.map((item) => item.id === routine.id ? { ...item, exercises: [...item.exercises, exercise(name)] } : item) })} remove={() => update({ ...data, routines: data.routines.filter((item) => item.id !== routine.id), schedule: data.schedule?.map((day) => day.routineId === routine.id ? { ...day, routineId: null } : day) })} />)}
    <div className="review-add"><input aria-label="New split name" placeholder="New split name" value={newSplit} onChange={(event) => setNewSplit(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addSplit(); }} /><button onClick={addSplit}><Plus /> Add split</button></div>
  </div>;
}

function RoutineReviewCard({ routine, names, update, addCustom, remove }: { routine: Routine; names: string[]; update: (updater: (routine: Routine) => Routine) => void; addCustom: (name: string) => void; remove: () => void }) {
  const [custom, setCustom] = useState("");
  function addExercise() {
    const name = custom.trim();
    if (!name) { update((item) => ({ ...item, exercises: [...item.exercises, exercise(names[0] ?? "Bench Press")] })); return; }
    const existing = names.find((item) => item.toLowerCase() === name.toLowerCase());
    if (existing) update((item) => ({ ...item, exercises: [...item.exercises, exercise(existing)] }));
    else addCustom(name);
    setCustom("");
  }
  return <section className="review-card"><div className="review-title"><input aria-label="Split name" value={routine.name} onChange={(event) => update((item) => ({ ...item, name: event.target.value }))} /><button aria-label={"Remove " + routine.name + " split"} onClick={remove}><Trash2 /></button></div>
    <ol className="review-exercises">{routine.exercises.map((item, index) => <li key={index}><span>{index + 1}</span><select aria-label={routine.name + " exercise " + (index + 1)} value={item.name} onChange={(event) => update((current) => ({ ...current, exercises: current.exercises.map((one, i) => i === index ? { ...one, name: event.target.value } : one) }))}>{!names.includes(item.name) && <option>{item.name}</option>}{names.map((name) => <option key={name}>{name}</option>)}</select><button aria-label={"Remove " + item.name} onClick={() => update((current) => ({ ...current, exercises: current.exercises.filter((_, i) => i !== index) }))}><Trash2 /></button></li>)}</ol>
    {routine.exercises.length === 0 && <p className="review-empty">Add an exercise to start this split.</p>}
    <div className="review-add"><input aria-label={"Add exercise to " + routine.name} placeholder="Exercise name" value={custom} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addExercise(); }} /><button onClick={addExercise}><Plus /> Add</button></div>
  </section>;
}

export default function RoutineSetup({ initial, complete }: { initial: LiftLogData; complete: (data: LiftLogData) => void }) {
  const [step, setStep] = useState<"welcome" | "split" | "exercises" | "week" | "ready">("welcome");
  const [draft, setDraft] = useState(initial);
  const [customName, setCustomName] = useState("");
  function choose(split: Split) {
    const choices = split === "custom" ? [{ name: customName.trim() || "My split", exercises: [BASE_EXERCISES[0]] }] : templates[split];
    const routines: Routine[] = choices.map((item) => ({ id: makeId(), name: item.name, exercises: item.exercises.map(exercise) }));
    const suggested = proposedDays(routines.length).map((day) => ({ ...day, routineId: day.routineId === null ? null : routines[Number(day.routineId)].id }));
    setDraft({ ...draft, routines, schedule: suggested });
    setStep("exercises");
  }
  return <div className="setup-shell"><div key={step} className="setup-page slide-forward">
    {step === "welcome" && <><div className="setup-copy"><p className="eyebrow">WELCOME TO</p><h1>Lift Log</h1><p>Build your routine. Track your sets. See your strength grow.</p></div><OrbitArt /><button className="primary-button setup-cta" onClick={() => setStep("split")}>Let’s get started</button></>}
    {step === "split" && <><button className="setup-back" onClick={() => setStep("welcome")}><ChevronLeft /> Back</button><p className="eyebrow">STEP 1 OF 3</p><h1>Let’s build your routine</h1><p className="setup-intro">Choose a split to start with. You can customize every day and exercise next.</p><div className="split-options"><button onClick={() => choose("upper-lower")}><strong>Upper / lower</strong><small>Four days · alternate upper and lower body</small></button><button onClick={() => choose("push-pull-legs")}><strong>Push / pull / legs</strong><small>Six days · two rounds of each split</small></button><button onClick={() => choose("back-bi-legs")}><strong>Back & biceps / chest & triceps / legs</strong><small>Six days · classic muscle groups</small></button><button onClick={() => choose("full-body")}><strong>Full body</strong><small>Four days · alternate two sessions</small></button><div className="custom-choice"><strong>Custom split</strong><input aria-label="Custom split name" placeholder="Name your split" value={customName} onChange={(event) => setCustomName(event.target.value)} /><button onClick={() => choose("custom")}>Build custom split</button></div></div></>}
    {step === "exercises" && <><button className="setup-back" onClick={() => setStep("split")}><ChevronLeft /> Back</button><p className="eyebrow">STEP 2 OF 3</p><h1>Your exercises</h1><p className="setup-intro">Here’s what each split includes. Tap any exercise to change it, or add your own.</p><ReviewSplits data={draft} update={setDraft} /><button className="primary-button" onClick={() => setStep("week")} disabled={draft.routines.length === 0 || draft.routines.some((routine) => !routine.name.trim() || routine.exercises.length === 0)}>Plan my week</button></>}
    {step === "week" && <><button className="setup-back" onClick={() => setStep("exercises")}><ChevronLeft /> Back</button><p className="eyebrow">STEP 3 OF 3</p><h1>Plan your week</h1><p className="setup-intro">Choose a split for each day. Use Earlier or Later to swap days.</p><WeekPlanner data={draft} update={setDraft} /><button className="primary-button" onClick={() => setStep("ready")}>Done</button></>}
    {step === "ready" && <div className="ready-screen"><LiftingPerson /><h1>Let’s lift.</h1><p>Your week is ready. Change your schedule and routines any time in More → Settings.</p><button className="primary-button setup-cta" onClick={() => complete({ ...draft, onboardingComplete: true })}>Start logging</button></div>}
  </div></div>;
}

function OrbitArt() {
  return <div className="orbit-art" aria-hidden="true"><div className="orbit-ring orbit-one"><span><FitnessIcon kind="dumbbell" /></span><span><FitnessIcon kind="plate" /></span><span><FitnessIcon kind="treadmill" /></span></div><div className="orbit-ring orbit-two"><span><FitnessIcon kind="bike" /></span><span><FitnessIcon kind="rack" /></span><span><FitnessIcon kind="bag" /></span></div><div className="orbit-core"><FitnessIcon kind="barbell" /><strong>LIFT LOG</strong></div></div>;
}
