import { redirect } from "next/navigation";

/**
 * The standalone Penalties/Incidents page was merged into /highlights — both
 * pages computed the same per-driver DNF tally over the same season results,
 * just framed differently (positive "highlights" vs. negative "incidents").
 * They're now two sections of one page.
 */
export default function PenaltiesPage() {
  redirect("/highlights#incidents");
}
