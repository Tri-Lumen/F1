import type { RaceControlMessage } from "@/lib/types";

const FLAG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  GREEN:  { bg: "bg-green-500/20", text: "text-green-400", label: "GREEN" },
  YELLOW: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "YELLOW" },
  DOUBLE_YELLOW: { bg: "bg-yellow-500/30", text: "text-yellow-300", label: "DBL YELLOW" },
  RED:    { bg: "bg-red-500/20", text: "text-red-400", label: "RED FLAG" },
  BLUE:   { bg: "bg-blue-500/20", text: "text-blue-400", label: "BLUE" },
  BLACK:  { bg: "bg-neutral-700/40", text: "text-neutral-300", label: "BLACK" },
  CHEQUERED: { bg: "bg-f1-dark", text: "text-f1-text", label: "CHEQUERED" },
  CLEAR:  { bg: "bg-green-500/10", text: "text-green-300", label: "CLEAR" },
};

const CATEGORY_ICONS: Record<string, string> = {
  Flag: "🏁",
  SafetyCar: "🚗",
  Drs: "📡",
  Other: "ℹ️",
  CarEvent: "🏎️",
};

export default function RaceControlFeed({
  messages,
}: {
  messages: RaceControlMessage[];
}) {
  // Show the most recent messages first, limit to last 20
  const recent = [...messages].reverse().slice(0, 20);

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-f1-border bg-f1-card">
        <div className="border-b border-f1-border p-4">
          <h3 className="font-bold text-lg">Race Control</h3>
        </div>
        <div className="p-6 text-center text-sm text-f1-text-muted">
          No race control messages yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-f1-border bg-f1-card">
      <div className="border-b border-f1-border p-4">
        <h3 className="font-bold text-lg">Race Control</h3>
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-f1-border/30">
        {recent.map((msg, i) => {
          const flagStyle = msg.flag ? FLAG_STYLES[msg.flag] ?? null : null;
          const icon = CATEGORY_ICONS[msg.category] ?? "ℹ️";
          const time = new Date(msg.date).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div
              key={`${msg.date}-${i}`}
              className={`px-4 py-3 ${flagStyle?.bg ?? ""}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-sm mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-mono text-f1-text-muted">
                      {time}
                    </span>
                    {msg.lap_number && (
                      <span className="text-[10px] text-f1-text-muted">
                        Lap {msg.lap_number}
                      </span>
                    )}
                    {flagStyle && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${flagStyle.text}`}
                      >
                        {flagStyle.label}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs leading-relaxed ${flagStyle?.text ?? "text-f1-text-muted"}`}>
                    {msg.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
