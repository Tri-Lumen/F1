export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-f1-card animate-pulse" />
      <div className="flex gap-4">
        <div className="h-12 flex-1 rounded-lg bg-f1-card animate-pulse" />
        <div className="h-12 flex-1 rounded-lg bg-f1-card animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-f1-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
