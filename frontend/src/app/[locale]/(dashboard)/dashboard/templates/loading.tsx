export default function TemplatesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 shimmer rounded" />
        <div className="h-5 w-96 shimmer rounded" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 shimmer rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
