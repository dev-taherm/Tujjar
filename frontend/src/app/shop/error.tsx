"use client";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">Store Error</h2>
        <p className="mt-2 text-sm text-gray-600">
          {error.message || "Something went wrong with this store"}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
