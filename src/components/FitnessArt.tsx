type FitnessKind = "dumbbell" | "barbell" | "plate" | "treadmill" | "rack" | "bench" | "kettlebell" | "ropes" | "bike" | "calendar" | "bag" | "chart" | "lifter";

export function FitnessIcon({ kind, className = "" }: { kind: FitnessKind; className?: string }) {
  const art: Record<FitnessKind, React.ReactNode> = {
    dumbbell: <g transform="rotate(-35 32 32)"><rect x="10" y="28" width="44" height="8" rx="4" fill="#A98BE7" /><rect x="5" y="18" width="11" height="28" rx="3" fill="#E97890" /><rect x="17" y="23" width="6" height="18" rx="2" fill="#C54A69" /><rect x="41" y="23" width="6" height="18" rx="2" fill="#C54A69" /><rect x="48" y="18" width="11" height="28" rx="3" fill="#E97890" /></g>,
    barbell: <><rect x="5" y="29" width="54" height="6" rx="3" fill="#A6C9D4" /><rect x="9" y="17" width="9" height="30" rx="3" fill="#E97890" /><rect x="19" y="23" width="5" height="18" rx="2" fill="#F4B356" /><rect x="40" y="23" width="5" height="18" rx="2" fill="#F4B356" /><rect x="46" y="17" width="9" height="30" rx="3" fill="#E97890" /></>,
    plate: <><circle cx="32" cy="32" r="25" fill="#A4B6C0" /><circle cx="32" cy="32" r="20" fill="#4D6472" /><circle cx="32" cy="32" r="12" fill="#657F8A" /><circle cx="32" cy="32" r="5" fill="#E8F2F1" /><path d="M32 13v7m0 24v7M13 32h7m24 0h7" stroke="#9CB4BC" strokeWidth="3" strokeLinecap="round" /></>,
    treadmill: <><path d="M8 47h49l-5 8H5z" fill="#4B8197" /><path d="M10 48h40" stroke="#B3D8E4" strokeWidth="5" strokeLinecap="round" /><path d="M40 14h11M42 14l7 33" fill="none" stroke="#4B8197" strokeWidth="5" strokeLinecap="round" /><rect x="37" y="9" width="17" height="7" rx="3" fill="#E97890" /><path d="M13 55v4m36-4v4" stroke="#A7C7D0" strokeWidth="4" /></>,
    rack: <><path d="M12 54V11h40v43M9 54h12m22 0h12" fill="none" stroke="#799EAA" strokeWidth="5" strokeLinecap="round" /><path d="M12 21h40" stroke="#E97890" strokeWidth="5" strokeLinecap="round" /><path d="M22 21v11m20-11v11" stroke="#F4B356" strokeWidth="4" strokeLinecap="round" /><rect x="17" y="33" width="30" height="4" rx="2" fill="#4D6472" /></>,
    bench: <><rect x="8" y="26" width="48" height="11" rx="5" fill="#E97890" /><rect x="12" y="34" width="40" height="4" rx="2" fill="#A6C9D4" /><path d="M17 39l-5 17m35-17 5 17M7 57h12m28 0h12" stroke="#526C79" strokeWidth="5" strokeLinecap="round" /><path d="M15 25h34" stroke="#F6AFB7" strokeWidth="2" strokeLinecap="round" /></>,
    kettlebell: <><path d="M23 23v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#A6C9D4" strokeWidth="6" /><path d="M13 37a19 19 0 0 1 38 0v6a19 19 0 0 1-38 0z" fill="#F4B356" /><path d="M20 34q12-9 24 0" fill="none" stroke="#FFE0A2" strokeWidth="4" strokeLinecap="round" /><path d="M17 51q15 10 30 0" fill="none" stroke="#D98944" strokeWidth="3" strokeLinecap="round" /></>,
    ropes: <><path d="M15 18c-4 10-10 22 0 34 5 6 11-2 17-15 6-13 12-21 17-15 6 8-5 26-2 32" fill="none" stroke="#A98BE7" strokeWidth="5" strokeLinecap="round" /><rect x="8" y="12" width="11" height="18" rx="4" transform="rotate(20 13 21)" fill="#E97890" /><rect x="45" y="40" width="11" height="18" rx="4" transform="rotate(-20 50 49)" fill="#E97890" /><circle cx="32" cy="37" r="3" fill="#F4B356" /></>,
    bike: <><circle cx="19" cy="46" r="10" fill="#829BAC" /><circle cx="19" cy="46" r="5" fill="#D1E9EF" /><path d="M19 46l17-1 8-15M29 44l-5-18h16M21 26h8M42 24h9" fill="none" stroke="#E97890" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 58h46" stroke="#5C7383" strokeWidth="4" strokeLinecap="round" /></>,
    calendar: <><rect x="9" y="11" width="46" height="45" rx="6" fill="#F4B356" /><path d="M9 25h46v25a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z" fill="#E8F2F1" /><path d="M20 8v11m24-11v11" stroke="#667D91" strokeWidth="5" strokeLinecap="round" /><path d="M19 35h6m9 0h6m-21 9h6m9 0h6" stroke="#78B5BD" strokeWidth="4" strokeLinecap="round" /></>,
    bag: <><rect x="8" y="24" width="48" height="31" rx="7" fill="#E97890" /><path d="M23 25v-7a9 9 0 0 1 18 0v7" fill="none" stroke="#526C79" strokeWidth="5" /><path d="M14 26v26m36-26v26" stroke="#C54A69" strokeWidth="4" /><rect x="4" y="33" width="6" height="14" rx="2" fill="#A6C9D4" /><rect x="54" y="33" width="6" height="14" rx="2" fill="#A6C9D4" /></>,
    chart: <><rect x="8" y="8" width="48" height="48" rx="10" fill="#DDECF0" /><path d="M16 44l11-12 8 5 13-18" fill="none" stroke="#C54A69" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 49h35" stroke="#7C9FA8" strokeWidth="3" strokeLinecap="round" /><circle cx="48" cy="19" r="4" fill="#F4B356" /></>,
    lifter: <><circle cx="32" cy="13" r="8" fill="#E8B38F" /><path d="M24 24h16l4 23H20z" fill="#5DB3B4" /><path d="M22 29L9 37m33-8 13 8" stroke="#E8B38F" strokeWidth="6" strokeLinecap="round" /><path d="M8 31v13m48-13v13" stroke="#526C79" strokeWidth="7" strokeLinecap="round" /><path d="M26 47v12m12-12v12" stroke="#667D91" strokeWidth="7" strokeLinecap="round" /></>,
  };
  return <svg className={`fitness-icon ${className}`} viewBox="0 0 64 64" fill="none" role="presentation" aria-hidden="true">{art[kind]}</svg>;
}

