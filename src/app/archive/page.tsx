import Link from "next/link";
import { ARCHIVE_SEASONS } from "@/lib/api";

export const metadata = {
  title: "F1 Archive — Season History",
  description: "Historical F1 season results from 2016 to 2025",
};

export default function ArchivePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          <span className="text-f1-red">F1</span> Archive
        </h1>
        <p className="mt-1 text-sm text-f1-text-muted">
          Championship standings and race results from 2016 to 2025
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {ARCHIVE_SEASONS.map((season) => (
          <Link
            key={season}
            href={`/archive/${season}`}
            className="group rounded-xl border border-f1-border bg-f1-card p-6 text-center transition-all hover:border-f1-accent hover:bg-f1-card-hover"
          >
            <p className="text-3xl font-black group-hover:text-f1-accent transition-colors">
              {season}
            </p>
            <p className="mt-1 text-xs text-f1-text-muted uppercase tracking-wider">
              Season
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
