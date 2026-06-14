export default function TemplatesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-5 w-96 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
