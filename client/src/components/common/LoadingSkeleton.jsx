export function CardSkeleton({ className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-800 bg-gray-900 p-4 animate-pulse ${className}`}
    >
      <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
      <div className="h-24 bg-gray-800 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-900 border-b border-gray-800" />
      ))}
    </div>
  );
}