export function LiftingPerson() {
  return <svg className="lifting-person" viewBox="0 0 360 360" role="img" aria-label="Athlete lifting a barbell overhead">
    <ellipse cx="180" cy="338" rx="96" ry="9" fill="#E97890" opacity=".16" />
    <path d="M146 227l-9 91h28l15-64 15 64h28l-9-91z" fill="#41485D" />
    <path d="M135 315h35v13h-44q-5 0-3-6zm55 0h35l12 7q3 6-4 6h-43z" fill="#D6DEE2" />
    <path d="M148 222h64l7 17h-78z" fill="#212635" />
    <path d="M143 135q37-18 74 0l15 92q-52 15-104 0z" fill="#C54A69" />
    <path d="M151 147q30-11 59 0M145 217q34 9 70 0" fill="none" stroke="#E97890" strokeWidth="5" opacity=".55" />
    <rect x="169" y="119" width="22" height="25" rx="8" fill="#C98E73" />
    <circle cx="180" cy="92" r="34" fill="#E5AC88" />
    <path d="M146 92q-5-37 28-40 32-4 41 29-17-3-28-17-14 19-41 28z" fill="#262B37" />
    <path d="M152 90q-7 5-7 13m63-13q7 5 7 13" fill="none" stroke="#C98E73" strokeWidth="7" strokeLinecap="round" />
    <circle cx="168" cy="97" r="2.5" fill="#333240" /><circle cx="192" cy="97" r="2.5" fill="#333240" />
    <path d="M173 109q7 5 14 0" fill="none" stroke="#9A584F" strokeWidth="2.5" strokeLinecap="round" />
    <path className="press-arm" d="M143 147 Q116 164 133 178 Q148 188 146 143" fill="none" stroke="#E5AC88" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="d" dur="2.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.18;0.52;0.72;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" values="M143 147 Q116 164 133 178 Q148 188 146 143;M143 147 Q116 164 133 178 Q148 188 146 143;M143 147 Q122 130 133 95 Q138 78 146 63;M143 147 Q122 130 133 95 Q138 78 146 63;M143 147 Q116 164 133 178 Q148 188 146 143" />
    </path>
    <path className="press-arm" d="M217 147 Q244 164 227 178 Q212 188 214 143" fill="none" stroke="#E5AC88" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="d" dur="2.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.18;0.52;0.72;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" values="M217 147 Q244 164 227 178 Q212 188 214 143;M217 147 Q244 164 227 178 Q212 188 214 143;M217 147 Q238 130 227 95 Q222 78 214 63;M217 147 Q238 130 227 95 Q222 78 214 63;M217 147 Q244 164 227 178 Q212 188 214 143" />
    </path>
    <g className="press-bar">
      <animateTransform attributeName="transform" type="translate" dur="2.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.18;0.52;0.72;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" values="0 0;0 0;0 -80;0 -80;0 0" />
      <rect x="53" y="134" width="254" height="8" rx="4" fill="#D6DEE2" />
      <rect x="64" y="119" width="16" height="38" rx="4" fill="#343B50" /><rect x="83" y="124" width="9" height="28" rx="3" fill="#E97890" />
      <rect x="268" y="124" width="9" height="28" rx="3" fill="#E97890" /><rect x="280" y="119" width="16" height="38" rx="4" fill="#343B50" />
      <rect x="137" y="131" width="16" height="14" rx="5" fill="#E5AC88" /><rect x="207" y="131" width="16" height="14" rx="5" fill="#E5AC88" />
    </g>
  </svg>;
}
