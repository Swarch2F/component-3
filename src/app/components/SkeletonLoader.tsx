// components/SkeletonLoader.tsx
export default function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4 card-modern">
      <div className="h-10 bg-[var(--color-gray)] rounded w-1/4 mb-6"></div>
      <div className="space-y-3">
        <div className="h-12 bg-[var(--color-gray)] rounded"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-[var(--color-bg)] rounded border border-[var(--color-gray)]"></div>
        ))}
      </div>
    </div>
  );
}