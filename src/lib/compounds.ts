export interface CompoundInfo {
  bg: string;
  bgFaded: string;
  border: string;
  text: string;
  label: string;
}

export const COMPOUND_COLORS: Record<string, CompoundInfo> = {
  SOFT:         { bg: "bg-red-500",    bgFaded: "bg-red-500/30",    border: "border-red-500/50",    text: "text-red-400",    label: "S" },
  MEDIUM:       { bg: "bg-yellow-500", bgFaded: "bg-yellow-500/30", border: "border-yellow-500/50", text: "text-yellow-400", label: "M" },
  HARD:         { bg: "bg-slate-300",  bgFaded: "bg-slate-300/30",  border: "border-slate-300/50",  text: "text-slate-300",  label: "H" },
  INTERMEDIATE: { bg: "bg-green-500",  bgFaded: "bg-green-500/30",  border: "border-green-500/50",  text: "text-green-400",  label: "I" },
  WET:          { bg: "bg-blue-500",   bgFaded: "bg-blue-500/30",   border: "border-blue-500/50",   text: "text-blue-400",   label: "W" },
};

export const COMPOUND_FALLBACK: CompoundInfo = {
  bg:    "bg-gray-500",
  bgFaded: "bg-gray-500/30",
  border: "border-gray-500/50",
  text:  "text-gray-400",
  label: "?",
};
