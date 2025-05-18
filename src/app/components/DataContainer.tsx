// components/DataContainer.tsx
import SkeletonLoader from './SkeletonLoader';

type DataContainerProps = {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  onRetry: () => void;
};

export default function DataContainer({ 
  loading, 
  error, 
  children, 
  onRetry 
}: DataContainerProps) {
  if (loading) return <SkeletonLoader />;
  if (error) return (
    <div className="text-center p-8 card-modern bg-red-50 border-l-4 border-red-400">
      <p className="text-red-600 mb-4 font-semibold">{error}</p>
      <button 
        onClick={onRetry}
        className="btn-primary bg-red-500 hover:bg-red-600 px-4 py-2"
      >
        Reintentar
      </button>
    </div>
  );

  return <>{children}</>;
}