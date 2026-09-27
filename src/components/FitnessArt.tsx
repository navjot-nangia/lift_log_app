type FitnessKind = "dumbbell" | "barbell" | "plate" | "treadmill" | "rack" | "bike" | "calendar" | "bag" | "chart" | "lifter";

export function FitnessIcon({ kind, className = "" }: { kind: FitnessKind; className?: string }) {
  const art: Record<FitnessKind, React.ReactNode> = {
    dumbbell: <g transform="rotate(-35 32 32)"><rect x="10" y="28" width="44" height="8" rx="4" fill="#A98BE7" /><rect x="5" y="18" width="11" height="28" rx="3" fill="#E97890" /><rect x="17" y="23" width="6" height="18" rx="2" fill="#C54A69" /><rect x="41" y="23" width="6" height="18" rx="2" fill="#C54A69" /><rect x="48" y="18" width="11" height="28" rx="3" fill="#E97890" /></g>,
    barbell: <><rect x="5" y="29" width="54" height="6" rx="3" fill="#A6C9D4" /><rect x="9" y="17" width="9" height="30" rx="3" fill="#E97890" /><rect x="19" y="23" width="5" height="18" rx="2" fill="#F4B356" /><rect x="40" y="23" width="5" height="18" rx="2" fill="#F4B356" /><rect x="46" y="17" width="9" height="30" rx="3" fill="#E97890" /></>,
    plate: <><circle cx="32" cy="32" r="25" fill="#A4B6C0" /><circle cx="32" cy="32" r="20" fill="#4D6472" /><circle cx="32" cy="32" r="12" fill="#657F8A" /><circle cx="32" cy="32" r="5" fill="#E8F2F1" /><path d="M32 13v7m0 24v7M13 32h7m24 0h7" stroke="#9CB4BC" strokeWidth="3" strokeLinecap="round" /></>,
    treadmill: <><path d="M8 47h49l-5 8H5z" fill="#4B8197" /><path d="M10 48h40" stroke="#B3D8E4" strokeWidth="5" strokeLinecap="round" /><path d="M40 14h11M42 14l7 33" fill="none" stroke="#4B8197" strokeWidth="5" strokeLinecap="round" /><rect x="37" y="9" width="17" height="7" rx="3" fill="#E97890" /><path d="M13 55v4m36-4v4" stroke="#A7C7D0" strokeWidth="4" /></>,
    rack: <><path d="M12 54V11h40v43M9 54h12m22 0h12" fill="none" stroke="#799EAA" strokeWidth="5" strokeLinecap="round" /><path d="M12 21h40" stroke="#E97890" strokeWidth="5" strokeLinecap="round" /><path d="M22 21v11m20-11v11" stroke="#F4B356" strokeWidth="4" strokeLinecap="round" /><rect x="17" y="33" width="30" height="4" rx="2" fill="#4D6472" /></>,
    bike: <><circle cx="19" cy="46" r="10" fill="#829BAC" /><circle cx="19" cy="46" r="5" fill="#D1E9EF" /><path d="M19 46l17-1 8-15M29 44l-5-18h16M21 26h8M42 24h9" fill="none" stroke="#E97890" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 58h46" stroke="#5C7383" strokeWidth="4" strokeLinecap="round" /></>,
    calendar: <><rect x="9" y="11" width="46" height="45" rx="6" fill="#F4B356" /><path d="M9 25h46v25a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z" fill="#E8F2F1" /><path d="M20 8v11m24-11v11" stroke="#667D91" strokeWidth="5" strokeLinecap="round" /><path d="M19 35h6m9 0h6m-21 9h6m9 0h6" stroke="#78B5BD" strokeWidth="4" strokeLinecap="round" /></>,
    bag: <><rect x="8" y="24" width="48" height="31" rx="7" fill="#E97890" /><path d="M23 25v-7a9 9 0 0 1 18 0v7" fill="none" stroke="#526C79" strokeWidth="5" /><path d="M14 26v26m36-26v26" stroke="#C54A69" strokeWidth="4" /><rect x="4" y="33" width="6" height="14" rx="2" fill="#A6C9D4" /><rect x="54" y="33" width="6" height="14" rx="2" fill="#A6C9D4" /></>,
    chart: <><rect x="8" y="8" width="48" height="48" rx="10" fill="#DDECF0" /><path d="M16 44l11-12 8 5 13-18" fill="none" stroke="#C54A69" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 49h35" stroke="#7C9FA8" strokeWidth="3" strokeLinecap="round" /><circle cx="48" cy="19" r="4" fill="#F4B356" /></>,
    lifter: <><circle cx="32" cy="13" r="8" fill="#E8B38F" /><path d="M24 24h16l4 23H20z" fill="#5DB3B4" /><path d="M22 29L9 37m33-8 13 8" stroke="#E8B38F" strokeWidth="6" strokeLinecap="round" /><path d="M8 31v13m48-13v13" stroke="#526C79" strokeWidth="7" strokeLinecap="round" /><path d="M26 47v12m12-12v12" stroke="#667D91" strokeWidth="7" strokeLinecap="round" /></>,
  };
  return <svg className={`fitness-icon ${className}`} viewBox="0 0 64 64" fill="none" role="presentation" aria-hidden="true">{art[kind]}</svg>;
}

