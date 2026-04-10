export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-f1-card animate-pulse" />
      <div className="h-32 rounded-xl bg-f1-card animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-f1-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
