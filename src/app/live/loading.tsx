export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-xl bg-f1-card animate-pulse" />
      <div className="h-96 rounded-xl bg-f1-card animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-f1-card animate-pulse" />
        <div className="h-64 rounded-xl bg-f1-card animate-pulse" />
      </div>
    </div>
  );
}
