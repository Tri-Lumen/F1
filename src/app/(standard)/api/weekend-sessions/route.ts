import { NextResponse } from "next/server";
import { getUpcomingWeekendSessions } from "@/lib/api";

/**
 * Backs the client-side "auto-subscribe to all weekend sessions" toggle
 * (NotificationContext's autoSubscribeWeekend) — returns every remaining
 * session of the next race weekend so the browser can schedule a
 * notification for each without needing the server-only data layer.
 */
export async function GET() {
  const sessions = await getUpcomingWeekendSessions();
  return NextResponse.json(
    sessions.map((s) => ({
      type: s.type,
      raceName: s.raceName,
      date: s.date.toISOString(),
    })),
  );
}
