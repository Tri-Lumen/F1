import { redirect } from "next/navigation";

/**
 * The standalone Championship Gap page was folded into /stats — its chart
 * was recomputing the exact same per-round cumulative-points series as the
 * Championship Evolution chart there, just inverted to show the deficit to
 * the leader. That view is now a toggle on the same chart.
 */
export default function GapPage() {
  redirect("/stats#evolution");
}
