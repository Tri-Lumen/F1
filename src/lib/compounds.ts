export interface CompoundInfo {
  bg: string;
  text: string;
  label: string;
}

export const COMPOUND_COLORS: Record<string, CompoundInfo> = {
  SOFT:         { bg: "bg-red-500",    text: "text-red-400",    label: "S" },
  MEDIUM:       { bg: "bg-yellow-500", text: "text-yellow-400", label: "M" },
  HARD:         { bg: "bg-slate-300",  text: "text-slate-300",  label: "H" },
  INTERMEDIATE: { bg: "bg-green-500",  text: "text-green-400",  label: "I" },
  WET:          { bg: "bg-blue-500",   text: "text-blue-400",   label: "W" },
};

export const COMPOUND_FALLBACK: CompoundInfo = {
  bg:    "bg-gray-500",
  text:  "text-gray-400",
  label: "?",
};
