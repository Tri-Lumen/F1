import { getNextScheduledSession, getCountryFlagByCountry } from "@/lib/api";
import CircuitMap from "@/components/CircuitMap";
import CountdownTimer from "@/components/CountdownTimer";
import NotifyButton from "@/components/NotifyButton";

export default async function NextSessionCard() {
  const session = await getNextScheduledSession();
  if (!session) return null;

  const flag = getCountryFlagByCountry(session.country);
  const dateStr = session.date.toISOString();

  const sessionDate = session.date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const isRace = session.type === "Race";

  return (
    <div className="mb-8 rounded-xl border border-f1-accent/25 bg-f1-card overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_1.2fr]">
        {/* Circuit map panel — accent-tinted background */}
        <div className="relative flex items-center justify-center p-8 min-h-[200px]"
          style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-f1-accent) 12%, var(--color-f1-dark)) 0%, var(--color-f1-dark) 100%)" }}>
          <CircuitMap
            circuitId={session.circuitId}
            className="w-full max-w-[260px] h-40 text-f1-accent"
          />
          <p className="absolute bottom-3 left-4 text-xs text-f1-text-muted font-medium">
            {session.circuitName}
          </p>
        </div>

        {/* Session info + countdown panel */}
        <div className="p-6 flex flex-col justify-between gap-6">
          <div>
            {/* Session type badge */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                  isRace
                    ? "bg-f1-accent/20 text-f1-accent border border-f1-accent/40"
                    : "bg-f1-accent-secondary/15 text-f1-accent-secondary border border-f1-accent-secondary/30"
                }`}
              >
                {session.type}
              </span>
              <span className="text-xs text-f1-text-muted">
                Round {session.round}
              </span>
            </div>

            {/* Race name */}
            <h2 className="text-2xl font-black leading-tight">
              {flag} {session.raceName}
            </h2>
            <p className="text-sm text-f1-text-muted mt-1">
              {session.locality}, {session.country}
            </p>
            <p className="text-xs text-f1-text-muted mt-1.5 font-mono">
              {sessionDate}
            </p>
          </div>

          {/* Countdown */}
          <div>
            <p className="text-xs uppercase tracking-wider text-f1-text-muted font-semibold mb-3">
              Starts In
            </p>
            <CountdownTimer target={dateStr} />
          </div>

          {/* Notification opt-in */}
          <div className="pt-3 border-t border-f1-border/50">
            <NotifyButton
              sessionDate={dateStr}
              sessionType={session.type}
              raceName={session.raceName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
