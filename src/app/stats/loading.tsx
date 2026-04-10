export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-f1-card animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-f1-card animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-f1-card animate-pulse" />
    </div>
  );
}
