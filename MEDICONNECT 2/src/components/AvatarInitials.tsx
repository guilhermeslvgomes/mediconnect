import React from "react";

/**
 * Simple avatar placeholder that renders the first letter of first + last name inside a colored circle.
 * Usage: <AvatarInitials name={fullName} size={40} />
 */
export interface AvatarInitialsProps {
  name: string | undefined | null;
  size?: number; // diameter in px
  className?: string;
}

const COLORS = [
  "bg-emerald-600",
  "bg-green-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-fuchsia-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-teal-600",
];

function hashToColorIndex(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++)
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash % COLORS.length;
}

export const AvatarInitials: React.FC<AvatarInitialsProps> = ({
  name,
  size = 40,
  className = "",
}) => {
  const safe = (name || "?").trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  let letters = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  if (!letters) letters = "?";
  const color = COLORS[hashToColorIndex(safe)];
  const style: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    flexShrink: 0,
  };
  const fontSize = Math.max(14, Math.round(size * 0.42));
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold select-none ${color} ${className}`}
      style={style}
      aria-label={`Avatar de ${safe}`}
    >
      <span style={{ fontSize }}>{letters}</span>
    </div>
  );
};

export default AvatarInitials;