export function LiftingPerson() {
  return <svg className="lifting-person" viewBox="0 0 240 260" role="img" aria-label="Person pressing dumbbells overhead">
    <ellipse cx="120" cy="242" rx="85" ry="9" fill="#A98BE7" opacity=".2" />
    <path d="M105 171l-8 60h17l13-48m8-12 8 60h17l-8-60" fill="#687D95" stroke="#687D95" strokeWidth="8" strokeLinejoin="round" />
    <path d="M90 226h27v10H85q-4 0-2-5zm56 0h27l4 10h-31z" fill="#3B4B61" />
    <path d="M94 102q26-14 52 0l9 67q-35 16-70 0z" fill="#5DB3B4" />
    <path d="M88 163q32 12 64 0l3 18H85z" fill="#E97890" />
    <rect x="111" y="84" width="18" height="18" rx="6" fill="#DDA687" />
    <circle cx="120" cy="62" r="29" fill="#E8B38F" />
    <path d="M92 61q-4-31 26-33 30-1 31 29-14-5-21-15-10 14-36 19" fill="#4D6472" />
    <path d="M93 54q22-16 49-4" fill="none" stroke="#E97890" strokeWidth="5" strokeLinecap="round" />
    <circle cx="109" cy="65" r="2" fill="#4D6472" /><circle cx="131" cy="65" r="2" fill="#4D6472" />
    <path d="M115 78q5 4 10 0" fill="none" stroke="#AD7163" strokeWidth="2" strokeLinecap="round" />
    <g className="lifter-arm lifter-arm-left"><path d="M90 111Q76 125 58 150" fill="none" stroke="#E8B38F" strokeWidth="15" strokeLinecap="round" /><path d="M62 139l-8 7" stroke="#F8F1E8" strokeWidth="9" strokeLinecap="round" /><rect x="31" y="145" width="52" height="9" rx="4" fill="#A98BE7" /><rect x="30" y="138" width="9" height="23" rx="3" fill="#526C79" /><rect x="75" y="138" width="9" height="23" rx="3" fill="#526C79" /></g>
    <g className="lifter-arm lifter-arm-right"><path d="M150 111Q164 125 182 150" fill="none" stroke="#E8B38F" strokeWidth="15" strokeLinecap="round" /><path d="M178 139l8 7" stroke="#F8F1E8" strokeWidth="9" strokeLinecap="round" /><rect x="157" y="145" width="52" height="9" rx="4" fill="#A98BE7" /><rect x="156" y="138" width="9" height="23" rx="3" fill="#526C79" /><rect x="201" y="138" width="9" height="23" rx="3" fill="#526C79" /></g>
  </svg>;
}
