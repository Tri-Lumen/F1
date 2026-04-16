import { getNextScheduledSession, getLatestSession, isSessionLive } from "@/lib/api";
import SessionPill from "./SessionPill";

/**
 * Async server component that fetches the next/live session info and
 * renders the SessionPill. Must be wrapped in a <Suspense> boundary so the
 * rest of the page can render while these API calls are in flight.
 */
export default async function NavSessionLoader() {
  try {
    const [nextSession, latestSession] = await Promise.all([
      getNextScheduledSession(),
      getLatestSession(),
    ]);

    const isLive = latestSession ? isSessionLive(latestSession) : false;
    const session = nextSession
      ? {
          type: nextSession.type,
          raceName: nextSession.raceName,
          country: nextSession.country,
          date: nextSession.date.toISOString(),
        }
      : null;

    return <SessionPill session={session} isLive={isLive} />;
  } catch {
    return null;
  }
}
