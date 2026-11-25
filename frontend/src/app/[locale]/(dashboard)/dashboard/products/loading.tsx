export default function ProductsLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-48 shimmer rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}
