export default function VehicleIcon({ capacityKg }) {
  const kg = Number(capacityKg) || 0;

  if (kg >= 3000)
    return (
      <svg width="72" height="40" viewBox="0 0 120 65" fill="none">
        <rect x="0" y="12" width="85" height="38" rx="4" fill="#3b82f6" />
        <rect x="85" y="18" width="30" height="32" rx="4" fill="#2563eb" />
        <rect
          x="89"
          y="21"
          width="22"
          height="14"
          rx="2"
          fill="#bfdbfe"
          opacity="0.8"
        />
        <circle cx="18" cy="53" r="10" fill="#1e3a8a" />
        <circle cx="18" cy="53" r="5" fill="#93c5fd" />
        <circle cx="55" cy="53" r="10" fill="#1e3a8a" />
        <circle cx="55" cy="53" r="5" fill="#93c5fd" />
        <circle cx="100" cy="53" r="10" fill="#1e3a8a" />
        <circle cx="100" cy="53" r="5" fill="#93c5fd" />
      </svg>
    );

  if (kg >= 1000)
    return (
      <svg width="72" height="40" viewBox="0 0 110 66" fill="none">
        <rect x="0" y="14" width="75" height="36" rx="4" fill="#6366f1" />
        <rect x="75" y="20" width="28" height="30" rx="4" fill="#4f46e5" />
        <rect
          x="78"
          y="23"
          width="20"
          height="13"
          rx="2"
          fill="#c7d2fe"
          opacity="0.85"
        />
        <circle cx="16" cy="54" r="10" fill="#1e1b4b" />
        <circle cx="16" cy="54" r="5" fill="#a5b4fc" />
        <circle cx="90" cy="54" r="10" fill="#1e1b4b" />
        <circle cx="90" cy="54" r="5" fill="#a5b4fc" />
      </svg>
    );

  return (
    <svg width="72" height="40" viewBox="0 0 100 55" fill="none">
      <rect x="5" y="20" width="88" height="26" rx="6" fill="#0ea5e9" />
      <path d="M20 20 Q25 8 45 8 L65 8 Q80 8 85 20Z" fill="#0284c7" />
      <path d="M63 8 Q78 8 83 20 L65 20Z" fill="#bae6fd" opacity="0.85" />
      <path d="M22 8 Q28 8 35 20 L20 20Z" fill="#bae6fd" opacity="0.85" />
      <rect
        x="36"
        y="9"
        width="26"
        height="11"
        rx="2"
        fill="#bae6fd"
        opacity="0.75"
      />
      <circle cx="24" cy="47" r="9" fill="#0c4a6e" />
      <circle cx="24" cy="47" r="4" fill="#7dd3fc" />
      <circle cx="76" cy="47" r="9" fill="#0c4a6e" />
      <circle cx="76" cy="47" r="4" fill="#7dd3fc" />
    </svg>
  );
}
