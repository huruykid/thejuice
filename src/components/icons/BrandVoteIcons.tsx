interface IconProps {
  className?: string;
}

/**
 * Juice mark — a simplified variation of the brand logo (the OJ glass + green straw),
 * drawn to stay legible at ~16-20px for the positive vote / verdict. Reads unmistakably
 * as orange juice (amber liquid), unlike the 🧃 emoji which renders as an apple-juice box.
 */
export const JuiceIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* straw */}
    <path d="M14.5 7.5 L18 2.5" stroke="#3FA76A" strokeWidth="2" strokeLinecap="round" />
    {/* glass filled with OJ (tapered tumbler) */}
    <path
      d="M5.6 6.6 H18.4 L16.8 20.2 A1.2 1.2 0 0 1 15.6 21.3 H8.4 A1.2 1.2 0 0 1 7.2 20.2 Z"
      fill="#F8B23A"
      stroke="#241a05"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* rim */}
    <path d="M5.6 6.6 H18.4" stroke="#241a05" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Spoiled-milk counter-icon — a gable-top carton with a red warning label. The red is the
 * "bad for you" cue that plain milk (🥛, which looks fresh) lacks. Distinct silhouette from
 * the OJ glass, so the two votes separate at a glance and for colorblind users.
 */
export const MilkIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* carton body + gable top */}
    <path
      d="M6 9 V20.4 A0.9 0.9 0 0 0 6.9 21.3 H17.1 A0.9 0.9 0 0 0 18 20.4 V9 L15 4 H9 Z"
      fill="#ECECEC"
      stroke="#2A2A2A"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* shoulder line */}
    <path d="M6 9 H18" stroke="#2A2A2A" strokeWidth="1.3" />
    {/* spout fold */}
    <path d="M9 4 L12 7 L15 4" fill="none" stroke="#2A2A2A" strokeWidth="1.3" strokeLinejoin="round" />
    {/* red warning label (stands in for the red lettering at small sizes) */}
    <rect x="8" y="12.4" width="8" height="4.6" rx="0.6" fill="#E5484D" />
    <path d="M9.6 14.7 H14.4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
  </svg>
);
